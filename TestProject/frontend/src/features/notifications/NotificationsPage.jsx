import { useEffect, useState, useRef, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Bell, MessageSquare, UserCheck, GitBranch,
  Users, X, Check, ArrowRight, AtSign, Clock,
  FolderKanban, Trash2, ExternalLink, Send, Loader2,
  CheckCircle2, Circle, Search, Sparkles, SlidersHorizontal,
  BookmarkPlus, Archive, MoreHorizontal, ChevronDown,
  Inbox, RefreshCw, CheckCheck, Pin, Filter, SortAsc,
  MailOpen, Mail, ChevronRight, ArrowUpRight, Paperclip, Image, FileText, XCircle, Download, ZoomIn
} from 'lucide-react'
import {
  fetchNotifications, markNotificationRead, markAllNotificationsRead,
  removeNotification, clearAllNotifications
} from './notificationSlice'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { Button } from '../../components/ui/button'
import { cn, getInitials } from '../../lib/utils'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import * as commentsApi from '../../api/comments'
import * as socketClient from '../../api/socketClient'
import { getProjectMembers } from '../../api/projects'
import { updateTask, downloadAttachmentAuth, fetchAttachmentBlobUrl } from '../../api/tasks'
import toast from 'react-hot-toast'

/* ─── Constants ─── */
const TYPE_META = {
  mentioned:              { icon: AtSign,        color: 'text-violet-500',  bg: 'bg-violet-500/10', label: 'mentioned you',           accent: '#8b5cf6' },
  comment_added:          { icon: MessageSquare, color: 'text-blue-500',    bg: 'bg-blue-500/10',   label: 'commented',               accent: '#3b82f6' },
  task_assigned:          { icon: UserCheck,     color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'assigned a task to you', accent: '#10b981' },
  task_status_changed:    { icon: GitBranch,     color: 'text-orange-500',  bg: 'bg-orange-500/10', label: 'changed status',          accent: '#f97316' },
  due_date_approaching:   { icon: Clock,         color: 'text-red-500',     bg: 'bg-red-500/10',    label: 'due soon',                accent: '#ef4444' },
  project_member_added:   { icon: Users,         color: 'text-sky-500',     bg: 'bg-sky-500/10',    label: 'added you',               accent: '#0ea5e9' },
  project_member_removed: { icon: Users,         color: 'text-slate-500',   bg: 'bg-slate-500/10',  label: 'removed you',             accent: '#64748b' },
  workspace_invite:       { icon: Users,         color: 'text-indigo-500',  bg: 'bg-indigo-500/10', label: 'invited you',             accent: '#6366f1' },
}

const TABS = [
  { key: 'activity', label: 'Activity', icon: Inbox },
  { key: 'archive',  label: 'Archive',  icon: Archive },
]

const FILTERS = [
  { key: 'all',           label: 'All notifications' },
  { key: 'mentioned',     label: '@Mentions' },
  { key: 'task_assigned', label: 'Assigned to me' },
  { key: 'comment_added', label: 'Comments' },
  { key: 'other',         label: 'Other updates' },
]

const SORT_OPTIONS = ['Newest', 'Oldest', 'Unread first']
const REACTIONS = ['👍', '❤️', '😄', '🎉', '👀']
const OTHER_TYPES = new Set(['task_status_changed','due_date_approaching','project_member_added','project_member_removed','workspace_invite'])
const AVATAR_COLORS = ['#f06a6a','#6366f1','#0ea5e9','#10b981','#f59e0b','#8b5cf6','#ec4899']

function colorFromName(name = '') {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d === 1) return 'Yesterday'
  if (d < 7) return `${d}d ago`
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function groupByDate(notifications) {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart - 86400000)
  const weekStart = new Date(todayStart - 6 * 86400000)
  const groups = { Today: [], Yesterday: [], 'This Week': [], Earlier: [] }
  notifications.forEach(n => {
    const d = new Date(n.createdAt)
    if (d >= todayStart)          groups.Today.push(n)
    else if (d >= yesterdayStart)  groups.Yesterday.push(n)
    else if (d >= weekStart)       groups['This Week'].push(n)
    else                           groups.Earlier.push(n)
  })
  return groups
}

/* ─── Comment text with @mention highlights ─── */
function CommentText({ text }) {
  if (!text) return null
  const parts = text.split(/(@\S+)/g)
  return (
    <span className="text-[13px] leading-relaxed whitespace-pre-wrap">
      {parts.map((part, i) =>
        part.startsWith('@')
          ? <span key={i} className="text-primary font-semibold bg-primary/5 px-0.5 rounded">{part}</span>
          : part
      )}
    </span>
  )
}

