import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Search, FolderKanban, CheckSquare, X, ChevronRight,
  Users, Bell, Settings, Plus, Hash, Loader2
} from 'lucide-react'
import { cn, getInitials } from '../../lib/utils'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { searchTasks } from '../../api/tasks'

const RECENT_KEY = 'tfp_recent'
const MAX_RECENT = 6

function getRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
}
function addRecent(item) {
  const prev = getRecent().filter(r => r.id !== item.id)
  localStorage.setItem(RECENT_KEY, JSON.stringify([item, ...prev].slice(0, MAX_RECENT)))
}

const CATEGORIES = [
  { id: 'all',      label: 'All' },
  { id: 'tasks',    label: 'Tasks' },
  { id: 'projects', label: 'Projects' },
  { id: 'people',   label: 'People' },
  { id: 'actions',  label: 'Actions' },
]

const QUICK_ACTIONS = [
  { id: 'qa-inbox',    label: 'Go to Inbox',    icon: Bell,        path: '/notifications',      shortcut: 'I' },
  { id: 'qa-mytasks',  label: 'My Tasks',        icon: CheckSquare, path: '/my-work',            shortcut: 'M' },
  { id: 'qa-people',   label: 'People',          icon: Users,       path: '/people',             shortcut: null },
  { id: 'qa-settings', label: 'Settings',        icon: Settings,    path: '/workspace/settings', shortcut: null },
  { id: 'qa-new',      label: 'New project',     icon: Plus,        path: '/projects/new',       shortcut: null },
]

function SectionLabel({ label }) {
  return <p className="px-3 pt-3 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{label}</p>
}

