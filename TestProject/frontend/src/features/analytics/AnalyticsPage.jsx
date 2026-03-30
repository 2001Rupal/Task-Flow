import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { getProjectAnalytics, getProjectStats } from '../../api/projects'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LineChart, Line, CartesianGrid, Legend,
  AreaChart, Area
} from 'recharts'
import { Loader2, ArrowLeft, CheckCircle2, AlertTriangle, Clock, Users } from 'lucide-react'
import { cn } from '../../lib/utils'

const STATUS_COLORS  = ['#f06a6a','#6366f1','#10b981','#f97316','#8b5cf6','#06b6d4']
const PRIORITY_COLORS = { Urgent: '#ef4444', High: '#f97316', Medium: '#eab308', Low: '#6366f1' }

function StatCard({ label, value, sub, icon: Icon, colorCls }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
      <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', colorCls)}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xl font-bold leading-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { current: project } = useSelector(s => s.projects)
  const [analytics, setAnalytics] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getProjectAnalytics(projectId),
      getProjectStats(projectId)
    ]).then(([a, s]) => {
      setAnalytics(a.data.analytics)
      setStats(s.data.stats)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [projectId])

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )

  if (!analytics) return (
    <div className="p-8 text-muted-foreground text-sm">Failed to load analytics</div>
  )

  const statusData   = Object.entries(analytics.tasksByStatus || {}).map(([name, value]) => ({ name, value }))
  const priorityData = Object.entries(analytics.tasksByPriority || {}).map(([name, value]) => ({ name, value }))
  const assigneeData = (analytics.tasksByAssignee || []).map(a => ({ name: a.displayName || a.email?.split('@')[0], count: a.count }))
  const timeData     = (analytics.timeTracking || []).map(a => ({ name: a.displayName || a.email?.split('@')[0], estimated: a.estimatedHours, logged: a.loggedHours }))
  const completionData = analytics.completionOverTime || []

  // Build burndown: cumulative remaining tasks over time
  const burndownData = (() => {
    if (!completionData.length || !stats) return []
    let remaining = stats.total
    return completionData.map(d => {
      remaining = Math.max(0, remaining - d.count)
      return { date: d.date.slice(5), completed: d.count, remaining }
    })
  })()

  const completionRate = stats?.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  return (
    <div className="px-6 py-4 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/projects/${projectId}`)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-semibold">{project?.name || 'Project'} — Analytics</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Task completion and team performance</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Total tasks"   value={stats.total}       icon={CheckCircle2}  colorCls="text-primary bg-primary/10" />
          <StatCard label="Completed"     value={stats.completed}   icon={CheckCircle2}  colorCls="text-green-500 bg-green-50 dark:bg-green-950/30"
            sub={`${completionRate}% completion rate`} />
          <StatCard label="In progress"   value={stats.inProgress}  icon={Clock}         colorCls="text-blue-500 bg-blue-50 dark:bg-blue-950/30" />
          <StatCard label="Overdue"       value={stats.overdue}     icon={AlertTriangle} colorCls="text-red-500 bg-red-50 dark:bg-red-950/30" />
        </div>
      )}

      {/* Completion rate ring + status breakdown */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Status donut */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4">Tasks by status</h2>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={statusData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70}>
                  {statusData.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-1">
              {statusData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[i % STATUS_COLORS.length] }} />
                    <span className="text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="font-medium">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Priority bar */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4">Tasks by priority</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={priorityData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {priorityData.map((d, i) => (
                  <Cell key={i} fill={PRIORITY_COLORS[d.name] || '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Completion over time + burndown */}
      {completionData.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Daily completions */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold mb-4">Daily completions (last 30 days)</h2>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={completionData}>
                <defs>
                  <linearGradient id="completionGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f06a6a" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f06a6a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" name="Completed" stroke="#f06a6a" strokeWidth={2} fill="url(#completionGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Burndown */}
          {burndownData.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-sm font-semibold mb-4">Burndown chart</h2>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={burndownData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="remaining" name="Remaining" stroke="#6366f1" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="completed" name="Completed" stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Assignee workload */}
      {assigneeData.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4">Tasks per assignee</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={assigneeData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Tasks" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Time tracking */}
      {timeData.length > 0 && timeData.some(d => d.estimated > 0 || d.logged > 0) && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4">Time tracking (hours)</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={timeData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="estimated" name="Estimated" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="logged"    name="Logged"    fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
