import { useState } from 'react'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { cn, getInitials } from '../../lib/utils'

/**
 * Stacked online presence avatars with green status dot.
 * Each avatar shows a tooltip with the user's name on hover.
 */
export default function OnlineAvatars({ users = [], max = 5, size = 'sm' }) {
  if (!users.length) return null

  const shown = users.slice(0, max)
  const overflow = users.length - max

  const dim = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8'
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs'
  const dotSize = size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5'

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {shown.map((u, i) => (
          <OnlineAvatar key={u.userId} u={u} dim={dim} textSize={textSize} dotSize={dotSize} zIndex={shown.length - i} />
        ))}
        {overflow > 0 && (
          <div
            className={cn(
              dim,
              'rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-semibold text-muted-foreground relative z-0'
            )}
          >
            +{overflow}
          </div>
        )}
      </div>
      {users.length === 1 && (
        <span className="ml-2 text-xs text-muted-foreground hidden sm:block">
          {users[0].displayName || users[0].email?.split('@')[0]} is here
        </span>
      )}
      {users.length > 1 && (
        <span className="ml-2 text-xs text-muted-foreground hidden sm:block">
          {users.length} online
        </span>
      )}
    </div>
  )
}

function OnlineAvatar({ u, dim, textSize, dotSize, zIndex }) {
  const [showTip, setShowTip] = useState(false)
  const name = u.displayName || u.email?.split('@')[0] || '?'

  return (
    <div
      className="relative overflow-visible"
      style={{ zIndex }}
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      <Avatar className={cn(dim, 'ring-2 ring-background transition-transform hover:scale-110 hover:z-50 cursor-default')}>
        <AvatarFallback
          style={{ backgroundColor: u.avatarColor || '#6366f1' }}
          className={cn('text-white font-semibold', textSize)}
        >
          {getInitials(u.displayName, u.email)}
        </AvatarFallback>
      </Avatar>

      {/* Green online dot — outside avatar edge */}
      <span className={cn(
        dotSize,
        'absolute -bottom-0.5 -right-0.5 rounded-full bg-green-500 ring-2 ring-background block'
      )} />

      {/* Tooltip */}
      {showTip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-100">
          <div className="bg-popover border border-border rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap">
            <p className="text-xs font-semibold">{name}</p>
            {u.email && <p className="text-[10px] text-muted-foreground">{u.email}</p>}
            <p className="text-[10px] text-green-500 font-medium mt-0.5">● Online now</p>
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-border" />
        </div>
      )}
    </div>
  )
}
