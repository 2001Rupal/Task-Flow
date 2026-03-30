import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { setSelectedTask, updateTask, createTask } from '../taskSlice'
import { Plus, GripVertical, Clock, Paperclip, CheckSquare, Check, CircleDashed } from 'lucide-react'
import { cn, PRIORITY_BG, formatDate, isOverdue, getInitials } from '../../../lib/utils'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'

const PRIORITY_ACCENT = {
  Urgent: '#ef4444',
  High:   '#f97316',
  Medium: '#eab308',
  Low:    '#3b82f6',
}

// ── Inline add task row ───────────────────────
function AddTaskRow({ statusName, projectId, onDone }) {
  const dispatch = useDispatch()
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    const t = title.trim()
    if (!t) { onDone(); return }
    setSaving(true)
    await dispatch(createTask({ listId: projectId, title: t, status: statusName }))
    setSaving(false)
    setTitle('')
    onDone()
  }

  return (
    <div className="bg-card border border-primary/40 rounded-xl p-3 shadow-sm">
      <input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') submit()
          if (e.key === 'Escape') onDone()
        }}
        onBlur={submit}
        placeholder="Task name…"
        className="w-full text-sm bg-transparent outline-none placeholder:text-muted-foreground/50"
        disabled={saving}
      />
      <p className="text-[10px] text-muted-foreground/40 mt-1.5">↵ to add · Esc to cancel</p>
    </div>
  )
}

