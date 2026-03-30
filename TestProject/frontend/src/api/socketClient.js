import { io } from 'socket.io-client'

let socket = null

export const connect = (token) => {
  if (socket?.connected) return socket
  const serverUrl = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace('/api', '')
    : '/'
  socket = io(serverUrl, {
    auth: { token },
    transports: ['websocket', 'polling']
  })
  socket.on('connect_error', (err) => {
    console.warn('Socket connect error:', err.message)
  })
  return socket
}

export const disconnect = () => {
  socket?.disconnect()
  socket = null
}

export const getSocket = () => socket

export const joinProject = (projectId) => {
  socket?.emit('joinProject', projectId)
}

export const leaveProject = (projectId) => {
  socket?.emit('leaveProject', projectId)
}

export const joinPresence = (projectId, user) => {
  socket?.emit('presence:join', {
    projectId,
    displayName: user?.displayName || user?.email?.split('@')[0] || 'Someone',
    avatarColor: user?.avatarColor || '#6366f1',
    email: user?.email || ''
  })
}

export const leavePresence = (projectId) => {
  socket?.emit('presence:leave', { projectId })
}

export const on = (event, handler) => {
  socket?.on(event, handler)
}

export const off = (event, handler) => {
  socket?.off(event, handler)
}
