import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import * as tasksApi from '../../api/tasks'
import { updateTask } from './taskSlice'
import { cn, formatDate } from '../../lib/utils'
import {
  CheckCircle2, Circle, ChevronDown, ChevronRight,
  Filter, Plus, Calendar, List, LayoutGrid, GripVertical,
  Star, MoreHorizontal, Search, SortAsc, X, Hash,
  AlertCircle, Clock, FolderOpen, Inbox, CalendarDays
} from 'lucide-react'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select'
import { Button } from '../../components/ui/button'
import CreateTaskModal from './CreateTaskModal'
import toast from 'react-hot-toast'

/* ─── Priority config ─── */
const PRIORITY_CONFIG = {
  Urgent: { color: '#cf2a27', bg: '#fef2f2', darkBg: 'rgba(239,68,68,0.12)', label: 'Urgent', icon: '🔴' },
  High:   { color: '#f57c02', bg: '#fff7ed', darkBg: 'rgba(249,115,22,0.12)', label: 'High',   icon: '🟠' },
  Medium: { color: '#f5a623', bg: '#fffbeb', darkBg: 'rgba(245,158,11,0.12)', label: 'Medium', icon: '🟡' },
  Low:    { color: '#4a90d9', bg: '#eff6ff', darkBg: 'rgba(59,130,246,0.12)', label: 'Low',    icon: '🔵' },
}

/* ─── Smart date formatting (Asana-style) ─── */
function smartDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diff = Math.round((target - today) / 86400000)

  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff > 1 && diff <= 6) {
    return d.toLocaleDateString('en-US', { weekday: 'long' })
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/* ─── Group tasks by date bucket ─── */
function groupByDate(tasks) {
  const today = new Date(); today.setHours(0,0,0,0)
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + 7)

  const groups = {
    overdue:  { id: 'overdue',  label: 'Overdue',           icon: AlertCircle, accent: '#ef4444', tasks: [] },
    today:    { id: 'today',    label: 'Today',             icon: Clock,       accent: '#6366f1', tasks: [] },
    upcoming: { id: 'upcoming', label: 'Upcoming',          icon: CalendarDays,accent: '#3b82f6', tasks: [] },
    later:    { id: 'later',    label: 'Later',             icon: Calendar,    accent: '#64748b', tasks: [] },
    no_date:  { id: 'no_date',  label: 'No due date',       icon: Inbox,       accent: '#94a3b8', tasks: [] },
  }

  for (const t of tasks) {
    if (t.status?.toLowerCase() === 'done') continue
    if (!t.dueDate) { groups.no_date.tasks.push(t); continue }
    const due = new Date(t.dueDate); due.setHours(0,0,0,0)
    if (due < today)         groups.overdue.tasks.push(t)
    else if (due < tomorrow) groups.today.tasks.push(t)
    else if (due < nextWeek) groups.upcoming.tasks.push(t)
    else                     groups.later.tasks.push(t)
  }
  return groups
}

/* ─── Group tasks by project ─── */
function groupByProject(tasks) {
  const groups = {}
  for (const t of tasks) {
    if (t.status?.toLowerCase() === 'done') continue
    const name = t.listId?.name || 'No Project'
    const id = t.listId?._id || 'none'
    const color = t.listId?.color || '#94a3b8'
    if (!groups[id]) groups[id] = { id, label: name, color, icon: FolderOpen, accent: color, tasks: [] }
    groups[id].tasks.push(t)
  }
  return groups
}

/* ═══════════════════════════════════════════════
   TASK ROW — Asana-style table row
   ═══════════════════════════════════════════════ */
