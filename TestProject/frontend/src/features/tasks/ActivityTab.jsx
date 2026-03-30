import { useState, useEffect, useRef } from 'react'
import * as tasksApi from '../../api/tasks'
import * as socketClient from '../../api/socketClient'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { getInitials, cn } from '../../lib/utils'
import {
  Loader2, ArrowRight, Paperclip, CheckCircle2,
  MessageSquare, Activity
} from 'lucide-react'

// ── Priority colors ───────────────────────────
const PRIORITY_COLORS = {
  High:   'text-red-500',
  Medium: 'text-orange-400',
  Low:    'text-blue-400',
  None:   'text-muted-foreground',
}

// ── Filter config ─────────────────────────────
const FILTERS = [
  { key: 'all',      label: 'All activity' },
  { key: 'status',   label: 'Status & priority' },
  { key: 'assigned', label: 'Assignee' },
  { key: 'comments', label: 'Comments' },
  { key: 'files',    label: 'Files' },
]

const OTHER_ACTIONS = new Set(['created','updated','tag_added','tag_removed','watcher_added','watcher_removed','subtask_added','subtask_completed'])

function matchesFilter(a, filter) {
  if (filter === 'all')      return true
  if (filter === 'status')   return ['status_changed','priority_changed','due_date_changed'].includes(a.action)
  if (filter === 'assigned') return ['assigned','unassigned'].includes(a.action)
  if (filter === 'comments') return a.action === 'commented'
  if (filter === 'files')    return ['attachment_added','attachment_removed'].includes(a.action)
  return true
}

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d === 1) return 'Yesterday'
  if (d < 7)  return `${d}d ago`
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function groupByDate(activities) {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart - 86400000)
  const weekStart = new Date(todayStart - 6 * 86400000)
  const groups = { Today: [], Yesterday: [], 'This week': [], Earlier: [] }
  activities.forEach(a => {
    const d = new Date(a.createdAt)
    if (d >= todayStart)          groups.Today.push(a)
    else if (d >= yesterdayStart) groups.Yesterday.push(a)
    else if (d >= weekStart)      groups['This week'].push(a)
    else                          groups.Earlier.push(a)
  })
  return groups
}

// ── Inline chip ───────────────────────────────
function Chip({ children, highlight, className }) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium mx-0.5 align-middle',
      highlight ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
      className
    )}>
      {children}
    </span>
  )
}

