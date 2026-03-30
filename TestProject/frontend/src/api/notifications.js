import axiosClient from './axiosClient'

export const getNotifications    = (params) => axiosClient.get('/notifications', { params })
export const markRead            = (id)     => axiosClient.put(`/notifications/${id}/read`)
export const markAllRead         = ()       => axiosClient.put('/notifications/read-all')
export const deleteNotification  = (id)     => axiosClient.delete(`/notifications/${id}`)
export const clearAllNotifications = ()     => axiosClient.delete('/notifications/clear-all')