function TaskRow({ task, onToggle, isLast, onSelect, isSelected }) {
  const isDone = task.status?.toLowerCase() === 'done'
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isDone
  const projColor = task.listId?.color || '#94a3b8'
  const navigate = useNavigate()
  const [starred, setStarred] = useState(false)
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className={cn(
        "group/row grid items-center transition-colors duration-75 cursor-pointer border-b",
        isSelected
          ? "bg-[hsl(var(--primary)/0.04)] border-[hsl(var(--primary)/0.15)]"
          : "bg-transparent hover:bg-[hsl(var(--foreground)/0.02)] border-border/30",
        isLast && "border-b-0"
      )}
      style={{ gridTemplateColumns: '1fr 140px 100px 160px 40px' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect?.(task)}
    >
      {/* Col 1: Task name */}
      <div className="flex items-center gap-2 pl-3 pr-2 py-[7px] min-w-0">
        {/* Grip handle */}
        <div className={cn("shrink-0 transition-opacity", hovered ? "opacity-30" : "opacity-0")}>
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </div>

        {/* Completion checkbox */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(task) }}
          className={cn(
            "shrink-0 h-[18px] w-[18px] rounded-full border-[1.5px] flex items-center justify-center transition-all duration-150",
            isDone
              ? "bg-emerald-500 border-emerald-500 text-white"
              : "border-muted-foreground/25 hover:border-emerald-400 bg-transparent"
          )}
          title={isDone ? "Mark incomplete" : "Mark complete"}
        >
          {isDone && <CheckCircle2 className="h-3 w-3" strokeWidth={3} />}
        </button>

        {/* Task title */}
        <span className={cn(
          "text-[13px] leading-tight truncate transition-colors",
          isDone
            ? "line-through text-muted-foreground/50"
            : "text-foreground font-medium"
        )}>
          {task.title}
        </span>
      </div>

      {/* Col 2: Due date */}
      <div className="px-2 py-[7px] flex items-center">
        {task.dueDate ? (
          <span className={cn(
            "text-[12px] font-medium flex items-center gap-1.5",
            isOverdue ? "text-red-500" : "text-muted-foreground"
          )}>
            <Calendar className="h-3 w-3 shrink-0 opacity-50" />
            {smartDate(task.dueDate)}
          </span>
        ) : (
          <span className="text-[12px] text-muted-foreground/30">—</span>
        )}
      </div>

      {/* Col 3: Priority */}
      <div className="px-2 py-[7px] flex items-center">
        {task.priority && PRIORITY_CONFIG[task.priority] ? (
          <div className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: PRIORITY_CONFIG[task.priority].color }}
            />
            <span className="text-[12px] font-medium text-muted-foreground">
              {task.priority}
            </span>
          </div>
        ) : (
          <span className="text-[12px] text-muted-foreground/30">—</span>
        )}
      </div>

      {/* Col 4: Project */}
      <div className="px-2 py-[7px] flex items-center min-w-0">
        {task.listId?.name ? (
          <Link
            to={`/projects/${task.listId._id || task.listId}`}
            className="flex items-center gap-1.5 max-w-full min-w-0 group/proj hover:text-foreground transition-colors text-muted-foreground"
            onClick={e => e.stopPropagation()}
          >
            <div
              className="h-2.5 w-2.5 rounded-[3px] shrink-0"
              style={{ backgroundColor: projColor }}
            />
            <span className="text-[12px] font-medium truncate">
              {task.listId.name}
            </span>
          </Link>
        ) : (
          <span className="text-[12px] text-muted-foreground/30">—</span>
        )}
      </div>

      {/* Col 5: Actions */}
      <div className="px-1 py-[7px] flex items-center justify-center">
        <button
          className={cn(
            "p-0.5 rounded transition-all",
            hovered ? "opacity-60 hover:opacity-100 hover:bg-muted" : "opacity-0"
          )}
          onClick={(e) => { e.stopPropagation() }}
        >
          <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   INLINE ADD ROW — Add task within a section
   ═══════════════════════════════════════════════ */