/* ─── Mention dropdown ─── */
function MentionDropdown({ members, query, onSelect, selectedIdx }) {
  const filtered = members.filter(m =>
    (m.displayName || m.email || '').toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5)
  if (!filtered.length) return null
  return (
    <div className="absolute bottom-full left-0 mb-1 w-52 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in slide-in-from-bottom-2 duration-150">
      {filtered.map((m, i) => (
        <button
          key={m.userId || m.email}
          type="button"
          className={cn('flex items-center gap-2.5 w-full px-3 py-2 text-xs hover:bg-muted transition-colors', i === selectedIdx && 'bg-muted')}
          onMouseDown={e => { e.preventDefault(); onSelect(m) }}
        >
          <Avatar className="h-5 w-5 shrink-0">
            <AvatarFallback style={{ backgroundColor: colorFromName(m.displayName || m.email || '') }} className="text-[9px] text-white">
              {getInitials(m.displayName, m.email)}
            </AvatarFallback>
          </Avatar>
          <p className="font-medium truncate">{m.displayName || m.email?.split('@')[0]}</p>
        </button>
      ))}
    </div>
  )
}

/* ─── Inline image ─── */
function InlineImage({ attachment, onExpand }) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    let blobUrl
    fetchAttachmentBlobUrl(attachment._id || attachment)
      .then(u => { blobUrl = u; setUrl(u) })
      .catch(() => {})
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl) }
  }, [attachment._id || attachment])

  if (!url) return (
    <div className="h-24 max-w-[240px] rounded-lg bg-muted/40 border border-border/50 flex items-center justify-center">
      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 border-t-transparent animate-spin" />
    </div>
  )
  return (
    <div className="relative group cursor-pointer rounded-lg overflow-hidden border border-border/60 mt-1 max-w-[240px]" onClick={onExpand}>
      <img src={url} alt={attachment.originalName} className="max-h-[160px] w-full object-cover" />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
        <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
      </div>
    </div>
  )
}

