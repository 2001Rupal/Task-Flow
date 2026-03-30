import axiosClient from './axiosClient'

export const getTasks       = (listId)       => axiosClient.get(`/todos/list/${listId}`)
export const getTask        = (id)           => axiosClient.get(`/todos/${id}`)
export const createTask     = (data)         => axiosClient.post('/todos', data)
export const updateTask     = (id, data)     => axiosClient.put(`/todos/${id}`, data)
export const deleteTask     = (id)           => axiosClient.delete(`/todos/${id}`)
export const bulkUpdateTasks = (data)        => axiosClient.post('/todos/bulk/update', data)
export const bulkDeleteTasks = (ids)         => axiosClient.post('/todos/bulk/update', { ids, deleteAll: true })

// Subtasks
export const addSubtask     = (id, data)     => axiosClient.post(`/todos/${id}/subtasks`, data)
export const updateSubtask  = (id, subId, data) => axiosClient.put(`/todos/${id}/subtasks/${subId}`, data)
export const deleteSubtask  = (id, subId)    => axiosClient.delete(`/todos/${id}/subtasks/${subId}`)

// Watchers
export const addWatcher     = (id, userId)   => axiosClient.post(`/todos/${id}/watchers`, { userId })
export const removeWatcher  = (id, userId)   => axiosClient.delete(`/todos/${id}/watchers/${userId}`)

// Activity
export const getTaskActivity = (taskId)      => axiosClient.get(`/activities/task/${taskId}`)

// Attachments
export const getAttachments  = (taskId)      => axiosClient.get(`/attachments/task/${taskId}`)
export const uploadAttachment = (taskId, formData) => axiosClient.post(`/attachments/task/${taskId}`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
export const deleteAttachment = (id)         => axiosClient.delete(`/attachments/${id}`)
export const downloadAttachment = (id)       => `/api/attachments/${id}/download`

// Fetch attachment as authenticated blob URL (for inline preview)
export const fetchAttachmentBlobUrl = async (id) => {
  const token = localStorage.getItem('token')
  const res = await fetch(`/api/attachments/${id}/download`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Fetch failed')
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}

// Authenticated file download — fetches with JWT then triggers browser save
export const downloadAttachmentAuth = async (id, filename) => {
  const blobUrl = await fetchAttachmentBlobUrl(id)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = filename || 'download'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(blobUrl)
}

// My work
export const getMyWork = (params) => axiosClient.get('/profile/my-work', { params })

// Global search
export const searchTasks = (q) => axiosClient.get('/todos/search', { params: { q } })
