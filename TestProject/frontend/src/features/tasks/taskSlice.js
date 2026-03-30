import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as api from '../../api/tasks'

export const fetchTasks = createAsyncThunk('tasks/fetchAll', async (listId, { rejectWithValue }) => {
  try {
    const { data } = await api.getTasks(listId)
    return data.todos
  } catch (err) { return rejectWithValue(err.response?.data?.error) }
})

export const fetchTask = createAsyncThunk('tasks/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.getTask(id)
    return data.todo
  } catch (err) { return rejectWithValue(err.response?.data?.error) }
})

export const createTask = createAsyncThunk('tasks/create', async (data, { rejectWithValue }) => {
  try {
    const res = await api.createTask(data)
    return res.data.todo
  } catch (err) { return rejectWithValue(err.response?.data?.error) }
})

export const updateTask = createAsyncThunk('tasks/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.updateTask(id, data)
    return res.data.todo
  } catch (err) { return rejectWithValue(err.response?.data?.error) }
})

export const deleteTask = createAsyncThunk('tasks/delete', async (id, { rejectWithValue }) => {
  try {
    await api.deleteTask(id)
    return id
  } catch (err) { return rejectWithValue(err.response?.data?.error) }
})

export const bulkUpdateTasks = createAsyncThunk('tasks/bulkUpdate', async (data, { rejectWithValue }) => {
  try {
    await api.bulkUpdateTasks(data)
    return data
  } catch (err) { return rejectWithValue(err.response?.data?.error) }
})

export const bulkDeleteTasks = createAsyncThunk('tasks/bulkDelete', async (ids, { rejectWithValue }) => {
  try {
    await api.bulkDeleteTasks(ids)
    return ids
  } catch (err) { return rejectWithValue(err.response?.data?.error) }
})

const taskSlice = createSlice({
  name: 'tasks',
  initialState: {
    list: [],
    selected: null,
    loading: false,
    error: null,
    selectedIds: []
  },
  reducers: {
    setSelectedTask(state, { payload }) { state.selected = payload },
    clearSelectedTask(state) { state.selected = null },
    toggleSelectTask(state, { payload }) {
      const idx = state.selectedIds.indexOf(payload)
      if (idx === -1) state.selectedIds.push(payload)
      else state.selectedIds.splice(idx, 1)
    },
    clearSelection(state) { state.selectedIds = [] },
    selectAll(state) { state.selectedIds = state.list.map(t => t._id) },
    // Real-time socket updates
    taskCreatedSocket(state, { payload }) {
      if (!state.list.find(t => t._id === payload._id)) state.list.push(payload)
    },
    taskUpdatedSocket(state, { payload }) {
      const idx = state.list.findIndex(t => t._id === payload._id)
      if (idx !== -1) state.list[idx] = payload
      if (state.selected?._id === payload._id) state.selected = payload
    },
    taskDeletedSocket(state, { payload }) {
      state.list = state.list.filter(t => t._id !== payload.taskId)
      if (state.selected?._id === payload.taskId) state.selected = null
    },
    clearError(state) { state.error = null }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (s) => { s.loading = true })
      .addCase(fetchTasks.fulfilled, (s, { payload }) => { s.loading = false; s.list = payload })
      .addCase(fetchTasks.rejected, (s, { payload }) => { s.loading = false; s.error = payload })

      .addCase(fetchTask.fulfilled, (s, { payload }) => { s.selected = payload })

      .addCase(createTask.fulfilled, (s, { payload }) => {
        if (!s.list.find(t => t._id === payload._id)) s.list.push(payload)
      })

      .addCase(updateTask.fulfilled, (s, { payload }) => {
        const idx = s.list.findIndex(t => t._id === payload._id)
        if (idx !== -1) s.list[idx] = payload
        if (s.selected?._id === payload._id) s.selected = payload
      })

      .addCase(deleteTask.fulfilled, (s, { payload }) => {
        s.list = s.list.filter(t => t._id !== payload)
        if (s.selected?._id === payload) s.selected = null
      })
      .addCase(bulkUpdateTasks.fulfilled, (s, { payload }) => {
        // Re-fetch will happen via socket; optimistically update local state
        const { ids, status, priority, assignedTo } = payload
        s.list = s.list.map(t => {
          if (!ids.includes(t._id)) return t
          return {
            ...t,
            ...(status !== undefined && { status }),
            ...(priority !== undefined && { priority }),
            ...(assignedTo !== undefined && { assignedTo }),
          }
        })
        s.selectedIds = []
      })
      .addCase(bulkDeleteTasks.fulfilled, (s, { payload }) => {
        s.list = s.list.filter(t => !payload.includes(t._id))
        if (payload.includes(s.selected?._id)) s.selected = null
        s.selectedIds = []
      })
  }
})

export const {
  setSelectedTask, clearSelectedTask,
  toggleSelectTask, clearSelection, selectAll,
  taskCreatedSocket, taskUpdatedSocket, taskDeletedSocket,
  clearError
} = taskSlice.actions
export default taskSlice.reducer
