# Requirements — TaskFlow Pro (Asana-Like Task Management Platform)

## Intent Analysis

### User Request
Evolve the existing basic Todo App into a full-featured task management platform similar to Asana, with a React frontend, extended Node.js/MongoDB backend, and additional features beyond Asana's core offering.

### Request Type
Major Enhancement (Brownfield) — existing backend is retained and extended; frontend is rebuilt from scratch in React.

### Scope Estimate
System-wide — affects all layers: data models, backend API, frontend, infrastructure, and project structure.

### Complexity Estimate
High — multi-workspace architecture, 5 view types (List, Board, Calendar, Timeline, Table), real-time WebSocket updates, file uploads, rich text comments, activity logs, notifications, analytics, and smart workload balancing.

---

## Project Structure Decision

### Folder Layout
```
TestProject/
├── backend/        # Node.js/Express/MongoDB (moved from root)
├── frontend/       # React + Vite + shadcn/ui + Tailwind
└── package.json    # Root-level concurrent dev runner
```

---

## Functional Requirements

### FR-1: Multi-Workspace Architecture
- **FR-1.1**: Users can create multiple workspaces
- **FR-1.2**: Each workspace has a name, description, and owner
- **FR-1.3**: Workspace owners can invite members by email (pending invite state shown)
- **FR-1.4**: Users can switch between workspaces via a workspace switcher in the UI
- **FR-1.5**: Projects belong to a workspace
- **FR-1.6**: Workspace members can be assigned roles: Owner, Admin, Member
- **FR-1.7**: A default personal workspace is created on user registration

### FR-2: User Authentication & Profile
- **FR-2.1**: Register with email and password (min 6 chars)
- **FR-2.2**: Login returns JWT token + userId + email + displayName + avatarColor
- **FR-2.3**: Profile: displayName, avatarColor, email (read-only)
- **FR-2.4**: Dark/light theme toggle + system preference detection

### FR-3: Projects (formerly Lists)
- **FR-3.1**: Projects have: name, color, icon, description, status (Active/Archived/On Hold), start date, end date, owner
- **FR-3.2**: Projects belong to a workspace
- **FR-3.3**: Project members have roles: Owner, Editor, Viewer
- **FR-3.4**: Owners can invite collaborators by email — pending invite state shown in members list
- **FR-3.5**: Projects support custom statuses (hybrid: defaults To Do / In Progress / Done + user-defined)
- **FR-3.6**: Each custom status has a name and color
- **FR-3.7**: Projects can be archived or deleted (cascade deletes tasks)

### FR-4: Tasks
- **FR-4.1**: Tasks have: title, description (rich text), status, priority (Low/Medium/High/Urgent), due date, start date, assignee, subtasks, tags, time tracking (estimated/logged hours), recurrence, dependencies (blockedBy), order, section/column
- **FR-4.2**: Tasks support file attachments (upload to server, stored in backend/uploads/)
- **FR-4.3**: Tasks support custom fields per project (text, number, date, dropdown types)
- **FR-4.4**: Tasks support watchers — users who receive notifications but are not the assignee
- **FR-4.5**: Task status options come from the project's custom status list
- **FR-4.6**: Bulk operations: set status, set priority, assign, delete for multiple selected tasks
- **FR-4.7**: Drag-and-drop reordering within list view and between columns in board view
- **FR-4.8**: Task templates — save a task as a template, create new tasks from templates

### FR-5: Views (per project)
- **FR-5.1 List View**: Sortable/filterable task list with inline editing, grouping by status/assignee/priority
- **FR-5.2 Board View**: Kanban columns = statuses (custom columns = custom statuses). Drag task between columns changes status.
- **FR-5.3 Calendar View**: Monthly calendar showing tasks by due date; click day to add task
- **FR-5.4 Timeline View**: Interactive Gantt chart — drag task bars to change start/due dates, resize bars to change duration
- **FR-5.5 Table View**: Spreadsheet-like view with all task fields as columns, inline editing

