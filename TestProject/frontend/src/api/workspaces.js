import axiosClient from './axiosClient'

export const getWorkspaces    = ()           => axiosClient.get('/workspaces')
export const getWorkspace     = (id)         => axiosClient.get(`/workspaces/${id}`)
export const createWorkspace  = (data)       => axiosClient.post('/workspaces', data)
export const updateWorkspace  = (id, data)   => axiosClient.put(`/workspaces/${id}`, data)
export const deleteWorkspace  = (id)         => axiosClient.delete(`/workspaces/${id}`)
export const inviteMember     = (id, data)   => axiosClient.post(`/workspaces/${id}/invite`, data)
export const removeMember     = (id, memberId) => axiosClient.delete(`/workspaces/${id}/members/${memberId}`)
export const acceptInvite     = (token)      => axiosClient.get(`/workspaces/invite/accept?token=${token}`)
export const getWorkload      = (workspaceId) => axiosClient.get(`/profile/workload?workspaceId=${workspaceId}`)
export const getWorkspacePeople = (id) => axiosClient.get(`/workspaces/${id}/people`)
export const getMemberTasks     = (workspaceId, userId) => axiosClient.get(`/workspaces/${workspaceId}/people/${userId}/tasks`)
export const getPortfolio       = (workspaceId) => axiosClient.get(`/workspaces/${workspaceId}/portfolio`)

// Status updates
export const getStatusUpdates    = (projectId)        => axiosClient.get(`/lists/${projectId}/status-updates`)
export const createStatusUpdate  = (projectId, data)  => axiosClient.post(`/lists/${projectId}/status-updates`, data)
export const deleteStatusUpdate  = (projectId, id)    => axiosClient.delete(`/lists/${projectId}/status-updates/${id}`)
