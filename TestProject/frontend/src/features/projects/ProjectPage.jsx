import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProject } from './projectSlice'
import { fetchTasks } from '../tasks/taskSlice'
import { useProjectSocket } from '../../hooks/useSocket'
import { usePresence } from '../../hooks/usePresence'
import { List, LayoutGrid, Calendar, GanttChart, Table2, Settings, BarChart2, Plus, TrendingUp } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { cn } from '../../lib/utils'
import ListView from '../tasks/views/ListView'
import BoardView from '../tasks/views/BoardView'
import CalendarView from '../tasks/views/CalendarView'
import TimelineView from '../tasks/views/TimelineView'
import TableView from '../tasks/views/TableView'
import TaskDetailPanel from '../tasks/TaskDetailPanel'
import CreateTaskModal from '../tasks/CreateTaskModal'
import StatusUpdatePanel from './StatusUpdatePanel'
import OnlineAvatars from '../../components/common/OnlineAvatars'

const VIEWS = [
  { id: 'list',     label: 'List',     icon: List },
  { id: 'board',    label: 'Board',    icon: LayoutGrid },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'timeline', label: 'Timeline', icon: GanttChart },
  { id: 'table',    label: 'Table',    icon: Table2 },
]

export default function ProjectPage() {
  const { projectId } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { current: project, currentStatuses, currentRole } = useSelector(s => s.projects)
  const { selected: selectedTask, list: allTasks } = useSelector(s => s.tasks)
  const [activeView, setActiveView] = useState('list')
  const [createOpen, setCreateOpen] = useState(false)
  const [statusPanelOpen, setStatusPanelOpen] = useState(false)

  useProjectSocket(projectId)
  const onlineUsers = usePresence(projectId)

  useEffect(() => {
    if (projectId) {
      dispatch(fetchProject(projectId))
      dispatch(fetchTasks(projectId))
    }
  }, [projectId, dispatch])

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* ── Project header — Asana style ── */}
      <div className="border-b border-border bg-background shrink-0">
        {/* Title row */}
        <div className="flex items-center justify-between px-6 pt-2 pb-1.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl leading-none">{project.icon || '📋'}</span>
            <h1 className="text-lg font-semibold truncate">{project.name}</h1>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Online presence */}
            <OnlineAvatars users={onlineUsers} max={5} />
            {onlineUsers.length > 0 && <div className="w-px h-5 bg-border mx-1" />}
            <Button
              size="sm"
              className="h-7 gap-1.5 text-[11px] font-medium px-2.5"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-3 w-3" />
              Add task
            </Button>
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => navigate(`/analytics/${projectId}`)}
              title="Analytics"
            >
              <BarChart2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost" size="sm"
              className={cn('h-8 gap-1.5 text-xs', statusPanelOpen && 'text-primary bg-primary/10')}
              onClick={() => setStatusPanelOpen(o => !o)}
              title="Status updates"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Status
            </Button>
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => navigate(`/projects/${projectId}/settings`)}
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* View tabs — underline style */}
        <div className="flex items-end gap-0 px-6">
          {VIEWS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveView(id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 transition-all duration-150 -mb-px',
                activeView === id
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border/60'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── View content ── */}
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 overflow-auto">
          {activeView === 'list'     && <ListView projectId={projectId} statuses={currentStatuses} />}
          {activeView === 'board'    && <BoardView projectId={projectId} statuses={currentStatuses} />}
          {activeView === 'calendar' && <CalendarView projectId={projectId} />}
          {activeView === 'timeline' && <TimelineView projectId={projectId} />}
          {activeView === 'table'    && <TableView projectId={projectId} statuses={currentStatuses} />}
        </div>

        {selectedTask && (
          <TaskDetailPanel projectId={projectId} statuses={currentStatuses} role={currentRole} allTasks={allTasks}
            modal={['board', 'calendar', 'timeline'].includes(activeView)}
          />
        )}
        {!selectedTask && statusPanelOpen && (
          <StatusUpdatePanel
            projectId={projectId}
            role={currentRole}
            onClose={() => setStatusPanelOpen(false)}
          />
        )}
      </div>

      {createOpen && (
        <CreateTaskModal
          projectId={projectId}
          statuses={currentStatuses}
          onClose={() => setCreateOpen(false)}
        />
      )}
    </div>
  )
}
