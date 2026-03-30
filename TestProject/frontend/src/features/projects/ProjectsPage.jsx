import { useSelector, useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Plus, FolderKanban, MoreHorizontal, Trash2, Settings } from 'lucide-react'
import { deleteProject } from './projectSlice'
import { Button } from '../../components/ui/button'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator
} from '../../components/ui/dropdown-menu'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
  Active:    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'On Hold': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  Archived:  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
}

export default function ProjectsPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { list: projects, loading } = useSelector(s => s.projects)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const handleDelete = async () => {
    const result = await dispatch(deleteProject(confirmDeleteId))
    setConfirmDeleteId(null)
    if (deleteProject.fulfilled.match(result)) toast.success('Project deleted')
    else toast.error(result.payload || 'Failed to delete')
  }

  return (
    <>
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground text-sm mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => navigate('/projects/new')} size="sm">
          <Plus className="h-4 w-4" />
          New project
        </Button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">No projects yet</p>
          <Button onClick={() => navigate('/projects/new')} size="sm">
            <Plus className="h-4 w-4" />
            Create your first project
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => (
            <Link
              key={p._id}
              to={`/projects/${p._id}`}
              className="group relative bg-card border border-border rounded-xl p-5 hover:border-primary/50 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{p.icon || '📋'}</span>
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color || '#6366f1' }} />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={e => e.preventDefault()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.preventDefault(); navigate(`/projects/${p._id}/settings`) }} className="gap-2">
                      <Settings className="h-4 w-4" /> Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => { e.preventDefault(); setConfirmDeleteId(p._id) }} className="gap-2 text-destructive focus:text-destructive">
                      <Trash2 className="h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <h3 className="font-semibold truncate">{p.name}</h3>
              {p.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}

              <div className="flex items-center justify-between mt-4">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status] || STATUS_COLORS.Active}`}>
                  {p.status || 'Active'}
                </span>
                <span className="text-xs text-muted-foreground">{p.role}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>

    <ConfirmDialog
      open={!!confirmDeleteId}
      onConfirm={handleDelete}
      onCancel={() => setConfirmDeleteId(null)}
      title="Delete project?"
      description="All tasks, comments, and attachments will be permanently removed. This cannot be undone."
      confirmLabel="Delete project"
    />
    </>
  )
}