/* ─── Image lightbox ─── */
function ImageLightbox({ attachment, onClose }) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    let blobUrl
    fetchAttachmentBlobUrl(attachment._id || attachment)
      .then(u => { blobUrl = u; setUrl(u) })
      .catch(() => {})
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl) }
  }, [attachment._id || attachment])

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-150" onClick={onClose}>
      <button className="absolute top-4 right-4 text-white/50 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition-colors" onClick={onClose}>
        <X className="h-5 w-5" />
      </button>
      <div className="flex flex-col items-center gap-3 w-full" onClick={e => e.stopPropagation()}>
        {url
          ? <img src={url} alt={attachment.originalName} className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200" />
          : <div className="h-8 w-8 rounded-full border-2 border-white/50 border-t-white animate-spin" />
        }
        <div className="flex items-center gap-3 text-white/80 text-[13px] font-medium mt-2">
          <span>{attachment.originalName || 'Image'}</span>
          <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-white bg-white/10 px-3 py-1.5 rounded-lg transition-colors border border-white/10" title="Open in new tab">
            <ExternalLink className="h-3.5 w-3.5" /> Open
          </a>
          <button
            className="flex items-center gap-1.5 hover:text-white bg-white/10 px-3 py-1.5 rounded-lg transition-colors border border-white/10"
            onClick={() => downloadAttachmentAuth(attachment._id, attachment.originalName).catch(() => toast.error('Download failed'))}
          >
            <Download className="h-3.5 w-3.5" /> Download
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Reaction bar ─── */
function ReactionBar({ c, currentUserId, onUpdate }) {
  const [reactions, setReactions] = useState(c.reactions || [])
  const [hovered, setHovered] = useState(false)
  const [pending, setPending] = useState(null)
  const hideTimer = useRef(null)

  useEffect(() => { setReactions(c.reactions || []) }, [c.reactions])

  const toggle = async (emoji) => {
    if (pending) return
    setPending(emoji)
    setHovered(false)
    setReactions(prev => {
      const bucket = prev.find(r => r.emoji === emoji)
      if (!bucket) return [...prev, { emoji, userIds: [currentUserId] }]
      const already = bucket.userIds.map(String).includes(String(currentUserId))
      return prev.map(r => r.emoji === emoji
        ? { ...r, userIds: already ? r.userIds.filter(u => String(u) !== String(currentUserId)) : [...r.userIds, currentUserId] }
        : r
      ).filter(r => r.userIds.length > 0)
    })
    try {
      const { data } = await commentsApi.toggleReaction(c._id, emoji)
      setReactions(data.reactions)
      onUpdate?.(c._id, data.reactions)
    } catch { setReactions(c.reactions || []) }
    finally { setPending(null) }
  }

  const showPicker = () => { clearTimeout(hideTimer.current); setHovered(true) }
  const hidePicker = () => { hideTimer.current = setTimeout(() => setHovered(false), 200) }

  return (
    <div className="relative" onMouseEnter={showPicker} onMouseLeave={hidePicker}>
      {hovered && (
        <div
          onMouseEnter={showPicker}
          onMouseLeave={hidePicker}
          className="absolute bottom-full left-0 mb-1.5 flex items-center gap-0.5 bg-popover border border-border rounded-full px-2 py-1.5 shadow-lg z-50 animate-in zoom-in-90 slide-in-from-bottom-1 duration-150"
        >
          {REACTIONS.map(e => (
            <button key={e} onClick={() => toggle(e)} className="text-base leading-none hover:scale-125 transition-transform p-0.5 rounded-full hover:bg-muted">
              {e}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-1 mt-1.5 flex-wrap min-h-[20px]">
        {reactions.map(({ emoji, userIds }) => {
          const mine = userIds.map(String).includes(String(currentUserId))
          return (
            <button key={emoji} onClick={() => toggle(emoji)} disabled={!!pending}
              className={cn(
                'flex items-center gap-1 text-[11px] rounded-full px-2 py-0.5 border transition-all',
                mine ? 'border-primary/40 bg-primary/10 text-primary font-medium' : 'border-border bg-muted/30 hover:bg-muted text-muted-foreground'
              )}
            >
              {emoji} <span>{userIds.length}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Comment bubble ─── */
function CommentBubble({ c, currentUserId, onUpdate }) {
  const isMe = String(c.userId?._id || c.userId) === String(currentUserId)
  return (
    <div className="group flex gap-2.5 animate-in fade-in slide-in-from-bottom-1 duration-200">
      <Avatar className="h-7 w-7 shrink-0 mt-0.5">
        <AvatarFallback
          style={{ backgroundColor: colorFromName(c.userId?.displayName || c.userId?.email || '') }}
          className="text-[9px] text-white font-bold"
        >
          {getInitials(c.userId?.displayName, c.userId?.email)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-[12px] font-semibold text-foreground">
            {c.userId?.displayName || c.userId?.email?.split('@')[0]}
          </span>
          <span className="text-[10px] text-muted-foreground/50">{timeAgo(c.createdAt)}</span>
        </div>
        
        {c.text && (
          <div className={cn(
            'rounded-xl rounded-tl-[4px] px-3.5 py-2.5 text-[13px] leading-relaxed',
            isMe ? 'bg-primary/8 text-foreground' : 'bg-muted/40 text-foreground'
          )}>
            <CommentText text={c.text} />
          </div>
        )}

        {/* Attachments rendering */}
        {c.attachments?.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-2 transition-all">
            {c.attachments.map((att, i) => {
              if (att.mimetype?.startsWith('image/')) {
                return (
                  <InlineImage 
                    key={i} 
                    attachment={att} 
                    onExpand={() => onUpdate && onUpdate('lightbox', att)} 
                  />
                )
              }
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 max-w-[250px] px-2.5 py-1.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors text-xs group/att cursor-pointer"
                  onClick={async () => {
                    try {
                      // Attempt to open native preview in a new tab (useful for PDFs, txt, etc)
                      const url = await fetchAttachmentBlobUrl(att._id || att)
                      window.open(url, '_blank')
                    } catch { toast.error('Preview failed') }
                  }}
                  title="Click to preview file"
                >
                  <Paperclip className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
                  <span className="flex-1 truncate text-left font-medium">{att.originalName || att.filename || 'Attachment'}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover/att:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        downloadAttachmentAuth(att._id || att, att.originalName || att.filename).catch(() => toast.error('Download failed'))
                      }} 
                      className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors" 
                      title="Download"
                    >
                      <Download className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <ReactionBar c={c} currentUserId={currentUserId} onUpdate={onUpdate} />
      </div>
    </div>
  )
}

/* ═════════════════════════════════════════════
   NOTIFICATION ITEM — Asana inbox style
   ═════════════════════════════════════════════ */
function NotifItem({ n, selected, onSelect, onRead, onDelete, animIdx }) {
  const meta = TYPE_META[n.type] || { icon: Bell, color: 'text-muted-foreground', bg: 'bg-muted', accent: '#6366f1', label: 'notification' }
  const Icon = meta.icon
  const [removing, setRemoving] = useState(false)
  const [hovered, setHovered] = useState(false)

  // Extract actor name from notification
  const actorName = n.payload?.actorName || n.title?.split(' ')[0] || 'Someone'

  const handleDelete = (e) => {
    e.stopPropagation()
    setRemoving(true)
    setTimeout(() => onDelete(n._id), 260)
  }

  return (
    <div
      style={{ animationDelay: `${animIdx * 20}ms` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'group relative cursor-pointer transition-all duration-100',
        'animate-in fade-in slide-in-from-top-1 fill-mode-both',
        removing && 'animate-out slide-out-to-right-4 fade-out duration-260 fill-mode-forwards pointer-events-none',
        selected
          ? 'bg-primary/[0.06]'
          : 'hover:bg-muted/30',
      )}
      onClick={() => onSelect(n)}
    >
      {/* Unread accent */}
      {!n.read && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary rounded-r" />
      )}

      <div className="px-4 py-3 flex gap-3">
        {/* Actor avatar */}
        <div className="relative shrink-0">
          <Avatar className="h-8 w-8">
            <AvatarFallback
              style={{ backgroundColor: colorFromName(actorName) }}
              className="text-[10px] text-white font-bold"
            >
              {actorName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {/* Type icon badge */}
          <div className={cn(
            'absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full flex items-center justify-center border-2 border-background',
            meta.bg
          )}>
            <Icon className={cn('h-2 w-2', meta.color)} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Project breadcrumb */}
          {n.payload?.projectName && (
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="h-1.5 w-1.5 rounded-full bg-primary/50 shrink-0" />
              <span className="text-[10px] text-muted-foreground/60 font-medium truncate">{n.payload.projectName}</span>
            </div>
          )}

          {/* Main text — actor + action */}
          <p className="text-[13px] leading-snug mb-0.5">
            <span className={cn('font-semibold', !n.read ? 'text-foreground' : 'text-muted-foreground')}>
              {actorName}
            </span>
            <span className="text-muted-foreground"> {meta.label}</span>
          </p>

          {/* Task title */}
          {n.payload?.taskTitle && (
            <p className={cn(
              'text-[12px] leading-snug truncate',
              !n.read ? 'text-foreground/80 font-medium' : 'text-muted-foreground/70'
            )}>
              {n.payload.taskTitle}
            </p>
          )}

          {/* Fallback body */}
          {!n.payload?.taskTitle && n.title && (
            <p className="text-[12px] text-muted-foreground/70 truncate leading-snug">
              {n.title}
            </p>
          )}

          {/* Timestamp */}
          <p className="text-[10px] text-muted-foreground/40 mt-1 font-medium">{timeAgo(n.createdAt)}</p>
        </div>

        {/* Hover actions */}
        <div className={cn(
          'flex items-start gap-0.5 shrink-0 pt-0.5 transition-all duration-100',
          hovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}>
          {!n.read && (
            <button
              onClick={e => { e.stopPropagation(); onRead(n._id) }}
              className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-colors"
              title="Mark read"
            >
              <MailOpen className="h-3 w-3" />
            </button>
          )}
          <button
            onClick={handleDelete}
            className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Dismiss"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        {/* Unread dot (right side) */}
        {!n.read && !hovered && (
          <div className="shrink-0 pt-2">
            <div className="h-2 w-2 rounded-full bg-primary" />
          </div>
        )}
      </div>

      {/* Bottom border */}
      <div className="mx-4 h-px bg-border/30 last:hidden" />
    </div>
  )
}

/* ═════════════════════════════════════════════
   DETAIL PANE — Right side (Asana-style)
   ═════════════════════════════════════════════ */
function DetailPane({ n, onRead, onDelete, onNavigate }) {
  const { user } = useSelector(s => s.auth)
  const [comments, setComments] = useState([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [members, setMembers] = useState([])
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [taskDone, setTaskDone] = useState(false)
  const [mentionQuery, setMentionQuery] = useState(null)
  const [mentionIdx, setMentionIdx] = useState(0)
  const [attachments, setAttachments] = useState([])
  const [lightboxAtt, setLightboxAtt] = useState(null)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const commentsEndRef = useRef(null)

  const taskId = n?.payload?.taskId
  const projectId = n?.payload?.projectId

  useEffect(() => {
    if (!taskId) { setComments([]); return }
    setCommentsLoading(true)
    commentsApi.getComments(taskId)
      .then(({ data }) => setComments(data.comments || []))
      .catch(() => {})
      .finally(() => setCommentsLoading(false))
  }, [taskId])

  useEffect(() => {
    if (!projectId) return
    getProjectMembers(projectId)
      .then(({ data }) => setMembers(data.collaborators || []))
      .catch(() => {})
  }, [projectId])

  useEffect(() => {
    if (!projectId) return
    socketClient.joinProject(projectId)
    const onReaction = ({ commentId, reactions }) =>
      setComments(prev => prev.map(c => c._id === commentId ? { ...c, reactions } : c))
    const onNew = ({ comment }) =>
      setComments(prev => prev.find(c => c._id === comment._id) ? prev : [...prev, comment])
    socketClient.on('comment:reaction', onReaction)
    socketClient.on('comment:new', onNew)
    return () => {
      socketClient.off('comment:reaction', onReaction)
      socketClient.off('comment:new', onNew)
    }
  }, [projectId])

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments.length])

  const handleTextChange = (e) => {
    const val = e.target.value
    setReplyText(val)
    const pos = e.target.selectionStart
    const before = val.slice(0, pos)
    const match = before.match(/@(\w*)$/)
    if (match) { setMentionQuery(match[1]); setMentionIdx(0) }
    else setMentionQuery(null)
  }

  const insertMention = useCallback((member) => {
    const name = member.displayName || member.email?.split('@')[0] || 'user'
    const pos = textareaRef.current?.selectionStart ?? replyText.length
    const before = replyText.slice(0, pos)
    const after = replyText.slice(pos)
    const replaced = before.replace(/@(\w*)$/, `@${name} `)
    setReplyText(replaced + after)
    setMentionQuery(null)
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(replaced.length, replaced.length)
      }
    }, 0)
  }, [replyText])

  const handleKeyDown = (e) => {
    if (mentionQuery !== null) {
      const filtered = members.filter(m =>
        (m.displayName || m.email || '').toLowerCase().includes(mentionQuery.toLowerCase())
      ).slice(0, 5)
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIdx(i => Math.min(i + 1, filtered.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setMentionIdx(i => Math.max(i - 1, 0)) }
      if ((e.key === 'Enter' || e.key === 'Tab') && filtered[mentionIdx]) { e.preventDefault(); insertMention(filtered[mentionIdx]); return }
      if (e.key === 'Escape') { setMentionQuery(null); return }
    }
    if (e.key === 'Enter' && !e.shiftKey && mentionQuery === null) { e.preventDefault(); submitReply() }
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setAttachments(prev => [...prev, ...files].slice(0, 5)) // max 5 files
    e.target.value = '' // reset input
  }

  const removeAttachment = (idx) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx))
  }

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) return Image
    return FileText
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  const submitReply = async () => {
    if ((!replyText.trim() && attachments.length === 0) || !taskId) return
    setSubmitting(true)
    try {
      const formData = new FormData()
      if (replyText.trim()) formData.append('text', replyText.trim())
      attachments.forEach(file => formData.append('attachments', file))
      await commentsApi.createComment(taskId, formData)
      setReplyText('')
      setAttachments([])
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post comment')
    } finally { setSubmitting(false) }
  }

  const toggleTaskDone = async () => {
    if (!taskId) return
    const newStatus = taskDone ? 'todo' : 'done'
    try {
      await updateTask(taskId, { status: newStatus })
      setTaskDone(!taskDone)
      toast.success(newStatus === 'done' ? 'Task marked done' : 'Task reopened')
    } catch { toast.error('Failed to update task') }
  }

  /* Empty state */
  if (!n) return (
    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-5 p-8">
      <div className="relative">
        <div className="h-20 w-20 rounded-2xl bg-muted/30 flex items-center justify-center">
          <Inbox className="h-9 w-9 opacity-15" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground/50 mb-1">Select a notification</p>
        <p className="text-[12px] text-muted-foreground/40 max-w-[200px] leading-relaxed">
          Click any item to see details and reply inline
        </p>
      </div>
    </div>
  )

  const meta = TYPE_META[n.type] || { icon: Bell, color: 'text-muted-foreground', bg: 'bg-muted', label: 'notification', accent: '#6366f1' }
  const Icon = meta.icon
  const topLevelComments = comments.filter(c => !c.parentId)
  const actorName = n.payload?.actorName || n.title?.split(' ')[0] || 'Someone'

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-150">

      {/* Header */}
      <div className="px-5 py-4 border-b border-border/50 shrink-0">
        {/* Project context */}
        {n.payload?.projectName && (
          <div className="flex items-center gap-1.5 mb-2">
            <div className="h-2 w-2 rounded-[3px] bg-primary/50" />
            <span className="text-[11px] text-muted-foreground/60 font-medium">{n.payload.projectName}</span>
          </div>
        )}

        {/* Task title */}
        <div className="flex-1 min-w-0">
          <h2 className="text-[15px] font-semibold leading-snug text-foreground">
            {n.payload?.taskTitle || n.title}
          </h2>
          {n.payload?.taskTitle && (
            <p className="text-[12px] text-muted-foreground/70 mt-0.5 leading-snug">{n.title}</p>
          )}
        </div>

        {/* Mark complete — always visible, clearly labeled */}
        {taskId && (
          <button
            onClick={toggleTaskDone}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all mt-1 shrink-0',
              taskDone
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/15'
                : 'bg-background border-border/60 text-muted-foreground hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
            )}
          >
            {taskDone
              ? <><CheckCircle2 className="h-4 w-4" /> Completed</>
              : <><Circle className="h-4 w-4" /> Mark complete</>
            }
          </button>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5 mt-3">
          {!n.read && (
            <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1.5 rounded-lg font-medium" onClick={() => onRead(n._id)}>
              <Check className="h-3 w-3" /> Mark read
            </Button>
          )}
          {taskId && (
            <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1.5 rounded-lg font-medium" onClick={() => onNavigate(n)}>
              <ArrowUpRight className="h-3 w-3" /> Open task
            </Button>
          )}
          <div className="flex-1" />
          <Button
            size="sm" variant="ghost"
            className="h-7 text-[11px] gap-1.5 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(n._id)}
          >
            <Archive className="h-3 w-3" /> Archive
          </Button>
        </div>
      </div>

      {/* Comments thread */}
      {taskId ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Thread header */}
          <div className="px-5 py-2 border-b border-border/30 flex items-center gap-2 shrink-0">
            <MessageSquare className="h-3 w-3 text-muted-foreground/40" />
            <span className="text-[11px] text-muted-foreground/50 font-medium">
              {commentsLoading ? 'Loading…' : `${topLevelComments.length} comment${topLevelComments.length !== 1 ? 's' : ''}`}
            </span>
          </div>

          {/* Comments */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 custom-scrollbar">
            {commentsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/40" />
              </div>
            ) : topLevelComments.length === 0 ? (
              <div className="flex flex-col items-center py-12 gap-2 text-muted-foreground/30">
                <MessageSquare className="h-8 w-8 opacity-30" />
                <p className="text-[12px] font-medium">No comments yet</p>
                <p className="text-[11px] text-muted-foreground/30">Start the conversation below</p>
              </div>
            ) : (
              topLevelComments.map(c => (
                  <CommentBubble
                  key={c._id}
                  c={c}
                  currentUserId={user?.userId}
                  onUpdate={(id, data) => {
                    if (id === 'lightbox') {
                      setLightboxAtt(data)
                    } else {
                      setComments(prev => prev.map(cm => cm._id === id ? { ...cm, reactions: data } : cm))
                    }
                  }}
                />
              ))
            )}
            <div ref={commentsEndRef} />
          </div>

          {/* Reply compose */}
          <div className="px-5 py-3 border-t border-border/50 bg-background shrink-0 relative">
            {mentionQuery !== null && (
              <MentionDropdown members={members} query={mentionQuery} onSelect={insertMention} selectedIdx={mentionIdx} />
            )}

            {/* Attachment previews */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {attachments.map((file, idx) => {
                  const FileIcon = getFileIcon(file)
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 bg-muted/40 border border-border/40 rounded-lg px-2.5 py-1.5 text-[11px] group/file max-w-[200px]"
                    >
                      <FileIcon className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                      <span className="truncate text-foreground font-medium">{file.name}</span>
                      <span className="text-muted-foreground/40 shrink-0">{formatFileSize(file.size)}</span>
                      <button
                        onClick={() => removeAttachment(idx)}
                        className="ml-0.5 shrink-0 text-muted-foreground/40 hover:text-destructive transition-colors"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="flex gap-2.5 items-end">
              <Avatar className="h-7 w-7 shrink-0 mb-0.5">
                <AvatarFallback
                  style={{ backgroundColor: colorFromName(user?.displayName || user?.email || '') }}
                  className="text-[10px] text-white font-bold"
                >
                  {getInitials(user?.displayName, user?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 border border-border/60 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40 transition-all bg-background">
                <textarea
                  ref={textareaRef}
                  value={replyText}
                  onChange={handleTextChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Reply… type @ to mention"
                  rows={2}
                  className="w-full text-[13px] bg-transparent px-3.5 py-2.5 resize-none outline-none placeholder:text-muted-foreground/40"
                />
                <div className="flex items-center gap-1 px-2.5 py-1.5 border-t border-border/30 bg-muted/5">
                  {/* Attachment button */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-muted transition-colors"
                    title="Attach files"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                  </button>

                  <span className="text-[10px] text-muted-foreground/25 flex-1">⏎ send · ⇧⏎ new line</span>
                  <Button
                    size="sm"
                    className="h-6 text-[11px] px-3 gap-1.5 rounded-lg font-medium"
                    onClick={submitReply}
                    disabled={submitting || (!replyText.trim() && attachments.length === 0)}
                  >
                    {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-muted-foreground">
            <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center mx-auto mb-3', meta.bg)}>
              <Icon className={cn('h-5 w-5', meta.color)} />
            </div>
            <p className="text-[13px] leading-relaxed max-w-[240px] text-muted-foreground/60">{n.body || n.title || 'No additional details available.'}</p>
          </div>
        </div>
      )}

      {/* Lightbox for full-screen images */}
      {lightboxAtt && <ImageLightbox attachment={lightboxAtt} onClose={() => setLightboxAtt(null)} />}
    </div>
  )
}

/* ═════════════════════════════════════════════
   MAIN PAGE
   ═════════════════════════════════════════════ */
export default function NotificationsPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { list: notifications, loading } = useSelector(s => s.notifications)
  const [tab, setTab] = useState('activity')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('Newest')
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [selected, setSelected] = useState(null)
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [confirmClearAll, setConfirmClearAll] = useState(false)
  const sortRef = useRef(null)
  const filterRef = useRef(null)

  useEffect(() => { dispatch(fetchNotifications()) }, [dispatch])

  useEffect(() => {
    if (selected) {
      const updated = notifications.find(n => n._id === selected._id)
      if (updated) setSelected(updated)
    }
  }, [notifications])

  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setShowSortMenu(false)
      if (filterRef.current && !filterRef.current.contains(e.target)) setShowFilterMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setSelected(null) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  let filtered = notifications.filter(n => {
    if (tab === 'archive' && !n.read) return false
    if (tab === 'activity' && n.read && filter === 'all' && !search) { /* show all */ }
    const matchesFilter = filter === 'all' ? true
      : filter === 'other' ? OTHER_TYPES.has(n.type)
      : n.type === filter
    const matchesSearch = !search
      || n.title?.toLowerCase().includes(search.toLowerCase())
      || n.payload?.projectName?.toLowerCase().includes(search.toLowerCase())
      || n.payload?.taskTitle?.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  if (sort === 'Oldest') filtered = [...filtered].reverse()
  else if (sort === 'Unread first') filtered = [...filtered].sort((a, b) => (a.read ? 1 : 0) - (b.read ? 1 : 0))

  const grouped = groupByDate(filtered)
  const unreadCount = notifications.filter(n => !n.read).length
  const hasFilters = filter !== 'all' || search

  const handleSelect = (n) => {
    setSelected(s => s?._id === n._id ? null : n)
    if (!n.read) dispatch(markNotificationRead(n._id))
  }
  const handleRead   = (id) => dispatch(markNotificationRead(id))
  const handleDelete = (id) => { dispatch(removeNotification(id)); if (selected?._id === id) setSelected(null) }
  const handleNavigate = (n) => {
    if (n.payload?.projectId && n.payload?.taskId)
      navigate(`/projects/${n.payload.projectId}?task=${n.payload.taskId}`)
  }

  return (
    <div className="flex h-full overflow-hidden bg-background">

      {/* ─── Left panel — notification list ─── */}
      <div className={cn(
        "shrink-0 flex flex-col border-r border-border/60 overflow-hidden transition-all",
        selected ? "w-[380px]" : "w-[420px]"
      )}>

        {/* Header */}
        <div className="px-5 pt-5 pb-0 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight">Inbox</h1>
              {unreadCount > 0 && (
                <span className="inline-flex items-center h-[22px] px-2 rounded-full text-[11px] font-bold tabular-nums bg-primary/10 text-primary">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-0.5">
              {unreadCount > 0 && (
                <button
                  className="h-7 px-2 rounded-md text-[11px] font-medium flex items-center gap-1.5 text-muted-foreground/60 hover:text-primary hover:bg-primary/5 transition-colors"
                  onClick={() => dispatch(markAllNotificationsRead())}
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                className="h-7 px-2 rounded-md text-[11px] font-medium flex items-center gap-1.5 text-muted-foreground/60 hover:text-foreground hover:bg-muted/40 transition-colors"
                onClick={() => dispatch(fetchNotifications())}
                title="Refresh"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              {notifications.length > 0 && (
                <button
                  className="h-7 px-2 rounded-md text-[11px] font-medium flex items-center gap-1.5 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/5 transition-colors"
                  onClick={() => setConfirmClearAll(true)}
                  title="Clear all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-0 border-b border-border/50 -mx-5 px-5">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-semibold border-b-2 transition-colors -mb-[1px]',
                  tab === t.key
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground/50 hover:text-muted-foreground'
                )}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Toolbar — Filter / Sort / Search */}
        <div className="px-4 py-2 flex items-center gap-1.5 shrink-0 border-b border-border/30">
          {/* Filter */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setShowFilterMenu(p => !p)}
              className={cn(
                'h-7 px-2.5 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-colors',
                showFilterMenu || filter !== 'all'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/40'
              )}
            >
              <Filter className="h-3.5 w-3.5" />
              Filter
              {filter !== 'all' && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
            </button>
            {showFilterMenu && (
              <div className="absolute top-full left-0 mt-1.5 w-48 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 py-1">
                {FILTERS.map(f => (
                  <button
                    key={f.key}
                    onClick={() => { setFilter(f.key); setShowFilterMenu(false) }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-[12px] hover:bg-muted transition-colors flex items-center justify-between',
                      filter === f.key && 'text-primary font-semibold'
                    )}
                  >
                    {f.label}
                    {filter === f.key && <Check className="h-3 w-3" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort */}
          <div className="relative" ref={sortRef}>
            <button
              onClick={() => setShowSortMenu(p => !p)}
              className="h-7 px-2.5 rounded-md text-[11px] font-semibold flex items-center gap-1.5 text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/40 transition-colors"
            >
              <SortAsc className="h-3.5 w-3.5" />
              {sort}
            </button>
            {showSortMenu && (
              <div className="absolute top-full left-0 mt-1.5 w-40 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 py-1">
                {SORT_OPTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => { setSort(s); setShowSortMenu(false) }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-[12px] hover:bg-muted transition-colors flex items-center justify-between',
                      sort === s && 'text-primary font-semibold'
                    )}
                  >
                    {s}
                    {sort === s && <Check className="h-3 w-3" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1" />

          {/* Search toggle */}
          <button
            onClick={() => { setShowSearch(s => !s); if (showSearch) setSearch('') }}
            className={cn(
              'h-7 px-2 rounded-md flex items-center justify-center transition-colors',
              showSearch
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/40'
            )}
          >
            <Search className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Search bar (expandable) */}
        {showSearch && (
          <div className="px-4 py-2 border-b border-border/30 shrink-0">
            <div className="flex items-center gap-2 bg-muted/20 rounded-lg px-3 py-1.5 border border-border/40 focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
              <Search className="h-3 w-3 text-muted-foreground/40 shrink-0" />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search notifications…"
                className="flex-1 text-[12px] bg-transparent outline-none placeholder:text-muted-foreground/40 text-foreground min-w-0"
              />
              {search && (
                <button onClick={() => setSearch('')} className="p-0.5 hover:bg-muted rounded">
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="px-4 py-4 space-y-0">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex gap-3 px-4 py-3">
                  <div className="h-8 w-8 rounded-full skeleton shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3 w-24 rounded" />
                    <div className="skeleton h-3.5 rounded" style={{ width: `${120 + Math.random() * 100}px` }} />
                    <div className="skeleton h-2.5 w-12 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <div className="h-16 w-16 rounded-2xl bg-muted/30 flex items-center justify-center">
                {search ? <Search className="h-7 w-7 opacity-15" /> : <Inbox className="h-7 w-7 opacity-15" />}
              </div>
              <p className="text-[13px] font-semibold text-foreground/40">
                {search ? 'No results found' : tab === 'archive' ? 'Nothing archived' : "You're all caught up!"}
              </p>
              <p className="text-[11px] text-muted-foreground/30">
                {search ? 'Try a different search term' : 'New notifications will appear here'}
              </p>
            </div>
          ) : (
            Object.entries(grouped).map(([group, items]) =>
              items.length === 0 ? null : (
                <div key={group}>
                  {/* Date group header */}
                  <div className="px-4 py-2 flex items-center gap-2 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
                    <span className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-wider">{group}</span>
                    <div className="flex-1 h-px bg-border/20" />
                    <span className="text-[10px] text-muted-foreground/30 tabular-nums">{items.length}</span>
                  </div>
                  {items.map((n, i) => (
                    <NotifItem
                      key={n._id}
                      n={n}
                      selected={selected?._id === n._id}
                      onSelect={handleSelect}
                      onRead={handleRead}
                      onDelete={handleDelete}
                      animIdx={i}
                    />
                  ))}
                </div>
              )
            )
          )}
        </div>
      </div>

      {/* ─── Right detail pane ─── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DetailPane
          n={selected}
          onRead={handleRead}
          onDelete={handleDelete}
          onNavigate={handleNavigate}
        />
      </div>

      {/* Confirm clear all */}
      <ConfirmDialog
        open={confirmClearAll}
        onConfirm={() => { dispatch(clearAllNotifications()); setConfirmClearAll(false); setSelected(null) }}
        onCancel={() => setConfirmClearAll(false)}
        title="Clear all notifications?"
        description="This will permanently remove all your notifications. This cannot be undone."
        confirmLabel="Clear all"
      />
    </div>
  )
}
