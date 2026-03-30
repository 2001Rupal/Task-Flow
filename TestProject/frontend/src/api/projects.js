import axiosClient from './axiosClient'

export const getProjects      = (workspaceId) => axiosClient.get(`/lists?workspaceId=${workspaceId}`)
export const getProject       = (id)          => axiosClient.get(`/lists/${id}`)
export const createProject    = (data)        => axiosClient.post('/lists', data)
export const updateProject    = (id, data)    => axiosClient.put(`/lists/${id}`, data)
export const deleteProject    = (id)          => axiosClient.delete(`/lists/${id}`)
export const getProjectMembers = (projectId)  => axiosClient.get(`/collaborations/lists/${projectId}/collaborators`)
export const getProjectStats  = (id)          => axiosClient.get(`/lists/${id}/stats`)
export const getProjectAnalytics = (id)       => axiosClient.get(`/lists/${id}/analytics`)

// Statuses
export const getStatuses      = (projectId)   => axiosClient.get(`/statuses/project/${projectId}`)
export const createStatus     = (projectId, data) => axiosClient.post(`/statuses/project/${projectId}`, data)
export const updateStatus     = (id, data)    => axiosClient.put(`/statuses/${id}`, data)
export const deleteStatus     = (id)          => axiosClient.delete(`/statuses/${id}`)
export const reorderStatuses  = (projectId, orderedIds) => axiosClient.put(`/statuses/project/${projectId}/reorder`, { orderedIds })

// Members
export const getCollaborators = (projectId)   => axiosClient.get(`/collaborations/lists/${projectId}/collaborators`)
export const inviteCollaborator = (projectId, data) => axiosClient.post(`/collaborations/lists/${projectId}/collaborators`, data)
export const updateCollaboratorRole = (projectId, collabId, role) => axiosClient.put(`/collaborations/lists/${projectId}/collaborators/${collabId}`, { role })
export const removeCollaborator = (projectId, collabId) => axiosClient.delete(`/collaborations/lists/${projectId}/collaborators/${collabId}`)
export const getPendingInvites  = (projectId)           => axiosClient.get(`/collaborations/lists/${projectId}/collaborators/pending`)
