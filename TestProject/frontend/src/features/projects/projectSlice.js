import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as api from '../../api/projects'

export const fetchProjects = createAsyncThunk('projects/fetchAll', async (workspaceId, { rejectWithValue }) => {
  try {
    const { data } = await api.getProjects(workspaceId)
    return data.lists
  } catch (err) { return rejectWithValue(err.response?.data?.error) }
})

export const fetchProject = createAsyncThunk('projects/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.getProject(id)
    return data
  } catch (err) { return rejectWithValue(err.response?.data?.error) }
})

export const createProject = createAsyncThunk('projects/create', async (data, { rejectWithValue }) => {
  try {
    const res = await api.createProject(data)
    return res.data.list
  } catch (err) { return rejectWithValue(err.response?.data?.error) }
})

export const updateProject = createAsyncThunk('projects/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.updateProject(id, data)
    return res.data.list
  } catch (err) { return rejectWithValue(err.response?.data?.error) }
})

export const deleteProject = createAsyncThunk('projects/delete', async (id, { rejectWithValue }) => {
  try {
    await api.deleteProject(id)
    return id
  } catch (err) { return rejectWithValue(err.response?.data?.error) }
})

export const fetchStatuses = createAsyncThunk('projects/fetchStatuses', async (projectId, { rejectWithValue }) => {
  try {
    const { data } = await api.getStatuses(projectId)
    return { projectId, statuses: data.statuses }
  } catch (err) { return rejectWithValue(err.response?.data?.error) }
})

const projectSlice = createSlice({
  name: 'projects',
  initialState: {
    list: [],
    current: null,
    currentStatuses: [],
    currentMembers: [],
    currentRole: null,
    loading: false,
    error: null
  },
  reducers: {
    setCurrentProject(state, { payload }) { state.current = payload },
    clearError(state) { state.error = null },
    updateStatusLocally(state, { payload }) {
      const idx = state.currentStatuses.findIndex(s => s._id === payload._id)
      if (idx !== -1) state.currentStatuses[idx] = payload
    },
    setStatuses(state, { payload }) { state.currentStatuses = payload }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (s) => { s.loading = true })
      .addCase(fetchProjects.fulfilled, (s, { payload }) => { s.loading = false; s.list = payload })
      .addCase(fetchProjects.rejected, (s, { payload }) => { s.loading = false; s.error = payload })

      .addCase(fetchProject.fulfilled, (s, { payload }) => {
        s.current = payload.list
        s.currentStatuses = payload.statuses || []
        s.currentMembers = payload.members || []
        s.currentRole = payload.role
      })

      .addCase(createProject.fulfilled, (s, { payload }) => { s.list.push(payload) })

      .addCase(updateProject.fulfilled, (s, { payload }) => {
        const idx = s.list.findIndex(p => p._id === payload._id)
        if (idx !== -1) s.list[idx] = { ...s.list[idx], ...payload }
        if (s.current?._id === payload._id) s.current = { ...s.current, ...payload }
      })

      .addCase(deleteProject.fulfilled, (s, { payload }) => {
        s.list = s.list.filter(p => p._id !== payload)
        if (s.current?._id === payload) s.current = null
      })

      .addCase(fetchStatuses.fulfilled, (s, { payload }) => {
        s.currentStatuses = payload.statuses
      })
  }
})

export const { setCurrentProject, clearError, updateStatusLocally, setStatuses } = projectSlice.actions
export default projectSlice.reducer
