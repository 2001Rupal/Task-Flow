import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  Search, CheckSquare, AlertCircle, X, Mail,
  Briefcase, TrendingUp, Users, Clock, UserPlus, Loader2
} from 'lucide-react'
import { getWorkspacePeople, getMemberTasks } from '../../api/workspaces'
import { inviteMember } from './workspaceSlice'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { ScrollArea } from '../../components/ui/scroll-area'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select'
import { cn, getInitials, formatDate } from '../../lib/utils'
import toast from 'react-hot-toast'

const ROLE_STYLE = {
  owner:  { pill: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400', dot: 'bg-amber-400' },
  admin:  { pill: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',   dot: 'bg-blue-400' },
  member: { pill: 'bg-muted text-muted-foreground',                                       dot: 'bg-slate-400' },
}

const PRIORITY_COLOR = {
  Urgent: 'text-red-500',
  High:   'text-orange-500',
  Medium: 'text-yellow-500',
  Low:    'text-blue-400',
}

function completionPct(stats) {
  const total = (stats.assignedTasks || 0) + (stats.completedTasks || 0)
  if (!total) return 0
  return Math.round((stats.completedTasks / total) * 100)
}

// ── Invite modal ──────────────────────────────
function InviteModal({ onClose }) {
  const dispatch = useDispatch()
  const { current: workspace, currentRole } = useSelector(s => s.workspace)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('Member')
  const [loading, setLoading] = useState(false)

  const canInvite = ['owner', 'admin'].includes(currentRole?.toLowerCase())

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    const result = await dispatch(inviteMember({ id: workspace._id, data: { email: email.trim(), role } }))
    setLoading(false)
    if (inviteMember.fulfilled.match(result)) {
      toast.success(`Invitation sent to ${email}`)
      onClose()
    } else {
      toast.error(result.payload || 'Failed to send invite')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-[400px] bg-background border border-border/60 shadow-2xl rounded-2xl flex flex-col overflow-hidden modal-enter" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/40 bg-muted/20">
          <div>
            <h2 className="text-[15px] font-bold text-foreground">Invite to Workspace</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5 max-w-[280px] truncate">Send an email invite to join {workspace?.name}</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors -mr-2">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5">
          {!canInvite ? (
            <p className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded-lg border border-border/40">Only Owners and Admins can invite members.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                  <Input
                    type="email"
                    placeholder="colleague@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="pl-9 bg-background focus:ring-1 focus:ring-primary/30 h-9 text-[13px]"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Role</label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="h-9 bg-background focus:ring-1 focus:ring-primary/30 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin" className="cursor-pointer font-medium text-[13px]">Admin</SelectItem>
                    <SelectItem value="Member" className="cursor-pointer font-medium text-[13px]">Member</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground pt-1 pl-1">
                  {role === 'Admin' 
                    ? 'Can manage projects, settings, and team members.' 
                    : 'Can view shared projects and edit assigned tasks.'}
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border/40 mt-4">
                <Button type="button" variant="outline" className="flex-1 h-9 rounded-lg" onClick={onClose}>Cancel</Button>
                <Button type="submit" className="flex-1 gap-2 h-9 rounded-lg bg-primary hover:bg-primary/90" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Send invite
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}



// ── Member row ───────────────────────────────
function MemberRow({ member, onClick }) {
  const pct = completionPct(member.stats)
  const role = ROLE_STYLE[member.workspaceRole?.toLowerCase()] || ROLE_STYLE.member

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer group"
    >
      {/* Avatar + name (Fixed width for alignment) */}
      <div className="flex items-center gap-3 w-[260px] shrink-0">
        <div className="relative shrink-0">
          <Avatar className="h-9 w-9">
            <AvatarFallback
              style={{ backgroundColor: member.avatarColor || '#6366f1' }}
              className="text-white font-bold text-xs"
            >
              {getInitials(member.displayName, member.email)}
            </AvatarFallback>
          </Avatar>
          {/* Online dot */}
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-background" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[13px] truncate group-hover:text-primary transition-colors">{member.displayName || member.email}</p>
          <p className="text-[11px] text-muted-foreground truncate">{member.email}</p>
        </div>
      </div>

      {/* Role */}
      <div className="w-[100px] shrink-0 hidden sm:block">
        <span className={cn('inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full capitalize', role.pill)}>
          <span className={cn('h-1.5 w-1.5 rounded-full', role.dot)} />
          {member.workspaceRole}
        </span>
      </div>

      {/* Projects */}
      <div className="flex-1 flex flex-wrap gap-1 items-center min-w-[150px] hidden md:flex">
        {member.projects?.slice(0, 2).map(proj => (
          <span key={proj._id} className="text-[10px] bg-muted border border-border/60 text-muted-foreground rounded-full px-2 py-0.5 truncate max-w-[120px]">
            {proj.name}
          </span>
        ))}
        {member.projects?.length > 2 && (
          <span className="text-[10px] text-muted-foreground rounded-full px-1.5 py-0.5 bg-muted/50 border border-border/30">
            +{member.projects.length - 2}
          </span>
        )}
        {(!member.projects || member.projects.length === 0) && (
          <span className="text-xs text-muted-foreground/30">—</span>
        )}
      </div>

      {/* Stats (Active, Done, Overdue) */}
      <div className="flex items-center gap-6 shrink-0 text-center">
        <div className="flex flex-col items-center justify-center w-8">
           <span className="text-[13px] font-semibold tabular-nums text-sky-600 dark:text-sky-400">{member.stats.assignedTasks || 0}</span>
           <span className="text-[9px] text-muted-foreground uppercase tracking-wider mt-[2px]">Act</span>
        </div>
        <div className="flex flex-col items-center justify-center w-8">
           <span className="text-[13px] font-semibold tabular-nums text-green-600 dark:text-green-400">{member.stats.completedTasks || 0}</span>
           <span className="text-[9px] text-muted-foreground uppercase tracking-wider mt-[2px]">Done</span>
        </div>
        <div className="flex flex-col items-center justify-center w-8">
           <span className={cn('text-[13px] font-semibold tabular-nums', member.stats.overdueTasks > 0 ? 'text-red-500' : 'text-muted-foreground')}>{member.stats.overdueTasks || 0}</span>
           <span className="text-[9px] text-muted-foreground uppercase tracking-wider mt-[2px]">Over</span>
        </div>
      </div>

      {/* Progress */}
      <div className="w-[120px] shrink-0 hidden lg:block ml-4 pl-4 pt-1">
        <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          <span>{pct}% Done</span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: member.avatarColor || '#6366f1' }}
          />
        </div>
      </div>
    </div>
  )
}

// ── Member side drawer ────────────────────────
function MemberDrawer({ member, onClose }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all | active | done | overdue
  const { current: workspace } = useSelector(s => s.workspace)
  const pct = completionPct(member.stats)

  useEffect(() => {
    if (!member || !workspace) return
    setLoading(true)
    getMemberTasks(workspace._id, member.userId)
      .then(r => setTasks(r.data.tasks || []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false))
  }, [member, workspace])

  const filtered = tasks.filter(t => {
    if (filter === 'active')  return t.status !== 'Done'
    if (filter === 'done')    return t.status === 'Done'
    if (filter === 'overdue') return new Date(t.dueDate) < new Date() && t.status !== 'Done'
    return true
  })

  const role = ROLE_STYLE[member.workspaceRole?.toLowerCase()] || ROLE_STYLE.member

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-3xl bg-background border border-border shadow-2xl rounded-2xl flex flex-col max-h-[85vh] overflow-hidden modal-enter flex-1"
        onClick={e => e.stopPropagation()}
      >
        {/* Colored header band */}
        <div
          className="px-5 pt-5 pb-4"
          style={{ background: `linear-gradient(135deg, ${member.avatarColor || '#6366f1'}22, transparent)` }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14 ring-2 ring-white dark:ring-background shadow-md">
                <AvatarFallback
                  style={{ backgroundColor: member.avatarColor || '#6366f1' }}
                  className="text-white font-bold text-lg"
                >
                  {getInitials(member.displayName, member.email)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-base">{member.displayName || member.email}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                </div>
                <span className={cn('inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full capitalize mt-1.5', role.pill)}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', role.dot)} />
                  {member.workspaceRole}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Completion bar */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Overall completion</span>
              <span className="font-semibold">{pct}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: member.avatarColor || '#6366f1' }}
              />
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 px-6 py-4 border-b border-border/60">
          {[
            { label: 'Active Tasks', value: member.stats.assignedTasks,  color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-900/10' },
            { label: 'Completed',    value: member.stats.completedTasks, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/10' },
            { label: 'Overdue',      value: member.stats.overdueTasks,   color: member.stats.overdueTasks > 0 ? 'text-red-500' : 'text-muted-foreground', bg: member.stats.overdueTasks > 0 ? 'bg-red-50 dark:bg-red-900/10' : 'bg-muted/40' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={cn('rounded-xl p-3 text-center border border-border/40 card-shadow', bg)}>
              <p className={cn('text-2xl font-bold leading-none', color)}>{value}</p>
              <p className="text-[11px] font-medium text-muted-foreground mt-1.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row flex-1 min-h-0 bg-muted/10">
          {/* Sidebar Area (Projects) */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border/60 bg-background/50 flex flex-col min-h-0">
            {member.projects?.length > 0 ? (
              <div className="p-5">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" /> Shared Projects
                </p>
                <div className="flex flex-col gap-1.5">
                  {member.projects.map(proj => (
                    <div key={proj._id} className="text-[13px] font-medium bg-background border border-border/60 text-foreground rounded-lg px-3 py-2 shadow-sm truncate flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor: proj.color || '#6366f1'}}></span>
                       <span className="truncate">{proj.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
                <div className="p-5 text-sm text-muted-foreground text-center">No shared projects.</div>
            )}
          </div>

          {/* Main Area (Tasks) */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-background">
            {/* Task filter tabs */}
            <div className="flex gap-2 px-5 py-3 border-b border-border/60 bg-muted/20">
              {[
                { id: 'all',     label: 'All tasks' },
                { id: 'active',  label: 'Active' },
                { id: 'done',    label: 'Done' },
                { id: 'overdue', label: 'Overdue' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={cn(
                    'text-[12px] px-3.5 py-1.5 rounded-md font-medium transition-all',
                    filter === tab.id
                      ? 'bg-foreground text-background shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Task list scrollable */}
            <ScrollArea className="flex-1 h-[400px]">
          <div className="p-4 space-y-1">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10">
                <CheckSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No tasks here</p>
              </div>
            ) : (
              filtered.map(t => {
                const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Done'
                return (
                  <div
                    key={t._id}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                  >
                    <div className={cn(
                      'mt-0.5 h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center',
                      t.status === 'Done' ? 'bg-green-500 border-green-500' : 'border-muted-foreground/40'
                    )}>
                      {t.status === 'Done' && (
                        <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm leading-snug', t.status === 'Done' && 'opacity-50')}>
                        {t.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {t.listId?.name && (
                          <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                            {t.listId.name}
                          </span>
                        )}
                        {t.priority && (
                          <span className={cn('text-[10px] font-medium', PRIORITY_COLOR[t.priority])}>
                            {t.priority}
                          </span>
                        )}
                        {t.dueDate && (
                          <span className={cn('text-[10px] flex items-center gap-0.5', isOverdue ? 'text-red-500' : 'text-muted-foreground')}>
                            <Clock className="h-2.5 w-2.5" />
                            {formatDate(t.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={cn(
                      'text-[10px] font-medium shrink-0 px-2 py-0.5 rounded-full',
                      t.status === 'Done' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      isOverdue ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-muted text-muted-foreground'
                    )}>
                      {t.status}
                    </span>
                  </div>
                )
              })
            )}
          </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────
export default function PeoplePage() {
  const { current: workspace, currentRole } = useSelector(s => s.workspace)
  const [people, setPeople]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [selected, setSelected] = useState(null)
  const [roleFilter, setRoleFilter] = useState('all')
  const [inviteOpen, setInviteOpen] = useState(false)

  useEffect(() => {
    if (!workspace) return
    setLoading(true)
    getWorkspacePeople(workspace._id)
      .then(r => setPeople(r.data.people || []))
      .catch(() => setPeople([]))
      .finally(() => setLoading(false))
  }, [workspace])

  const filtered = people.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = (p.displayName || '').toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
    const matchRole   = roleFilter === 'all' || p.workspaceRole?.toLowerCase() === roleFilter
    return matchSearch && matchRole
  })

  return (
    <div className="px-6 py-4 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">People</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {workspace?.name} · {people.length} member{people.length !== 1 ? 's' : ''}
          </p>
        </div>
        {['owner', 'admin'].includes(currentRole?.toLowerCase()) && (
          <Button className="gap-2 shadow-sm relative group overflow-hidden" onClick={() => setInviteOpen(true)}>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <UserPlus className="h-4 w-4 relative z-10" />
            <span className="relative z-10">Invite people</span>
          </Button>
        )}
      </div>



      {/* Filters row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {['all', 'owner', 'admin', 'member'].map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-full capitalize transition-colors',
                roleFilter === r
                  ? 'bg-primary text-white font-medium'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* List / Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">{search ? 'No members match your search' : 'No members yet'}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden card-shadow">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Table Header */}
              <div className="flex items-center gap-4 px-4 py-2.5 bg-muted/30 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <div className="w-[260px] shrink-0">Member</div>
                <div className="w-[100px] shrink-0 hidden sm:block">Role</div>
                <div className="flex-1 min-w-[150px] hidden md:block">Projects</div>
                <div className="flex items-center gap-6 shrink-0 w-[140px] justify-center text-center">Tasks</div>
                <div className="w-[120px] shrink-0 hidden lg:block ml-4 pl-4">Completion</div>
              </div>
              {/* Rows */}
              <div className="divide-y divide-border/60">
                {filtered.map(p => (
                  <MemberRow key={p.userId} member={p} onClick={() => setSelected(p)} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {selected && <MemberDrawer member={selected} onClose={() => setSelected(null)} />}
      {inviteOpen && <InviteModal onClose={() => setInviteOpen(false)} />}
    </div>
  )
}
