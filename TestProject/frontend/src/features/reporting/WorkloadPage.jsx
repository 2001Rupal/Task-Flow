import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { getWorkload } from '../../api/workspaces'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { AlertTriangle, CheckSquare, Clock } from 'lucide-react'
import { getInitials, cn } from '../../lib/utils'

const CAPACITY_TASKS = 10  // tasks = 100%
const CAPACITY_HOURS = 40  // hours = 100%

function CapacityBar({ value, max, color, overloaded }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', overloaded ? 'bg-red-500' : color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn('text-xs w-8 text-right tabular-nums', overloaded ? 'text-red-500 font-semibold' : 'text-muted-foreground')}>
        {Math.round(pct)}%
      </span>
    </div>
  )
}

export default function WorkloadPage() {
  const { current: workspace } = useSelector(s => s.workspace)
  const [workload, setWorkload] = useState([])
  const [threshold, setThreshold] = useState({ tasks: CAPACITY_TASKS, hours: CAPACITY_HOURS })
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('tasks') // tasks | hours | name

  useEffect(() => {
    if (!workspace) return
    setLoading(true)
    getWorkload(workspace._id)
      .then(r => {
        setWorkload(r.data.workload || [])
        if (r.data.threshold) setThreshold(r.data.threshold)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [workspace])

  const sorted = [...workload].sort((a, b) => {
    if (sort === 'hours') return b.estimatedHours - a.estimatedHours
    if (sort === 'name') return (a.displayName || a.email).localeCompare(b.displayName || b.email)
    return b.taskCount - a.taskCount
  })

  const overloaded = workload.filter(m => m.isOverloaded).length
  const totalTasks = workload.reduce((s, m) => s + m.taskCount, 0)
  const totalHours = workload.reduce((s, m) => s + m.estimatedHours, 0)

  return (
    <div className="px-6 py-4 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Workload</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Team capacity across {workspace?.name}</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Team members', value: workload.length,  colorCls: 'text-primary bg-primary/10',                          icon: CheckSquare },
          { label: 'Active tasks', value: totalTasks,       colorCls: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30',        icon: CheckSquare },
          { label: 'Overloaded',   value: overloaded,       colorCls: 'text-red-500 bg-red-50 dark:bg-red-950/30',           icon: AlertTriangle },
        ].map(({ label, value, colorCls, icon: Icon }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', colorCls)}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Overload warning */}
      {overloaded > 0 && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg text-sm text-red-700 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {overloaded} team member{overloaded > 1 ? 's are' : ' is'} overloaded (≥{threshold.tasks} tasks or ≥{threshold.hours}h estimated)
        </div>
      )}

      {/* Sort tabs */}
      <div className="flex gap-1 border-b border-border">
        {[
          { key: 'tasks', label: 'By tasks' },
          { key: 'hours', label: 'By hours' },
          { key: 'name',  label: 'By name' },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setSort(s.key)}
            className={cn(
              'px-3 py-2 text-sm border-b-2 -mb-px transition-colors',
              sort === s.key ? 'border-primary text-primary font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Member cards */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No team members found</div>
      ) : (
        <div className="space-y-3">
          {sorted.map(m => (
            <div
              key={m.userId}
              className={cn(
                'bg-card border rounded-xl p-4 transition-colors',
                m.isOverloaded ? 'border-red-200 dark:border-red-900' : 'border-border'
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback style={{ backgroundColor: m.avatarColor || '#f06a6a' }} className="text-white text-sm font-semibold">
                    {getInitials(m.displayName, m.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{m.displayName || m.email}</p>
                  <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                </div>
                {m.isOverloaded && (
                  <span className="flex items-center gap-1 text-xs text-red-500 font-medium bg-red-50 dark:bg-red-950/30 px-2 py-1 rounded-full">
                    <AlertTriangle className="h-3 w-3" /> Overloaded
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <CheckSquare className="h-3 w-3" /> Tasks
                    </span>
                    <span className="font-medium">{m.taskCount} / {threshold.tasks}</span>
                  </div>
                  <CapacityBar
                    value={m.taskCount}
                    max={threshold.tasks}
                    color="bg-blue-500"
                    overloaded={m.taskCount >= threshold.tasks}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Est. hours
                    </span>
                    <span className="font-medium">{m.estimatedHours}h / {threshold.hours}h</span>
                  </div>
                  <CapacityBar
                    value={m.estimatedHours}
                    max={threshold.hours}
                    color="bg-violet-500"
                    overloaded={m.estimatedHours >= threshold.hours}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
