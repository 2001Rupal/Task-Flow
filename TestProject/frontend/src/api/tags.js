import axiosClient from './axiosClient'

export const getTags    = (projectId)        => axiosClient.get(`/tags/lists/${projectId}`)
export const createTag  = (projectId, data)  => axiosClient.post(`/tags/lists/${projectId}`, data)
export const updateTag  = (id, data)         => axiosClient.put(`/tags/${id}`, data)
export const deleteTag  = (id)               => axiosClient.delete(`/tags/${id}`)
