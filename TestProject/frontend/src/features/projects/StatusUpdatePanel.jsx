import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { getStatusUpdates, createStatusUpdate, deleteStatusUpdate } from '../../api/workspaces'
import { cn, getInitials, formatDate } from '../../lib/utils'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { Button } from '../../components/ui/button'
import { Textarea } from '../../components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select'
import { TrendingUp, AlertTriangle, XCircle, Plus, Trash2, X } from 'lucide-react'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  'on-track':  { label: 'On track',  icon: TrendingUp,    color: 'text-green-600',  bg: 'bg-green-100 dark:bg-green-900/30',  dot: 'bg-green-500' },
  'at-risk':   { label: 'At risk',   icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30', dot: 'bg-yellow-500' },
  'off-track': { label: 'Off track', icon: XCircle,       color: 'text-red-600',    bg: 'bg-red-100 dark:bg-red-900/30',       dot: 'bg-red-500' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['on-track']
  const Icon = cfg.icon
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full', cfg.bg, cfg.color)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  )
}

export default function StatusUpdatePanel({ projectId, role, onClose }) {
  const { user } = useSelector(s => s.auth)
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  const [composing, setComposing] = useState(false)
  const [status, setStatus] = useState('on-track')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const isViewer = role === 'Viewer'

  useEffect(() => {
    setLoading(true)
    getStatusUpdates(projectId)
      .then(r => setUpdates(r.data.updates || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [projectId])

  const handleSubmit = async () => {
    if (!body.trim()) return toast.error('Please add a note')
    setSubmitting(true)
    try {
      const r = await createStatusUpdate(projectId, { status, title, body })
      setUpdates(prev => [r.data.update, ...prev])
      setComposing(false)
      setTitle(''); setBody(''); setStatus('on-track')
      toast.success('Status update posted')
    } catch {
      toast.error('Failed to post update')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteStatusUpdate(projectId, id)
      setUpdates(prev => prev.filter(u => u._id !== id))
      setConfirmDeleteId(null)
      toast.success('Update deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <>
    <div className="w-[380px] border-l border-border bg-background flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h3 className="text-sm font-semibold">Status updates</h3>
        <div className="flex items-center gap-1">
          {!isViewer && !composing && (
            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setComposing(true)}>
              <Plus className="h-3.5 w-3.5" /> Update
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Compose form */}
        {composing && (
          <div className="p-4 border-b border-border space-y-3 bg-muted/20">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">New update</p>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                  <SelectItem key={val} value={val}>
                    <span className="flex items-center gap-2">
                      <span className={cn('h-2 w-2 rounded-full', cfg.dot)} />
                      {cfg.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Title (optional)"
              className="w-full text-sm bg-transparent border border-input rounded-md px-3 py-1.5 outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
            />

            <Textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="What's the current status? Any blockers?"
              rows={4}
              className="text-sm resize-none"
            />

            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => setComposing(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Posting…' : 'Post update'}
              </Button>
            </div>
          </div>
        )}

        {/* Updates list */}
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : updates.length === 0 ? (
            <div className="text-center py-10">
              <TrendingUp className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No status updates yet</p>
              {!isViewer && (
                <Button size="sm" variant="outline" className="mt-3" onClick={() => setComposing(true)}>
                  Post first update
                </Button>
              )}
            </div>
          ) : (
            updates.map(u => (
              <div key={u._id} className="space-y-2">
                {/* Author + date */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback
                        style={{ backgroundColor: u.authorId?.avatarColor || '#6366f1' }}
                        className="text-white text-[10px] font-bold"
                      >
                        {getInitials(u.authorId?.displayName, u.authorId?.email)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">{u.authorId?.displayName || u.authorId?.email}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(u.createdAt)}</span>
                  </div>
                  {u.authorId?._id === user?.userId && (
                    <button
                      onClick={() => setConfirmDeleteId(u._id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Status badge */}
                <StatusBadge status={u.status} />

                {/* Title */}
                {u.title && <p className="text-sm font-semibold">{u.title}</p>}

                {/* Body */}
                {u.body && <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{u.body}</p>}

                <div className="border-b border-border" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>

    <ConfirmDialog
      open={!!confirmDeleteId}
      onConfirm={() => handleDelete(confirmDeleteId)}
      onCancel={() => setConfirmDeleteId(null)}
      title="Delete status update?"
      description="This update will be permanently removed."
      confirmLabel="Delete"
    />
    </>
  )
}