function ResultItem({ icon: Icon, iconBg, label, sub, shortcut, onClick, active, avatarColor }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-colors group',
        active ? 'bg-primary/10 text-primary' : 'hover:bg-muted/60 text-foreground'
      )}
    >
      {avatarColor ? (
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarFallback style={{ backgroundColor: avatarColor }} className="text-white text-[10px] font-bold">
            {label.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center shrink-0', iconBg || 'bg-muted')}>
          {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{label}</p>
        {sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}
      </div>
      {shortcut && (
        <kbd className="text-[10px] bg-muted border border-border rounded px-1.5 py-0.5 font-mono text-muted-foreground shrink-0">{shortcut}</kbd>
      )}
      <ChevronRight className={cn('h-3.5 w-3.5 shrink-0 transition-opacity', active ? 'opacity-60' : 'opacity-0 group-hover:opacity-40')} />
    </button>
  )
}

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [activeIdx, setActiveIdx] = useState(0)
  const [taskResults, setTaskResults] = useState([])
  const [searching, setSearching] = useState(false)
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const { list: projects } = useSelector(s => s.projects)
  const members = useSelector(s => s.workspace?.currentMembers || [])

  useEffect(() => {
    if (!open) { setQuery(''); setCategory('all'); setActiveIdx(0); setTaskResults([]) }
    else setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  // Real API task search
  useEffect(() => {
    if (!query.trim()) { setTaskResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const { data } = await searchTasks(query.trim())
        setTaskResults(data.tasks || [])
      } catch { setTaskResults([]) }
      finally { setSearching(false) }
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  const q = query.toLowerCase().trim()
  const recent = getRecent()

  const filteredProjects = projects.filter(p => !q || p.name.toLowerCase().includes(q)).slice(0, 5)
  const filteredMembers  = members.filter(m => {
    const name = (m.userId?.displayName || m.userId?.email || '').toLowerCase()
    return !q || name.includes(q)
  }).slice(0, 4)
  const filteredActions  = QUICK_ACTIONS.filter(a => !q || a.label.toLowerCase().includes(q))

  // Flat list for keyboard nav
  const allItems = q ? [
    ...(category === 'all' || category === 'tasks'    ? taskResults.map(t => ({ type: 'task',    data: t })) : []),
    ...(category === 'all' || category === 'projects' ? filteredProjects.map(p => ({ type: 'project', data: p })) : []),
    ...(category === 'all' || category === 'people'   ? filteredMembers.map(m => ({ type: 'member',  data: m })) : []),
    ...(category === 'all' || category === 'actions'  ? filteredActions.map(a => ({ type: 'action',  data: a })) : []),
  ] : [
    ...recent.map(r => ({ type: 'recent', data: r })),
    ...QUICK_ACTIONS.map(a => ({ type: 'action', data: a })),
  ]

  const go = useCallback((path, item) => {
    if (item) addRecent(item)
    navigate(path)
    onClose()
  }, [navigate, onClose])

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, allItems.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
      if (e.key === 'Enter' && allItems[activeIdx]) {
        e.preventDefault()
        const item = allItems[activeIdx]
        if (item.type === 'task')    go(`/projects/${item.data.listId?._id || item.data.listId}`, { id: item.data._id, label: item.data.title, type: 'task', path: `/projects/${item.data.listId?._id || item.data.listId}` })
        if (item.type === 'project') go(`/projects/${item.data._id}`, { id: item.data._id, label: item.data.name, type: 'project', path: `/projects/${item.data._id}` })
        if (item.type === 'action' || item.type === 'recent') go(item.data.path, item.data)
        if (item.type === 'member') go('/people', null)
      }
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, allItems, activeIdx, go, onClose])

  useEffect(() => { setActiveIdx(0) }, [query, category])

  if (!open) return null

  let idx = 0
  const gi = () => idx++

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-background border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tasks, projects, people…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query
            ? <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            : <kbd className="text-[10px] bg-muted border border-border rounded px-1.5 py-0.5 font-mono text-muted-foreground">Esc</kbd>
          }
        </div>

        {/* Category tabs */}
        {q && (
          <div className="flex gap-1 px-3 pt-2 pb-1 border-b border-border/50">
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={cn(
                  'text-xs px-3 py-1 rounded-full transition-colors',
                  category === c.id ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {!q && (
            <>
              {recent.length > 0 && (
                <>
                  <SectionLabel label="Recent" />
                  {recent.map(r => {
                    const i = gi()
                    return (
                      <ResultItem key={r.id} icon={r.type === 'project' ? FolderKanban : Hash} iconBg="bg-muted"
                        label={r.label} sub={r.sub} active={activeIdx === i} onClick={() => go(r.path, r)} />
                    )
                  })}
                </>
              )}
              <SectionLabel label="Quick actions" />
              {QUICK_ACTIONS.map(a => {
                const i = gi()
                return (
                  <ResultItem key={a.id} icon={a.icon} iconBg="bg-muted" label={a.label} shortcut={a.shortcut}
                    active={activeIdx === i} onClick={() => go(a.path, a)} />
                )
              })}
            </>
          )}

          {q && (
            <>
              {/* Tasks */}
              {(category === 'all' || category === 'tasks') && (taskResults.length > 0 || searching) && (
                <>
                  <SectionLabel label="Tasks" />
                  {searching && taskResults.length === 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching…
                    </div>
                  )}
                  {taskResults.map(t => {
                    const i = gi()
                    return (
                      <ResultItem key={t._id} icon={CheckSquare} iconBg="bg-blue-100 dark:bg-blue-900/30"
                        label={t.title}
                        sub={`${t.listId?.name || 'Project'} · ${t.status || ''}`}
                        active={activeIdx === i}
                        onClick={() => go(`/projects/${t.listId?._id || t.listId}`, { id: t._id, label: t.title, type: 'task', path: `/projects/${t.listId?._id || t.listId}` })} />
                    )
                  })}
                </>
              )}
              {(category === 'all' || category === 'projects') && filteredProjects.length > 0 && (
                <>
                  <SectionLabel label="Projects" />
                  {filteredProjects.map(p => {
                    const i = gi()
                    return (
                      <ResultItem key={p._id} icon={FolderKanban} iconBg="bg-violet-100 dark:bg-violet-900/30"
                        label={p.name} sub={`${p.role || 'Member'} · Project`} active={activeIdx === i}
                        onClick={() => go(`/projects/${p._id}`, { id: p._id, label: p.name, type: 'project', path: `/projects/${p._id}` })} />
                    )
                  })}
                </>
              )}

              {(category === 'all' || category === 'people') && filteredMembers.length > 0 && (
                <>
                  <SectionLabel label="People" />
                  {filteredMembers.map(m => {
                    const i = gi()
                    const name = m.userId?.displayName || m.userId?.email?.split('@')[0] || '?'
                    return (
                      <ResultItem key={m._id} avatarColor={m.userId?.avatarColor || '#6366f1'}
                        label={name} sub={m.userId?.email} active={activeIdx === i}
                        onClick={() => go('/people', null)} />
                    )
                  })}
                </>
              )}

              {(category === 'all' || category === 'actions') && filteredActions.length > 0 && (
                <>
                  <SectionLabel label="Actions" />
                  {filteredActions.map(a => {
                    const i = gi()
                    return (
                      <ResultItem key={a.id} icon={a.icon} iconBg="bg-muted" label={a.label}
                        active={activeIdx === i} onClick={() => go(a.path, a)} />
                    )
                  })}
                </>
              )}

              {filteredProjects.length === 0 && filteredMembers.length === 0 && filteredActions.length === 0 && taskResults.length === 0 && !searching && (
                <div className="flex flex-col items-center py-10 gap-2 text-muted-foreground">
                  <Search className="h-8 w-8 opacity-20" />
                  <p className="text-sm">No results for "<span className="font-medium text-foreground">{query}</span>"</p>
                  <p className="text-xs opacity-60">Try a project name or person's name</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-border/50 bg-muted/20">
          {[['↑↓', 'Navigate'], ['↵', 'Open'], ['Esc', 'Close']].map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <kbd className="bg-muted border border-border rounded px-1 py-0.5 font-mono text-[10px]">{key}</kbd>
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
