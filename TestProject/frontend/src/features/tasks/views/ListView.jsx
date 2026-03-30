import { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { setSelectedTask, updateTask, toggleSelectTask, clearSelection, selectAll, createTask, bulkUpdateTasks, bulkDeleteTasks } from '../taskSlice'
import { ChevronDown, ChevronRight, Circle, CheckCircle2, Plus, X, Trash2, UserCheck, Tag } from 'lucide-react'
import { cn, formatDate, isOverdue } from '../../../lib/utils'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Button } from '../../../components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select'
import { getInitials } from '../../../lib/utils'
import toast from 'react-hot-toast'

const PRIORITY_DOT = {
  Urgent: 'bg-red-500',
  High:   'bg-orange-400',
  Medium: 'bg-yellow-400',
  Low:    'bg-blue-400',
}
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']

// ── Inline task creation row ──────────────────
function InlineCreateRow({ projectId, statusName, onDone }) {
  const dispatch = useDispatch()
  const [title, setTitle] = useState('')
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const submit = async () => {
    const t = title.trim()
    if (!t) { onDone(); return }
    const result = await dispatch(createTask({ listId: projectId, title: t, status: statusName }))
    if (createTask.fulfilled.match(result)) {
      setTitle('')
      inputRef.current?.focus()
    } else {
      toast.error('Failed to create task')
      onDone()
    }
  }

  return (
    <div className="flex items-center gap-3 px-2 py-1.5">
      <div className="w-5 shrink-0" />
      <Circle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
      <input
        ref={inputRef}
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') submit()
          if (e.key === 'Escape') onDone()
        }}
        onBlur={submit}
        placeholder="Task name…"
        className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground/50 border-b border-primary pb-0.5"
      />
      <button onClick={onDone} className="text-muted-foreground hover:text-foreground">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// ── Bulk action bar ───────────────────────────
