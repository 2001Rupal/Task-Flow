import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { updateProject, deleteProject } from './projectSlice'
import * as projectsApi from '../../api/projects'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { UserPlus, UserMinus, Crown, Shield, Eye, Loader2, Settings, Users, AlertTriangle, ArrowLeft } from 'lucide-react'
import { getInitials, cn } from '../../lib/utils'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import toast from 'react-hot-toast'

const ROLE_ICONS = { Owner: Crown, Editor: Shield, Viewer: Eye }
const SECTIONS = [
  { id: 'general', label: 'General',     icon: Settings },
  { id: 'members', label: 'Members',     icon: Users },
  { id: 'danger',  label: 'Danger Zone', icon: AlertTriangle, destructive: true },
]

export default function ProjectSettingsPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const project = useSelector(s => s.projects.current)
  const currentRole = useSelector(s => s.projects.currentRole)

  const [section, setSection] = useState('general')
  const [name, setName] = useState(project?.name || '')
  const [description, setDescription] = useState(project?.description || '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState('')
  const [members, setMembers] = useState([])
  const [pending, setPending] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('Editor')
  const [inviting, setInviting] = useState(false)
  const [confirmRemoveId, setConfirmRemoveId] = useState(null)

  const isOwner = currentRole === 'Owner'
  const canEdit = isOwner || currentRole === 'Editor'

  useEffect(() => {
    if (project) { setName(project.name || ''); setDescription(project.description || '') }
  }, [project?._id])

  useEffect(() => { if (projectId) loadMembers() }, [projectId])

  async function loadMembers() {
    setLoadingMembers(true)
    try {
      const [mr, pr] = await Promise.all([
        projectsApi.getCollaborators(projectId),
        isOwner
          ? projectsApi.getPendingInvites?.(projectId).catch(() => ({ data: { pending: [] } }))
          : Promise.resolve({ data: { pending: [] } })
      ])
      setMembers(mr.data.collaborators || [])
      setPending(pr.data.pending || [])
    } catch { toast.error('Failed to load members') }
    finally { setLoadingMembers(false) }
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!name.trim()) return toast.error('Project name is required')
    setSaving(true)
    try {
      await dispatch(updateProject({ id: projectId, data: { name: name.trim(), description } })).unwrap()
      toast.success('Project updated')
    } catch (err) { toast.error(err?.message || 'Failed to update') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (confirmDelete !== project?.name) return toast.error('Project name does not match')
    setDeleting(true)
    try {
      await dispatch(deleteProject(projectId)).unwrap()
      toast.success('Project deleted')
      navigate('/projects')
    } catch (err) { toast.error(err?.message || 'Failed to delete'); setDeleting(false) }
  }

  async function handleInvite(e) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)
    try {
      await projectsApi.inviteCollaborator(projectId, { email: inviteEmail.trim(), role: inviteRole })
      toast.success(`Invited ${inviteEmail}`)
      setInviteEmail('')
      loadMembers()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to invite') }
    finally { setInviting(false) }
  }

  async function handleRoleChange(collabId, role) {
    try {
      await projectsApi.updateCollaboratorRole(projectId, collabId, role)
      setMembers(m => m.map(mb => mb.collaborationId === collabId ? { ...mb, role } : mb))
      toast.success('Role updated')
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to update role') }
  }

  async function handleRemove(collabId) {
    try {
      await projectsApi.removeCollaborator(projectId, collabId)
      setMembers(m => m.filter(mb => mb.collaborationId !== collabId))
      setConfirmRemoveId(null)
      toast.success('Member removed')
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to remove member') }
  }

  if (!project) return (
    <div className="flex items-center justify-center h-full text-muted-foreground">Project not found</div>
  )

  const visibleSections = isOwner ? SECTIONS : SECTIONS.filter(s => s.id !== 'danger')

  return (
    <>
    <div className="flex h-full">
      {/* Left nav */}
      <div className="w-56 shrink-0 border-r border-border bg-muted/20 px-3 py-5 space-y-0.5">
        <button
          onClick={() => navigate(`/projects/${projectId}`)}
          className="flex items-center gap-2 px-3 py-1.5 mb-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to project
        </button>
        <div className="flex items-center gap-2 px-3 mb-3">
          <span
            className="h-5 w-5 rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0"
            style={{ backgroundColor: project.color || '#5b5ef4' }}
          >
            {project.name.slice(0, 1).toUpperCase()}
          </span>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">{project.name}</p>
        </div>
        {visibleSections.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left',
              section === s.id
                ? s.destructive ? 'bg-destructive/10 text-destructive font-medium' : 'bg-primary/10 text-primary font-medium'
                : s.destructive ? 'text-destructive/70 hover:bg-destructive/5 hover:text-destructive' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <s.icon className="h-4 w-4 shrink-0" /> {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-2xl mx-auto px-8 py-8 space-y-7">

          {section === 'general' && (
            <>
              <div>
                <h2 className="text-lg font-semibold">General</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Project name and description</p>
              </div>
              <form onSubmit={handleSave} className="space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label>Project name</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} required disabled={!canEdit} />
                    <p className="text-xs text-muted-foreground">This is the display name shown across the app</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Project color</Label>
                    <div className="flex gap-2 flex-wrap pt-1">
                      {['#5b5ef4','#10b981','#f97316','#ef4444','#8b5cf6','#0ea5e9','#ec4899','#eab308','#64748b'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {}}
                          className="h-7 w-7 rounded-full transition-all hover:scale-110"
                          style={{ backgroundColor: c, outline: project.color === c ? '2px solid white' : 'none', outlineOffset: '2px' }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="What is this project about? Add context for your team…"
                    rows={4}
                    disabled={!canEdit}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none disabled:opacity-50"
                  />
                  <p className="text-xs text-muted-foreground">Visible to all project members</p>
                </div>
                {canEdit && (
                  <div className="flex items-center gap-3 pt-1">
                    <Button type="submit" disabled={saving} className="gap-2">
                      {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
                    </Button>
                    <span className="text-xs text-muted-foreground">Changes are saved immediately</span>
                  </div>
                )}
              </form>

              {/* Project info card */}
              <div className="mt-2 p-4 rounded-xl bg-muted/30 border border-border grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Your role</p>
                  <p className="text-sm font-semibold mt-0.5">{currentRole}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm font-semibold mt-0.5">{project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '—'}</p>
                </div>
              </div>
            </>
          )}

          {section === 'members' && (
            <>
              <div>
                <h2 className="text-lg font-semibold">Members</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{members.length} member{members.length !== 1 ? 's' : ''}</p>
              </div>
              {isOwner && (
                <form onSubmit={handleInvite} className="flex gap-2 p-4 rounded-xl border border-border bg-muted/20">
                  <Input type="email" placeholder="Email address" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required className="flex-1" />
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Editor">Editor</SelectItem>
                      <SelectItem value="Viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="submit" disabled={inviting} className="gap-1.5">
                    {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Invite
                  </Button>
                </form>
              )}
              {loadingMembers ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden">
                  {members.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">No members yet</div>
                  ) : members.map((m, i) => {
                    const RoleIcon = ROLE_ICONS[m.role] || Eye
                    return (
                      <div key={m.collaborationId} className={cn('flex items-center gap-3 px-4 py-3', i < members.length - 1 && 'border-b border-border/60')}>
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback style={{ backgroundColor: m.avatarColor || '#6366f1' }} className="text-white text-xs font-semibold">
                            {getInitials(m.displayName, m.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{m.displayName || m.email}</p>
                          <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                        </div>
                        {isOwner && m.role !== 'Owner' ? (
                          <Select value={m.role} onValueChange={role => handleRoleChange(m.collaborationId, role)}>
                            <SelectTrigger className="w-24 h-7 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Editor">Editor</SelectItem>
                              <SelectItem value="Viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground w-24 shrink-0">
                            <RoleIcon className="h-3.5 w-3.5" /> {m.role}
                          </div>
                        )}
                        {isOwner && m.role !== 'Owner' && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0" onClick={() => setConfirmRemoveId(m.collaborationId)}>
                            <UserMinus className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              {pending.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Pending invites</p>
                  <div className="rounded-xl border border-border overflow-hidden">
                    {pending.map((p, i) => (
                      <div key={p._id} className={cn('flex items-center gap-3 px-4 py-3', i < pending.length - 1 && 'border-b border-border/60')}>
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="text-xs bg-muted text-muted-foreground">?</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{p.inviteEmail}</p>
                          <p className="text-xs text-muted-foreground">Pending · {p.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {section === 'danger' && isOwner && (
            <>
              <div>
                <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Irreversible actions</p>
              </div>
              <div className="rounded-xl border border-destructive/30 p-5 space-y-4">
                <div>
                  <p className="text-sm font-semibold">Delete project</p>
                  <p className="text-xs text-muted-foreground mt-0.5">All tasks, comments, and attachments will be permanently removed.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Type <span className="font-semibold">{project.name}</span> to confirm</Label>
                  <Input value={confirmDelete} onChange={e => setConfirmDelete(e.target.value)} placeholder={project.name} className="max-w-sm" />
                </div>
                <Button variant="destructive" disabled={deleting || confirmDelete !== project.name} onClick={handleDelete} className="gap-2">
                  {deleting && <Loader2 className="h-4 w-4 animate-spin" />} Delete project
                </Button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>

    <ConfirmDialog
      open={!!confirmRemoveId}
      onConfirm={() => handleRemove(confirmRemoveId)}
      onCancel={() => setConfirmRemoveId(null)}
      title="Remove member?"
      description="This person will lose access to the project."
      confirmLabel="Remove"
    />
    </>
  )
}
