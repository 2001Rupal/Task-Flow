import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { updateTask } from './taskSlice'
import * as tasksApi from '../../api/tasks'
import { Plus, Check, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { cn } from '../../lib/utils'
import toast from 'react-hot-toast'

export default function SubtaskList({ task, isViewer }) {
  const dispatch = useDispatch()
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const completed = task.subtasks?.filter(s => s.completed).length || 0
  const total = task.subtasks?.length || 0

  const addSubtask = async () => {
    if (!newTitle.trim()) return
    try {
      const { data } = await tasksApi.addSubtask(task._id, { title: newTitle.trim() })
      dispatch(updateTask({ id: task._id, data: { subtasks: data.subtasks } }))
      setNewTitle('')
      setAdding(false)
    } catch { toast.error('Failed to add subtask') }
  }

  const toggleSubtask = async (sub) => {
    try {
      const { data } = await tasksApi.updateSubtask(task._id, sub._id, { completed: !sub.completed })
      dispatch(updateTask({ id: task._id, data: { subtasks: data.subtasks } }))
    } catch { toast.error('Failed to update subtask') }
  }

  const deleteSubtask = async (subId) => {
    try {
      const { data } = await tasksApi.deleteSubtask(task._id, subId)
      dispatch(updateTask({ id: task._id, data: { subtasks: data.subtasks } }))
    } catch { toast.error('Failed to delete subtask') }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Subtasks {total > 0 && `(${completed}/${total})`}</p>
        {!isViewer && (
          <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => setAdding(true)}>
            <Plus className="h-3 w-3" /> Add
          </Button>
        )}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(completed / total) * 100}%` }} />
        </div>
      )}

      <div className="space-y-1">
        {task.subtasks?.map(sub => (
          <div key={sub._id} className="flex items-center gap-2 group">
            <button
              onClick={() => !isViewer && toggleSubtask(sub)}
              className={cn(
                'h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                sub.completed ? 'bg-primary border-primary' : 'border-border hover:border-primary'
              )}
            >
              {sub.completed && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
            </button>
            <span className={cn('text-sm flex-1', sub.completed && 'text-muted-foreground opacity-80')}>
              {sub.title}
            </span>
            {!isViewer && (
              <Button
                variant="ghost" size="icon"
                className="h-5 w-5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                onClick={() => deleteSubtask(sub._id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {adding && (
        <div className="flex gap-2">
          <Input
            autoFocus
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addSubtask(); if (e.key === 'Escape') setAdding(false) }}
            placeholder="Subtask title"
            className="h-7 text-xs"
          />
          <Button size="sm" className="h-7 text-xs" onClick={addSubtask}>Add</Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAdding(false)}>Cancel</Button>
        </div>
      )}
    </div>
  )
}