// ── Activity row message ──────────────────────
function ActivityMessage({ a }) {
  const name = a.userId?.displayName || a.userId?.email?.split('@')[0] || 'Someone'

  switch (a.action) {
    case 'created':
      return <><span className="font-semibold">{name}</span> created this task</>

    case 'status_changed':
      return (
        <>
          <span className="font-semibold">{name}</span> changed the status from{' '}
          <Chip>{a.oldValue || '—'}</Chip>
          <ArrowRight className="inline h-3 w-3 mx-0.5 text-muted-foreground/50 align-middle" />
          <Chip highlight>{a.newValue}</Chip>
        </>
      )

    case 'priority_changed':
      return (
        <>
          <span className="font-semibold">{name}</span> changed priority from{' '}
          <Chip className={PRIORITY_COLORS[a.oldValue]}>{a.oldValue || '—'}</Chip>
          <ArrowRight className="inline h-3 w-3 mx-0.5 text-muted-foreground/50 align-middle" />
          <Chip highlight className={PRIORITY_COLORS[a.newValue]}>{a.newValue}</Chip>
        </>
      )

    case 'assigned':
      return a.newValue
        ? <><span className="font-semibold">{name}</span> assigned this task to <Chip highlight>{a.newValue}</Chip></>
        : <><span className="font-semibold">{name}</span> unassigned <Chip>{a.oldValue}</Chip></>

    case 'unassigned':
      return <><span className="font-semibold">{name}</span> unassigned <Chip>{a.oldValue}</Chip></>

    case 'due_date_changed':
      return a.newValue
        ? <><span className="font-semibold">{name}</span> set the due date to <Chip highlight>{new Date(a.newValue).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</Chip></>
        : <><span className="font-semibold">{name}</span> removed the due date</>

    case 'attachment_added':
      return (
        <>
          <span className="font-semibold">{name}</span> attached{' '}
          <Chip highlight><Paperclip className="inline h-2.5 w-2.5 mr-0.5 align-middle" />{a.newValue}</Chip>
        </>
      )

    case 'attachment_removed':
      return <><span className="font-semibold">{name}</span> removed attachment <Chip>{a.oldValue}</Chip></>

    case 'tag_added':
      return <><span className="font-semibold">{name}</span> added tag <Chip highlight className="text-teal-600 dark:text-teal-400">{a.newValue}</Chip></>

    case 'tag_removed':
      return <><span className="font-semibold">{name}</span> removed tag <Chip>{a.newValue || a.oldValue}</Chip></>

    case 'watcher_added':
      return <><span className="font-semibold">{name}</span> added <Chip highlight>{a.newValue}</Chip> as a watcher</>

    case 'watcher_removed':
      return <><span className="font-semibold">{name}</span> removed <Chip>{a.oldValue}</Chip> as a watcher</>

    case 'subtask_added':
      return <><span className="font-semibold">{name}</span> added subtask <Chip highlight>{a.newValue}</Chip></>

    case 'subtask_completed':
      return (
        <>
          <span className="font-semibold">{name}</span> completed subtask{' '}
          <Chip highlight className="text-green-600 dark:text-green-400">
            <CheckCircle2 className="inline h-2.5 w-2.5 mr-0.5 align-middle" />{a.newValue}
          </Chip>
        </>
      )

    case 'commented':
      return (
        <>
          <span className="font-semibold">{name}</span> added a comment
          {a.newValue && (
            <span className="block mt-1 text-muted-foreground italic text-[11px] leading-relaxed pl-0.5">
              "{a.newValue}"
            </span>
          )}
        </>
      )

    default:
      return <><span className="font-semibold">{name}</span> updated the task</>
  }
}

// ── Single activity row (Asana feed style) ────
function ActivityRow({ a, isNew }) {
  const avatarColor = a.userId?.avatarColor || '#6366f1'
  const isComment = a.action === 'commented'

  return (
    <div className={cn(
      'flex gap-3 py-2.5 px-1 rounded-lg transition-colors group',
      isNew && 'animate-in fade-in slide-in-from-bottom-1 duration-300',
      isComment && 'hover:bg-muted/30'
    )}>
      {/* Avatar */}
      <Avatar className="h-7 w-7 shrink-0 mt-0.5">
        <AvatarFallback
          style={{ backgroundColor: avatarColor }}
          className="text-[10px] text-white font-medium"
        >
          {getInitials(a.userId?.displayName, a.userId?.email)}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs leading-relaxed text-foreground/90">
          <ActivityMessage a={a} />
        </p>
        <p className="text-[10px] text-muted-foreground/50 mt-0.5">{timeAgo(a.createdAt)}</p>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────
export default function ActivityTab({ taskId, projectId }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [newIds, setNewIds] = useState(new Set())
  const bottomRef = useRef(null)

  useEffect(() => {
    tasksApi.getTaskActivity(taskId)
      .then(({ data }) => setActivities(data.activities || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [taskId])

  // Real-time updates
  useEffect(() => {
    if (!projectId) return
    socketClient.joinProject(projectId)
    const handler = ({ activity }) => {
      if (String(activity.taskId) !== String(taskId)) return
      setActivities(prev => {
        if (prev.find(a => a._id === activity._id)) return prev
        return [...prev, activity]
      })
      setNewIds(prev => new Set([...prev, activity._id]))
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
    socketClient.on('activity:new', handler)
    return () => socketClient.off('activity:new', handler)
  }, [projectId, taskId])

  // Activities come sorted newest-first from API, reverse for chronological display
  const chronological = [...activities].reverse()
  const filtered = chronological.filter(a => matchesFilter(a, filter))
  const grouped = groupByDate(filtered)

  if (loading) return (
    <div className="py-8 flex justify-center">
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    </div>
  )

  return (
    <div className="mt-1 space-y-1">

      {/* Filter pills */}
      <div className="flex gap-1 flex-wrap pb-2 border-b border-border/40">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'text-[11px] rounded-full px-2.5 py-1 transition-colors whitespace-nowrap',
              filter === f.key
                ? 'bg-foreground text-background font-semibold'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-10 gap-2 text-muted-foreground">
          <Activity className="h-7 w-7 opacity-20" />
          <p className="text-xs">No activity yet</p>
        </div>
      ) : (
        Object.entries(grouped).map(([group, items]) =>
          items.length === 0 ? null : (
            <div key={group} className="space-y-0">
              {/* Date group label */}
              <div className="flex items-center gap-2 pt-2 pb-1">
                <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">{group}</span>
                <div className="flex-1 h-px bg-border/40" />
              </div>

              {/* Rows */}
              {items.map(a => (
                <ActivityRow key={a._id} a={a} isNew={newIds.has(a._id)} />
              ))}
            </div>
          )
        )
      )}

      <div ref={bottomRef} />
    </div>
  )
}
