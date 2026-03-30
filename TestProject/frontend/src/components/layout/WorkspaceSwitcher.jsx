import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { ChevronsUpDown, Plus, Check } from 'lucide-react'
import { setCurrentWorkspace } from '../../features/workspace/workspaceSlice'
import { fetchProjects } from '../../features/projects/projectSlice'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator
} from '../ui/dropdown-menu'

export default function WorkspaceSwitcher() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { list, current } = useSelector(s => s.workspace)

  const switchTo = (ws) => {
    dispatch(setCurrentWorkspace(ws))
    dispatch(fetchProjects(ws._id))
    navigate('/dashboard')
  }

  // Pick a consistent color from workspace name
  const wsColor = current?.color || '#f06a6a'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 w-full px-1 py-1 rounded-md hover:bg-sidebar-border/60 transition-colors text-left group">
          <div
            className="flex h-6 w-6 items-center justify-center rounded text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: wsColor }}
          >
            {current?.name?.slice(0, 1).toUpperCase() || 'W'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-sidebar-foreground truncate leading-tight">
              {current?.name || 'Select workspace'}
            </p>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 text-sidebar-foreground/40 shrink-0 group-hover:text-sidebar-foreground/70 transition-colors" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="start" sideOffset={6}>
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {list.map(ws => (
          <DropdownMenuItem key={ws._id} onClick={() => switchTo(ws)} className="gap-2 cursor-pointer">
            <div
              className="flex h-5 w-5 items-center justify-center rounded text-white text-[10px] font-bold shrink-0"
              style={{ backgroundColor: ws.color || '#f06a6a' }}
            >
              {ws.name.slice(0, 1).toUpperCase()}
            </div>
            <span className="flex-1 truncate text-sm">{ws.name}</span>
            {current?._id === ws._id && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/workspace/new')} className="gap-2 cursor-pointer text-muted-foreground">
          <Plus className="h-4 w-4" />
          Create workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
