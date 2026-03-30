import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  LayoutDashboard, CheckSquare, Bell, Settings, Plus,
  ChevronDown, ChevronRight, BarChart2, Briefcase,
  Users, LogOut, User, Moon, Sun, MoreHorizontal,
  PanelLeftClose, PanelLeftOpen, FileText,
} from 'lucide-react'
import { cn, getInitials } from '../../lib/utils'
import WorkspaceSwitcher from './WorkspaceSwitcher'
import { logout } from '../../features/auth/authSlice'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel
} from '../ui/dropdown-menu'
import { Avatar, AvatarFallback } from '../ui/avatar'

// ── Nav item ──────────────────────────────────
function NavItem({ to, icon: Icon, label, badge, indent = false, collapsed = false }) {
  return (
    <NavLink
      to={to}
      end
      title={collapsed ? label : undefined}
      className={({ isActive }) => cn(
        'relative flex items-center gap-2 rounded-md text-[13px] font-medium transition-colors duration-150 select-none group/nav',
        collapsed ? 'px-0 py-1.5 justify-center' : 'px-2.5 py-1',
        indent && !collapsed ? 'pl-7' : '',
        isActive
          ? 'bg-white/10 text-white'
          : 'text-sidebar-foreground/55 hover:bg-white/6 hover:text-sidebar-foreground'
      )}
    >
      {({ isActive }) => (
        <>
          {isActive && !collapsed && (
            <span className="absolute left-0 inset-y-1 w-[3px] rounded-r-full bg-white/60" />
          )}
          {isActive && collapsed && (
            <span className="absolute left-0 inset-y-2 w-[3px] rounded-r-full bg-white/60" />
          )}
          <Icon className={cn(
            'shrink-0 transition-colors',
            collapsed ? 'h-[16px] w-[16px]' : 'h-[14px] w-[14px]',
            isActive ? 'text-white' : 'text-sidebar-foreground/40 group-hover/nav:text-sidebar-foreground/70'
          )} />
          {!collapsed && <span className="flex-1 truncate">{label}</span>}
          {!collapsed && badge > 0 && (
            <span className={cn(
              'shrink-0 rounded-full text-[10px] font-bold w-[18px] h-[18px] flex items-center justify-center',
              isActive ? 'bg-white text-sidebar' : 'bg-white/15 text-white/80'
            )}>
              {badge > 99 ? '99+' : badge}
            </span>
          )}
          {collapsed && badge > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
          )}
        </>
      )}
    </NavLink>
  )
}

// ── Section label ─────────────────────────────
function SectionLabel({ label, open, onToggle, onAdd, collapsed }) {
  if (collapsed) return <div className="mx-3 my-1.5 border-t border-sidebar-border/30" />
  return (
    <div className="flex items-center px-2 py-1 mt-2 group/sec">
      <button
        onClick={onToggle}
        className="flex items-center gap-1 flex-1 min-w-0 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30 hover:text-sidebar-foreground/60 transition-colors"
      >
        {open
          ? <ChevronDown className="h-2.5 w-2.5 shrink-0" />
          : <ChevronRight className="h-2.5 w-2.5 shrink-0" />
        }
        <span className="truncate ml-0.5">{label}</span>
      </button>
      {onAdd && (
        <button
          onClick={onAdd}
          className="shrink-0 h-5 w-5 rounded flex items-center justify-center text-sidebar-foreground/25 hover:text-sidebar-foreground/70 hover:bg-white/5 transition-colors opacity-0 group-hover/sec:opacity-100"
          title="New project"
        >
          <Plus className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

// ── Project item ──────────────────────────────
function ProjectItem({ project, onSettings, collapsed }) {
  return (
    <NavLink
      to={`/projects/${project._id}`}
      title={collapsed ? project.name : undefined}
      className={({ isActive }) => cn(
        'group/proj relative flex items-center gap-2 rounded-md text-[13px] transition-colors duration-150 select-none',
        collapsed ? 'px-0 py-1.5 justify-center' : 'px-2.5 py-1',
        isActive
          ? 'bg-white/10 text-white font-medium'
          : 'text-sidebar-foreground/55 hover:bg-white/6 hover:text-sidebar-foreground'
      )}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className={cn('absolute left-0 w-[3px] rounded-r-full bg-white/60', collapsed ? 'inset-y-2' : 'inset-y-1')} />
          )}
          <span
            className="shrink-0 h-4 w-4 rounded-[4px] text-white text-[9px] font-bold flex items-center justify-center shadow-sm"
            style={{ backgroundColor: project.color || '#5b5ef4' }}
          >
            {project.icon && project.icon !== '📋'
              ? project.icon
              : project.name.slice(0, 1).toUpperCase()
            }
          </span>
          {!collapsed && (
            <>
              <span className="flex-1 truncate text-[13px]">{project.name}</span>
              <button
                onClick={e => { e.preventDefault(); e.stopPropagation(); onSettings(project._id) }}
                className="shrink-0 h-5 w-5 rounded flex items-center justify-center text-sidebar-foreground/25 hover:text-sidebar-foreground/70 hover:bg-white/10 transition-all opacity-0 group-hover/proj:opacity-100"
                title="Settings"
              >
                <MoreHorizontal className="h-3 w-3" />
              </button>
            </>
          )}
        </>
      )}
    </NavLink>
  )
}

