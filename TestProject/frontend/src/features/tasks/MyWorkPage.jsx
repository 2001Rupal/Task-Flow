import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import * as tasksApi from '../../api/tasks'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select'
import { cn, formatDate, isOverdue, PRIORITY_BG } from '../../lib/utils'
import { CheckCircle2, Circle, AlertTriangle } from 'lucide-react'

export default function MyWorkPage() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  useEffect(() => {
    const params = {}
    if (statusFilter !== 'all') params.status = statusFilter
    if (priorityFilter !== 'all') params.priority = priorityFilter
    tasksApi.getMyWork(params)
      .then(({ data }) => setTasks(data.todos || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [statusFilter, priorityFilter])

  const overdue = tasks.filter(t => isOverdue(t.dueDate, t.status))

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Work</h1>
        <p className="text-muted-foreground text-sm mt-1">All tasks assigned to you</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-8 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="To Do">To Do</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Done">Done</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36 h-8 text-sm"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="Urgent">Urgent</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground self-center">{tasks.length} tasks</span>
        {overdue.length > 0 && (
          <span className="flex items-center gap-1 text-sm text-red-500 self-center">
            <AlertTriangle className="h-3.5 w-3.5" />
            {overdue.length} overdue
          </span>
        )}
      </div>

      {/* Task list */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No tasks assigned to you</p>
        </div>
      ) : (
        <div className="space-y-1">
          {tasks.map(t => (
            <Link
              key={t._id}
              to={`/projects/${t.listId?._id || t.listId}/tasks/${t._id}`}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-all"
            >
              {t.status?.toLowerCase() === 'done'
                ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
              }
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium truncate', t.status?.toLowerCase() === 'done' && 'opacity-50')}>
                  {t.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">{t.listId?.name || 'Unknown project'}</p>
              </div>
              <span className={cn('text-xs px-1.5 py-0.5 rounded-full shrink-0', PRIORITY_BG[t.priority])}>
                {t.priority}
              </span>
              {t.dueDate && (
                <span className={cn('text-xs shrink-0', isOverdue(t.dueDate, t.status) ? 'text-red-500 font-medium' : 'text-muted-foreground')}>
                  {formatDate(t.dueDate)}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
