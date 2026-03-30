import { useState, useEffect, useCallback } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import CommandPalette from '../common/CommandPalette'
import { fetchWorkspaces, fetchWorkspace } from '../../features/workspace/workspaceSlice'
import { fetchProjects } from '../../features/projects/projectSlice'
import { fetchNotifications } from '../../features/notifications/notificationSlice'
import { clearSelectedTask } from '../../features/tasks/taskSlice'
import { useNotificationSocket } from '../../hooks/useSocket'
import { connect as socketConnect } from '../../api/socketClient'
import ShortcutsModal from '../common/ShortcutsModal'

export default function AppLayout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [cmdOpen, setCmdOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const { token } = useSelector(s => s.auth)
  const { current: workspace } = useSelector(s => s.workspace)
  const { selected: selectedTask } = useSelector(s => s.tasks)

  // Connect socket
  useEffect(() => {
    if (token) socketConnect(token)
  }, [token])

  // Listen for real-time notifications
  useNotificationSocket()

  // Bootstrap data
  useEffect(() => {
    dispatch(fetchWorkspaces())
    dispatch(fetchNotifications())
  }, [dispatch])

  useEffect(() => {
    if (workspace?._id) {
      dispatch(fetchProjects(workspace._id))
      dispatch(fetchWorkspace(workspace._id))
    }
  }, [workspace?._id, dispatch])

  // Global keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    const tag = document.activeElement?.tagName
    const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) ||
      document.activeElement?.isContentEditable

    // ⌘K / Ctrl+K — command palette
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setCmdOpen(true)
      return
    }

    // ? — shortcuts help (not while typing)
    if (e.key === '?' && !isTyping) {
      setShortcutsOpen(true)
      return
    }

    // Escape — close task detail panel
    if (e.key === 'Escape' && selectedTask) {
      dispatch(clearSelectedTask())
      return
    }

    // / — focus search (not while typing)
    if (e.key === '/' && !isTyping) {
      e.preventDefault()
      setCmdOpen(true)
      return
    }

    // N — new task (not while typing)
    if (e.key === 'n' && !isTyping && !e.metaKey && !e.ctrlKey) {
      e.preventDefault()
      // Dispatch a custom event that views can listen to
      window.dispatchEvent(new CustomEvent('shortcut:newTask'))
      return
    }

    // G then I — go to inbox
    if (e.key === 'i' && !isTyping && !e.metaKey && !e.ctrlKey) {
      navigate('/notifications')
      return
    }
  }, [selectedTask, dispatch, navigate])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar onSearchOpen={() => setCmdOpen(true)} />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  )
}
