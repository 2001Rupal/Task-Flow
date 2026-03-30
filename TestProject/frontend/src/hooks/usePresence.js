import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { on, off, joinPresence, leavePresence } from '../api/socketClient'

/**
 * Track who's currently viewing a project.
 * Returns array of { userId, displayName, avatarColor, email }
 * excluding the current user.
 */
export function usePresence(projectId) {
  const { user } = useSelector(s => s.auth)
  const [online, setOnline] = useState([])

  useEffect(() => {
    if (!projectId || !user) return

    // Announce we're here
    joinPresence(projectId, user)

    const handler = ({ projectId: pid, online: users }) => {
      if (pid !== projectId) return
      // Exclude self
      setOnline(users.filter(u => u.userId !== user.userId))
    }

    on('presence:update', handler)

    return () => {
      leavePresence(projectId)
      off('presence:update', handler)
      setOnline([])
    }
  }, [projectId, user])

  return online
}