function InlineAddRow({ onAdd }) {
  const [active, setActive] = useState(false)
  const [value, setValue] = useState('')
  const inputRef = useRef(null)

  const submit = () => {
    if (value.trim()) {
      onAdd?.(value.trim())
      setValue('')
    }
    setActive(false)
  }

  useEffect(() => {
    if (active && inputRef.current) inputRef.current.focus()
  }, [active])

  if (!active) {
    return (
      <button
        onClick={() => setActive(true)}
        className="flex items-center gap-2 w-full px-3 py-[7px] text-muted-foreground/50 hover:text-muted-foreground transition-colors group/add"
      >
        <Plus className="h-3.5 w-3.5 group-hover/add:text-primary transition-colors" />
        <span className="text-[13px] font-medium">Add task…</span>
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 px-3 py-[5px] bg-[hsl(var(--primary)/0.03)]">
      <div className="shrink-0 h-[18px] w-[18px] rounded-full border-[1.5px] border-muted-foreground/20" />
      <input
        ref={inputRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') submit()
          if (e.key === 'Escape') { setValue(''); setActive(false) }
        }}
        onBlur={submit}
        placeholder="Write a task name…"
        className="flex-1 text-[13px] bg-transparent outline-none placeholder:text-muted-foreground/40 text-foreground font-medium"
      />
    </div>
  )
}

/* ═══════════════════════════════════════════════
   TASK SECTION — Collapsible section like Asana
   ═══════════════════════════════════════════════ */