### FR-6: Comments & Activity Feed (per task)
- **FR-6.1**: Rich text comments (bold, italic, lists, code blocks)
- **FR-6.2**: @mention support in comments — notifies mentioned user
- **FR-6.3**: File attachments on comments
- **FR-6.4**: Activity log tracks all field changes: status, priority, assignee, due date, title, description, subtasks, tags, watchers
- **FR-6.5**: Activity and comments shown in unified chronological feed on task detail panel

### FR-7: Notifications
- **FR-7.1**: In-app notification bell with unread count badge
- **FR-7.2**: Email notifications for all trigger events
- **FR-7.3**: Notification triggers:
  - Task assigned to me
  - Task commented on (when I'm assignee, watcher, or mentioned)
  - @mention in a comment
  - Task status changed (when I'm assignee or watcher)
  - Due date approaching (24h before, for incomplete tasks)
  - Project updates (member added/removed, project archived)
  - Collaborator added/removed from project
- **FR-7.4**: Mark individual notifications as read; mark all as read
- **FR-7.5**: Notification preferences per user (which events to receive email for)

### FR-8: Dashboard (Global Home)
- **FR-8.1**: My assigned tasks across all workspaces/projects
- **FR-8.2**: Overdue task count and list
- **FR-8.3**: Upcoming deadlines (next 7 days)
- **FR-8.4**: Project progress charts (completion % per project)
- **FR-8.5**: Team workload overview (tasks per member across workspace)
- **FR-8.6**: Recent activity feed (across all projects user has access to)

### FR-9: Project Analytics
- **FR-9.1**: Completion rate chart (tasks completed over time)
- **FR-9.2**: Tasks by status breakdown (pie/bar chart)
- **FR-9.3**: Tasks by assignee (who has how many tasks)
- **FR-9.4**: Tasks by priority breakdown
- **FR-9.5**: Time tracking report (estimated vs logged hours per task/assignee)

### FR-10: Smart Workload Balancing (New Feature)
- **FR-10.1**: Per-workspace, track task count and total estimated hours per member
- **FR-10.2**: When assigning a task, show assignee's current workload (task count + hours)
- **FR-10.3**: Visual warning indicator when a member exceeds configurable threshold (default: 10 tasks or 40h/week)
- **FR-10.4**: Workload overview panel in dashboard showing all members' load

### FR-11: Export & Share
- **FR-11.1**: Export project to PDF or Excel (includes all tasks, statuses, assignees)
- **FR-11.2**: Export single task to PDF or Excel
- **FR-11.3**: Share project via public read-only link (no login required)
- **FR-11.4**: Share task via public read-only link
- **FR-11.5**: Share via email with PDF/Excel attachment
- **FR-11.6**: Share links remain active until manually revoked

### FR-12: Real-Time Updates (WebSocket)
- **FR-12.1**: Task changes (create/update/delete) broadcast to all project members in real-time
- **FR-12.2**: New comments appear in real-time for all users viewing the task
- **FR-12.3**: Notification count updates in real-time
- **FR-12.4**: Online presence indicator (show which members are currently active)

### FR-13: File Uploads
- **FR-13.1**: Upload files as task attachments (max 10MB per file, max 5 files per task)
- **FR-13.2**: Supported types: images (jpg, png, gif, webp), documents (pdf, docx, xlsx), archives (zip)
- **FR-13.3**: Files stored in backend/uploads/ directory
- **FR-13.4**: Download and delete attachment endpoints

### FR-14: Reminders
- **FR-14.1**: On-demand reminder check triggered on login
- **FR-14.2**: Email reminder sent 24h before due date for incomplete tasks
- **FR-14.3**: Once-per-day reminder per task (no duplicates)

---

## Non-Functional Requirements

### NFR-1: Technology Stack
- **Frontend**: React 18 + Vite, shadcn/ui + Tailwind CSS, Redux Toolkit (state), React Router v6
- **Backend**: Node.js + Express.js (existing, extended)
- **Database**: MongoDB + Mongoose (existing, extended)
- **Real-time**: Socket.IO (WebSocket)
- **File uploads**: Multer
- **Auth**: JWT (existing)
- **PDF**: PDFKit (existing)
- **Excel**: ExcelJS (existing)
- **Email**: Nodemailer + Gmail SMTP (existing)

### NFR-2: Project Structure
```
TestProject/
├── backend/                  # Express API (moved from root)
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── uploads/              # File upload storage
│   ├── server.js
│   └── package.json
├── frontend/                 # React app
│   ├── src/
│   │   ├── api/
│   │   ├── app/              # Redux store
│   │   ├── components/       # Shared UI components
│   │   ├── features/         # Feature slices
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── package.json              # Root: concurrent dev runner
```

### NFR-3: Security
- Passwords hashed with bcrypt
- JWT with 24h expiration
- All API endpoints authenticated (except auth + public share)
- Role-based access control enforced server-side
- File upload validation (type + size)
- Input sanitization

### NFR-4: Performance
- API response < 500ms for CRUD
- File generation < 5s for lists up to 100 tasks
- WebSocket events delivered < 100ms
- Frontend bundle < 500KB gzipped (code splitting per route)

### NFR-5: UX
- Dark/light theme (toggle + system preference)
- Responsive: desktop-first, mobile-friendly
- Keyboard shortcuts (⌘K command palette, N for new task, etc.)
- Toast notifications for all actions
- Optimistic UI updates where appropriate

### NFR-6: Development
- Root `package.json` with `npm run dev` starts both backend and frontend concurrently
- `.env` in backend/ for all environment variables
- Hot reload for both frontend (Vite HMR) and backend (nodemon)

---

## Backend Improvements Required

### Bug Fixes
1. `shareController` — hardcoded `http://localhost:3000` → use `process.env.APP_URL`
2. `authController` login — response missing `displayName` and `avatarColor`
3. `reminderController` — `sendReminder` arg order wrong (listName/dueDate swapped)
4. `getMyWork` — null dueDate sort fix needed

### New Models
- `Workspace` — multi-workspace support
- `WorkspaceMember` — workspace membership + roles
- `ProjectInvite` — pending email invites (project level)
- `WorkspaceInvite` — pending email invites (workspace level)
- `Activity` — task activity log
- `Notification` — in-app notifications
- `Attachment` — file upload metadata
- `CustomField` — per-project custom field definitions
- `CustomFieldValue` — per-task custom field values
- `TaskTemplate` — reusable task templates
- `ProjectStatus` — custom statuses per project

### New API Endpoints
- Workspace CRUD + member management
- Invite by email (workspace + project level)
- Activity log per task
- Notifications (list, mark read, preferences)
- File upload/download/delete
- Custom fields CRUD
- Task templates CRUD
- Project statuses CRUD
- Workload stats per workspace
- Project analytics
- WebSocket events via Socket.IO

---

## Out of Scope
- Mobile native apps
- Offline support
- Social login (Google, GitHub)
- Recurring tasks automation (background job) — on-demand only
- AI features (deferred to future)
- Natural language date parsing (deferred)
- Browser push notifications (in-app + email only)

---

## Success Criteria
1. Users can create workspaces, invite members, and switch between workspaces
2. Projects support full metadata (color, icon, description, status, dates)
3. All 5 views work: List, Board, Calendar, Timeline (interactive Gantt), Table
4. Task detail panel shows rich text comments, @mentions, activity feed, attachments
5. Real-time updates via WebSocket for all project members
6. In-app + email notifications for all defined trigger events
7. Global dashboard with workload overview and project progress
8. Project analytics with charts
9. Smart workload balancing warns when member is overloaded
10. Export to PDF/Excel and public share links work
11. Dark/light theme with system preference detection
12. App runs with single `npm run dev` from root
