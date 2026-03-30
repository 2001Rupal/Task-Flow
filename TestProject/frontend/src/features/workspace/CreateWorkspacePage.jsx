import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { createWorkspace } from './workspaceSlice'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CreateWorkspacePage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const result = await dispatch(createWorkspace({ name, description }))
    setLoading(false)
    if (createWorkspace.fulfilled.match(result)) {
      toast.success('Workspace created')
      navigate('/dashboard')
    } else {
      toast.error(result.payload || 'Failed to create workspace')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">New Workspace</h1>
          <p className="text-sm text-muted-foreground">Create a workspace for your team</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Workspace name</Label>
            <Input
              placeholder="e.g. My Team"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              maxLength={100}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Description <span className="text-muted-foreground">(optional)</span></Label>
            <Input
              placeholder="What is this workspace for?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={500}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create workspace
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </form>
      </div>
    </div>
  )
}
