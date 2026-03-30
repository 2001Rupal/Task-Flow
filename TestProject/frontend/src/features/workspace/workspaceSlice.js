import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as api from '../../api/workspaces'

export const fetchWorkspaces = createAsyncThunk('workspace/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.getWorkspaces()
    return data.workspaces
  } catch (err) { return rejectWithValue(err.response?.data?.error) }
})

export const fetchWorkspace = createAsyncThunk('workspace/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.getWorkspace(id)
    return data
  } catch (err) { return rejectWithValue(err.response?.data?.error) }
})

export const createWorkspace = createAsyncThunk('workspace/create', async (data, { rejectWithValue }) => {
  try {
    const res = await api.createWorkspace(data)
    return res.data.workspace
  } catch (err) { return rejectWithValue(err.response?.data?.error) }
})

export const updateWorkspace = createAsyncThunk('workspace/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.updateWorkspace(id, data)
    return res.data.workspace
  } catch (err) { return rejectWithValue(err.response?.data?.error) }
})

export const deleteWorkspace = createAsyncThunk('workspace/delete', async (id, { rejectWithValue }) => {
  try {
    await api.deleteWorkspace(id)
    return id
  } catch (err) { return rejectWithValue(err.response?.data?.error) }
})

export const inviteMember = createAsyncThunk('workspace/invite', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.inviteMember(id, data)
    return res.data
  } catch (err) { return rejectWithValue(err.response?.data?.error) }
})

export const removeMember = createAsyncThunk('workspace/removeMember', async ({ workspaceId, memberId }, { rejectWithValue }) => {
  try {
    await api.removeMember(workspaceId, memberId)
    return { workspaceId, memberId }
  } catch (err) { return rejectWithValue(err.response?.data?.error) }
})

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState: {
    list: [],
    current: null,
    currentMembers: [],
    currentRole: null,
    loading: false,
    error: null
  },
  reducers: {
    setCurrentWorkspace(state, { payload }) {
      state.current = payload
      localStorage.setItem('currentWorkspaceId', payload?._id || '')
    },
    clearError(state) { state.error = null }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaces.pending, (s) => { s.loading = true })
      .addCase(fetchWorkspaces.fulfilled, (s, { payload }) => {
        s.loading = false
        s.list = payload
        // Restore last selected workspace
        const savedId = localStorage.getItem('currentWorkspaceId')
        if (!s.current && payload.length > 0) {
          s.current = payload.find(w => w._id === savedId) || payload[0]
        }
      })
      .addCase(fetchWorkspaces.rejected, (s, { payload }) => { s.loading = false; s.error = payload })

      .addCase(fetchWorkspace.fulfilled, (s, { payload }) => {
        s.currentMembers = payload.members || []
        s.currentRole = payload.role
      })

      .addCase(createWorkspace.fulfilled, (s, { payload }) => {
        s.list.push(payload)
        s.current = payload
        localStorage.setItem('currentWorkspaceId', payload._id)
      })

      .addCase(updateWorkspace.fulfilled, (s, { payload }) => {
        const idx = s.list.findIndex(w => w._id === payload._id)
        if (idx !== -1) s.list[idx] = { ...s.list[idx], ...payload }
        if (s.current?._id === payload._id) s.current = { ...s.current, ...payload }
      })

      .addCase(deleteWorkspace.fulfilled, (s, { payload }) => {
        s.list = s.list.filter(w => w._id !== payload)
        if (s.current?._id === payload) s.current = s.list[0] || null
      })

      .addCase(removeMember.fulfilled, (s, { payload }) => {
        s.currentMembers = s.currentMembers.filter(m => m.userId?._id !== payload.memberId)
      })
  }
})

export const { setCurrentWorkspace, clearError } = workspaceSlice.actions
export default workspaceSlice.reducer
