import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Bell, CheckCheck, MessageSquare, UserCheck, GitBranch,
  Calendar, Users, X, Trash2, Check
} from 'lucide-react'
import {
  markNotificationRead, markAllNotificationsRead,
  removeNotification, clearAllNotifications
} from './notificationSlice'
import { Button } from '../../components/ui/button'
import { ScrollArea } from '../../components/ui/scroll-area'
import { cn } from '../../lib/utils'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent
} from '../../components/ui/dropdown-menu'

const TYPE_META = {
  mentioned:              { icon: MessageSquare, color: 'text-violet-500',  bg: 'bg-violet-50 dark:bg-violet-950/40' },
  comment_added:          { icon: MessageSquare, color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-950/40' },
  task_assigned:          { icon: UserCheck,     color: 'text-green-500',   bg: 'bg-green-50 dark:bg-green-950/40' },
  task_status_changed:    { icon: GitBranch,     color: 'text-orange-500',  bg: 'bg-orange-50 dark:bg-orange-950/40' },
  due_date_approaching:   { icon: Calendar,      color: 'text-red-500',     bg: 'bg-red-50 dark:bg-red-950/40' },
  project_member_added:   { icon: Users,         color: 'text-sky-500',     bg: 'bg-sky-50 dark:bg-sky-950/40' },
  project_member_removed: { icon: Users,         color: 'text-slate-500',   bg: 'bg-slate-50 dark:bg-slate-950/40' },
  workspace_invite:       { icon: Users,         color: 'text-indigo-500',  bg: 'bg-indigo-50 dark:bg-indigo-950/40' },
}

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function NotifRow({ n, onRead, onDelete, onClick }) {
  const meta = TYPE_META[n.type] || { icon: Bell, color: 'text-muted-foreground', bg: 'bg-muted' }
  const Icon = meta.icon

  return (
    <div
      className={cn(
        'group relative flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/40',
        !n.read && 'bg-primary/[0.04]'
      )}
      onClick={() => onClick(n)}
    >
      {/* Unread indicator */}
      {!n.read && (
        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary" />
      )}

      {/* Icon */}
      <div className={cn('h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5', meta.bg)}>
        <Icon className={cn('h-4 w-4', meta.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-14">
        <p className={cn('text-sm leading-snug', !n.read ? 'font-semibold' : 'font-medium text-muted-foreground')}>
          {n.title}
        </p>

        {/* Project + task context */}
        {(n.payload?.projectName || n.payload?.taskTitle) && (
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {n.payload.projectName && (
              <span className="text-[11px] text-muted-foreground">
                {n.payload.projectName}
              </span>
            )}
            {n.payload.projectName && n.payload.taskTitle && (
              <span className="text-[11px] text-muted-foreground">·</span>
            )}
            {n.payload.taskTitle && (
              <span className="text-[11px] text-muted-foreground truncate max-w-[160px]">
                {n.payload.taskTitle}
              </span>
            )}
          </div>
        )}

        {n.body && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{n.body}</p>
        )}
      </div>

      {/* Time + actions */}
      <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{timeAgo(n.createdAt)}</span>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {!n.read && (
            <button
              onClick={e => { e.stopPropagation(); onRead(n._id) }}
              className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10"
              title="Mark read"
            >
              <Check className="h-3 w-3" />
            </button>
          )}
          <button
            onClick={e => { e.stopPropagation(); onDelete(n._id) }}
            className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="Remove"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function NotificationBell() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { list, unreadCount } = useSelector(s => s.notifications)
  const [open, setOpen] = useState(false)

  // Show only the 15 most recent in the dropdown
  const preview = list.slice(0, 15)

  const handleClick = (n) => {
    if (!n.read) dispatch(markNotificationRead(n._id))
    const projectId = n.payload?.projectId
    if (projectId) navigate(`/projects/${projectId}`)
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-0.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[380px] p-0 shadow-xl" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Inbox</h3>
            {unreadCount > 0 && (
              <span className="text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 font-medium leading-none">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost" size="sm"
                className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                onClick={() => dispatch(markAllNotificationsRead())}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
            {list.length > 0 && (
              <Button
                variant="ghost" size="sm"
                className="h-7 text-xs gap-1 text-muted-foreground hover:text-destructive"
                onClick={() => dispatch(clearAllNotifications())}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* List */}
        <ScrollArea className="max-h-[440px]">
          {preview.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Bell className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">You're all caught up</p>
              <p className="text-xs text-muted-foreground/60">No new notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {preview.map(n => (
                <NotifRow
                  key={n._id}
                  n={n}
                  onRead={id => dispatch(markNotificationRead(id))}
                  onDelete={id => dispatch(removeNotification(id))}
                  onClick={handleClick}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {list.length > 0 && (
          <div className="border-t border-border px-4 py-2.5">
            <button
              className="w-full text-xs text-center text-primary hover:underline font-medium"
              onClick={() => { navigate('/notifications'); setOpen(false) }}
            >
              View all notifications
            </button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
