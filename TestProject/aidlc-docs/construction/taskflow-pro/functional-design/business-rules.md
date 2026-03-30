# Business Rules — UNIT-1: Backend Foundation

## BR-1: Authentication

| ID | Rule |
|---|---|
| BR-1.1 | Email must match regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` |
| BR-1.2 | Password minimum 6 characters |
| BR-1.3 | Email stored lowercase, trimmed |
| BR-1.4 | JWT expires in 24h (configurable via JWT_EXPIRATION env) |
| BR-1.5 | Login response MUST include: token, userId, email, displayName, avatarColor |
| BR-1.6 | On registration, create a default personal workspace named "{displayName || email}'s Workspace" |
| BR-1.7 | On registration, add user as Owner of their default workspace |

## BR-2: Workspace

| ID | Rule |
|---|---|
| BR-2.1 | Workspace name: 1–100 characters, required |
| BR-2.2 | Only workspace Owner can delete the workspace |
| BR-2.3 | Deleting a workspace cascades: delete all projects, tasks, comments, activities, notifications, members |
| BR-2.4 | Workspace Owner cannot be removed from their own workspace |
| BR-2.5 | Workspace Owner cannot change their own role |
| BR-2.6 | Invite token expires in 7 days |
| BR-2.7 | Accepting an invite creates a WorkspaceMember record and marks invite as accepted |
| BR-2.8 | Inviting an already-active member updates their role instead of creating a duplicate |
| BR-2.9 | Workspace roles: Owner > Admin > Member. Admins can manage Members but not other Admins or Owner |

## BR-3: Projects

| ID | Rule |
|---|---|
| BR-3.1 | Project name: 1–100 characters, required |
| BR-3.2 | Project must belong to a workspace the creator is a member of |
| BR-3.3 | Project creator is automatically added as Owner in Collaboration |
| BR-3.4 | Only project Owner can delete the project |
| BR-3.5 | Deleting a project cascades: delete all tasks, comments, activities, attachments, tags, custom fields, statuses, share links |
| BR-3.6 | Project status transitions: Active ↔ On Hold ↔ Archived (any direction allowed) |
| BR-3.7 | Archived projects are read-only — no new tasks or edits allowed |
| BR-3.8 | Project endDate must be after startDate if both are set |
| BR-3.9 | Only Owner can invite collaborators; Owner and Admin can manage members |
| BR-3.10 | Viewer role: read-only access to project and tasks |
| BR-3.11 | Editor role: create/update/delete tasks; cannot manage members or delete project |
| BR-3.12 | Owner role: full control |

## BR-4: Project Statuses

| ID | Rule |
|---|---|
| BR-4.1 | Every new project gets 3 default statuses seeded: "To Do" (#94a3b8), "In Progress" (#6366f1), "Done" (#10b981) |
| BR-4.2 | Default statuses cannot be deleted (isDefault: true) |
| BR-4.3 | Custom status name: 1–50 characters, unique within project |
| BR-4.4 | Deleting a custom status reassigns all tasks with that status to "To Do" |
| BR-4.5 | Status order is maintained; reordering updates all order fields |
| BR-4.6 | Maximum 20 statuses per project |

## BR-5: Tasks

| ID | Rule |
|---|---|
| BR-5.1 | Task title: 1–200 characters, required |
| BR-5.2 | Task description: max 5000 characters (rich text HTML) |
| BR-5.3 | Task status must match one of the project's ProjectStatus names |
| BR-5.4 | Due date must be a valid date; no restriction on past dates (allows editing overdue tasks) |
| BR-5.5 | Start date must be before or equal to due date if both are set |
| BR-5.6 | Assignee must be a member of the project |
| BR-5.7 | Watchers must be members of the project |
| BR-5.8 | When status changes to a status with name "Done" (case-insensitive), set completedAt = now |
| BR-5.9 | When status changes away from "Done", clear completedAt |
| BR-5.10 | loggedHours cannot be negative |
| BR-5.11 | estimatedHours cannot be negative |
| BR-5.12 | Subtask title: 1–200 characters |
| BR-5.13 | Maximum 50 subtasks per task |
| BR-5.14 | blockedBy cannot reference the task itself (no self-dependency) |
| BR-5.15 | Viewers cannot create, update, or delete tasks |
| BR-5.16 | Task order field used for drag-and-drop sorting within a status group |

## BR-6: Attachments

| ID | Rule |
|---|---|
| BR-6.1 | Maximum file size: 10MB (10,485,760 bytes) |
| BR-6.2 | Maximum 5 attachments per task |
| BR-6.3 | Allowed MIME types: image/jpeg, image/png, image/gif, image/webp, application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/zip |
| BR-6.4 | Stored filename is UUID-based to prevent collisions |
| BR-6.5 | Only the uploader or project Owner can delete an attachment |
| BR-6.6 | Deleting a task cascades: delete all attachment files from disk |

## BR-7: Comments

| ID | Rule |
|---|---|
| BR-7.1 | Comment text: 1–10000 characters (rich text HTML), required |
| BR-7.2 | Only the comment author can edit or delete their comment |
| BR-7.3 | @mentions must reference valid project members |
| BR-7.4 | Editing a comment sets editedAt timestamp |
| BR-7.5 | Comment attachments follow the same rules as task attachments (BR-6) |

## BR-8: Activity Log

| ID | Rule |
|---|---|
| BR-8.1 | Activity records are append-only — never updated or deleted |
| BR-8.2 | Activity is created for every task field change: status, priority, assignee, due date, start date, title, description, subtask add/complete, attachment add/remove, watcher add/remove, tag add/remove |
| BR-8.3 | Activity is created when a task is first created (action: 'created') |
| BR-8.4 | Activity stores both oldValue and newValue for all field changes |
| BR-8.5 | Activity userId is the user who made the change |

## BR-9: Notifications

| ID | Rule |
|---|---|
| BR-9.1 | Notifications are created for all trigger events defined in FR-7.3 |
| BR-9.2 | A user does not receive a notification for their own actions |
| BR-9.3 | Email notification is only sent if user's preference for that event has email: true |
| BR-9.4 | In-app notification is only sent if user's preference for that event has inApp: true |
| BR-9.5 | Notification delivery failures (email) do not fail the originating request |
| BR-9.6 | Notifications are delivered in real-time via Socket.IO to connected clients |
| BR-9.7 | Maximum 500 notifications stored per user; oldest are pruned when limit exceeded |

## BR-10: Workload Balancing

| ID | Rule |
|---|---|
| BR-10.1 | Workload is calculated as: active task count (status != Done) + total estimatedHours of active tasks |
| BR-10.2 | Overload threshold defaults: 10 tasks OR 40 estimated hours (configurable via env: WORKLOAD_TASK_THRESHOLD, WORKLOAD_HOUR_THRESHOLD) |
| BR-10.3 | Workload warning is informational only — assignment is not blocked |
| BR-10.4 | Workload is scoped to a workspace (across all projects in the workspace) |

## BR-11: File Upload Security

| ID | Rule |
|---|---|
| BR-11.1 | File type validated by MIME type, not just extension |
| BR-11.2 | Filename sanitized — original name stored in DB, UUID used on disk |
| BR-11.3 | Upload directory is outside the public web root |
| BR-11.4 | Download requires authentication (except public share links) |

## BR-12: Share Links

| ID | Rule |
|---|---|
| BR-12.1 | Share links use UUID tokens — unguessable |
| BR-12.2 | Share links do not expire automatically |
| BR-12.3 | Only the creator can revoke a share link |
| BR-12.4 | Public share endpoint returns read-only data — no auth required |
| BR-12.5 | Share URL uses APP_URL env var (not hardcoded localhost) |

## BR-13: Reminders

| ID | Rule |
|---|---|
| BR-13.1 | Reminder check triggered on user login |
| BR-13.2 | Reminder sent for tasks due within next 24 hours, status != Done |
| BR-13.3 | Maximum one reminder per task per day (lastReminderSent tracks this) |
| BR-13.4 | Reminder email uses correct arg order: (userEmail, taskTitle, dueDate, listName) |
