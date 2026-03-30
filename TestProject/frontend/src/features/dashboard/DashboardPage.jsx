import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import {
  CheckSquare, AlertTriangle, FolderKanban, TrendingUp,
  Circle, CheckCircle2, ArrowRight, Clock, Zap,
  Calendar, Target, Star
} from 'lucide-react'
import { formatDate, isOverdue } from '../../lib/utils'
import * as tasksApi from '../../api/tasks'
import { cn } from '../../lib/utils'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
function getEmoji() {
  const h = new Date().getHours()
  if (h < 12) return '☀️'
  if (h < 17) return '👋'
  return '🌙'
}

// ── Compact stat pill ─────────────────────────
function StatPill({ label, value, icon: Icon, color, alert }) {
  return (
    <div className={cn(
      'flex items-center gap-2.5 px-3.5 py-2 rounded-xl border transition-colors',
      alert
        ? 'border-red-200 bg-red-50/60 dark:border-red-900/40 dark:bg-red-950/20'
        : 'border-border bg-card hover:bg-muted/30'
    )}>
      <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center shrink-0', color)}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold tabular-nums leading-none">{value}</p>
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">{label}</p>
      </div>
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <div className="skeleton h-3.5 w-3.5 rounded-full shrink-0" />
      <div className="skeleton h-3 flex-1 rounded" />
      <div className="skeleton h-3 w-16 rounded" />
    </div>
  )
}

function PriorityDot({ priority }) {
  const colors = { Urgent: 'bg-red-500', High: 'bg-orange-400', Medium: 'bg-yellow-400', Low: 'bg-blue-400' }
  return <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', colors[priority] || 'bg-muted-foreground/30')} />
}

// ── Progress ring ─────────────────────────────
function ProgressRing({ value, max, size = 56, stroke = 5, color = '#5b5ef4' }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = max > 0 ? Math.min(value / max, 1) : 0
  const dash = pct * circ
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted/60" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" className="transition-all duration-700" />
    </svg>
  )
}

