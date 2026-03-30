import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { updateTask, deleteTask, clearSelectedTask } from './taskSlice'
import { X, Trash2, Calendar, Clock, ChevronDown, ChevronRight, RefreshCw, Link2, Search, XCircle } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs'
import { ScrollArea } from '../../components/ui/scroll-area'
import { Separator } from '../../components/ui/separator'
import { Badge } from '../../components/ui/badge'
import { cn } from '../../lib/utils'
import CommentsTab from './CommentsTab'
import ActivityTab from './ActivityTab'
import SubtaskList from './SubtaskList'
import AttachmentList from './AttachmentList'
import AssigneePicker from './AssigneePicker'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import toast from 'react-hot-toast'

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']
const RECURRENCES = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

// Dependency picker — search tasks in the same project
function DependencyPicker({ currentTaskId, blockedBy = [], allTasks = [], onChange, disabled }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const blockedIds = blockedBy.map(t => (t._id || t).toString())
  const filtered = allTasks.filter(t =>
    t._id.toString() !== currentTaskId &&
    !blockedIds.includes(t._id.toString()) &&
    t.title.toLowerCase().includes(query.toLowerCase())
  )

  const add = (task) => {
    onChange([...blockedBy, task])
    setQuery('')
    setOpen(false)
  }

  const remove = (id) => {
    onChange(blockedBy.filter(t => (t._id || t).toString() !== id.toString()))
  }

  return (
    <div className="space-y-1.5">
      {/* Existing dependencies */}
      {blockedBy.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {blockedBy.map(dep => {
            const id = dep._id || dep
            const title = dep.title || id
            const status = dep.status
            return (
              <div key={id} className="flex items-center gap-1 bg-muted rounded px-2 py-0.5 text-xs">
                <Link2 className="h-3 w-3 text-muted-foreground" />
                <span className="max-w-[120px] truncate">{title}</span>
                {status && <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">{status}</Badge>}
                {!disabled && (
                  <button onClick={() => remove(id)} className="ml-0.5 text-muted-foreground hover:text-destructive">
                    <XCircle className="h-3 w-3" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add dependency */}
      {!disabled && (
        <div className="relative">
          <div className="flex items-center gap-1.5 border border-input rounded-md px-2 py-1">
            <Search className="h-3 w-3 text-muted-foreground shrink-0" />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setOpen(true) }}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              placeholder="Search tasks to block…"
              className="flex-1 text-xs bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
          {open && filtered.length > 0 && (
            <div className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-md shadow-md max-h-40 overflow-y-auto">
              {filtered.slice(0, 10).map(t => (
                <button
                  key={t._id}
                  onMouseDown={() => add(t)}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent flex items-center gap-2"
                >
                  <span className="truncate flex-1">{t.title}</span>
                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 shrink-0">{t.status}</Badge>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Section({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 w-full text-left py-1 group"
      >
        {open
          ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        }
        <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
          {title}
        </span>
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  )
}

export default function TaskDetailPanel({ projectId, statuses, role, allTasks = [], modal = false }) {
  const dispatch = useDispatch()
  const { selected: task } = useSelector(s => s.tasks)
  const [editTitle, setEditTitle] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setEditTitle(false)
    }
  }, [task?._id])

  if (!task) return null

  const isViewer = role === 'Viewer'

  const update = async (data) => {
    setSaving(true)
    const result = await dispatch(updateTask({ id: task._id, data }))
    setSaving(false)
    if (!updateTask.fulfilled.match(result)) toast.error(result.payload || 'Update failed')
  }

  const handleDelete = async () => {
    setDeleting(true)
    const result = await dispatch(deleteTask(task._id))
    setDeleting(false)
    setConfirmDelete(false)
    if (deleteTask.fulfilled.match(result)) {
      dispatch(clearSelectedTask())
      toast.success('Task deleted')
    }
  }

  const saveTitle = () => {
    if (title.trim() && title !== task.title) update({ title: title.trim() })
    setEditTitle(false)
  }

  const saveDescription = () => {
    if (description !== (task.description || '')) update({ description })
  }

  // Shared content — properties, description, subtasks, attachments
  const PanelContent = (
    <>
      {/* Title */}
      {editTitle ? (
        <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setTitle(task.title); setEditTitle(false) } }}
          className="w-full text-base font-semibold bg-transparent border-b-2 border-primary outline-none pb-0.5"
        />
      ) : (
        <h2 className={cn('text-base font-semibold leading-snug', !isViewer && 'cursor-pointer hover:text-primary transition-colors')}
          onClick={() => !isViewer && setEditTitle(true)} title={!isViewer ? 'Click to edit' : ''}>
          {task.title}
        </h2>
      )}

      {/* Properties */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-20 shrink-0">Assignee</span>
          <AssigneePicker value={task.assignedTo} onChange={userId => update({ assignedTo: userId })} disabled={isViewer} />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-20 shrink-0">Status</span>
          <Select value={task.status} onValueChange={v => update({ status: v })} disabled={isViewer}>
            <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>{(statuses || []).map(s => <SelectItem key={s._id || s.name} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-20 shrink-0">Priority</span>
          <Select value={task.priority} onValueChange={v => update({ priority: v })} disabled={isViewer}>
            <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-20 shrink-0 flex items-center gap-1"><Calendar className="h-3 w-3" /> Due date</span>
          <Input type="date" className="h-8 text-xs flex-1" value={task.dueDate ? task.dueDate.split('T')[0] : ''} onChange={e => update({ dueDate: e.target.value || null })} disabled={isViewer} />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-20 shrink-0 flex items-center gap-1"><Clock className="h-3 w-3" /> Hours</span>
          <div className="flex gap-2 flex-1">
            <Input type="number" min="0" step="0.5" className="h-8 text-xs" placeholder="Est." value={task.estimatedHours ?? ''} onChange={e => update({ estimatedHours: parseFloat(e.target.value) || null })} disabled={isViewer} title="Estimated hours" />
            <Input type="number" min="0" step="0.5" className="h-8 text-xs" placeholder="Logged" value={task.loggedHours ?? 0} onChange={e => update({ loggedHours: parseFloat(e.target.value) || 0 })} disabled={isViewer} title="Logged hours" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-20 shrink-0 flex items-center gap-1"><RefreshCw className="h-3 w-3" /> Repeat</span>
          <Select value={task.recurrence || 'none'} onValueChange={v => update({ recurrence: v })} disabled={isViewer}>
            <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>{RECURRENCES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <Separator />
      <Section title="Dependencies" defaultOpen={false}>
        <p className="text-xs text-muted-foreground mb-2">This task is blocked by:</p>
        <DependencyPicker currentTaskId={task._id} blockedBy={task.blockedBy || []} allTasks={allTasks} onChange={deps => update({ blockedBy: deps.map(d => d._id || d) })} disabled={isViewer} />
      </Section>
      <Separator />
      <Section title="Description" defaultOpen={true}>
        <textarea value={description} onChange={e => setDescription(e.target.value)} onBlur={saveDescription}
          placeholder={isViewer ? 'No description' : 'Add a description…'} rows={4} disabled={isViewer}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60 placeholder:text-muted-foreground" />
      </Section>
      <Separator />
      <Section title="Subtasks" defaultOpen={true}><SubtaskList task={task} isViewer={isViewer} /></Section>
      <Separator />
      <Section title="Attachments" defaultOpen={true}><AttachmentList taskId={task._id} isViewer={isViewer} /></Section>
    </>
  )

  // Modal mode — used for board/calendar views where side panel compresses content
  if (modal) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        onClick={() => dispatch(clearSelectedTask())}
      >
        <div
          className="bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-150"
          style={{ width: 'min(860px, 95vw)', height: 'min(90vh, 800px)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0 bg-background rounded-t-2xl">
            <div className="flex items-center gap-2">
              {saving && <div className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />}
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Task detail</span>
            </div>
            <div className="flex items-center gap-0.5">
              {!isViewer && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => setConfirmDelete(true)} title="Delete task">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => dispatch(clearSelectedTask())} title="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Two-column layout inside modal */}
          <div className="flex flex-1 min-h-0">
            {/* Left — main details */}
            <ScrollArea className="flex-1 border-r border-border">
              <div className="p-5 space-y-4">
                {PanelContent}
              </div>
            </ScrollArea>
            {/* Right — comments + activity */}
            <div className="w-[340px] shrink-0 flex flex-col">
              <Tabs defaultValue="comments" className="flex flex-col flex-1 min-h-0">
                <TabsList className="w-full shrink-0 rounded-none border-b border-border bg-transparent px-4 pt-2">
                  <TabsTrigger value="comments" className="flex-1 text-xs">Comments</TabsTrigger>
                  <TabsTrigger value="activity" className="flex-1 text-xs">Activity</TabsTrigger>
                </TabsList>
                <TabsContent value="comments" className="flex-1 overflow-y-auto p-4 mt-0">
                  <CommentsTab taskId={task._id} projectId={projectId} isViewer={isViewer} />
                </TabsContent>
                <TabsContent value="activity" className="flex-1 overflow-y-auto p-4 mt-0">
                  <ActivityTab taskId={task._id} projectId={projectId} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
    <div className="w-[480px] border-l border-border bg-card flex flex-col h-full shrink-0 shadow-[-4px_0_16px_hsl(222_25%_12%/0.06)]">

      {/* ── Panel header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 bg-background">
        <div className="flex items-center gap-2">
          {saving && (
            <div className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          )}
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Task detail</span>
        </div>
        <div className="flex items-center gap-0.5">
          {!isViewer && (
            <Button
              variant="ghost" size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => setConfirmDelete(true)}
              title="Delete task"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => dispatch(clearSelectedTask())}
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">

          {/* ── Title ── */}
          {editTitle ? (
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={e => {
                if (e.key === 'Enter') saveTitle()
                if (e.key === 'Escape') { setTitle(task.title); setEditTitle(false) }
              }}
              className="w-full text-base font-semibold bg-transparent border-b-2 border-primary outline-none pb-0.5"
            />
          ) : (
            <h2
              className={cn(
                'text-base font-semibold leading-snug',
                !isViewer && 'cursor-pointer hover:text-primary transition-colors'
              )}
              onClick={() => !isViewer && setEditTitle(true)}
              title={!isViewer ? 'Click to edit' : ''}
            >
              {task.title}
            </h2>
          )}

          {/* ── Properties grid ── */}
          <div className="space-y-2.5">
            {/* Assignee */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-20 shrink-0">Assignee</span>
              <AssigneePicker
                value={task.assignedTo}
                onChange={userId => update({ assignedTo: userId })}
                disabled={isViewer}
              />
            </div>

            {/* Status */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-20 shrink-0">Status</span>
              <Select value={task.status} onValueChange={v => update({ status: v })} disabled={isViewer}>
                <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(statuses || []).map(s => (
                    <SelectItem key={s._id || s.name} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-20 shrink-0">Priority</span>
              <Select value={task.priority} onValueChange={v => update({ priority: v })} disabled={isViewer}>
                <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Due date */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-20 shrink-0 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Due date
              </span>
              <Input
                type="date"
                className="h-8 text-xs flex-1"
                value={task.dueDate ? task.dueDate.split('T')[0] : ''}
                onChange={e => update({ dueDate: e.target.value || null })}
                disabled={isViewer}
              />
            </div>

            {/* Time tracking */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-20 shrink-0 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Hours
              </span>
              <div className="flex gap-2 flex-1">
                <Input
                  type="number" min="0" step="0.5"
                  className="h-8 text-xs"
                  placeholder="Est."
                  value={task.estimatedHours ?? ''}
                  onChange={e => update({ estimatedHours: parseFloat(e.target.value) || null })}
                  disabled={isViewer}
                  title="Estimated hours"
                />
                <Input
                  type="number" min="0" step="0.5"
                  className="h-8 text-xs"
                  placeholder="Logged"
                  value={task.loggedHours ?? 0}
                  onChange={e => update({ loggedHours: parseFloat(e.target.value) || 0 })}
                  disabled={isViewer}
                  title="Logged hours"
                />
              </div>
            </div>

            {/* Recurrence */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-20 shrink-0 flex items-center gap-1">
                <RefreshCw className="h-3 w-3" /> Repeat
              </span>
              <Select
                value={task.recurrence || 'none'}
                onValueChange={v => update({ recurrence: v })}
                disabled={isViewer}
              >
                <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RECURRENCES.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* ── Dependencies ── */}
          <Section title="Dependencies" defaultOpen={false}>
            <p className="text-xs text-muted-foreground mb-2">This task is blocked by:</p>
            <DependencyPicker
              currentTaskId={task._id}
              blockedBy={task.blockedBy || []}
              allTasks={allTasks}
              onChange={deps => update({ blockedBy: deps.map(d => d._id || d) })}
              disabled={isViewer}
            />
          </Section>

          <Separator />

          {/* ── Description ── */}
          <Section title="Description" defaultOpen={true}>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              onBlur={saveDescription}
              placeholder={isViewer ? 'No description' : 'Add a description…'}
              rows={4}
              disabled={isViewer}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60 placeholder:text-muted-foreground"
            />
          </Section>

          <Separator />

          {/* ── Subtasks ── */}
          <Section title="Subtasks" defaultOpen={true}>
            <SubtaskList task={task} isViewer={isViewer} />
          </Section>

          <Separator />

          {/* ── Attachments ── */}
          <Section title="Attachments" defaultOpen={true}>
            <AttachmentList taskId={task._id} isViewer={isViewer} />
          </Section>

          <Separator />

          {/* ── Comments / Activity tabs ── */}
          <Tabs defaultValue="comments">
            <TabsList className="w-full">
              <TabsTrigger value="comments" className="flex-1 text-xs">Comments</TabsTrigger>
              <TabsTrigger value="activity" className="flex-1 text-xs">Activity</TabsTrigger>
            </TabsList>
            <TabsContent value="comments" className="mt-3">
              <CommentsTab taskId={task._id} projectId={projectId} isViewer={isViewer} />
            </TabsContent>
            <TabsContent value="activity" className="mt-3">
              <ActivityTab taskId={task._id} projectId={projectId} />
            </TabsContent>
          </Tabs>

        </div>
      </ScrollArea>
    </div>

    <ConfirmDialog
      open={confirmDelete}
      onConfirm={handleDelete}
      onCancel={() => setConfirmDelete(false)}
      title="Delete task?"
      description="This will permanently delete the task, its comments, and attachments. This cannot be undone."
      confirmLabel="Delete task"
      loading={deleting}
    />
    </>
  )
}