function BulkActionBar({ selectedIds, statuses, onClear }) {
  const dispatch = useDispatch()

  const bulkStatus = async (status) => {
    await dispatch(bulkUpdateTasks({ ids: selectedIds, status }))
    toast.success(`${selectedIds.length} tasks updated`)
    onClear()
  }

  const bulkPriority = async (priority) => {
    await dispatch(bulkUpdateTasks({ ids: selectedIds, priority }))
    toast.success(`${selectedIds.length} tasks updated`)
    onClear()
  }

  const bulkDelete = async () => {
    await dispatch(bulkDeleteTasks(selectedIds))
    toast.success(`${selectedIds.length} tasks deleted`)
    onClear()
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-foreground text-background rounded-xl px-4 py-2.5 shadow-2xl border border-border/20">
      <span className="text-sm font-medium mr-1">{selectedIds.length} selected</span>

      <div className="w-px h-5 bg-background/20 mx-1" />

      {/* Status */}
      <Select onValueChange={bulkStatus}>
        <SelectTrigger className="h-7 text-xs bg-background/10 border-background/20 text-background hover:bg-background/20 w-32">
          <SelectValue placeholder="Set status" />
        </SelectTrigger>
        <SelectContent>
          {statuses.map(s => <SelectItem key={s._id} value={s.name}>{s.name}</SelectItem>)}
        </SelectContent>
      </Select>

      {/* Priority */}
      <Select onValueChange={bulkPriority}>
        <SelectTrigger className="h-7 text-xs bg-background/10 border-background/20 text-background hover:bg-background/20 w-32">
          <SelectValue placeholder="Set priority" />
        </SelectTrigger>
        <SelectContent>
          {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
        </SelectContent>
      </Select>

      <div className="w-px h-5 bg-background/20 mx-1" />

      {/* Delete */}
      <button
        onClick={bulkDelete}
        className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded hover:bg-background/10"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </button>

      {/* Clear */}
      <button
        onClick={onClear}
        className="flex items-center gap-1 text-xs text-background/60 hover:text-background transition-colors ml-1"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// ── Main ListView ─────────────────────────────
export default function ListView({ projectId, statuses }) {
  const dispatch = useDispatch()
  const { list: tasks, selectedIds } = useSelector(s => s.tasks)
  const [collapsed, setCollapsed] = useState({})
  const [inlineCreate, setInlineCreate] = useState(null) // statusName or null

  // Listen for global N shortcut → open inline create in first status group
  useEffect(() => {
    const handler = () => {
      if (statuses.length > 0) setInlineCreate(statuses[0].name)
    }
    window.addEventListener('shortcut:newTask', handler)
    return () => window.removeEventListener('shortcut:newTask', handler)
  }, [statuses])

  const grouped = {}
  for (const s of statuses) grouped[s.name] = []
  for (const t of tasks) {
    if (!grouped[t.status]) grouped[t.status] = []
    grouped[t.status].push(t)
  }

  const toggleStatus = (task) => {
    const isDone = task.status?.toLowerCase() === 'done'
    const newStatus = isDone ? (statuses[0]?.name || 'To Do') : 'Done'
    dispatch(updateTask({ id: task._id, data: { status: newStatus } }))
  }

  // Select all in a group
  const toggleGroupSelect = (groupTasks) => {
    const allSelected = groupTasks.every(t => selectedIds.includes(t._id))
    if (allSelected) {
      groupTasks.forEach(t => {
        if (selectedIds.includes(t._id)) dispatch(toggleSelectTask(t._id))
      })
    } else {
      groupTasks.forEach(t => {
        if (!selectedIds.includes(t._id)) dispatch(toggleSelectTask(t._id))
      })
    }
  }

  return (
    <>
      <div className="px-5 py-3 space-y-4 max-w-5xl mx-auto pb-20">
        {statuses.map(status => {
          const groupTasks = grouped[status.name] || []
          const isCollapsed = collapsed[status.name]
          const allGroupSelected = groupTasks.length > 0 && groupTasks.every(t => selectedIds.includes(t._id))

          return (
            <div key={status._id}>
              {/* Section header */}
              <div className="flex items-center gap-2 py-1.5 select-none">
                <button
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setCollapsed(c => ({ ...c, [status.name]: !c[status.name] }))}
                >
                  {isCollapsed
                    ? <ChevronRight className="h-3.5 w-3.5" />
                    : <ChevronDown className="h-3.5 w-3.5" />
                  }
                </button>
                <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: status.color || '#94a3b8' }} />
                <span className="text-sm font-semibold">{status.name}</span>
                <span className="text-xs text-muted-foreground">{groupTasks.length}</span>
              </div>

              {!isCollapsed && (
                <>
                  {/* Column headers */}
                  <div className="flex items-center gap-3 px-2 py-0.5 border-b border-border mb-0.5">
                    <div className="w-5 shrink-0 flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={allGroupSelected && groupTasks.length > 0}
                        onChange={() => toggleGroupSelect(groupTasks)}
                        className="h-3.5 w-3.5 rounded border-border cursor-pointer"
                      />
                    </div>
                    <div className="w-5 shrink-0" />
                    <span className="flex-1 text-xs text-muted-foreground font-medium">Task name</span>
                    <span className="w-24 text-xs text-muted-foreground font-medium hidden md:block">Assignee</span>
                    <span className="w-24 text-xs text-muted-foreground font-medium hidden sm:block">Due date</span>
                    <span className="w-20 text-xs text-muted-foreground font-medium hidden sm:block">Priority</span>
                  </div>

                  <div>
                    {groupTasks.map(task => (
                      <TaskRow
                        key={task._id}
                        task={task}
                        selected={selectedIds.includes(task._id)}
                        onSelect={() => dispatch(toggleSelectTask(task._id))}
                        onOpen={() => dispatch(setSelectedTask(task))}
                        onToggleStatus={() => toggleStatus(task)}
                      />
                    ))}

                    {/* Inline create row */}
                    {inlineCreate === status.name ? (
                      <InlineCreateRow
                        projectId={projectId}
                        statusName={status.name}
                        onDone={() => setInlineCreate(null)}
                      />
                    ) : (
                      <button
                        className="flex items-center gap-2 w-full px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded transition-colors group"
                        onClick={() => setInlineCreate(status.name)}
                      >
                        <div className="w-5 shrink-0" />
                        <Plus className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-xs">Add task</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <BulkActionBar
          selectedIds={selectedIds}
          statuses={statuses}
          onClear={() => dispatch(clearSelection())}
        />
      )}
    </>
  )
}

function TaskRow({ task, selected, onSelect, onOpen, onToggleStatus }) {
  const isDone = task.status?.toLowerCase() === 'done'
  const overdue = isOverdue(task.dueDate, task.status)
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-2 py-1 rounded-md cursor-pointer transition-all group border border-transparent',
        'hover:bg-muted/50 hover:border-border/50',
        selected && 'bg-primary/5 border-primary/20 hover:bg-primary/8'
      )}
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Checkbox */}
      <div className="w-5 shrink-0 flex items-center justify-center">
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          onClick={e => e.stopPropagation()}
          className={cn(
            'h-3.5 w-3.5 rounded border-border cursor-pointer transition-opacity',
            !selected && !hovered && 'opacity-0'
          )}
        />
      </div>

      {/* Complete toggle */}
      <button
        onClick={e => { e.stopPropagation(); onToggleStatus() }}
        className="w-5 shrink-0 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
      >
        {isDone
          ? <CheckCircle2 className="h-4 w-4 text-green-500" />
          : <Circle className="h-4 w-4" />
        }
      </button>

      {/* Title */}
      <span className={cn('flex-1 text-sm truncate', isDone && 'opacity-50')}>
        {task.title}
      </span>

      {/* Assignee */}
      <div className="w-24 hidden md:flex items-center">
        {task.assignedTo ? (
          <Avatar className="h-6 w-6">
            <AvatarFallback style={{ backgroundColor: task.assignedTo.avatarColor || '#f06a6a' }} className="text-white text-[10px] font-semibold">
              {getInitials(task.assignedTo.displayName, task.assignedTo.email)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-6 w-6 rounded-full border-2 border-dashed border-border" />
        )}
      </div>

      {/* Due date */}
      <div className="w-24 hidden sm:block">
        {task.dueDate
          ? <span className={cn('text-xs', overdue ? 'text-red-500 font-medium' : 'text-muted-foreground')}>{formatDate(task.dueDate)}</span>
          : <span className="text-xs text-muted-foreground/30">—</span>
        }
      </div>

      {/* Priority */}
      <div className="w-20 hidden sm:flex items-center gap-1.5">
        <div className={cn('h-2 w-2 rounded-full shrink-0', PRIORITY_DOT[task.priority] || 'bg-muted-foreground/30')} />
        <span className="text-xs text-muted-foreground">{task.priority}</span>
      </div>
    </div>
  )
}
