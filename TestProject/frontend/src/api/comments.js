import axiosClient from './axiosClient'

export const getComments = (taskId) =>
  axiosClient.get(`/comments/todos/${taskId}`)

export const createComment = (taskId, data) => {
  const isFormData = data instanceof FormData
  return axiosClient.post(`/comments/todos/${taskId}`, data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
  })
}

export const updateComment = (id, data) =>
  axiosClient.put(`/comments/${id}`, data)

export const deleteComment = (id) =>
  axiosClient.delete(`/comments/${id}`)

export const toggleReaction = (commentId, emoji) =>
  axiosClient.post(`/comments/${commentId}/reactions`, { emoji })

export const addReply = (commentId, text) =>
  axiosClient.post(`/comments/${commentId}/reply`, { text })

export const pinComment = (commentId) =>
  axiosClient.post(`/comments/${commentId}/pin`)

export const markSeen = (taskId) =>
  axiosClient.post(`/comments/todos/${taskId}/seen`)

export const sendTyping = (taskId, typing) =>
  axiosClient.post(`/comments/todos/${taskId}/typing`, { typing })
