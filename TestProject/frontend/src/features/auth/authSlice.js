import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as authApi from '../../api/auth'
import { connect as socketConnect, disconnect as socketDisconnect } from '../../api/socketClient'

const stored = localStorage.getItem('user')
const initialUser = stored ? JSON.parse(stored) : null
const initialToken = localStorage.getItem('token') || null

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await authApi.login(credentials)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Login failed')
  }
})

export const registerUser = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await authApi.register(data)
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Registration failed')
  }
})

export const fetchProfile = createAsyncThunk('auth/fetchProfile', async (_, { rejectWithValue }) => {
  try {
    const { data } = await authApi.getProfile()
    return data.user
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to fetch profile')
  }
})

export const updateUserProfile = createAsyncThunk('auth/updateProfile', async (data, { rejectWithValue }) => {
  try {
    const res = await authApi.updateProfile(data)
    return res.data.user
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Update failed')
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: initialUser,
    token: initialToken,
    loading: false,
    error: null
  },
  reducers: {
    logout(state) {
      state.user = null
      state.token = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      socketDisconnect()
    },
    clearError(state) { state.error = null }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (s) => { s.loading = true; s.error = null })
      .addCase(loginUser.fulfilled, (s, { payload }) => {
        s.loading = false
        s.token = payload.token
        s.user = { userId: payload.userId, email: payload.email, displayName: payload.displayName, avatarColor: payload.avatarColor }
        localStorage.setItem('token', payload.token)
        localStorage.setItem('user', JSON.stringify(s.user))
        socketConnect(payload.token)
      })
      .addCase(loginUser.rejected, (s, { payload }) => { s.loading = false; s.error = payload })

      .addCase(registerUser.pending, (s) => { s.loading = true; s.error = null })
      .addCase(registerUser.fulfilled, (s) => { s.loading = false })
      .addCase(registerUser.rejected, (s, { payload }) => { s.loading = false; s.error = payload })

      .addCase(fetchProfile.fulfilled, (s, { payload }) => {
        s.user = { ...s.user, ...payload }
        localStorage.setItem('user', JSON.stringify(s.user))
      })

      .addCase(updateUserProfile.fulfilled, (s, { payload }) => {
        s.user = { ...s.user, ...payload }
        localStorage.setItem('user', JSON.stringify(s.user))
      })
  }
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer
