import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as api from '../../api/notifications'

export const fetchNotifications = createAsyncThunk('notifications/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.getNotifications(params)
    return data
  } catch (err) { return rejectWithValue(err.response?.data?.error) }
})

export const markNotificationRead = createAsyncThunk('notifications/markRead', async (id, { rejectWithValue }) => {
  try {
    await api.markRead(id)
    return id
  } catch (err) { return rejectWithValue(err.response?.data?.error) }
})

export const markAllNotificationsRead = createAsyncThunk('notifications/markAllRead', async (_, { rejectWithValue }) => {
  try {
    await api.markAllRead()
  } catch (err) { return rejectWithValue(err.response?.data?.error) }
})

export const removeNotification = createAsyncThunk('notifications/delete', async (id, { rejectWithValue }) => {
  try {
    await api.deleteNotification(id)
    return id
  } catch (err) { return rejectWithValue(err.response?.data?.error) }
})

export const clearAllNotifications = createAsyncThunk('notifications/clearAll', async (_, { rejectWithValue }) => {
  try {
    await api.clearAllNotifications()
  } catch (err) { return rejectWithValue(err.response?.data?.error) }
})

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    list: [],
    unreadCount: 0,
    loading: false
  },
  reducers: {
    addNotification(state, { payload }) {
      state.list.unshift(payload)
      state.unreadCount++
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (s) => { s.loading = true })
      .addCase(fetchNotifications.fulfilled, (s, { payload }) => {
        s.loading = false
        s.list = payload.notifications
        s.unreadCount = payload.unreadCount
      })
      .addCase(markNotificationRead.fulfilled, (s, { payload }) => {
        const n = s.list.find(n => n._id === payload)
        if (n && !n.read) { n.read = true; s.unreadCount = Math.max(0, s.unreadCount - 1) }
      })
      .addCase(markAllNotificationsRead.fulfilled, (s) => {
        s.list.forEach(n => n.read = true)
        s.unreadCount = 0
      })
      .addCase(removeNotification.fulfilled, (s, { payload }) => {
        const idx = s.list.findIndex(n => n._id === payload)
        if (idx !== -1) {
          if (!s.list[idx].read) s.unreadCount = Math.max(0, s.unreadCount - 1)
          s.list.splice(idx, 1)
        }
      })
      .addCase(clearAllNotifications.fulfilled, (s) => {
        s.list = []
        s.unreadCount = 0
      })
  }
})

export const { addNotification } = notificationSlice.actions
export default notificationSlice.reducer
