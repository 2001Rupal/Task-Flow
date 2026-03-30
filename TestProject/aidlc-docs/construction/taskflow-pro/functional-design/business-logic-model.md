# Business Logic Model — UNIT-1: Backend Foundation

## BL-1: User Registration Flow
```
1. Validate email format + password length (>= 6)
2. Check email uniqueness → 409 if exists
3. Hash password (bcrypt, rounds=10)
4. Create User document
5. Create default Workspace: name = "{email}'s Workspace"
6. Create WorkspaceMember: workspaceId=new, userId=new, role='Owner'
7. Return { userId, message }
```

## BL-2: User Login Flow
```
1. Validate email + password present
2. Find User by email → 401 if not found
3. comparePassword(candidate) → 401 if mismatch
4. generateJWT(userId, email) → token (24h)
5. Trigger checkAndSendReminders(userId) async (non-blocking)
6. Return { token, userId, email, displayName, avatarColor }
```

## BL-3: Project Creation Flow
```
1. Validate name (1-100 chars)
2. Verify user is WorkspaceMember of workspaceId
3. Create List/Project document with all fields
4. Create Collaboration: listId=new, userId=creator, role='Owner'
5. Seed 3 default ProjectStatus documents:
   - { name:'To Do', color:'#94a3b8', order:0, isDefault:true }
   - { name:'In Progress', color:'#6366f1', order:1, isDefault:true }
   - { name:'Done', color:'#10b981', order:2, isDefault:true }
6. Return project
```

## BL-4: Task Creation Flow
```
1. Validate title (1-200 chars), listId present
2. Verify user has Collaboration access (not Viewer)
3. Validate status exists in project's ProjectStatus list (default 'To Do')
4. Validate assignedTo is project member (if provided)
5. Validate watchers are project members (if provided)
6. Validate startDate <= dueDate (if both provided)
7. Create Todo document
8. activityService.logActivity(taskId, userId, 'created', null, task.title)
9. If assignedTo: notificationService.notifyTaskAssigned(task, req.user)
10. socketService.emitToProject(listId, 'task:created', populatedTask)
11. Return populated task
```

## BL-5: Task Update Flow
```
1. Find task → 404 if not found
2. Verify user has Collaboration access (not Viewer)
3. For each changed field:
   a. Capture oldValue
   b. Apply new value with validation
   c. activityService.logActivity(taskId, userId, action, oldValue, newValue)
4. Special handling:
   - status → 'Done' (case-insensitive): set completedAt=now
   - status away from 'Done': clear completedAt
   - assignedTo changed: notificationService.notifyTaskAssigned + notifyTaskReassigned
   - status changed: notificationService.notifyTaskStatusChanged (to assignee + watchers)
5. Save task
6. socketService.emitToProject(listId, 'task:updated', populatedTask)
7. Return populated task
```

## BL-6: Custom Status Deletion Flow
```
1. Verify user is project Owner
2. Find status → 404 if not found
3. Check isDefault → 400 if true (cannot delete defaults)
4. Bulk update all tasks with this status → set status = 'To Do'
5. Delete ProjectStatus document
6. Return { message, tasksUpdated: count }
```

## BL-7: Comment Creation with @Mentions
```
1. Validate text (1-10000 chars)
2. Verify user has project access
3. Parse mentions[] from request body
4. Validate each mention is a project member
5. Create Comment document
6. For each mentioned userId (excluding commenter):
   notificationService.notifyMentioned(userId, commenter, task, text)
7. Notify task assignee + watchers (if not the commenter):
   notificationService.notifyCommentAdded(comment, task, commenter)
8. socketService.emitToProject(listId, 'comment:added', comment)
9. Return populated comment
```

## BL-8: Notification Creation Flow
```
1. Check user's notificationPreferences for event type
2. If inApp enabled:
   a. Create Notification document
   b. socketService.emitToUser(userId, 'notification:new', notification)
   c. Prune if user has > 500 notifications (delete oldest)
3. If email enabled:
   a. emailService.sendNotificationEmail(userEmail, type, payload) async
   b. Catch and log email errors (never fail the request)
```

## BL-9: Activity Logging Flow
```
activityService.logActivity(taskId, userId, action, oldValue, newValue):
1. Create Activity document (append-only)
2. Format human-readable message based on action type
3. Return activity document

Action → message mapping:
- 'created'          → "{user} created this task"
- 'status_changed'   → "{user} changed status from {old} to {new}"
- 'assigned'         → "{user} assigned to {new}" / "{user} unassigned {old}"
- 'priority_changed' → "{user} changed priority from {old} to {new}"
- 'due_date_changed' → "{user} set due date to {new}" / "{user} removed due date"
- 'subtask_added'    → "{user} added subtask: {new}"
- 'subtask_completed'→ "{user} completed subtask: {new}"
- 'attachment_added' → "{user} attached {new}"
- 'watcher_added'    → "{user} added {new} as watcher"
- 'tag_added'        → "{user} added tag: {new}"
```

## BL-10: File Upload Flow
```
1. Multer validates: size <= 10MB, MIME type in allowed list
2. Generate UUID filename: {uuid}.{ext}
3. Save to backend/uploads/{uuid}.{ext}
4. Check task attachment count <= 5 → 400 if exceeded
5. Create Attachment document
6. activityService.logActivity(taskId, userId, 'attachment_added', null, originalName)
7. Return attachment metadata
```

## BL-11: Workload Calculation
```
GET /api/profile/workload?workspaceId=:id
1. Get all projects in workspace where user is member
2. For each project member (userId):
   a. Count tasks where assignedTo=userId AND status != 'Done' AND listId in workspace projects
   b. Sum estimatedHours for same filter
3. Mark overloaded if taskCount >= WORKLOAD_TASK_THRESHOLD OR estimatedHours >= WORKLOAD_HOUR_THRESHOLD
4. Return array of { userId, email, displayName, avatarColor, taskCount, estimatedHours, isOverloaded }
```

## BL-12: Project Analytics
```
GET /api/projects/:id/analytics
1. Verify user has project access
2. Fetch all tasks for project
3. Compute:
   a. completionOverTime: group tasks by completedAt date (last 30 days), count per day
   b. tasksByStatus: count per status name
   c. tasksByPriority: count per priority
   d. tasksByAssignee: count per assignee (userId, email, displayName)
   e. timeTracking: per assignee { estimatedHours, loggedHours }
4. Return analytics object
```

## BL-13: Socket.IO Room Management
```
On client connect:
1. Verify JWT from handshake auth.token
2. Join user's personal room: socket.join(`user:${userId}`)

On client joinProject(projectId):
1. Verify user has project access
2. socket.join(`project:${projectId}`)

emitToProject(projectId, event, data):
  io.to(`project:${projectId}`).emit(event, data)

emitToUser(userId, event, data):
  io.to(`user:${userId}`).emit(event, data)
```

## BL-14: Invite Accept Flow (Workspace)
```
GET /api/workspaces/invite/accept?token=:token
1. Find WorkspaceInvite by token → 404 if not found
2. Check status === 'pending' → 400 if not
3. Check expiresAt > now → 410 if expired
4. Find or create User by invite email
5. Create WorkspaceMember: workspaceId, userId, role from invite
6. Update invite status = 'accepted'
7. Return { workspace, message }
```
