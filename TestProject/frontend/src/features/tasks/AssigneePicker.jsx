import { useState, useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { User, X, Check, Search } from 'lucide-react'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { getInitials, cn } from '../../lib/utils'

/**
 * Asana-style assignee picker.
 * Props:
 *   value    — populated assignedTo object { _id, email, displayName, avatarColor } or null
 *   onChange — (userId | null) => void
 *   disabled — bool
 *   size     — 'sm' | 'md'
 */
export default function AssigneePicker({ value, onChange, disabled, size = 'md' }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)
  const members = useSelector(s => s.projects.currentMembers)

  // Resolve value: accept populated object OR bare { _id } by looking up from members
  const assignedUser = (() => {
    if (!value) return null
    if (value._id && value.email) return value          // already populated
    const found = members.find(m => m.userId?._id === value._id || m.userId?._id === value)
    return found?.userId || null
  })()

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = members.filter(m => {
    const u = m.userId
    if (!u) return false
    const q = search.toLowerCase()
    return (u.displayName || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
  })

  const select = (userId) => {
    onChange(userId)
    setOpen(false)
    setSearch('')
  }

  const avatarCls = size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-7 w-7 text-xs'
  const triggerCls = size === 'sm' ? 'h-6 gap-1 text-xs px-1.5' : 'h-8 gap-1.5 text-sm px-2'

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={cn(
          'flex items-center rounded-md border border-input bg-background hover:bg-muted transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          triggerCls
        )}
      >
        {assignedUser ? (
          <>
            <Avatar className={avatarCls}>
              <AvatarFallback style={{ backgroundColor: assignedUser.avatarColor || '#6366f1' }}>
                {getInitials(assignedUser.displayName, assignedUser.email)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate max-w-[110px]">
              {assignedUser.displayName || assignedUser.email?.split('@')[0]}
            </span>
            {!disabled && (
              <X
                className="h-3 w-3 text-muted-foreground hover:text-foreground ml-auto shrink-0"
                onClick={e => { e.stopPropagation(); onChange(null) }}
              />
            )}
          </>
        ) : (
          <>
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Assign</span>
          </>
        )}
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 w-60 rounded-lg border border-border bg-popover shadow-lg">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search members..."
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Unassign */}
          {assignedUser && (
            <button
              type="button"
              onClick={() => select(null)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Unassign
            </button>
          )}

          {/* Member list */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-xs text-muted-foreground text-center">No members found</p>
            ) : (
              filtered.map(m => {
                const u = m.userId
                const isSelected = assignedUser?._id === u._id
                return (
                  <button
                    key={u._id}
                    type="button"
                    onClick={() => select(u._id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted transition-colors"
                  >
                    <Avatar className="h-6 w-6 text-[10px] shrink-0">
                      <AvatarFallback style={{ backgroundColor: u.avatarColor || '#6366f1' }}>
                        {getInitials(u.displayName, u.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm truncate">{u.displayName || u.email?.split('@')[0]}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
