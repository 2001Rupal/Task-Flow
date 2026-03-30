import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import workspaceReducer from '../features/workspace/workspaceSlice'
import projectReducer from '../features/projects/projectSlice'
import taskReducer from '../features/tasks/taskSlice'
import notificationReducer from '../features/notifications/notificationSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    workspace: workspaceReducer,
    projects: projectReducer,
    tasks: taskReducer,
    notifications: notificationReducer
  }
})
