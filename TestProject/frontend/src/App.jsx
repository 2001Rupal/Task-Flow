import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './features/auth/ProtectedRoute'
import LoginPage from './features/auth/LoginPage'
import RegisterPage from './features/auth/RegisterPage'
import ForgotPasswordPage from './features/auth/ForgotPasswordPage'
import ResetPasswordPage from './features/auth/ResetPasswordPage'
import DashboardPage from './features/dashboard/DashboardPage'
import WorkspaceSettingsPage from './features/workspace/WorkspaceSettingsPage'
import CreateWorkspacePage from './features/workspace/CreateWorkspacePage'
import AcceptInvitePage from './features/workspace/AcceptInvitePage'
import ProfilePage from './features/profile/ProfilePage'

// Lazy-loaded heavy pages (UNIT-3 & 4)
import { lazy, Suspense } from 'react'
const ProjectsPage          = lazy(() => import('./features/projects/ProjectsPage'))
const ProjectPage           = lazy(() => import('./features/projects/ProjectPage'))
const CreateProjectPage     = lazy(() => import('./features/projects/CreateProjectPage'))
const ProjectSettingsPage   = lazy(() => import('./features/projects/ProjectSettingsPage'))
const MyWorkPage         = lazy(() => import('./features/tasks/MyWorkPage'))
const MyTasksPage        = lazy(() => import('./features/tasks/MyTasksPage'))
const AnalyticsPage      = lazy(() => import('./features/analytics/AnalyticsPage'))
const PeoplePage         = lazy(() => import('./features/workspace/PeoplePage'))
const NotificationsPage  = lazy(() => import('./features/notifications/NotificationsPage'))
const PortfolioPage      = lazy(() => import('./features/reporting/PortfolioPage'))
const WorkloadPage       = lazy(() => import('./features/reporting/WorkloadPage'))
const FilesPage          = lazy(() => import('./features/files/FilesPage'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        {/* Public */}
        <Route path="/login"            element={<LoginPage />} />
        <Route path="/register"         element={<RegisterPage />} />
        <Route path="/forgot-password"  element={<ForgotPasswordPage />} />
        <Route path="/reset-password"   element={<ResetPasswordPage />} />
        <Route path="/invite/workspace" element={<AcceptInvitePage />} />
        <Route path="/workspace/new" element={<ProtectedRoute><CreateWorkspacePage /></ProtectedRoute>} />

        {/* Protected app shell */}
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="workspace/settings" element={<WorkspaceSettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />

          <Route path="projects" element={
            <Suspense fallback={<PageLoader />}><ProjectsPage /></Suspense>
          } />
          <Route path="projects/new" element={
            <Suspense fallback={<PageLoader />}><CreateProjectPage /></Suspense>
          } />
          <Route path="projects/:projectId/*" element={
            <Suspense fallback={<PageLoader />}><ProjectPage /></Suspense>
          } />
          <Route path="projects/:projectId/settings" element={
            <Suspense fallback={<PageLoader />}><ProjectSettingsPage /></Suspense>
          } />
          <Route path="my-work" element={
            <Suspense fallback={<PageLoader />}><MyTasksPage /></Suspense>
          } />
          <Route path="analytics/:projectId" element={
            <Suspense fallback={<PageLoader />}><AnalyticsPage /></Suspense>
          } />
          <Route path="people" element={
            <Suspense fallback={<PageLoader />}><PeoplePage /></Suspense>
          } />
          <Route path="notifications" element={
            <Suspense fallback={<PageLoader />}><NotificationsPage /></Suspense>
          } />
          <Route path="portfolio" element={
            <Suspense fallback={<PageLoader />}><PortfolioPage /></Suspense>
          } />
          <Route path="workload" element={
            <Suspense fallback={<PageLoader />}><WorkloadPage /></Suspense>
          } />
          <Route path="files" element={
            <Suspense fallback={<PageLoader />}><FilesPage /></Suspense>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
