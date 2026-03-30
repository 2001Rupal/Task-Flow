import { useState, useEffect, useRef, useCallback } from 'react'
import { useSelector } from 'react-redux'
import * as commentsApi from '../../api/comments'
import * as socketClient from '../../api/socketClient'
import { getProjectMembers } from '../../api/projects'
import { downloadAttachmentAuth, fetchAttachmentBlobUrl } from '../../api/tasks'
import { Button } from '../../components/ui/button'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import {
  Loader2, Send, Pencil, Trash2, Paperclip, X,
  Download, ZoomIn, AtSign, Pin, PinOff, CornerDownRight,
  CheckCheck, ExternalLink
} from 'lucide-react'
import { formatDate, getInitials, cn } from '../../lib/utils'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import toast from 'react-hot-toast'

const REACTIONS = ['👍', '❤️', '😄', '🎉', '👀']
const TYPING_DEBOUNCE = 2500 // ms before sending typing:false

// ── Comment text with @mention highlights ─────
function CommentText({ text }) {
  if (!text) return null
  const parts = text.split(/(@\S+)/g)
  return (
    <p className="text-xs whitespace-pre-wrap leading-relaxed">
      {parts.map((part, i) =>
        part.startsWith('@')
          ? <span key={i} className="text-violet-500 font-medium">{part}</span>
          : part
      )}
    </p>
  )
}

// ── Inline image ──────────────────────────────
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
    <div className="h-24 w-full rounded-md bg-muted flex items-center justify-center">
      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin" />
    </div>
  )
  return (
    <div className="relative group cursor-pointer rounded-md overflow-hidden border border-border" onClick={onExpand}>
      <img src={url} alt={attachment.originalName} className="max-h-48 w-full object-cover" />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
        <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  )
}

// ── Image lightbox ────────────────────────────
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