// ── Main Sidebar ──────────────────────────────
export default function Sidebar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { list: projects } = useSelector(s => s.projects)
  const { unreadCount } = useSelector(s => s.notifications)
  const { user } = useSelector(s => s.auth)
  const [projectsOpen, setProjectsOpen] = useState(true)
  const [reportingOpen, setReportingOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [theme, setTheme] = useState(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  )

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.classList.toggle('dark', next === 'dark')
    setTheme(next)
  }

  const w = collapsed ? '56px' : '240px'

  return (
    <aside
      style={{ width: w, minWidth: w, maxWidth: w }}
      className="flex flex-col h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border shrink-0 select-none transition-all duration-200"
    >
      {/* Workspace + collapse toggle */}
      <div className={cn(
        'flex items-center border-b border-sidebar-border shrink-0',
        collapsed ? 'px-2 py-3 justify-center' : 'px-3 pt-3 pb-2.5 gap-2'
      )}>
        {!collapsed && <div className="flex-1 min-w-0"><WorkspaceSwitcher /></div>}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="shrink-0 h-6 w-6 rounded-md flex items-center justify-center text-sidebar-foreground/30 hover:text-sidebar-foreground/70 hover:bg-white/5 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <PanelLeftOpen className="h-3.5 w-3.5" />
            : <PanelLeftClose className="h-3.5 w-3.5" />
          }
        </button>
      </div>

      {/* Nav */}
      <div className={cn(
        'flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-2',
        collapsed ? 'px-1.5' : 'px-2'
      )}>

        {/* Main nav */}
        <div className="space-y-0.5">
          <NavItem to="/dashboard"     icon={LayoutDashboard} label="Home"     collapsed={collapsed} />
          <NavItem to="/my-work"       icon={CheckSquare}     label="My tasks" collapsed={collapsed} />
          <NavItem to="/notifications" icon={Bell}            label="Inbox"    badge={unreadCount} collapsed={collapsed} />
          <NavItem to="/files"         icon={FileText}        label="Files"    collapsed={collapsed} />
        </div>

        {/* Reporting */}
        <SectionLabel label="Reporting" open={reportingOpen} onToggle={() => setReportingOpen(o => !o)} collapsed={collapsed} />
        {(reportingOpen || collapsed) && (
          <div className="space-y-0.5">
            <NavItem to="/portfolio" icon={Briefcase} label="Portfolio" indent={!collapsed} collapsed={collapsed} />
            <NavItem to="/workload"  icon={BarChart2} label="Workload"  indent={!collapsed} collapsed={collapsed} />
          </div>
        )}

        {/* Projects */}
        <SectionLabel label="Projects" open={projectsOpen} onToggle={() => setProjectsOpen(o => !o)} onAdd={collapsed ? undefined : () => navigate('/projects/new')} collapsed={collapsed} />
        {(projectsOpen || collapsed) && (
          <div className="space-y-0.5">
            {projects.length === 0 && !collapsed ? (
              <div className="px-3 py-2">
                <p className="text-xs text-sidebar-foreground/25 italic">No projects yet</p>
                <button
                  onClick={() => navigate('/projects/new')}
                  className="mt-1.5 flex items-center gap-1.5 text-xs text-primary/60 hover:text-primary transition-colors"
                >
                  <Plus className="h-3 w-3" /> Create a project
                </button>
              </div>
            ) : (
              projects.slice(0, 20).map(p => (
                <ProjectItem
                  key={p._id}
                  project={p}
                  collapsed={collapsed}
                  onSettings={(id) => navigate(`/projects/${id}/settings`)}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Bottom */}
      <div className={cn(
        'shrink-0 border-t border-sidebar-border pt-2 pb-3 space-y-0.5',
        collapsed ? 'px-1.5' : 'px-2'
      )}>
        <NavItem to="/people"             icon={Users}    label="People"   collapsed={collapsed} />
        <NavItem to="/workspace/settings" icon={Settings} label="Settings" collapsed={collapsed} />

        {/* User profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              'group w-full flex items-center rounded-lg text-sm text-sidebar-foreground/60 hover:bg-white/5 hover:text-sidebar-foreground transition-colors mt-1',
              collapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-1.5'
            )}>
              <div className="relative shrink-0">
                <Avatar className="h-6 w-6">
                  <AvatarFallback
                    style={{ backgroundColor: user?.avatarColor || '#5b5ef4' }}
                    className="text-white text-[10px] font-bold"
                  >
                    {getInitials(user?.displayName, user?.email)}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 ring-[1.5px] ring-sidebar block" />
              </div>
              {!collapsed && (
                <>
                  <span className="flex-1 truncate text-left text-[13px] font-medium">
                    {user?.displayName || user?.email?.split('@')[0] || 'Me'}
                  </span>
                  <MoreHorizontal className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-50 transition-opacity" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-52 mb-1" side="top" align={collapsed ? 'center' : 'start'} sideOffset={6}>
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-8 w-8">
                  <AvatarFallback
                    style={{ backgroundColor: user?.avatarColor || '#5b5ef4' }}
                    className="text-white text-xs font-bold"
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
              <User className="h-4 w-4" /> My profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleTheme} className="gap-2 cursor-pointer">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => { dispatch(logout()); navigate('/login') }}
              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
