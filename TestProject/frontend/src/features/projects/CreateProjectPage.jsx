import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { createProject } from './projectSlice'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#ef4444','#f97316','#eab308','#22c55e','#14b8a6','#06b6d4','#3b82f6']
const ICONS  = ['📋','🚀','💡','🎯','🔥','⚡','🌟','🛠️','📊','🎨']

export default function CreateProjectPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { current: workspace } = useSelector(s => s.workspace)
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1', icon: '📋' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!workspace?._id) return toast.error('No workspace selected')
    setLoading(true)
    const result = await dispatch(createProject({ ...form, workspaceId: workspace._id }))
    setLoading(false)
    if (createProject.fulfilled.match(result)) {
      toast.success('Project created')
      navigate(`/projects/${result.payload._id}`)
    } else {
      toast.error(result.payload || 'Failed to create project')
    }
  }

  return (
    <div className="max-w-lg mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Project</h1>
        <p className="text-muted-foreground text-sm mt-1">Create a project in {workspace?.name}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Icon & Color */}
        <div className="flex gap-4">
          <div className="space-y-1.5">
            <Label>Icon</Label>
            <div className="flex gap-1.5 flex-wrap w-48">
              {ICONS.map(ic => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, icon: ic }))}
                  className={`text-xl p-1.5 rounded-md transition-colors ${form.icon === ic ? 'bg-primary/20 ring-1 ring-primary' : 'hover:bg-muted'}`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex gap-1.5 flex-wrap w-32">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={`h-7 w-7 rounded-full transition-transform hover:scale-110 ${form.color === c ? 'ring-2 ring-offset-2 ring-ring scale-110' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Project name *</Label>
          <Input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Website Redesign"
            required
            maxLength={100}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Description <span className="text-muted-foreground">(optional)</span></Label>
          <Input
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="What is this project about?"
            maxLength={1000}
          />
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create project
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