// ── @Mention dropdown ─────────────────────────
function MentionDropdown({ members, query, onSelect, selectedIdx }) {
  const filtered = members.filter(m =>
    (m.displayName || m.email || '').toLowerCase().includes(query.toLowerCase())
  ).slice(0, 6)
  if (!filtered.length) return null
  return (
    <div className="absolute bottom-full left-0 mb-1 w-56 bg-popover border border-border rounded-lg shadow-lg z-30 overflow-hidden">
      {filtered.map((m, i) => (
        <button
          key={m.userId || m.email}
          type="button"
          className={cn('flex items-center gap-2.5 w-full px-3 py-2 text-xs hover:bg-muted transition-colors', i === selectedIdx && 'bg-muted')}
          onMouseDown={e => { e.preventDefault(); onSelect(m) }}
        >
          <Avatar className="h-5 w-5 shrink-0">
            <AvatarFallback style={{ backgroundColor: m.avatarColor || '#6366f1' }} className="text-[9px] text-white">
              {getInitials(m.displayName, m.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 text-left">
            <p className="font-medium truncate">{m.displayName || m.email?.split('@')[0]}</p>
            {m.displayName && <p className="text-[10px] text-muted-foreground truncate">{m.email}</p>}
          </div>
        </button>
      ))}
    </div>
  )
}

// ── Hover reaction picker + counts ───────────
function ReactionBar({ comment, currentUserId, onUpdate }) {
  const [reactions, setReactions] = useState(comment.reactions || [])
  const [hovered, setHovered] = useState(false)
  const [pending, setPending] = useState(null)
  const hideTimer = useRef(null)

  useEffect(() => { setReactions(comment.reactions || []) }, [comment.reactions])

  const toggle = async (emoji) => {
    if (pending) return
    setPending(emoji)
    setHovered(false)
    setReactions(prev => {
      const bucket = prev.find(r => r.emoji === emoji)
      if (!bucket) return [...prev, { emoji, userIds: [currentUserId] }]
      const already = bucket.userIds.map(String).includes(String(currentUserId))
      return prev
        .map(r => r.emoji === emoji
          ? { ...r, userIds: already ? r.userIds.filter(u => String(u) !== String(currentUserId)) : [...r.userIds, currentUserId] }
          : r
        ).filter(r => r.userIds.length > 0)
    })
    try {
      const { data } = await commentsApi.toggleReaction(comment._id, emoji)
      setReactions(data.reactions)
      onUpdate?.(comment._id, data.reactions)
    } catch { setReactions(comment.reactions || []) }
    finally { setPending(null) }
  }

  const showPicker = () => { clearTimeout(hideTimer.current); setHovered(true) }
  const hidePicker = () => { hideTimer.current = setTimeout(() => setHovered(false), 200) }

  return (
    <div className="relative" onMouseEnter={showPicker} onMouseLeave={hidePicker}>
      {/* Floating emoji picker — appears on hover */}
      {hovered && (
        <div
          onMouseEnter={showPicker}
          onMouseLeave={hidePicker}
          className="absolute bottom-full left-0 mb-1.5 flex items-center gap-0.5 bg-popover border border-border rounded-full px-2 py-1.5 shadow-lg z-50 animate-in zoom-in-90 slide-in-from-bottom-1 duration-150"
        >
          {REACTIONS.map(e => (
            <button
              key={e}
              onClick={() => toggle(e)}
              className="text-base leading-none hover:scale-125 transition-transform p-0.5 rounded-full hover:bg-muted"
              title={e}
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Existing reaction counts */}
      <div className="flex items-center gap-1 mt-1.5 flex-wrap min-h-[20px]">
        {reactions.map(({ emoji, userIds }) => {
          const mine = userIds.map(String).includes(String(currentUserId))
          return (
            <button key={emoji} onClick={() => toggle(emoji)} disabled={!!pending}
              title={`${userIds.length} reaction${userIds.length !== 1 ? 's' : ''}`}
              className={cn(
                'flex items-center gap-1 text-[11px] rounded-full px-2 py-0.5 border transition-all select-none',
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

// ── Read receipts ─────────────────────────────
function SeenBy({ seenBy, currentUserId }) {
  const others = (seenBy || []).filter(u => String(u._id || u) !== String(currentUserId))
  if (!others.length) return null
  const shown = others.slice(0, 4)
  const extra = others.length - shown.length
  return (
    <div className="flex items-center gap-1 mt-1" title={others.map(u => u.displayName || u.email || '').join(', ')}>
      <CheckCheck className="h-3 w-3 text-primary/60 shrink-0" />
      <div className="flex -space-x-1">
        {shown.map((u, i) => (
          <Avatar key={i} className="h-3.5 w-3.5 ring-1 ring-background">
            <AvatarFallback style={{ backgroundColor: u.avatarColor || '#6366f1' }} className="text-[6px] text-white">
              {getInitials(u.displayName, u.email)}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
      {extra > 0 && <span className="text-[9px] text-muted-foreground">+{extra}</span>}
    </div>
  )
}

// ── Compose box (shared for new comment + replies) ──
function ComposeBox({ placeholder, onSubmit, submitting, members, autoFocus = false, onTyping }) {
  const [text, setText] = useState('')
  const [mentionQuery, setMentionQuery] = useState(null)
  const [mentionIdx, setMentionIdx] = useState(0)
  const textareaRef = useRef(null)
  const typingTimer = useRef(null)
  const isTyping = useRef(false)

  useEffect(() => { if (autoFocus) textareaRef.current?.focus() }, [autoFocus])

  const fireTyping = (val) => {
    if (!onTyping) return
    if (val && !isTyping.current) { isTyping.current = true; onTyping(true) }
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => { isTyping.current = false; onTyping(false) }, TYPING_DEBOUNCE)
  }

  const handleChange = (e) => {
    const val = e.target.value
    setText(val)
    fireTyping(val)
    const pos = e.target.selectionStart
    const before = val.slice(0, pos)
    const match = before.match(/@(\w*)$/)
    if (match) { setMentionQuery(match[1]); setMentionIdx(0) } else setMentionQuery(null)
  }

  const insertMention = useCallback((member) => {
    const name = member.displayName || member.email?.split('@')[0] || 'user'
    const pos = textareaRef.current?.selectionStart ?? text.length
    const before = text.slice(0, pos)
    const after = text.slice(pos)
    const replaced = before.replace(/@(\w*)$/, `@${name} `)
    setText(replaced + after)
    setMentionQuery(null)
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(replaced.length, replaced.length)
      }
    }, 0)
  }, [text])

  const handleKeyDown = (e) => {
    if (mentionQuery !== null) {
      const filtered = members.filter(m => (m.displayName || m.email || '').toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 6)
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIdx(i => Math.min(i + 1, filtered.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setMentionIdx(i => Math.max(i - 1, 0)) }
      if ((e.key === 'Enter' || e.key === 'Tab') && filtered[mentionIdx]) { e.preventDefault(); insertMention(filtered[mentionIdx]); return }
      if (e.key === 'Escape') { setMentionQuery(null); return }
    }
    if (e.key === 'Enter' && !e.shiftKey && mentionQuery === null) { e.preventDefault(); handleSubmit() }
  }

  const handleSubmit = async () => {
    if (!text.trim()) return
    const ok = await onSubmit(text.trim())
    if (ok !== false) { setText(''); if (onTyping) { clearTimeout(typingTimer.current); isTyping.current = false; onTyping(false) } }
  }

  return (
    <div className="relative">
      {mentionQuery !== null && (
        <MentionDropdown members={members} query={mentionQuery} onSelect={insertMention} selectedIdx={mentionIdx} />
      )}
      <div className="border border-border rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-ring">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={2}
          className="w-full text-xs bg-transparent px-3 py-2.5 resize-none outline-none placeholder:text-muted-foreground"
        />
        <div className="flex items-center justify-between px-2 py-1.5 border-t border-border bg-muted/20">
          <span className="text-[10px] text-muted-foreground/50">↵ send · Shift+↵ newline</span>
          <Button size="sm" className="h-6 text-xs px-3 gap-1" onClick={handleSubmit} disabled={submitting || !text.trim()}>
            {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Single comment row ────────────────────────
function CommentRow({ c, currentUserId, isViewer, canPin, onEdit, onDelete, onPin, onReply, onReactionsUpdate, onSeenUpdate, replies = [] }) {
  const [showReply, setShowReply] = useState(false)
  const [replySubmitting, setReplySubmitting] = useState(false)
  const [lightboxAtt, setLightboxAtt] = useState(null)

  const handleReply = async (text) => {
    setReplySubmitting(true)
    try {
      await onReply(c._id, text)
      setShowReply(false)
      return true
    } catch { return false }
    finally { setReplySubmitting(false) }
  }

  return (
    <div className={cn('group', c.pinned && 'bg-amber-50/50 dark:bg-amber-900/10 rounded-lg px-2 -mx-2')}>
      {c.pinned && (
        <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium mb-1">
          <Pin className="h-2.5 w-2.5" /> Pinned
        </div>
      )}

      <div className="flex gap-2.5">
        <Avatar className="h-7 w-7 shrink-0 mt-0.5">
          <AvatarFallback style={{ backgroundColor: c.userId?.avatarColor || '#6366f1' }} className="text-[10px] text-white">
            {getInitials(c.userId?.displayName, c.userId?.email)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold">{c.userId?.displayName || c.userId?.email?.split('@')[0]}</span>
            <span className="text-[10px] text-muted-foreground">{formatDate(c.createdAt)}</span>
            {c.editedAt && <span className="text-[10px] text-muted-foreground italic">(edited)</span>}
          </div>

          {/* Bubble + hover reaction trigger */}
          <div className="relative group/bubble">
            <CommentText text={c.text} />

            {/* Attachments */}
            {c.attachments?.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {c.attachments.map((att, i) => {
                  if (att.mimetype?.startsWith('image/')) {
                    return <InlineImage key={i} attachment={att} onExpand={() => setLightboxAtt(att)} />
                  }
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 max-w-[280px] px-2.5 py-1.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors text-xs group/att cursor-pointer"
                      onClick={async () => {
                        try {
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

            {/* Reactions — hover on bubble to reveal picker */}
            <ReactionBar comment={c} currentUserId={currentUserId} onUpdate={onReactionsUpdate} />
          </div>

          {/* Read receipts */}
          <SeenBy seenBy={c.seenBy} currentUserId={currentUserId} />
          {/* Reply toggle */}
          {!isViewer && !c.parentId && (
            <button
              onClick={() => setShowReply(p => !p)}
              className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <CornerDownRight className="h-3 w-3" />
              {showReply ? 'Cancel' : replies.length > 0 ? `${replies.length} repl${replies.length === 1 ? 'y' : 'ies'}` : 'Reply'}
            </button>
          )}

          {/* Inline replies */}
          {replies.length > 0 && (
            <div className="mt-2 ml-3 pl-3 border-l-2 border-border space-y-3">
              {replies.map(r => (
                <div key={r._id} className="flex gap-2 group/reply">
                  <Avatar className="h-5 w-5 shrink-0 mt-0.5">
                    <AvatarFallback style={{ backgroundColor: r.userId?.avatarColor || '#6366f1' }} className="text-[8px] text-white">
                      {getInitials(r.userId?.displayName, r.userId?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[11px] font-semibold">{r.userId?.displayName || r.userId?.email?.split('@')[0]}</span>
                      <span className="text-[10px] text-muted-foreground">{formatDate(r.createdAt)}</span>
                    </div>
                    <CommentText text={r.text} />
                    <ReactionBar comment={r} currentUserId={currentUserId} onUpdate={onReactionsUpdate} />
                    <SeenBy seenBy={r.seenBy} currentUserId={currentUserId} />
                  </div>
                  {r.userId?._id === currentUserId && !isViewer && (
                    <button onClick={() => onDelete(r._id)}
                      className="opacity-0 group-hover/reply:opacity-100 transition-opacity h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Reply compose */}
          {showReply && (
            <div className="mt-2 ml-3 pl-3 border-l-2 border-primary/30">
              <ComposeBox
                placeholder={`Reply to ${c.userId?.displayName || 'comment'}…`}
                onSubmit={handleReply}
                submitting={replySubmitting}
                members={[]}
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity mt-0.5">
          {canPin && (
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-amber-500" onClick={() => onPin(c._id)} title={c.pinned ? 'Unpin' : 'Pin'}>
              {c.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
            </Button>
          )}
          {c.userId?._id === currentUserId && !isViewer && (
            <>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => onEdit(c)} title="Edit">
                <Pencil className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => onDelete(c._id)} title="Delete">
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>

      {lightboxAtt && <ImageLightbox attachment={lightboxAtt} onClose={() => setLightboxAtt(null)} />}
    </div>
  )
}

// ── Main component ────────────────────────────
export default function CommentsTab({ taskId, projectId, isViewer }) {
  const { user } = useSelector(s => s.auth)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [members, setMembers] = useState([])
  const [typers, setTypers] = useState([])   // [{userId, displayName, avatarColor}]
  const [lightboxAtt, setLightboxAtt] = useState(null)
  const fileInputRef = useRef(null)
  const [pendingFiles, setPendingFiles] = useState([])
  const bottomRef = useRef(null)
  const seenTimer = useRef(null)

  // ── Load ──────────────────────────────────────
  useEffect(() => {
    commentsApi.getComments(taskId)
      .then(({ data }) => setComments(data.comments || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [taskId])

  useEffect(() => {
    if (!projectId) return
    getProjectMembers(projectId)
      .then(({ data }) => setMembers(data.collaborators || []))
      .catch(() => {})
  }, [projectId])

  // ── Mark seen after 1.5s of viewing ──────────
  useEffect(() => {
    if (loading) return
    seenTimer.current = setTimeout(() => {
      commentsApi.markSeen(taskId).catch(() => {})
    }, 1500)
    return () => clearTimeout(seenTimer.current)
  }, [taskId, loading])

  // ── Socket listeners ──────────────────────────
  useEffect(() => {
    if (!projectId) return
    socketClient.joinProject(projectId)

    const onReaction = ({ commentId, reactions }) =>
      setComments(prev => prev.map(c => c._id === commentId ? { ...c, reactions } : c))

    const onPinned = ({ commentId, pinned }) =>
      setComments(prev => prev.map(c => c._id === commentId ? { ...c, pinned } : c))

    const onNew = ({ comment }) => {
      setComments(prev => {
        if (prev.find(c => c._id === comment._id)) return prev
        return [...prev, comment]
      })
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }

    const onSeen = ({ todoId: tid, userId }) => {
      if (tid !== taskId) return
      setComments(prev => prev.map(c => {
        const already = (c.seenBy || []).some(u => String(u._id || u) === String(userId))
        if (already) return c
        return { ...c, seenBy: [...(c.seenBy || []), { _id: userId }] }
      }))
    }

    const onTyping = ({ todoId: tid, userId, displayName, avatarColor, typing }) => {
      if (tid !== taskId || userId === user?.userId) return
      setTypers(prev => {
        const filtered = prev.filter(t => t.userId !== userId)
        return typing ? [...filtered, { userId, displayName, avatarColor }] : filtered
      })
    }

    socketClient.on('comment:reaction', onReaction)
    socketClient.on('comment:pinned',   onPinned)
    socketClient.on('comment:new',      onNew)
    socketClient.on('comment:seen',     onSeen)
    socketClient.on('comment:typing',   onTyping)

    return () => {
      socketClient.off('comment:reaction', onReaction)
      socketClient.off('comment:pinned',   onPinned)
      socketClient.off('comment:new',      onNew)
      socketClient.off('comment:seen',     onSeen)
      socketClient.off('comment:typing',   onTyping)
    }
  }, [projectId, taskId, user?.userId])

  // ── Handlers ──────────────────────────────────
  const handleSubmit = async (text) => {
    if (!text.trim() && pendingFiles.length === 0) return false
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('text', text.trim())
      pendingFiles.forEach(f => formData.append('attachments', f))
      await commentsApi.createComment(taskId, formData)
      // Don't push to state — socket 'comment:new' handles it for everyone including the sender
      setPendingFiles([])
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      return true
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post comment')
      return false
    } finally { setSubmitting(false) }
  }

  const handleReply = async (parentId, text) => {
    await commentsApi.addReply(parentId, text)
    // Don't push to state here — the socket 'comment:new' event handles it for everyone including the sender
  }

  const handlePin = async (id) => {
    try {
      const { data } = await commentsApi.pinComment(id)
      // Update state from API response directly (socket handles other users)
      setComments(prev => prev.map(c => c._id === id ? { ...c, pinned: data.pinned, pinnedAt: data.pinned ? new Date() : null } : c))
    } catch { toast.error('Failed to pin comment') }
  }

  const handleDelete = async (id) => {
    try {
      await commentsApi.deleteComment(id)
      setComments(prev => prev.filter(c => c._id !== id))
      setConfirmDeleteId(null)
    } catch { toast.error('Failed to delete comment') }
  }

  const saveEdit = async (id) => {
    if (!editText.trim()) return
    try {
      const { data } = await commentsApi.updateComment(id, { text: editText.trim() })
      setComments(prev => prev.map(c => c._id === id ? data.comment : c))
      setEditingId(null)
    } catch { toast.error('Failed to update comment') }
  }

  const handleTyping = useCallback((typing) => {
    commentsApi.sendTyping(taskId, typing).catch(() => {})
  }, [taskId])

  const handleReactionsUpdate = (id, reactions) =>
    setComments(prev => prev.map(c => c._id === id ? { ...c, reactions } : c))

  // ── Separate top-level vs replies ─────────────
  const topLevel = comments.filter(c => !c.parentId)
  const pinnedFirst = [...topLevel].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
  const repliesFor = (id) => comments.filter(c => String(c.parentId) === String(id))
  const canPin = !isViewer

  if (loading) return (
    <div className="py-6 flex justify-center">
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    </div>
  )

  return (
    <div className="space-y-4 mt-2">

      {/* Comment list */}
      {pinnedFirst.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {pinnedFirst.map(c => (
            editingId === c._id ? (
              <div key={c._id} className="space-y-1.5 pl-9">
                <textarea autoFocus value={editText} onChange={e => setEditText(e.target.value)} rows={2}
                  className="w-full text-xs rounded-md border border-input bg-transparent px-2.5 py-1.5 resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <div className="flex gap-1.5">
                  <Button size="sm" className="h-6 text-xs px-2" onClick={() => saveEdit(c._id)}>Save</Button>
                  <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setEditingId(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <CommentRow
                key={c._id}
                c={c}
                currentUserId={user?.userId}
                isViewer={isViewer}
                canPin={canPin}
                replies={repliesFor(c._id)}
                onEdit={(cm) => { setEditingId(cm._id); setEditText(cm.text || '') }}
                onDelete={(id) => setConfirmDeleteId(id)}
                onPin={handlePin}
                onReply={handleReply}
                onReactionsUpdate={handleReactionsUpdate}
              />
            )
          ))}
        </div>
      )}

      {/* Typing indicator */}
      {typers.length > 0 && (
        <div className="flex items-center gap-2 pl-1">
          <div className="flex -space-x-1">
            {typers.slice(0, 3).map(t => (
              <Avatar key={t.userId} className="h-4 w-4 ring-1 ring-background">
                <AvatarFallback style={{ backgroundColor: t.avatarColor || '#6366f1' }} className="text-[7px] text-white">
                  {(t.displayName || '?')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <span>{typers.map(t => t.displayName).join(', ')} {typers.length === 1 ? 'is' : 'are'} typing</span>
            <span className="flex gap-0.5">
              {[0,1,2].map(i => (
                <span key={i} className="h-1 w-1 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />

      {/* Compose */}
      {!isViewer && (
        <div className="relative">
          {pendingFiles.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {pendingFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-1 bg-muted rounded-full px-2 py-0.5 text-[10px]">
                  <Paperclip className="h-2.5 w-2.5 text-muted-foreground" />
                  <span className="max-w-[100px] truncate">{f.name}</span>
                  <button type="button" onClick={() => setPendingFiles(p => p.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-foreground ml-0.5">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <ComposeBox
            placeholder="Write a comment… type @ to mention"
            onSubmit={handleSubmit}
            submitting={submitting}
            members={members}
            onTyping={handleTyping}
          />
          <div className="flex items-center gap-1 mt-1.5">
            <input ref={fileInputRef} type="file" className="hidden" multiple
              accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.docx,.xlsx,.zip"
              onChange={e => { setPendingFiles(p => [...p, ...Array.from(e.target.files || [])].slice(0, 3)); e.target.value = '' }}
            />
            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground"
              title="Attach file" onClick={() => fileInputRef.current?.click()} disabled={pendingFiles.length >= 3}
            >
              <Paperclip className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {lightboxAtt && <ImageLightbox attachment={lightboxAtt} onClose={() => setLightboxAtt(null)} />}

      <ConfirmDialog
        open={!!confirmDeleteId}
        onConfirm={() => handleDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
        title="Delete comment?"
        description="This comment will be permanently removed."
        confirmLabel="Delete"
      />
    </div>
  )
}
