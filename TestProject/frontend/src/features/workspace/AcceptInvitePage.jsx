import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setCurrentWorkspace } from './workspaceSlice'
import axiosClient from '../../api/axiosClient'
import { Loader2, CheckCircle2, XCircle, LogIn } from 'lucide-react'
import { Button } from '../../components/ui/button'

export default function AcceptInvitePage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { token: authToken } = useSelector(s => s.auth)
  const token = params.get('token')

  const [status, setStatus] = useState('loading') // loading | success | error | needs_login | needs_register
  const [message, setMessage] = useState('')
  const [workspace, setWorkspace] = useState(null)

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('Invalid invite link — no token found.'); return }
    if (!authToken) { setStatus('needs_login'); return }
    accept()
  }, [token, authToken])

  const accept = async () => {
    setStatus('loading')
    try {
      const { data } = await axiosClient.get(`/workspaces/invite/accept?token=${token}`)
      setWorkspace(data.workspace)
      setStatus('success')
      // Switch to the newly joined workspace
      if (data.workspace) dispatch(setCurrentWorkspace(data.workspace))
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to accept invite'
      if (msg.includes('register')) {
        setStatus('needs_register')
      } else {
        setStatus('error')
        setMessage(msg)
      }
    }
  }

  // Not logged in — save token in sessionStorage and redirect to login
  if (status === 'needs_login') {
    sessionStorage.setItem('pendingInviteToken', token)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <LogIn className="h-12 w-12 text-primary mx-auto" />
          <h1 className="text-xl font-semibold">Sign in to accept invite</h1>
          <p className="text-sm text-muted-foreground">
            You need to be signed in to accept this workspace invitation.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate(`/login?redirect=/invite/workspace?token=${token}`)}>
              Sign in
            </Button>
            <Button variant="outline" onClick={() => navigate(`/register?redirect=/invite/workspace?token=${token}`)}>
              Create account
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'needs_register') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <XCircle className="h-12 w-12 text-yellow-500 mx-auto" />
          <h1 className="text-xl font-semibold">Account required</h1>
          <p className="text-sm text-muted-foreground">
            No account found for this email. Create an account first, then click the invite link again.
          </p>
          <Button onClick={() => navigate(`/register?redirect=/invite/workspace?token=${token}`)}>
            Create account
          </Button>
        </div>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Accepting invitation...</p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
          <h1 className="text-xl font-semibold">You're in!</h1>
          <p className="text-sm text-muted-foreground">
            You've joined <span className="font-medium text-foreground">{workspace?.name}</span>.
          </p>
          <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
        </div>
      </div>
    )
  }

  // error
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-sm w-full text-center space-y-4">
        <XCircle className="h-12 w-12 text-destructive mx-auto" />
        <h1 className="text-xl font-semibold">Invite failed</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
        <Button variant="outline" onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
      </div>
    </div>
  )
}
