# Units of Work — TaskFlow Pro

## Deployment Model
Monolithic — single backend process, single frontend SPA. Sequential development (backend first, then frontend units).

## Code Organization
- Backend: `TestProject/backend/`
- Frontend: `TestProject/frontend/`
- Root runner: `TestProject/package.json`

---

## UNIT-1: Backend Foundation & Restructure

### Scope
Restructure the project, fix all backend bugs, extend existing models, add all new models, add all new API endpoints, integrate Socket.IO and Multer.

### Phases
1. **Project Restructure** — move existing backend files to `backend/`, create root `package.json`
2. **Bug Fixes** — fix shareController URL, authController login response, reminderController arg order, getMyWork sort
3. **Model Extensions** — extend List→Project, Todo→Task, Comment, User models
4. **New Models** — Workspace, WorkspaceMember, WorkspaceInvite, ProjectInvite, ProjectStatus, Activity, Notification, Attachment, CustomField, CustomFieldValue, TaskTemplate
5. **New Controllers & Routes** — Workspace, extended Project, extended Task, Activity, Notification, Upload middleware
6. **Socket.IO Integration** — socketService, attach to server, emit from controllers
7. **File Upload** — Multer middleware, upload/download/delete endpoints
8. **New Services** — socketService, activityService, notificationService, extend emailService

### Deliverables
- `backend/` directory with all backend code
- All 17 models implemented
- All 16 controllers implemented
- All 16 route files
- Socket.IO server running
- File upload working
- Root `package.json` with concurrently

### Dependencies
None — this is the foundation unit.

---

## UNIT-2: React Frontend — Auth, Workspace & App Shell

### Scope
Scaffold the React application, implement authentication, workspace management, and the overall app shell (sidebar, topbar, routing, theme).

### Phases
1. **Scaffold** — Vite + React 18, shadcn/ui, Tailwind CSS, Redux Toolkit, React Router v6
2. **API Layer** — axiosClient, socketClient, all API modules
3. **Redux Store** — authSlice, workspaceSlice, notificationSlice
4. **Auth Pages** — LoginPage, RegisterPage, protected route wrapper
5. **App Shell** — AppLayout, Sidebar, Topbar, WorkspaceSwitcher
6. **Workspace Pages** — WorkspacePage, WorkspaceSettingsPage, MemberList, InviteMemberModal
7. **Theme** — dark/light toggle + system preference, ThemeProvider
8. **Command Palette** — ⌘K global search across tasks and projects

### Deliverables
- `frontend/` directory fully scaffolded
- Auth flow working end-to-end
- Workspace creation, switching, member management
- App shell with sidebar and routing
- Dark/light theme working

### Dependencies
- UNIT-1 must be complete (auth API, workspace API)

---

## UNIT-3: React Frontend — Projects & Tasks (Core)

### Scope
All project views (List, Board, Calendar, Timeline, Table), task detail panel with full features, My Work view, bulk operations, drag-and-drop.

### Phases
1. **Project Pages** — ProjectsPage, CreateProjectModal, ProjectSettingsPage, ProjectStatusManager
2. **Redux** — projectSlice, taskSlice
3. **List View** — sortable/filterable task list, grouping, inline status toggle
4. **Board View** — Kanban columns = statuses, drag-and-drop between columns
5. **Calendar View** — monthly calendar, task dots by due date, click to add
6. **Timeline View** — interactive Gantt chart, drag bars to change dates
7. **Table View** — spreadsheet-like, all fields as columns, inline editing
8. **Task Detail Panel** — side panel with all task fields, subtasks, rich text description
9. **Comments & Activity** — rich text editor, @mentions, file attachments, activity feed
10. **Tags, Watchers, Custom Fields** — tag picker, watcher management, custom field values
11. **Bulk Operations** — multi-select, bulk status/priority/assign/delete
12. **My Work View** — tasks assigned to me across all projects

### Deliverables
- All 5 views functional with real data
- Task detail panel fully featured
- Drag-and-drop working in Board and Timeline
- Bulk operations working
- My Work view working

### Dependencies
- UNIT-2 must be complete (app shell, routing, auth)

---

## UNIT-4: React Frontend — Dashboard, Analytics, Notifications & Advanced

### Scope
Global dashboard, project analytics, notification system, workload balancing UI, export/share modals, profile settings, public share page.

### Phases
1. **Dashboard Page** — MyTasksWidget, OverdueWidget, UpcomingWidget, ProjectProgressWidget, TeamWorkloadWidget, RecentActivityWidget
2. **Analytics Page** — CompletionChart, StatusBreakdownChart, AssigneeChart, PriorityChart, TimeTrackingReport (using Recharts)
3. **Notification System** — NotificationBell (with badge), NotificationPanel, NotificationItem, mark read, real-time via socket
4. **Workload Balancing** — WorkloadPanel, overload warning in AssigneePicker
5. **Export/Share Modals** — ExportModal (PDF/Excel), ShareLinkModal, EmailShareModal
6. **Profile Page** — displayName, avatarColor picker, notification preferences
7. **Public Share Page** — SharedProjectView, SharedTaskView (no auth required)
8. **Polish** — keyboard shortcuts, toast notifications, loading skeletons, empty states

### Deliverables
- Dashboard with all widgets
- Analytics charts working
- Notifications real-time working
- Workload warnings showing
- Export and share working
- Public share page working
- Profile settings working

### Dependencies
- UNIT-3 must be complete (projects, tasks, views)
