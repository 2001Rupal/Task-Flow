# Application Components — TaskFlow Pro

## Architecture Overview
Layered architecture: React Frontend ↔ REST API + WebSocket ↔ Express Controllers ↔ Mongoose Models ↔ MongoDB

---

## BACKEND COMPONENTS

### 1. Auth Controller
**Purpose**: User registration, login, logout, JWT issuance
**Interfaces**: POST /api/auth/register, POST /api/auth/login, POST /api/auth/logout
**Changes**: Fix login response to include displayName + avatarColor

### 2. Workspace Controller
**Purpose**: CRUD for workspaces, member management, workspace switching
**Interfaces**:
- POST /api/workspaces
- GET /api/workspaces (all workspaces for current user)
- GET /api/workspaces/:id
- PUT /api/workspaces/:id
- DELETE /api/workspaces/:id
- GET /api/workspaces/:id/members
- POST /api/workspaces/:id/invite (email invite → pending)
- PUT /api/workspaces/:id/members/:memberId (change role)
- DELETE /api/workspaces/:id/members/:memberId

### 3. Project Controller (extends List Controller)
**Purpose**: CRUD for projects within workspaces, custom status management
**Interfaces**:
- POST /api/projects
- GET /api/projects?workspaceId=
- GET /api/projects/:id
- PUT /api/projects/:id
- DELETE /api/projects/:id
- GET /api/projects/:id/members
- POST /api/projects/:id/invite
- PUT /api/projects/:id/members/:collaborationId
- DELETE /api/projects/:id/members/:collaborationId
- GET /api/projects/:id/statuses
- POST /api/projects/:id/statuses
- PUT /api/projects/:id/statuses/:statusId
- DELETE /api/projects/:id/statuses/:statusId
- GET /api/projects/:id/stats
- GET /api/projects/:id/analytics

### 4. Task Controller (extends Todo Controller)
**Purpose**: Full task CRUD, subtasks, bulk ops, attachments, custom fields, watchers, templates
**Interfaces**:
- POST /api/tasks
- GET /api/tasks?projectId=
- GET /api/tasks/:id
- PUT /api/tasks/:id
- DELETE /api/tasks/:id
- POST /api/tasks/:id/subtasks
- PUT /api/tasks/:id/subtasks/:subtaskId
- DELETE /api/tasks/:id/subtasks/:subtaskId
- POST /api/tasks/bulk
- POST /api/tasks/:id/attachments (file upload)
- DELETE /api/tasks/:id/attachments/:attachmentId
- GET /api/tasks/:id/attachments/:attachmentId (download)
- POST /api/tasks/:id/watchers
- DELETE /api/tasks/:id/watchers/:userId
- GET /api/tasks/:id/activity
- POST /api/tasks/templates (save as template)
- GET /api/tasks/templates?projectId=
- POST /api/tasks/from-template/:templateId

### 5. Comment Controller (extends existing)
**Purpose**: Rich text comments with @mentions and file attachments
**Interfaces**:
- GET /api/comments/tasks/:taskId
- POST /api/comments/tasks/:taskId
- PUT /api/comments/:id
- DELETE /api/comments/:id

### 6. Activity Controller
**Purpose**: Read-only activity log per task
**Interfaces**:
- GET /api/activity/tasks/:taskId

### 7. Notification Controller
**Purpose**: In-app notifications, mark read, preferences
**Interfaces**:
- GET /api/notifications
- PUT /api/notifications/:id/read
- PUT /api/notifications/read-all
- GET /api/notifications/preferences
- PUT /api/notifications/preferences

### 8. Tag Controller (existing, unchanged)
**Interfaces**: GET/POST/PUT/DELETE /api/tags/projects/:projectId

### 9. Export Controller (existing, extended)
**Purpose**: PDF/Excel export for projects and tasks
**Interfaces**: GET /api/export/projects/:id/pdf|excel, GET /api/export/tasks/:id/pdf|excel

### 10. Share Controller (existing, fixed)
**Purpose**: Public share links, email sharing
**Fix**: Replace hardcoded localhost with process.env.APP_URL

