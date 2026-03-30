import axiosClient from './axiosClient'

export const register    = (data) => axiosClient.post('/auth/register', data)
export const login       = (data) => axiosClient.post('/auth/login', data)
export const logout      = ()     => axiosClient.post('/auth/logout')
export const getProfile  = ()     => axiosClient.get('/profile')
export const updateProfile = (data) => axiosClient.put('/profile', data)
export const forgotPassword = (email)           => axiosClient.post('/auth/forgot-password', { email })
export const resetPassword  = (token, password) => axiosClient.post('/auth/reset-password', { token, password })
