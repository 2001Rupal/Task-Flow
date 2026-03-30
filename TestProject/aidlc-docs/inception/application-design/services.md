# Services — TaskFlow Pro

## Backend Services

### emailService (existing, extended)
**Purpose**: All outbound email via Nodemailer + Gmail SMTP
**Methods**:
- sendCollaborationInvitation(to, projectName, role, inviterEmail)
- sendWorkspaceInvitation(to, workspaceName, role, inviterEmail, inviteToken)
- sendProjectInvitation(to, projectName, role, inviterEmail, inviteToken)
- sendTaskAssignment(toEmail, assignerEmail, taskTitle, projectName, dueDate, priority, appUrl)
- sendTaskReassigned(toEmail, assignerEmail, taskTitle, projectName, newAssigneeEmail)
- sendReminder(userEmail, todoTitle, dueDate, listName) — fix arg order
- sendSharedContent(to, resourceName, format, fileBuffer, fileName, fileType)
- sendMentionNotification(toEmail, mentionerEmail, taskTitle, projectName, commentText, appUrl)
- sendNotificationEmail(toEmail, event, payload) — generic notification email

### tokenService (existing, unchanged)
**Purpose**: JWT generation/verification, UUID share tokens
**Methods**: generateJWT(userId, email), verifyJWT(token), generateShareToken()

### fileService (existing, unchanged)
**Purpose**: PDF and Excel generation
**Methods**: generateListPDF, generateListExcel, generateTodoPDF, generateTodoExcel

### socketService (new)
**Purpose**: Socket.IO server management and event emission
**Methods**:
- initialize(httpServer) — attach Socket.IO to HTTP server
- joinProjectRoom(socket, projectId) — subscribe to project events
- emitToProject(projectId, event, data) — broadcast to all project members
- emitToUser(userId, event, data) — send to specific user
- emitNotification(userId, notification) — real-time notification delivery
**Events**:
- task:created, task:updated, task:deleted
- comment:added, comment:deleted
- notification:new
- member:joined, member:left
- project:updated

### activityService (new)
**Purpose**: Create activity log entries when task fields change
**Methods**:
- logActivity(taskId, userId, field, oldValue, newValue) — create Activity document
- getTaskActivity(taskId) — fetch activity log for task
- formatActivityMessage(activity) — human-readable change description

### notificationService (new)
**Purpose**: Create and deliver notifications for all trigger events
**Methods**:
- createNotification(userId, type, payload) — create Notification document + emit socket event
- notifyTaskAssigned(task, assignedBy)
- notifyTaskStatusChanged(task, changedBy, oldStatus)
- notifyCommentAdded(comment, task, commenter)
- notifyMentioned(mentionedUserId, commenter, task, commentText)
- notifyDueDateApproaching(task, user)
- notifyProjectMemberAdded(projectId, addedUser, addedBy)
- notifyProjectMemberRemoved(projectId, removedUser, removedBy)
- sendEmailIfPreferred(userId, event, payload) — check preferences then send email

### uploadService (new)
**Purpose**: File upload handling via Multer
**Methods**:
- getMulterConfig() — returns configured Multer instance (dest: uploads/, limits: 10MB, filter: allowed types)
- deleteFile(filename) — remove file from uploads/
- getFilePath(filename) — resolve absolute path

---

## Frontend Services (API Layer)

### api/axiosClient.js
**Purpose**: Configured Axios instance with JWT interceptor, base URL, error handling
**Config**: baseURL from env, Authorization header injection, 401 redirect to login

### api/auth.js — register, login, logout, getProfile, updateProfile
### api/workspaces.js — full workspace CRUD + member management
### api/projects.js — full project CRUD + statuses + analytics + stats
### api/tasks.js — full task CRUD + subtasks + bulk + attachments + watchers + templates
### api/comments.js — comment CRUD
### api/notifications.js — notifications list + mark read + preferences
### api/tags.js — tag CRUD
### api/export.js — export endpoints
### api/share.js — share link + email share
### api/reminders.js — reminder check + upcoming

### socketClient.js
**Purpose**: Socket.IO client connection management
**Methods**: connect(token), disconnect(), on(event, handler), off(event, handler), joinProject(projectId), leaveProject(projectId)