function TaskSection({ group, onToggle, defaultOpen = true, onSelect, selectedTaskId }) {
  const [open, setOpen] = useState(defaultOpen)
  const Icon = group.icon
  if (group.tasks.length === 0) return null

  return (
    <div className="mb-1">
      {/* Section header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full px-3 py-[9px] text-left group/section hover:bg-muted/30 transition-colors rounded-md sticky top-0 z-[1] bg-background/95 backdrop-blur-sm"
      >
        <div className="transition-transform duration-150" style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60" />
        </div>
        {Icon && (
          <div className="shrink-0 h-5 w-5 rounded flex items-center justify-center" style={{ backgroundColor: `${group.accent}12` }}>
            <Icon className="h-3 w-3" style={{ color: group.accent }} />
          </div>
        )}
        <span className="text-[13px] font-semibold text-foreground">
          {group.label}
        </span>
        <span className="text-[11px] font-medium text-muted-foreground/50 tabular-nums ml-0.5">
          {group.tasks.length}
        </span>
      </button>

      {/* Task rows */}
      {open && (
        <div className="ml-0">
          {group.tasks.map((t, i) => (
            <TaskRow
              key={t._id}
              task={t}
              onToggle={onToggle}
              isLast={i === group.tasks.length - 1}
              onSelect={onSelect}
              isSelected={selectedTaskId === t._id}
            />
          ))}
          <InlineAddRow />
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════
   COLUMN HEADERS — Table header row
   ═══════════════════════════════════════════════ */
function ColumnHeaders() {
  return (
    <div
      className="grid items-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 border-b border-border/50 bg-background sticky top-0 z-[2] px-0"
      style={{ gridTemplateColumns: '1fr 140px 100px 160px 40px' }}
    >
      <div className="pl-[52px] pr-2 py-2">Task name</div>
      <div className="px-2 py-2">Due date</div>
      <div className="px-2 py-2">Priority</div>
      <div className="px-2 py-2">Project</div>
      <div className="px-1 py-2" />
    </div>
  )
}

/* ═══════════════════════════════════════════════
   EMPTY STATE
   ═══════════════════════════════════════════════ */
function EmptyState({ onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-8">
      <div className="h-16 w-16 rounded-2xl bg-muted/40 flex items-center justify-center mb-5">
        <CheckCircle2 className="h-8 w-8 text-muted-foreground/25" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">
        You're all caught up!
      </h3>
      <p className="text-[13px] text-muted-foreground/60 text-center max-w-[280px] mb-5">
        Nice work. Tasks assigned to you across all projects will appear here.
      </p>
      <Button
        onClick={onAdd}
        variant="outline"
        className="h-8 px-4 text-xs font-semibold gap-1.5"
      >
        <Plus className="h-3.5 w-3.5" /> Create a task
      </Button>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════ */
export default function MyTasksPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [showCompleted, setShowCompleted] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [groupMode, setGroupMode] = useState('date') // 'date' | 'project' | 'priority'
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    tasksApi.getMyWork({})
      .then(({ data }) => setTasks(data.todos || []))
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleToggle = async (task) => {
    const isDone = task.status?.toLowerCase() === 'done'
    const newStatus = isDone ? 'To Do' : 'Done'
    setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: newStatus } : t))

    if (!isDone) {
      toast.success('Task completed! 🎉', { duration: 2000 })
    }

    const result = await dispatch(updateTask({ id: task._id, data: { status: newStatus } }))
    if (!updateTask.fulfilled.match(result)) {
      setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: task.status } : t))
      toast.error('Failed to update task')
    }
  }

  const projects = useMemo(() => [...new Map(
    tasks.filter(t => t.listId).map(t => [t.listId._id || t.listId, t.listId])
  ).values()], [tasks])

  const filtered = useMemo(() => tasks.filter(t => {
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
    if (projectFilter !== 'all') {
      const pid = t.listId?._id || t.listId
      if (pid?.toString() !== projectFilter) return false
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!t.title.toLowerCase().includes(q)) return false
    }
    return true
  }), [tasks, priorityFilter, projectFilter, searchQuery])

  const active    = filtered.filter(t => t.status?.toLowerCase() !== 'done')
  const completed = filtered.filter(t => t.status?.toLowerCase() === 'done')

  const groups = useMemo(() => {
    if (groupMode === 'project') return groupByProject(filtered)
    return groupByDate(filtered)
  }, [filtered, groupMode])

  const totalActive  = active.length
  const totalOverdue = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0)
    return active.filter(t => t.dueDate && new Date(t.dueDate) < today).length
  }, [active])

  const hasFilters = priorityFilter !== 'all' || projectFilter !== 'all' || searchQuery

  return (
    <div className="flex h-full overflow-hidden bg-background">
      {/* ════════════════════════════════════════════
          MAIN CONTENT AREA
          ════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── Page header ── */}
        <div className="shrink-0 px-6 pt-5 pb-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-foreground">My Tasks</h1>
              {/* Live counters */}
              <div className="flex items-center gap-2 ml-1">
                <span className="inline-flex items-center h-[22px] px-2 rounded-full text-[11px] font-bold tabular-nums bg-primary/10 text-primary">
                  {totalActive}
                </span>
                {totalOverdue > 0 && (
                  <span className="inline-flex items-center h-[22px] px-2 rounded-full text-[11px] font-bold tabular-nums bg-red-500/10 text-red-500 gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {totalOverdue} overdue
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                onClick={() => setShowCreateModal(true)}
                className="h-8 px-3 text-[12px] font-semibold gap-1.5 rounded-lg shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" /> Add task
              </Button>
            </div>
          </div>

          {/* ── Toolbar row ── */}
          <div className="flex items-center justify-between border-b border-border/50 pb-0">
            {/* Left: Group-by tabs */}
            <div className="flex items-center gap-0">
              {[
                { id: 'date', label: 'By date', icon: CalendarDays },
                { id: 'project', label: 'By project', icon: FolderOpen },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setGroupMode(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-semibold border-b-2 transition-colors -mb-[1px]",
                    groupMode === tab.id
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground/60 hover:text-muted-foreground"
                  )}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Right: Filter/Sort/Search */}
            <div className="flex items-center gap-1 pb-1.5">
              {/* Search toggle */}
              <button
                onClick={() => { setShowSearch(s => !s); if (showSearch) setSearchQuery('') }}
                className={cn(
                  "h-7 px-2 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-colors",
                  showSearch
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/40"
                )}
              >
                <Search className="h-3.5 w-3.5" />
              </button>

              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters(s => !s)}
                className={cn(
                  "h-7 px-2.5 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-colors",
                  showFilters || hasFilters
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/40"
                )}
              >
                <Filter className="h-3.5 w-3.5" />
                Filter
                {hasFilters && (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </button>

              {/* Sort */}
              <button
                className="h-7 px-2.5 rounded-md text-[11px] font-semibold flex items-center gap-1.5 text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/40 transition-colors"
              >
                <SortAsc className="h-3.5 w-3.5" />
                Sort
              </button>
            </div>
          </div>

          {/* ── Search bar ── */}
          {showSearch && (
            <div className="flex items-center gap-2 py-2 border-b border-border/30">
              <Search className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
              <input
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search your tasks…"
                className="flex-1 text-[13px] bg-transparent outline-none placeholder:text-muted-foreground/40 text-foreground"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="p-0.5 hover:bg-muted rounded">
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          )}

          {/* ── Filter bar ── */}
          {showFilters && (
            <div className="flex items-center gap-2 py-2 border-b border-border/30">
              <span className="text-[11px] font-medium text-muted-foreground/50 shrink-0">Filters:</span>
              
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="h-7 border-border/40 shadow-none bg-transparent w-[120px] text-[12px] font-medium px-2 focus:ring-0 rounded-md">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-[12px]">All priorities</SelectItem>
                  <SelectItem value="Urgent" className="text-[12px]">🔴 Urgent</SelectItem>
                  <SelectItem value="High" className="text-[12px]">🟠 High</SelectItem>
                  <SelectItem value="Medium" className="text-[12px]">🟡 Medium</SelectItem>
                  <SelectItem value="Low" className="text-[12px]">🔵 Low</SelectItem>
                </SelectContent>
              </Select>

              {projects.length > 0 && (
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger className="h-7 border-border/40 shadow-none bg-transparent w-[140px] text-[12px] font-medium px-2 focus:ring-0 rounded-md">
                    <SelectValue placeholder="Project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-[12px]">All projects</SelectItem>
                    {projects.map(p => (
                      <SelectItem key={p._id || p} value={(p._id || p).toString()} className="text-[12px]">
                        {p.name || 'Unknown'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {hasFilters && (
                <button
                  onClick={() => { setPriorityFilter('all'); setProjectFilter('all'); setSearchQuery('') }}
                  className="text-[11px] font-medium text-primary hover:text-primary/80 ml-1 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Task list ── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="px-6 py-4">
              <ColumnHeaders />
              <div className="space-y-0">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-[9px] border-b border-border/20">
                    <div className="h-[18px] w-[18px] rounded-full skeleton shrink-0" />
                    <div className="skeleton h-4 flex-1 rounded" style={{ maxWidth: `${200 + Math.random() * 200}px` }} />
                    <div className="skeleton h-3 w-16 rounded ml-auto" />
                  </div>
                ))}
              </div>
            </div>
          ) : totalActive === 0 && completed.length === 0 ? (
            <EmptyState onAdd={() => setShowCreateModal(true)} />
          ) : (
            <div className="px-6">
              <ColumnHeaders />

              {/* Active task groups */}
              {Object.entries(groups).map(([key, group]) => (
                <TaskSection
                  key={key}
                  group={group}
                  onToggle={handleToggle}
                  defaultOpen={key !== 'no_date'}
                  onSelect={setSelectedTask}
                  selectedTaskId={selectedTask?._id}
                />
              ))}

              {/* Completed section */}
              {completed.length > 0 && (
                <div className="mb-1 mt-2">
                  <button
                    onClick={() => setShowCompleted(o => !o)}
                    className="flex items-center gap-2 w-full px-3 py-[9px] text-left group/section hover:bg-muted/30 transition-colors rounded-md"
                  >
                    <div className="transition-transform duration-150" style={{ transform: showCompleted ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60" />
                    </div>
                    <div className="shrink-0 h-5 w-5 rounded flex items-center justify-center bg-emerald-500/10">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    </div>
                    <span className="text-[13px] font-semibold text-foreground">
                      Completed
                    </span>
                    <span className="text-[11px] font-medium text-muted-foreground/50 tabular-nums ml-0.5">
                      {completed.length}
                    </span>
                  </button>

                  {showCompleted && (
                    <div>
                      {completed.map((t, i) => (
                        <TaskRow
                          key={t._id}
                          task={t}
                          onToggle={handleToggle}
                          isLast={i === completed.length - 1}
                          onSelect={setSelectedTask}
                          isSelected={selectedTask?._id === t._id}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Bottom spacer */}
              <div className="h-16" />
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════
          RIGHT PANEL — Task detail (Asana-style)
          ════════════════════════════════════════════ */}
      {selectedTask && (
        <div className="w-[340px] shrink-0 border-l border-border/60 bg-background flex flex-col overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={(e) => { e.stopPropagation(); handleToggle(selectedTask) }}
                className={cn(
                  "shrink-0 h-[18px] w-[18px] rounded-full border-[1.5px] flex items-center justify-center transition-all",
                  selectedTask.status?.toLowerCase() === 'done'
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "border-muted-foreground/25 hover:border-emerald-400"
                )}
              >
                {selectedTask.status?.toLowerCase() === 'done' && <CheckCircle2 className="h-3 w-3" strokeWidth={3} />}
              </button>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                Task detail
              </span>
            </div>
            <button
              onClick={() => setSelectedTask(null)}
              className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Panel body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-4 space-y-4">
              {/* Title */}
              <h3 className="text-[15px] font-semibold text-foreground leading-snug">
                {selectedTask.title}
              </h3>

              {/* Properties */}
              <div className="space-y-3">
                {/* Status */}
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-medium text-muted-foreground/60 w-16 shrink-0 uppercase tracking-wide">Status</span>
                  <span className={cn(
                    "text-[12px] font-medium px-2 py-0.5 rounded-md",
                    selectedTask.status?.toLowerCase() === 'done'
                      ? "bg-emerald-500/10 text-emerald-600"
                      : selectedTask.status?.toLowerCase() === 'in progress'
                        ? "bg-blue-500/10 text-blue-600"
                        : "bg-muted text-muted-foreground"
                  )}>
                    {selectedTask.status || 'To Do'}
                  </span>
                </div>

                {/* Priority */}
                {selectedTask.priority && (
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-medium text-muted-foreground/60 w-16 shrink-0 uppercase tracking-wide">Priority</span>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: PRIORITY_CONFIG[selectedTask.priority]?.color }}
                      />
                      <span className="text-[12px] font-medium text-foreground">
                        {selectedTask.priority}
                      </span>
                    </div>
                  </div>
                )}

                {/* Due date */}
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-medium text-muted-foreground/60 w-16 shrink-0 uppercase tracking-wide">Due</span>
                  <span className={cn(
                    "text-[12px] font-medium flex items-center gap-1.5",
                    selectedTask.dueDate && new Date(selectedTask.dueDate) < new Date() && selectedTask.status?.toLowerCase() !== 'done'
                      ? "text-red-500"
                      : "text-foreground"
                  )}>
                    <Calendar className="h-3 w-3 opacity-40" />
                    {selectedTask.dueDate ? smartDate(selectedTask.dueDate) : '—'}
                  </span>
                </div>

                {/* Project */}
                {selectedTask.listId?.name && (
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-medium text-muted-foreground/60 w-16 shrink-0 uppercase tracking-wide">Project</span>
                    <Link
                      to={`/projects/${selectedTask.listId._id || selectedTask.listId}`}
                      className="flex items-center gap-1.5 text-[12px] font-medium text-foreground hover:text-primary transition-colors"
                    >
                      <div
                        className="h-2.5 w-2.5 rounded-[3px]"
                        style={{ backgroundColor: selectedTask.listId?.color || '#94a3b8' }}
                      />
                      {selectedTask.listId.name}
                    </Link>
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedTask.description && (
                <>
                  <div className="h-px bg-border/40" />
                  <div>
                    <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wide block mb-1.5">Description</span>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">
                      {selectedTask.description}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Panel footer — Open full */}
          <div className="shrink-0 border-t border-border/40 p-3">
            <Button
              variant="outline"
              className="w-full h-8 text-[12px] font-semibold"
              onClick={() => {
                if (selectedTask.listId?._id) {
                  navigate(`/projects/${selectedTask.listId._id}`)
                }
              }}
            >
              Open in project
            </Button>
          </div>
        </div>
      )}

      {showCreateModal && (
        <CreateTaskModal
          projectId={projects[0]?._id || ''}
          statuses={[
            { _id: '1', name: 'To Do', color: '#94a3b8' },
            { _id: '2', name: 'In Progress', color: '#3b82f6' },
            { _id: '3', name: 'Done', color: '#10b981' },
          ]}
          onClose={() => {
            setShowCreateModal(false)
            load()
          }}
        />
      )}
    </div>
  )
}