### 11. Reminder Controller (existing, fixed)
**Purpose**: On-demand due date reminder emails
**Fix**: Correct sendReminder argument order

### 12. Profile Controller (existing, extended)
**Purpose**: User profile, My Work view, workload stats
**New**: GET /api/profile/workload?workspaceId=

### 13. Upload Middleware (new)
**Purpose**: Multer configuration for file uploads
**Location**: backend/middleware/upload.js

### 14. Socket.IO Service (new)
**Purpose**: Real-time event broadcasting
**Events emitted**: task:created, task:updated, task:deleted, comment:added, notification:new

### 15. Auth Middleware (existing, unchanged)
### 16. Error Handler Middleware (existing, unchanged)

---

## FRONTEND COMPONENTS

### 17. App Shell
**Purpose**: Root layout — sidebar, topbar, routing, theme provider, socket connection
**Key sub-components**: Sidebar, Topbar, WorkspaceSwitcher, CommandPalette, NotificationBell

### 18. Auth Feature
**Purpose**: Login and Register pages
**Components**: LoginPage, RegisterPage, AuthLayout

### 19. Workspace Feature
**Purpose**: Workspace creation, settings, member management
**Components**: WorkspaceSettingsPage, MemberList, InviteMemberModal

### 20. Project Feature
**Purpose**: Project list, project creation, project settings
**Components**: ProjectsPage, ProjectCard, CreateProjectModal, ProjectSettingsPage, ProjectStatusManager

### 21. Task Views Feature
**Purpose**: All 5 views for a project
**Components**:
- ListView (sortable, filterable, groupable task list)
- BoardView (Kanban — columns = statuses, drag-and-drop)
- CalendarView (monthly calendar with task dots)
- TimelineView (interactive Gantt chart)
- TableView (spreadsheet-like, inline editing)

### 22. Task Detail Feature
**Purpose**: Full task detail side panel
**Components**: TaskDetailPanel, SubtaskList, CommentEditor (rich text), ActivityFeed, AttachmentList, WatcherList, CustomFieldValues, TagPicker, AssigneePicker

### 23. Dashboard Feature
**Purpose**: Global home screen
**Components**: DashboardPage, MyTasksWidget, OverdueWidget, UpcomingWidget, ProjectProgressWidget, TeamWorkloadWidget, RecentActivityWidget

### 24. Analytics Feature
**Purpose**: Per-project analytics
**Components**: AnalyticsPage, CompletionChart, StatusBreakdownChart, AssigneeChart, PriorityChart, TimeTrackingReport

### 25. Notification Feature
**Purpose**: Notification bell + panel
**Components**: NotificationBell, NotificationPanel, NotificationItem, NotificationPreferences

### 26. Profile Feature
**Purpose**: User profile settings
**Components**: ProfilePage, AvatarColorPicker, ThemeToggle

### 27. Share Feature
**Purpose**: Public read-only share page (no auth required)
**Components**: SharePage, SharedProjectView, SharedTaskView

### 28. Export/Share Modal
**Purpose**: Export and share actions within project
**Components**: ExportModal, ShareLinkModal, EmailShareModal

---

## DATA MODELS

### Backend Models
| Model | Status | Purpose |
|---|---|---|
| User | Existing (extend) | Add workload fields |
| Workspace | New | Multi-workspace container |
| WorkspaceMember | New | Workspace membership + roles |
| WorkspaceInvite | New | Pending workspace email invites |
| List → Project | Existing (extend) | Add color, icon, description, status, dates |
| Collaboration | Existing (extend) | Add pending invite state |
| ProjectInvite | New | Pending project email invites |
| ProjectStatus | New | Custom statuses per project |
| Todo → Task | Existing (extend) | Add watchers, attachments ref, custom fields ref |
| Attachment | New | File upload metadata |
| CustomField | New | Per-project custom field definitions |
| CustomFieldValue | New | Per-task custom field values |
| TaskTemplate | New | Reusable task templates |
| Comment | Existing (extend) | Add rich text, @mentions, attachments |
| Activity | New | Task field change log |
| Notification | New | In-app notifications |
| Tag | Existing (unchanged) | Task labels |
| ShareLink | Existing (unchanged) | Public share tokens |
