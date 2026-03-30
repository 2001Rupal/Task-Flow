import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { setSelectedTask, updateTask } from '../taskSlice'
import { cn, formatDate, isOverdue, PRIORITY_BG } from '../../../lib/utils'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { getInitials } from '../../../lib/utils'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select'

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']

export default function TableView({ projectId, statuses }) {
  const dispatch = useDispatch()
  const { list: tasks } = useSelector(s => s.tasks)
  const [editingCell, setEditingCell] = useState(null) // { taskId, field }
  const [editValue, setEditValue] = useState('')

  const startEdit = (taskId, field, value) => {
    setEditingCell({ taskId, field })
    setEditValue(value || '')
  }

  const commitEdit = (taskId, field) => {
    if (editValue.trim()) {
      dispatch(updateTask({ id: taskId, data: { [field]: editValue.trim() } }))
    }
    setEditingCell(null)
  }

  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted/30 sticky top-0">
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-8">#</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground min-w-[200px]">Title</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-32">Status</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-24">Priority</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-32">Due date</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-32">Assignee</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-20">Est. hrs</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task, idx) => (
            <tr
              key={task._id}
              className="border-b border-border/50 hover:bg-muted/20 cursor-pointer"
              onClick={() => dispatch(setSelectedTask(task))}
            >
              <td className="px-4 py-2 text-muted-foreground text-xs">{idx + 1}</td>

              {/* Title — inline edit */}
              <td className="px-4 py-2" onClick={e => { e.stopPropagation(); startEdit(task._id, 'title', task.title) }}>
                {editingCell?.taskId === task._id && editingCell?.field === 'title' ? (
                  <input
                    autoFocus
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onBlur={() => commitEdit(task._id, 'title')}
                    onKeyDown={e => e.key === 'Enter' && commitEdit(task._id, 'title')}
                    className="w-full bg-transparent border-b border-primary outline-none text-sm"
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <span className={cn('truncate block max-w-xs', task.status?.toLowerCase() === 'done' && 'opacity-50')}>
                    {task.title}
                  </span>
                )}
              </td>

              {/* Status */}
              <td className="px-4 py-2" onClick={e => e.stopPropagation()}>
                <Select value={task.status} onValueChange={val => dispatch(updateTask({ id: task._id, data: { status: val } }))}>
                  <SelectTrigger className="h-7 text-xs border-0 bg-transparent p-0 focus:ring-0 w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map(s => <SelectItem key={s._id} value={s.name}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </td>

              {/* Priority */}
              <td className="px-4 py-2" onClick={e => e.stopPropagation()}>
                <Select value={task.priority} onValueChange={val => dispatch(updateTask({ id: task._id, data: { priority: val } }))}>
                  <SelectTrigger className="h-7 text-xs border-0 bg-transparent p-0 focus:ring-0 w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </td>

              {/* Due date */}
              <td className={cn('px-4 py-2 text-xs', isOverdue(task.dueDate, task.status) ? 'text-red-500' : 'text-muted-foreground')}>
                {formatDate(task.dueDate) || '—'}
              </td>

              {/* Assignee */}
              <td className="px-4 py-2">
                {task.assignedTo ? (
                  <div className="flex items-center gap-1.5">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback style={{ backgroundColor: task.assignedTo.avatarColor || '#6366f1' }} className="text-[9px]">
                        {getInitials(task.assignedTo.displayName, task.assignedTo.email)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs truncate max-w-[80px]">{task.assignedTo.displayName || task.assignedTo.email}</span>
                  </div>
                ) : <span className="text-muted-foreground text-xs">—</span>}
              </td>

              {/* Est hours */}
              <td className="px-4 py-2 text-xs text-muted-foreground">
                {task.estimatedHours != null ? `${task.estimatedHours}h` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {tasks.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-12">No tasks yet</p>
      )}
    </div>
  )
}
