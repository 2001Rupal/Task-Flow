import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Loader2, Trash2, UserPlus, UserMinus, Crown, Shield, User, Settings, Users, AlertTriangle } from 'lucide-react'
import { fetchWorkspace, updateWorkspace, deleteWorkspace, inviteMember, removeMember } from './workspaceSlice'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { getInitials, cn } from '../../lib/utils'
import toast from 'react-hot-toast'

const ROLE_ICONS = { Owner: Crown, Admin: Shield, Member: User }

const SECTIONS = [
  { id: 'general', label: 'General',    icon: Settings },
  { id: 'members', label: 'Members',    icon: Users },
  { id: 'danger',  label: 'Danger Zone', icon: AlertTriangle, destructive: true },
]

export default function WorkspaceSettingsPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { current, currentMembers, currentRole } = useSelector(s => s.workspace)
  const { user } = useSelector(s => s.auth)
  const [section, setSection] = useState('general')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('Member')
  const [inviting, setInviting] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (current?._id) {
      dispatch(fetchWorkspace(current._id))
      setName(current.name || '')
      setDescription(current.description || '')
    }
  }, [current?._id, dispatch])

  const isOwner = currentRole === 'Owner'
  const isAdmin = ['Owner', 'Admin'].includes(currentRole)

  const handleSave = async () => {
    setSaving(true)
    const result = await dispatch(updateWorkspace({ id: current._id, data: { name, description } }))
    setSaving(false)
    if (updateWorkspace.fulfilled.match(result)) toast.success('Workspace updated')
    else toast.error(result.payload || 'Failed to update')
  }

  const handleInvite = async (e) => {
    e.preventDefault()
    setInviting(true)
    const result = await dispatch(inviteMember({ id: current._id, data: { email: inviteEmail, role: inviteRole } }))
    setInviting(false)
    if (inviteMember.fulfilled.match(result)) { toast.success(`Invitation sent to ${inviteEmail}`); setInviteEmail('') }
    else toast.error(result.payload || 'Failed to invite')
  }

  const handleRemove = async (memberId) => {
    const result = await dispatch(removeMember({ workspaceId: current._id, memberId }))
    if (removeMember.fulfilled.match(result)) toast.success('Member removed')
    else toast.error(result.payload || 'Failed to remove')
  }

  const handleDelete = async () => {
    const result = await dispatch(deleteWorkspace(current._id))
    if (deleteWorkspace.fulfilled.match(result)) { toast.success('Workspace deleted'); navigate('/dashboard') }
    else toast.error(result.payload || 'Failed to delete')
  }

  if (!current) return <div className="p-8 text-muted-foreground">No workspace selected</div>

  const visibleSections = isOwner ? SECTIONS : SECTIONS.filter(s => s.id !== 'danger')

  return (
    <div className="flex h-full">
      {/* ── Left nav ── */}
      <div className="w-56 shrink-0 border-r border-border bg-muted/20 px-3 py-5 space-y-0.5">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
          {current.name}
        </p>
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
            <s.icon className="h-4 w-4 shrink-0" />
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl px-8 py-6 space-y-6">

          {/* General */}
          {section === 'general' && (
            <>
              <div>
                <h2 className="text-lg font-semibold">General</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Basic workspace information</p>
              </div>
              <div className="space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label>Workspace name</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} disabled={!isAdmin} />
                    <p className="text-xs text-muted-foreground">Shown in the sidebar and all shared links</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Input value={description} onChange={e => setDescription(e.target.value)} disabled={!isAdmin} placeholder="What does your team work on?" />
                    <p className="text-xs text-muted-foreground">Optional — helps new members understand the workspace</p>
                  </div>
                </div>

                {/* Info card */}
                <div className="p-4 rounded-xl bg-muted/30 border border-border grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Your role</p>
                    <p className="text-sm font-semibold mt-0.5">{currentRole}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Members</p>
                    <p className="text-sm font-semibold mt-0.5">{currentMembers.length}</p>
                  </div>
                </div>

                {isAdmin && (
                  <Button onClick={handleSave} disabled={saving} className="gap-2">
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
                  </Button>
                )}
              </div>
            </>
          )}

          {/* Members */}
          {section === 'members' && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Members</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">{currentMembers.length} member{currentMembers.length !== 1 ? 's' : ''}</p>
                </div>
              </div>

              {isAdmin && (
                <form onSubmit={handleInvite} className="flex gap-2 p-4 rounded-xl border border-border bg-muted/20">
                  <Input type="email" placeholder="Email address" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required className="flex-1" />
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="submit" disabled={inviting} className="gap-1.5">
                    {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                    Invite
                  </Button>
                </form>
              )}

              <div className="rounded-xl border border-border overflow-hidden">
                {currentMembers.map((m, i) => {
                  const RoleIcon = ROLE_ICONS[m.role] || User
                  const isMe = m.userId?._id === user?.userId
                  return (
                    <div key={m._id} className={cn('flex items-center gap-3 px-4 py-3', i < currentMembers.length - 1 && 'border-b border-border/60')}>
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback style={{ backgroundColor: m.userId?.avatarColor || '#6366f1' }} className="text-white text-xs font-semibold">
                          {getInitials(m.userId?.displayName, m.userId?.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.userId?.displayName || m.userId?.email}
                          {isMe && <span className="ml-1.5 text-[10px] text-muted-foreground">(you)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{m.userId?.email}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                        <RoleIcon className="h-3.5 w-3.5" />
                        {m.role}
                      </div>
                      {isAdmin && !isMe && m.role !== 'Owner' && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0" onClick={() => handleRemove(m.userId?._id)}>
                          <UserMinus className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* Danger zone */}
          {section === 'danger' && isOwner && (
            <>
              <div>
                <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Irreversible actions — proceed with caution</p>
              </div>
              <div className="rounded-xl border border-destructive/30 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold">Delete workspace</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Permanently delete this workspace and all its data. This cannot be undone.</p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-1.5 shrink-0 ml-4">
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