// ── Task card ─────────────────────────────────
function TaskCard({ task, provided, snapshot }) {
  const dispatch = useDispatch()
  const over = isOverdue(task.dueDate, task.status)
  const isDone = task.status?.toLowerCase() === 'done'
  const isProgress = task.status?.toLowerCase() === 'in progress'
  const accent = PRIORITY_ACCENT[task.priority]
  const subtaskDone = task.subtasks?.filter(s => s.completed).length || 0
  const subtaskTotal = task.subtasks?.length || 0
  const subtaskPct = subtaskTotal > 0 ? Math.round((subtaskDone / subtaskTotal) * 100) : 0

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      onClick={() => dispatch(setSelectedTask(task))}
      className={cn(
        'group bg-card rounded-[10px] overflow-hidden cursor-pointer relative flex flex-col',
        'border border-border/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-md transition-all duration-200',
        snapshot.isDragging && 'shadow-2xl rotate-2 ring-1 ring-primary/50 scale-[1.03] z-50',
        isDone && 'opacity-80 bg-muted/10' 
      )}
    >
      {/* Priority accent bar - Absolute Left Edge */}
      {accent && (
        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: accent }} />
      )}

      {/* Absolute Drag Handle - Hidden until Hover */}
      <div
        {...provided.dragHandleProps}
        className="absolute right-1.5 top-1.5 rounded-md p-0.5 bg-background/90 text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-all shrink-0 cursor-grab active:cursor-grabbing z-10 shadow-sm border border-border/50"
        onClick={e => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4" />
      </div>

      <div className="p-3 pl-3.5">
        <div className="flex flex-col gap-2 relative">
          
          {/* Main Title & Inline Status */}
          <div className="flex items-start gap-2 pr-6">
            <div className="mt-[3px] shrink-0 opacity-80">
              {isDone ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={3} />
              ) : isProgress ? (
                  <Clock className="h-3.5 w-3.5 text-blue-500" strokeWidth={2.5} />
              ) : (
                  <CircleDashed className="h-3.5 w-3.5 text-muted-foreground/60" strokeWidth={2} />
              )}
            </div>
            <p className={cn('text-[13px] font-semibold leading-tight', isDone ? 'text-muted-foreground' : 'text-foreground')}>
              {task.title}
            </p>
          </div>

          {/* Description snippet */}
          {task.description && (
            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed pl-[22px]">
              {task.description.replace(/<[^>]+>/g, '')}
            </p>
          )}

          {/* Subtask progress bar */}
          {subtaskTotal > 0 && (
            <div className="mt-1 pl-[22px]">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1 font-medium">
                <span className="flex items-center gap-1">
                  <CheckSquare className="h-2.5 w-2.5" />
                  {subtaskDone}/{subtaskTotal}
                </span>
                <span>{subtaskPct}%</span>
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${subtaskPct}%`, backgroundColor: subtaskPct === 100 ? '#10b981' : '#6366f1' }}
                />
              </div>
            </div>
          )}

          {/* Footer Metadata */}
          <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-border/40">
            <div className="flex items-center gap-2 flex-wrap flex-1">
              
              {/* Due date */}
              {task.dueDate && (
                <span className={cn(
                  'text-[10px] font-semibold flex items-center gap-1 px-1.5 py-0.5 rounded-sm',
                  isDone ? 'bg-muted text-muted-foreground font-medium flex-row-reverse' :
                  over ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400' : 'bg-muted/50 text-muted-foreground/80 flex-row-reverse'
                )}>
                  {formatDate(task.dueDate)}
                </span>
              )}

              {/* Priority pill */}
              {task.priority && (
                <span className={cn('text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[4px] border border-black/5 dark:border-white/5', PRIORITY_BG[task.priority])}>
                  {task.priority}
                </span>
              )}
              
              {/* Attachment count */}
              {task.attachments?.length > 0 && (
                <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-0.5 px-1 bg-muted/40 rounded-sm">
                  <Paperclip className="h-2.5 w-2.5" />
                  {task.attachments.length}
                </span>
              )}
            </div>

            {/* Assignee Avatar */}
            {task.assignedTo && (
              <Avatar className="h-[22px] w-[22px] shrink-0 border border-background shadow-sm hover:scale-110 transition-transform">
                <AvatarFallback
                  style={{ backgroundColor: task.assignedTo.avatarColor || '#6366f1' }}
                  className="text-[8px] text-white font-bold tracking-widest"
                >
                  {getInitials(task.assignedTo.displayName, task.assignedTo.email)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main BoardView ────────────────────────────
export default function BoardView({ projectId, statuses }) {
  const dispatch = useDispatch()
  const { list: tasks } = useSelector(s => s.tasks)
  const [addingTo, setAddingTo] = useState(null)

  const grouped = {}
  for (const s of statuses) grouped[s.name] = []
  for (const t of tasks) {
    if (!grouped[t.status]) grouped[t.status] = []
    grouped[t.status].push(t)
  }

  const onDragEnd = ({ destination, source, draggableId }) => {
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return
    dispatch(updateTask({ id: draggableId, data: { status: destination.droppableId } }))
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 p-5 h-full overflow-x-auto items-start justify-center custom-scrollbar">
        {statuses.map(status => {
          const columnTasks = grouped[status.name] || []
          const isAdding = addingTo === status.name

          return (
            <div key={status._id} className="flex flex-col shrink-0 w-[310px]">
              {/* Column header */}
              <div className="flex items-center gap-2.5 mb-2.5 px-1 py-1 sticky top-0 bg-background z-10 w-full group">
                <div className="h-[14px] w-[14px] rounded-sm shrink-0 border border-black/10 dark:border-white/10 shadow-sm" style={{ backgroundColor: status.color || '#94a3b8' }} />
                <span className="text-[13.5px] font-bold text-foreground flex-1 tracking-tight truncate group-hover:text-primary transition-colors">{status.name}</span>
                <span className="text-[11px] font-bold text-muted-foreground bg-muted/80 px-2 py-[1px] rounded-[6px] shrink-0 border border-border/50 shadow-inner">
                  {columnTasks.length}
                </span>
              </div>

              {/* Droppable column */}
              <Droppable droppableId={status.name}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      'flex-1 rounded-[14px] p-2 space-y-2.5 min-h-[150px] transition-all duration-200 border w-full',
                      snapshot.isDraggingOver
                        ? 'bg-primary/[0.03] border-primary/30 border-dashed'
                        : 'bg-muted/[0.15] border-transparent hover:border-border/40 hover:bg-muted/[0.25]'
                    )}
                  >
                    {columnTasks.map((task, index) => (
                      <Draggable key={task._id} draggableId={task._id} index={index}>
                        {(provided, snapshot) => (
                          <TaskCard task={task} provided={provided} snapshot={snapshot} />
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {/* Inline add task */}
                    {isAdding && (
                      <div className="pt-1 w-full text-foreground/80">
                         <AddTaskRow
                           statusName={status.name}
                           projectId={projectId}
                           onDone={() => setAddingTo(null)}
                         />
                      </div>
                    )}

                    {/* Empty state purely visual */}
                    {columnTasks.length === 0 && !isAdding && !snapshot.isDraggingOver && (
                      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/30 pointer-events-none">
                        <div className="h-10 w-10 rounded-xl border border-dashed border-muted-foreground/20 flex items-center justify-center mb-2 bg-muted/10 shadow-sm">
                          <CheckSquare className="h-5 w-5 opacity-40" />
                        </div>
                        <p className="text-[11px] font-medium tracking-wide">Drop tasks here</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>

              {/* Add task ghost button */}
              {!isAdding && (
                <button
                  onClick={() => setAddingTo(status.name)}
                  className="group flex flex-col items-center justify-center mt-2 w-full p-2.5 border-[1.5px] border-dashed border-border/40 hover:border-primary/40 hover:bg-muted/30 rounded-xl transition-all select-none focus:outline-none"
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground group-hover:text-foreground">
                    <Plus className="h-3.5 w-3.5 opacity-70 group-hover:scale-110 transition-transform" />
                    Add task
                  </div>
                </button>
              )}
            </div>
          )
        })}
      </div>
    </DragDropContext>
  )
}
