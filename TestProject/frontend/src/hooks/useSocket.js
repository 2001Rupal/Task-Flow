import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { on, off, joinProject, leaveProject } from '../api/socketClient'
import { taskCreatedSocket, taskUpdatedSocket, taskDeletedSocket } from '../features/tasks/taskSlice'
import { addNotification } from '../features/notifications/notificationSlice'

export function useProjectSocket(projectId) {
  const dispatch = useDispatch()

  useEffect(() => {
    if (!projectId) return
    joinProject(projectId)

    const onCreated = (task) => dispatch(taskCreatedSocket(task))
    const onUpdated = (task) => dispatch(taskUpdatedSocket(task))
    const onDeleted = (data) => dispatch(taskDeletedSocket(data))

    on('task:created', onCreated)
    on('task:updated', onUpdated)
    on('task:deleted', onDeleted)

    return () => {
      leaveProject(projectId)
      off('task:created', onCreated)
      off('task:updated', onUpdated)
      off('task:deleted', onDeleted)
    }
  }, [projectId, dispatch])
}

export function useNotificationSocket() {
  const dispatch = useDispatch()

  useEffect(() => {
    const handler = (notif) => dispatch(addNotification(notif))
    on('notification:new', handler)
    return () => off('notification:new', handler)
  }, [dispatch])
}
