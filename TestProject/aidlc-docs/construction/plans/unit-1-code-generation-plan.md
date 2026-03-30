# Code Generation Plan — UNIT-1: Backend Foundation & Restructure

## Unit Context
- **Unit**: UNIT-1 — Backend Foundation & Restructure
- **Stories**: U1-S1 through U1-S20
- **Target directory**: TestProject/backend/
- **Root runner**: TestProject/package.json
- **Approach**: Move existing backend files → extend → add new

## Dependencies
- None (foundation unit)

---

## PHASE A: Project Restructure

- [ ] Step A1: Create TestProject/backend/ directory structure
- [ ] Step A2: Move all existing backend files into backend/ (config/, controllers/, middleware/, models/, routes/, services/, server.js, package.json, .env, .env.example, .gitignore)
- [ ] Step A3: Create TestProject/backend/uploads/ directory (with .gitkeep)
- [ ] Step A4: Create root TestProject/package.json with concurrently dev script
- [ ] Step A5: Update all relative require() paths inside moved files (../models → ./models etc.)

## PHASE B: Bug Fixes (U1-S1, U1-S2, U1-S3, U1-S4)

- [ ] Step B1: Fix authController.js — login response add displayName + avatarColor
- [ ] Step B2: Fix shareController.js — replace hardcoded localhost with process.env.APP_URL
- [ ] Step B3: Fix reminderController.js — correct sendReminder arg order (userEmail, title, dueDate, listName)
- [ ] Step B4: Fix profileController.js — getMyWork null dueDate sort (use $exists filter)

## PHASE C: Extend Existing Models

- [ ] Step C1: Extend backend/models/User.js — add notificationPreferences field
- [ ] Step C2: Extend backend/models/List.js — add workspaceId, color, icon, description, status, startDate, endDate fields + indexes
- [ ] Step C3: Extend backend/models/Todo.js — add watchers[] field
- [ ] Step C4: Extend backend/models/Comment.js — add mentions[], attachments[], editedAt fields
- [ ] Step C5: Extend backend/models/Collaboration.js — add status, inviteEmail, inviteToken fields

## PHASE D: New Models

- [ ] Step D1: Create backend/models/Workspace.js
- [ ] Step D2: Create backend/models/WorkspaceMember.js
- [ ] Step D3: Create backend/models/WorkspaceInvite.js
- [ ] Step D4: Create backend/models/ProjectStatus.js
- [ ] Step D5: Create backend/models/Attachment.js
- [ ] Step D6: Create backend/models/CustomField.js
- [ ] Step D7: Create backend/models/CustomFieldValue.js
- [ ] Step D8: Create backend/models/TaskTemplate.js
- [ ] Step D9: Create backend/models/Activity.js
- [ ] Step D10: Create backend/models/Notification.js

## PHASE E: New Services

- [ ] Step E1: Create backend/services/socketService.js
- [ ] Step E2: Create backend/services/activityService.js
- [ ] Step E3: Create backend/services/notificationService.js
- [ ] Step E4: Extend backend/services/emailService.js — add sendMentionNotification, sendNotificationEmail, sendWorkspaceInvitation
- [ ] Step E5: Create backend/middleware/upload.js (Multer config)

## PHASE F: New & Extended Controllers

- [ ] Step F1: Create backend/controllers/workspaceController.js
- [ ] Step F2: Extend backend/controllers/authController.js — create default workspace on register
- [ ] Step F3: Extend backend/controllers/listController.js → projectController — add workspaceId filter, project stats, analytics
- [ ] Step F4: Create backend/controllers/projectStatusController.js
- [ ] Step F5: Extend backend/controllers/todoController.js → taskController — add watchers, activity logging, socket emit, notifications
- [ ] Step F6: Create backend/controllers/attachmentController.js
- [ ] Step F7: Create backend/controllers/activityController.js
- [ ] Step F8: Create backend/controllers/notificationController.js
- [ ] Step F9: Extend backend/controllers/collaborationController.js — add pending invite support
- [ ] Step F10: Extend backend/controllers/profileController.js — add getWorkload endpoint

## PHASE G: New & Extended Routes

- [ ] Step G1: Create backend/routes/workspaceRoutes.js
- [ ] Step G2: Create backend/routes/projectStatusRoutes.js
- [ ] Step G3: Create backend/routes/attachmentRoutes.js
- [ ] Step G4: Create backend/routes/activityRoutes.js
- [ ] Step G5: Create backend/routes/notificationRoutes.js
- [ ] Step G6: Update backend/routes/todoRoutes.js — add watcher endpoints
- [ ] Step G7: Update backend/routes/collaborationRoutes.js — add invite endpoints

## PHASE H: Server & Socket.IO Integration

- [ ] Step H1: Update backend/server.js — integrate Socket.IO, add all new routes, update static file serving
- [ ] Step H2: Update backend/package.json — add socket.io, multer dependencies
- [ ] Step H3: Update backend/.env.example — add APP_URL, WORKLOAD_TASK_THRESHOLD, WORKLOAD_HOUR_THRESHOLD

---

## Story Traceability
| Step | Story |
|---|---|
| A1-A5 | U1-S19 |
| B1 | U1-S1 |
| B2 | U1-S2 |
| B3 | U1-S3 |
| B4 | U1-S4 |
| C1 | U1-S14 |
| C2 | U1-S6 |
| C3 | U1-S11 |
| C4 | U1-S20 |
| C5 | U1-S8 |
| D1-D3 | U1-S4, U1-S5 |
| D4 | U1-S7 |
| D5 | U1-S9 |
| D6-D7 | U1-S10 |
| D8 | U1-S12 |
| D9 | U1-S13 |
| D10 | U1-S14 |
| E1 | U1-S15 |
| E2 | U1-S13 |
| E3 | U1-S14 |
| E4 | U1-S14, U1-S20 |
| E5 | U1-S9 |
| F1 | U1-S4, U1-S5 |
| F2 | U1-S1 |
| F3 | U1-S6, U1-S17, U1-S18 |
| F4 | U1-S7 |
| F5 | U1-S11, U1-S13, U1-S14, U1-S15 |
| F6 | U1-S9 |
| F7 | U1-S13 |
| F8 | U1-S14 |
| F9 | U1-S8 |
| F10 | U1-S16 |
| G1-G7 | All route stories |
| H1-H3 | U1-S15, U1-S19 |
