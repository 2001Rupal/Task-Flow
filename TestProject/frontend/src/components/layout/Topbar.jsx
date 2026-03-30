import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Sun, Moon, Search, LogOut, User } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback } from '../ui/avatar'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator
} from '../ui/dropdown-menu'
import { logout } from '../../features/auth/authSlice'
import NotificationBell from '../../features/notifications/NotificationBell'
import { getInitials } from '../../lib/utils'

export default function Topbar({ onSearchOpen }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector(s => s.auth)
  const { theme, toggle } = useTheme()

  return (
    <header className="h-11 border-b border-border bg-background/95 backdrop-blur-sm flex items-center px-3 shrink-0 z-30">

      {/* Left spacer */}
      <div className="flex-1" />

      {/* Center — search pill */}
      <button
        onClick={onSearchOpen}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted hover:border-border transition-all duration-150 w-72 text-[13px] group"
      >
        <Search className="h-3.5 w-3.5 shrink-0 opacity-50 group-hover:opacity-80 transition-opacity" />
        <span className="flex-1 text-left">Search tasks, projects, people…</span>
        <kbd className="text-[10px] bg-background border border-border/60 rounded px-1.5 py-0.5 font-mono opacity-50">⌘K</kbd>
      </button>

      {/* Right spacer + actions */}
      <div className="flex-1 flex items-center justify-end gap-0.5">
        <Button
          variant="ghost" size="icon"
          onClick={toggle}
          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark'
            ? <Sun className="h-4 w-4" />
            : <Moon className="h-4 w-4" />
          }
        </Button>

        <NotificationBell />

        {/* User avatar with online dot */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 overflow-visible">
              <Avatar className="h-7 w-7 ring-2 ring-background hover:ring-primary/40 transition-all duration-150">
                <AvatarFallback
                  style={{ backgroundColor: user?.avatarColor || '#5b5ef4' }}
                  className="text-white text-[11px] font-semibold"
                >
                  {getInitials(user?.displayName, user?.email)}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background block" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 mt-1.5">
            <DropdownMenuLabel className="font-normal py-2.5 px-3">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-8 w-8">
                  <AvatarFallback
                    style={{ backgroundColor: user?.avatarColor || '#5b5ef4' }}
                    className="text-white text-xs font-semibold"
                  >
                    {getInitials(user?.displayName, user?.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{user?.displayName || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')} className="gap-2 cursor-pointer">
              <User className="h-4 w-4" /> Profile & settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => { dispatch(logout()); navigate('/login') }}
              className="gap-2 text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
