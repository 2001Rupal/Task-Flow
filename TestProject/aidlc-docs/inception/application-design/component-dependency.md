# Component Dependencies — TaskFlow Pro

## Backend Dependency Flow

```
HTTP Request
    │
    ▼
Auth Middleware (JWT verify)
    │
    ▼
Route Handler
    │
    ▼
Controller
    ├── Models (Mongoose) ──► MongoDB
    ├── Services
    │   ├── emailService ──► Gmail SMTP
    │   ├── socketService ──► Socket.IO clients
    │   ├── activityService ──► Activity Model
    │   ├── notificationService ──► Notification Model + socketService + emailService
    │   ├── fileService ──► PDFKit / ExcelJS
    │   └── uploadService ──► uploads/ directory
    └── Response
```

## Frontend Dependency Flow

```
React App (main.jsx)
    │
    ├── Redux Store (app/store.js)
    │   ├── authSlice
    │   ├── workspaceSlice
    │   ├── projectSlice
    │   ├── taskSlice
    │   └── notificationSlice
    │
    ├── React Router (routes)
    │   ├── / ──► DashboardPage
    │   ├── /login ──► LoginPage
    │   ├── /register ──► RegisterPage
    │   ├── /workspaces/:id ──► WorkspacePage
    │   ├── /projects/:id ──► ProjectPage (with view tabs)
    │   ├── /profile ──► ProfilePage
    │   └── /share/:token ──► SharePage (no auth)
    │
    ├── Socket.IO Client (socketClient.js)
    │   └── Listens: task:*, comment:*, notification:new, member:*
    │
    └── API Layer (axios)
        └── All HTTP calls to backend
```

## Key Cross-Component Dependencies

| Consumer | Depends On | Reason |
|---|---|---|
| TaskController | activityService | Log every field change |
| TaskController | notificationService | Notify on assign/status change |
| TaskController | socketService | Broadcast task events |
| CommentController | notificationService | Notify on mention/comment |
| WorkspaceController | emailService | Send workspace invites |
| ProjectController | emailService | Send project invites |
| notificationService | socketService | Real-time delivery |
| notificationService | emailService | Email delivery |
| BoardView | useDragDrop + taskSlice | Drag between columns |
| TimelineView | useDragDrop + taskSlice | Drag task bars |
| TaskDetailPanel | useTaskDetail + useSocket | Live comment updates |
| NotificationBell | notificationSlice + useSocket | Live unread count |
| WorkloadWidget | useWorkload | Overload warnings |

## Data Flow: Task Update
```
User edits task in UI
    │
    ▼
TaskDetailPanel dispatches updateTask(id, changes)
    │
    ▼
taskSlice → PUT /api/tasks/:id
    │
    ▼
TaskController
    ├── Save to MongoDB
    ├── activityService.logActivity(...)
    ├── notificationService.notifyTaskStatusChanged(...) [if status changed]
    │   ├── Create Notification document
    │   ├── socketService.emitToUser(assigneeId, 'notification:new', ...)
    │   └── emailService.sendNotificationEmail(...) [if preferred]
    └── socketService.emitToProject(projectId, 'task:updated', task)
            │
            ▼
    All connected project members receive task:updated
            │
            ▼
    taskSlice updates Redux store optimistically
            │
            ▼
    All views re-render with updated task
```
