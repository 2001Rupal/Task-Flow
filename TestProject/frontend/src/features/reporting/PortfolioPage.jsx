import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { getPortfolio } from '../../api/workspaces'
import { BarChart2, Users, AlertTriangle, CheckCircle2, Clock, TrendingUp } from 'lucide-react'
import { cn } from '../../lib/utils'

const HEALTH_META = {
  'on-track':  { label: 'On track',  color: 'text-green-600',  bg: 'bg-green-100 dark:bg-green-900/30',  dot: 'bg-green-500' },
  'off-track': { label: 'Off track', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30', dot: 'bg-yellow-500' },
  'at-risk':   { label: 'At risk',   color: 'text-red-600',    bg: 'bg-red-100 dark:bg-red-900/30',       dot: 'bg-red-500' },
}

function ProgressBar({ value, color }) {
  return (
    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color || '#f06a6a' }}
      />
    </div>
  )
}

export default function PortfolioPage() {
  const { current: workspace } = useSelector(s => s.workspace)
  const [portfolio, setPortfolio] = useState([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('name') // name | completion | health | overdue
  const navigate = useNavigate()

  useEffect(() => {
    if (!workspace) return
    setLoading(true)
    getPortfolio(workspace._id)
      .then(r => setPortfolio(r.data.portfolio || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [workspace])

  const sorted = [...portfolio].sort((a, b) => {
    if (sort === 'completion') return b.completion - a.completion
    if (sort === 'health') {
      const order = { 'at-risk': 0, 'off-track': 1, 'on-track': 2 }
      return order[a.health] - order[b.health]
    }
    if (sort === 'overdue') return b.overdue - a.overdue
    return a.name.localeCompare(b.name)
  })

  // Summary stats
  const totalTasks   = portfolio.reduce((s, p) => s + p.total, 0)
  const totalDone    = portfolio.reduce((s, p) => s + p.done, 0)
  const totalOverdue = portfolio.reduce((s, p) => s + p.overdue, 0)
  const atRisk       = portfolio.filter(p => p.health === 'at-risk').length

  return (
    <div className="px-6 py-4 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Portfolio</h1>
        <p className="text-sm text-muted-foreground mt-0.5">All projects across {workspace?.name}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total projects', value: portfolio.length,  icon: BarChart2,     colorCls: 'text-primary bg-primary/10' },
          { label: 'Tasks done',     value: `${totalDone}/${totalTasks}`, icon: CheckCircle2, colorCls: 'text-green-500 bg-green-50 dark:bg-green-950/30' },
          { label: 'Overdue tasks',  value: totalOverdue,      icon: AlertTriangle, colorCls: 'text-red-500 bg-red-50 dark:bg-red-950/30' },
          { label: 'At risk',        value: atRisk,            icon: TrendingUp,    colorCls: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950/30' },
        ].map(({ label, value, icon: Icon, colorCls }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', colorCls)}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xl font-bold leading-tight">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground">
          {[
            { key: 'name',       label: 'Project' },
            { key: 'health',     label: 'Health' },
            { key: 'completion', label: 'Progress' },
            { key: 'overdue',    label: 'Overdue' },
            { key: null,         label: 'Members' },
            { key: null,         label: 'Tasks' },
          ].map(({ key, label }) => (
            <button
              key={label}
              onClick={() => key && setSort(key)}
              className={cn('text-left transition-colors', key && 'hover:text-foreground cursor-pointer', sort === key && 'text-foreground')}
            >
              {label} {sort === key && '↓'}
            </button>
          ))}
        </div>

        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-4 border-b border-border last:border-0">
              {Array.from({ length: 6 }).map((_, j) => (
                <div key={j} className="h-4 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ))
        ) : sorted.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm">No projects yet</div>
        ) : (
          sorted.map(p => {
            const health = HEALTH_META[p.health] || HEALTH_META['on-track']
            return (
              <div
                key={p._id}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3.5 border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors items-center"
                onClick={() => navigate(`/projects/${p._id}`)}
              >
                {/* Name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: p.color || '#f06a6a' }} />
                  <span className="text-sm font-medium truncate">{p.name}</span>
                </div>

                {/* Health */}
                <div className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full w-fit', health.bg, health.color)}>
                  <div className={cn('h-1.5 w-1.5 rounded-full', health.dot)} />
                  {health.label}
                </div>

                {/* Progress */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{p.completion}%</span>
                  </div>
                  <ProgressBar value={p.completion} color={p.color} />
                </div>

                {/* Overdue */}
                <span className={cn('text-sm', p.overdue > 0 ? 'text-red-500 font-medium' : 'text-muted-foreground')}>
                  {p.overdue > 0 ? p.overdue : '—'}
                </span>

                {/* Members */}
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  {p.memberCount}
                </div>

                {/* Tasks */}
                <span className="text-sm text-muted-foreground">{p.done}/{p.total}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