// ── Week strip ────────────────────────────────
function WeekStrip({ tasks }) {
  const today = new Date(); today.setHours(0,0,0,0)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() + i)
    return d
  })
  const tasksByDay = days.map(d => ({
    date: d,
    count: tasks.filter(t => {
      if (!t.dueDate) return false
      const due = new Date(t.dueDate); due.setHours(0,0,0,0)
      return due.getTime() === d.getTime()
    }).length,
    isToday: d.getTime() === today.getTime()
  }))

  return (
    <div className="flex gap-1">
      {tasksByDay.map(({ date, count, isToday }, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <span className="text-[10px] text-muted-foreground">
            {['S','M','T','W','T','F','S'][date.getDay()]}
          </span>
          <div className={cn(
            'w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-semibold',
            isToday ? 'bg-primary text-white' : count > 0 ? 'bg-primary/10 text-primary' : 'bg-muted/40 text-muted-foreground'
          )}>
            {date.getDate()}
          </div>
          {count > 0 && (
            <span className="h-1 w-1 rounded-full bg-primary/60" />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Section header ────────────────────────────
function SectionHeader({ icon: Icon, iconColor, title, count, actionLabel, actionTo }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
      <div className="flex items-center gap-2">
        <div className={cn('h-5 w-5 rounded-md flex items-center justify-center', iconColor)}>
          <Icon className="h-3 w-3" />
        </div>
        <h2 className="text-[13px] font-semibold">{title}</h2>
        {count != null && (
          <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-1.5 py-px font-medium">{count}</span>
        )}
      </div>
      {actionLabel && actionTo && (
        <Link to={actionTo} className="text-[11px] text-primary hover:text-primary/80 font-medium flex items-center gap-0.5">
          {actionLabel} <ArrowRight className="h-2.5 w-2.5" />
        </Link>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { list: projects } = useSelector(s => s.projects)
  const { user } = useSelector(s => s.auth)
  const navigate = useNavigate()
  const [myTasks, setMyTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    tasksApi.getMyWork().then(({ data }) => {
      setMyTasks(data.todos || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const overdue    = myTasks.filter(t => isOverdue(t.dueDate, t.status))
  const inProgress = myTasks.filter(t => t.status === 'In Progress')
  const done       = myTasks.filter(t => ['Done', 'Completed'].includes(t.status))
  const active     = myTasks.filter(t => !['Done', 'Completed'].includes(t.status))
  const completionPct = myTasks.length > 0 ? Math.round((done.length / myTasks.length) * 100) : 0
  const name = user?.displayName || user?.email?.split('@')[0] || 'there'

  // Tasks due in next 7 days
  const today = new Date(); today.setHours(0,0,0,0)
  const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7)
  const dueThisWeek = myTasks.filter(t => {
    if (!t.dueDate || ['Done','Completed'].includes(t.status)) return false
    const d = new Date(t.dueDate); d.setHours(0,0,0,0)
    return d >= today && d <= nextWeek
  })

  return (
    <div className="page-enter h-full bg-background overflow-y-auto">
      <div className="max-w-[1100px] mx-auto px-5 py-4 space-y-4">

        {/* ── Greeting — tighter ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {getGreeting()}, {name} {getEmoji()}
            </h1>
            <p className="text-muted-foreground text-[13px] mt-0.5">
              {overdue.length > 0
                ? `${overdue.length} overdue task${overdue.length > 1 ? 's' : ''} need attention.`
                : "Here's your workspace at a glance."
              }
            </p>
          </div>
          <Link to="/my-work" className="hidden sm:flex items-center gap-1.5 text-[13px] text-primary hover:text-primary/80 font-medium">
            <Zap className="h-3.5 w-3.5" /> My work
          </Link>
        </div>

        {/* ── Stat pills — compact single row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <StatPill label="My tasks"    value={myTasks.length}    icon={CheckSquare}   color="bg-primary/10 text-primary" />
          <StatPill label="In progress" value={inProgress.length} icon={TrendingUp}    color="bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400" />
          <StatPill label="Overdue"     value={overdue.length}    icon={AlertTriangle} color="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" alert={overdue.length > 0} />
          <StatPill label="Projects"    value={projects.length}   icon={FolderKanban}  color="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400" />
        </div>

        {/* ── Overdue alert — inline if present ── */}
        {overdue.length > 0 && (
          <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/80 dark:bg-red-950/20 px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
              <h2 className="text-[13px] font-semibold text-red-700 dark:text-red-400">
                {overdue.length} overdue task{overdue.length > 1 ? 's' : ''}
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-4 gap-y-0.5">
              {overdue.slice(0, 6).map(t => (
                <div key={t._id} className="flex items-center gap-2 py-0.5 cursor-pointer group"
                  onClick={() => navigate(`/projects/${t.listId?._id || t.listId}`)}>
                  <Circle className="h-3 w-3 text-red-400 shrink-0" />
                  <span className="flex-1 text-xs truncate text-red-800 dark:text-red-300 group-hover:underline">{t.title}</span>
                  <span className="text-[10px] text-red-500 shrink-0 font-medium">{formatDate(t.dueDate)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Main 2-column grid ── */}
        <div className="grid lg:grid-cols-[1fr_280px] gap-4">

          {/* Left column: Tasks + Projects */}
          <div className="space-y-4">

            {/* My tasks */}
            <div className="bg-card rounded-xl border border-border card-shadow overflow-hidden">
              <SectionHeader icon={CheckSquare} iconColor="bg-primary/10 text-primary" title="My tasks" count={loading ? null : myTasks.length} actionLabel="View all" actionTo="/my-work" />
              <div className="divide-y divide-border/50">
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                  : myTasks.length === 0
                    ? (
                      <div className="px-4 py-6 text-center">
                        <CheckCircle2 className="h-8 w-8 text-muted-foreground/20 mx-auto mb-1.5" />
                        <p className="text-[13px] font-medium text-muted-foreground">All clear!</p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">No tasks assigned to you</p>
                      </div>
                    )
                    : myTasks.slice(0, 10).map(t => {
                      const over = isOverdue(t.dueDate, t.status)
                      const isDone = ['Done', 'Completed'].includes(t.status)
                      return (
                        <div key={t._id}
                          className="flex items-center gap-2.5 px-4 py-[7px] hover:bg-muted/30 cursor-pointer group"
                          onClick={() => navigate(`/projects/${t.listId?._id || t.listId}`)}
                        >
                          {isDone
                            ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                            : <Circle className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0 group-hover:text-muted-foreground/60" />
                          }
                          <PriorityDot priority={t.priority} />
                          <span className={cn('flex-1 text-[13px] truncate font-medium', isDone && 'text-muted-foreground opacity-80')}>
                            {t.title}
                          </span>
                          {t.listId?.name && (
                            <span className="text-[11px] text-muted-foreground/40 truncate max-w-[100px] hidden sm:block">{t.listId.name}</span>
                          )}
                          {t.dueDate && (
                            <span className={cn('text-[11px] shrink-0 flex items-center gap-0.5', over ? 'text-red-500 font-semibold' : 'text-muted-foreground/50')}>
                              {over && <Clock className="h-3 w-3" />}
                              {formatDate(t.dueDate)}
                            </span>
                          )}
                        </div>
                      )
                    })
                }
              </div>
            </div>

            {/* Projects */}
            <div className="bg-card rounded-xl border border-border card-shadow overflow-hidden">
              <SectionHeader icon={FolderKanban} iconColor="bg-violet-500/10 text-violet-500" title="Projects" count={projects.length} actionLabel="View all" actionTo="/projects" />
              <div className="divide-y divide-border/50">
                {projects.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <FolderKanban className="h-8 w-8 text-muted-foreground/20 mx-auto mb-1.5" />
                    <p className="text-[13px] font-medium text-muted-foreground">No projects yet</p>
                    <Link to="/projects/new" className="mt-1 inline-flex items-center gap-1 text-xs text-primary font-medium">
                      Create your first project →
                    </Link>
                  </div>
                ) : (
                  projects.slice(0, 6).map(p => (
                    <Link key={p._id} to={`/projects/${p._id}`}
                      className="flex items-center gap-2.5 px-4 py-[7px] hover:bg-muted/30 group"
                    >
                      <span className="h-5 w-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                        style={{ backgroundColor: p.color || '#5b5ef4' }}>
                        {p.icon && p.icon !== '📋' ? p.icon : p.name.slice(0,1).toUpperCase()}
                      </span>
                      <span className="flex-1 text-[13px] truncate group-hover:text-primary">{p.name}</span>
                      <span className="text-[11px] text-muted-foreground/40 capitalize shrink-0">{p.role}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground/20 opacity-0 group-hover:opacity-100" />
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right column: Widgets */}
          <div className="space-y-3">

            {/* Completion progress */}
            <div className="bg-card rounded-xl border border-border card-shadow p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-3.5 w-3.5 text-primary" />
                <h3 className="text-[13px] font-semibold">Progress</h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <ProgressRing value={done.length} max={myTasks.length} size={56} stroke={5} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold">{completionPct}%</span>
                  </div>
                </div>
                <div className="space-y-1.5 flex-1">
                  {[
                    { label: 'Completed', value: done.length, color: 'bg-green-500' },
                    { label: 'Active',    value: active.length, color: 'bg-primary' },
                    { label: 'Overdue',   value: overdue.length, color: 'bg-red-500' },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-2">
                      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', s.color)} />
                      <span className="text-[11px] text-muted-foreground flex-1">{s.label}</span>
                      <span className="text-[11px] font-semibold tabular-nums">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Week calendar strip */}
            <div className="bg-card rounded-xl border border-border card-shadow p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-3.5 w-3.5 text-sky-500" />
                <h3 className="text-[13px] font-semibold">This week</h3>
                {dueThisWeek.length > 0 && (
                  <span className="ml-auto text-[10px] bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 rounded-full px-1.5 py-px font-medium">
                    {dueThisWeek.length} due
                  </span>
                )}
              </div>
              <WeekStrip tasks={myTasks} />
              {dueThisWeek.length > 0 && (
                <div className="mt-3 space-y-1">
                  {dueThisWeek.slice(0, 3).map(t => (
                    <div key={t._id}
                      className="flex items-center gap-2 cursor-pointer group"
                      onClick={() => navigate(`/projects/${t.listId?._id || t.listId}`)}
                    >
                      <PriorityDot priority={t.priority} />
                      <span className="flex-1 text-[11px] truncate group-hover:text-primary">{t.title}</span>
                      <span className="text-[10px] text-muted-foreground/50 shrink-0">{formatDate(t.dueDate)}</span>
                    </div>
                  ))}
                  {dueThisWeek.length > 3 && (
                    <Link to="/my-work" className="text-[10px] text-primary hover:text-primary/80 font-medium">
                      +{dueThisWeek.length - 3} more
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Priority breakdown */}
            {!loading && myTasks.length > 0 && (
              <div className="bg-card rounded-xl border border-border card-shadow p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="h-3.5 w-3.5 text-orange-400" />
                  <h3 className="text-[13px] font-semibold">By priority</h3>
                </div>
                <div className="space-y-2">
                  {['Urgent','High','Medium','Low'].map(p => {
                    const count = active.filter(t => t.priority === p).length
                    const pct = active.length > 0 ? (count / active.length) * 100 : 0
                    const colors = { Urgent: 'bg-red-500', High: 'bg-orange-400', Medium: 'bg-yellow-400', Low: 'bg-blue-400' }
                    if (count === 0) return null
                    return (
                      <div key={p}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[11px] text-muted-foreground">{p}</span>
                          <span className="text-[11px] font-semibold tabular-nums">{count}</span>
                        </div>
                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                          <div className={cn('h-full rounded-full transition-all duration-700', colors[p])}
                            style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  )
}
