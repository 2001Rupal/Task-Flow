# Unit of Work Story Map — TaskFlow Pro

## Story → Unit Mapping

### UNIT-1: Backend Foundation & Restructure

| Story | Requirement | Description |
|---|---|---|
| U1-S1 | FR-2.2 | Fix login response to include displayName + avatarColor |
| U1-S2 | FR-11 | Fix shareController hardcoded URL |
| U1-S3 | FR-14 | Fix reminderController sendReminder arg order |
| U1-S4 | FR-1 | Workspace model + CRUD + member management |
| U1-S5 | FR-1.3 | Workspace invite by email (pending state) |
| U1-S6 | FR-3 | Extend Project model (color, icon, description, status, dates) |
| U1-S7 | FR-3.5 | ProjectStatus model + CRUD (custom statuses per project) |
| U1-S8 | FR-3.4 | Project invite by email (pending state) |
| U1-S9 | FR-4.2 | Attachment model + upload/download/delete endpoints |
| U1-S10 | FR-4.3 | CustomField + CustomFieldValue models + CRUD |
| U1-S11 | FR-4.4 | Task watchers (add/remove watcher endpoints) |
| U1-S12 | FR-4.8 | TaskTemplate model + save/list/create-from-template |
| U1-S13 | FR-6.4 | Activity model + activityService (log all field changes) |
| U1-S14 | FR-7 | Notification model + notificationService + all trigger events |
| U1-S15 | FR-12 | Socket.IO server + socketService + room management |
| U1-S16 | FR-10 | Workload stats endpoint (GET /api/profile/workload) |
| U1-S17 | FR-9 | Project analytics endpoint (GET /api/projects/:id/analytics) |
| U1-S18 | FR-3 | Project stats endpoint (GET /api/projects/:id/stats) |
| U1-S19 | NFR-2 | Project restructure (backend/ + frontend/ + root package.json) |
| U1-S20 | FR-6.2 | @mention support in comments (notify mentioned users) |

### UNIT-2: React Frontend — Auth, Workspace & Shell

| Story | Requirement | Description |
|---|---|---|
| U2-S1 | NFR-1 | Scaffold React app (Vite + shadcn/ui + Tailwind + Redux Toolkit) |
| U2-S2 | NFR-1 | API layer (axiosClient + all API modules + socketClient) |
| U2-S3 | FR-2.1 | Register page with validation |
| U2-S4 | FR-2.2 | Login page with JWT storage |
| U2-S5 | NFR-5 | Protected route wrapper (redirect to login if no token) |
| U2-S6 | FR-1.4 | Workspace switcher in sidebar |
| U2-S7 | FR-1.1 | Create workspace modal |
| U2-S8 | FR-1.6 | Workspace settings page (name, description, members) |
| U2-S9 | FR-1.3 | Invite member to workspace (email + pending state) |
| U2-S10 | NFR-5 | App shell — Sidebar, Topbar, main content area |
| U2-S11 | FR-2.4 | Dark/light theme toggle + system preference |
| U2-S12 | NFR-5 | Command palette (⌘K) — search tasks + projects |

### UNIT-3: React Frontend — Projects & Tasks (Core)

| Story | Requirement | Description |
|---|---|---|
| U3-S1 | FR-3 | Projects list page with project cards |
| U3-S2 | FR-3.1 | Create project modal (name, color, icon, description, dates) |
| U3-S3 | FR-3.7 | Project settings page (edit, archive, delete) |
| U3-S4 | FR-3.5 | Project status manager (add/edit/delete custom statuses) |
| U3-S5 | FR-3.4 | Invite member to project (email + pending state) |
| U3-S6 | FR-5.1 | List view — sortable, filterable, groupable task list |
| U3-S7 | FR-5.2 | Board view — Kanban columns = statuses, drag-and-drop |
| U3-S8 | FR-5.3 | Calendar view — monthly, task dots, click to add |
| U3-S9 | FR-5.4 | Timeline view — interactive Gantt, drag bars |
| U3-S10 | FR-5.5 | Table view — spreadsheet-like, inline editing |
| U3-S11 | FR-4.1 | Task detail panel — all fields, edit inline |
| U3-S12 | FR-4.1 | Subtask list in task detail |
| U3-S13 | FR-6.1 | Rich text comment editor (bold, italic, lists, code) |
| U3-S14 | FR-6.2 | @mention in comments |
| U3-S15 | FR-6.3 | File attachments on comments |
| U3-S16 | FR-6.4 | Activity feed in task detail |
| U3-S17 | FR-4.4 | Watcher management in task detail |
| U3-S18 | FR-4.3 | Custom field values in task detail |
| U3-S19 | FR-4.2 | File attachment upload/download/delete in task detail |
| U3-S20 | FR-4.6 | Bulk operations (multi-select, set status/priority/assign/delete) |
| U3-S21 | FR-4.7 | Drag-and-drop reordering in list view |
| U3-S22 | FR-4.8 | Task templates (save + create from template) |
| U3-S23 | FR-8.1 | My Work view (tasks assigned to me across all projects) |

### UNIT-4: React Frontend — Dashboard, Analytics, Notifications & Advanced

| Story | Requirement | Description |
|---|---|---|
| U4-S1 | FR-8.2 | Overdue tasks widget on dashboard |
| U4-S2 | FR-8.3 | Upcoming deadlines widget (next 7 days) |
| U4-S3 | FR-8.4 | Project progress charts widget |
| U4-S4 | FR-8.5 | Team workload overview widget |
| U4-S5 | FR-8.6 | Recent activity feed widget |
| U4-S6 | FR-9.1 | Completion rate chart (analytics page) |
| U4-S7 | FR-9.2 | Tasks by status chart |
| U4-S8 | FR-9.3 | Tasks by assignee chart |
| U4-S9 | FR-9.4 | Tasks by priority chart |
| U4-S10 | FR-9.5 | Time tracking report |
| U4-S11 | FR-7.1 | Notification bell with unread badge |
| U4-S12 | FR-7.4 | Notification panel (list, mark read, mark all read) |
| U4-S13 | FR-12.3 | Real-time notification count via socket |
| U4-S14 | FR-7.5 | Notification preferences page |
| U4-S15 | FR-10.2 | Workload warning in assignee picker |
| U4-S16 | FR-10.4 | Workload overview panel |
| U4-S17 | FR-11.1 | Export project modal (PDF/Excel) |
| U4-S18 | FR-11.4 | Share link modal (generate + copy + revoke) |
| U4-S19 | FR-11.5 | Email share modal |
| U4-S20 | FR-11.3 | Public share page (no auth, read-only) |
| U4-S21 | FR-2.3 | Profile settings page (displayName, avatarColor) |
| U4-S22 | NFR-5 | Keyboard shortcuts (N=new task, ESC=close panel, etc.) |
| U4-S23 | NFR-5 | Loading skeletons + empty states throughout |

## Total Stories: 55
- UNIT-1: 20 stories
- UNIT-2: 12 stories
- UNIT-3: 23 stories
- UNIT-4: 23 stories (some overlap with UNIT-3 infrastructure)
