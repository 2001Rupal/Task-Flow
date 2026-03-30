import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { createTask } from './taskSlice'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select'
import { Loader2, Target, Flag, Calendar as CalendarIcon, User, AlignLeft, LayoutPanelLeft } from 'lucide-react'
import AssigneePicker from './AssigneePicker'
import toast from 'react-hot-toast'

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']

export default function CreateTaskModal({ projectId, statuses, onClose }) {
  const dispatch = useDispatch()
  const [form, setForm] = useState({
    title: '', description: '', priority: 'Medium',
    status: statuses[0]?.name || 'To Do', dueDate: '', assignedTo: null
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const result = await dispatch(createTask({
      listId: projectId,
      ...form,
      dueDate: form.dueDate || null
    }))
    setLoading(false)
    if (createTask.fulfilled.match(result)) {
      toast.success('Task created')
      onClose()
    } else {
      toast.error(result.payload || 'Failed to create task')
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[550px] p-0 overflow-hidden bg-card/95 backdrop-blur-xl border-border/60 shadow-2xl">
        <DialogHeader className="px-6 py-4 border-b border-border/40 bg-muted/10">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
             <LayoutPanelLeft className="h-4 w-4 text-primary" />
             New Task
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="px-6 py-6 space-y-5">
            
            {/* Core Editor Container */}
            <div className="flex flex-col gap-4">
              {/* Title Entry */}
              <div className="space-y-1.5 focus-within:text-primary transition-colors">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 ml-1">
                  Task Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  autoFocus
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g., Update marketing website copy"
                  required
                  maxLength={200}
                  className="h-12 text-[17px] font-semibold bg-muted/20 border-border/60 shadow-inner focus-visible:ring-primary/50 focus-visible:border-primary/50 rounded-xl transition-all placeholder:text-muted-foreground/30 placeholder:font-medium"
                />
              </div>

              {/* Description Entry */}
              <div className="space-y-1.5 group focus-within:text-primary transition-colors mt-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 ml-1">
                  <AlignLeft className="h-3.5 w-3.5" /> Description
                </Label>
                <div className="rounded-xl overflow-hidden border border-border/60 bg-muted/20 shadow-inner focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary/50 transition-all">
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Add more details, links, or context to this task..."
                    rows={4}
                    className="w-full bg-transparent px-4 py-3 text-[13.5px] leading-relaxed resize-none focus-visible:outline-none placeholder:text-muted-foreground/40 text-foreground transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6 space-y-5">
            <div className="grid grid-cols-2 gap-x-8 gap-y-5 pt-4 border-t border-border/40">
              
              {/* Status */}
              <div className="space-y-2.5">
                <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Target className="h-3.5 w-3.5" /> Status
                </Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="h-9 hover:bg-muted/50 transition-colors shadow-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statuses.map(s => <SelectItem key={s._id} value={s.name}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2.5">
                <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Flag className="h-3.5 w-3.5" /> Priority
                </Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger className="h-9 hover:bg-muted/50 transition-colors shadow-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Due Date */}
              <div className="space-y-2.5">
                <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <CalendarIcon className="h-3.5 w-3.5" /> Due date
                </Label>
                <Input
                  type="date"
                  className="h-9 hover:bg-muted/50 transition-colors shadow-sm text-[13px]"
                  value={form.dueDate}
                  onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                />
              </div>

              {/* Assignee */}
              <div className="space-y-2.5">
                <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <User className="h-3.5 w-3.5" /> Assignee
                </Label>
                <div className="h-9">
                   <AssigneePicker
                     value={form.assignedTo ? { _id: form.assignedTo } : null}
                     onChange={userId => setForm(f => ({ ...f, assignedTo: userId }))}
                   />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-muted/20 border-t border-border/40">
            <Button type="button" variant="ghost" className="hover:bg-muted/50" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading} className="shadow-md popup-anim shadow-primary/20">
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
