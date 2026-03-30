# Component Methods — TaskFlow Pro

## Backend Controllers

### Auth Controller
| Method | Signature | Purpose |
|---|---|---|
| register | POST body: {email, password} → {userId, message} | Create user + default workspace |
| login | POST body: {email, password} → {token, userId, email, displayName, avatarColor} | Authenticate + return full profile |
| logout | POST → {message} | Client-side token removal |

### Workspace Controller
| Method | Signature | Purpose |
|---|---|---|
| createWorkspace | POST body: {name, description} → {workspace} | Create workspace + add creator as Owner |
| getWorkspaces | GET → {workspaces[]} | All workspaces for current user |
| getWorkspace | GET :id → {workspace, members[]} | Single workspace with members |
| updateWorkspace | PUT :id body: {name, description} → {workspace} | Update workspace metadata |
| deleteWorkspace | DELETE :id → {message} | Delete workspace + cascade |
| getMembers | GET :id/members → {members[]} | List workspace members |
| inviteMember | POST :id/invite body: {email, role} → {invite} | Send email invite, create pending record |
| updateMemberRole | PUT :id/members/:memberId body: {role} → {member} | Change member role |
| removeMember | DELETE :id/members/:memberId → {message} | Remove member |

### Project Controller
| Method | Signature | Purpose |
|---|---|---|
| createProject | POST body: {workspaceId, name, color, icon, description, status, startDate, endDate} → {project} | Create project |
| getProjects | GET ?workspaceId → {projects[]} | All projects in workspace |
| getProject | GET :id → {project, role} | Single project with user's role |
| updateProject | PUT :id body: {name, color, icon, description, status, startDate, endDate} → {project} | Update project |
| deleteProject | DELETE :id → {message} | Delete + cascade tasks |
| inviteMember | POST :id/invite body: {email, role} → {invite} | Invite to project |
| getStatuses | GET :id/statuses → {statuses[]} | Custom statuses for project |
| createStatus | POST :id/statuses body: {name, color, order} → {status} | Add custom status |
| updateStatus | PUT :id/statuses/:statusId body: {name, color, order} → {status} | Edit status |
| deleteStatus | DELETE :id/statuses/:statusId → {message} | Remove status (reassign tasks) |
| getStats | GET :id/stats → {total, byStatus{}, byPriority{}, byAssignee{}, completion%} | Project stats |
| getAnalytics | GET :id/analytics → {completionOverTime[], tasksByAssignee[], timeTracking[]} | Analytics data |

### Task Controller
| Method | Signature | Purpose |
|---|---|---|
| createTask | POST body: {projectId, title, description, status, priority, dueDate, startDate, assignedTo, tags[], estimatedHours, recurrence, blockedBy[], sectionId, order} → {task} | Create task + emit socket event + create activity |
| getTasks | GET ?projectId → {tasks[]} | All tasks in project (populated) |
| getTask | GET :id → {task} | Single task fully populated |
| updateTask | PUT :id body: {any fields} → {task} | Update task + activity log + socket emit + notifications |
| deleteTask | DELETE :id → {message} | Delete task + cascade |
| addSubtask | POST :id/subtasks body: {title} → {subtasks[]} | Add subtask |
| updateSubtask | PUT :id/subtasks/:subtaskId body: {title, completed} → {subtasks[]} | Update subtask |
| deleteSubtask | DELETE :id/subtasks/:subtaskId → {subtasks[]} | Remove subtask |
| bulkUpdate | POST /bulk body: {ids[], status?, priority?, assignedTo?, deleteAll?} → {message} | Bulk operations |
| uploadAttachment | POST :id/attachments (multipart) → {attachment} | Upload file |
| downloadAttachment | GET :id/attachments/:attachmentId → file stream | Download file |
| deleteAttachment | DELETE :id/attachments/:attachmentId → {message} | Delete file |
| addWatcher | POST :id/watchers body: {userId} → {watchers[]} | Add watcher |
| removeWatcher | DELETE :id/watchers/:userId → {watchers[]} | Remove watcher |
| getActivity | GET :id/activity → {activities[]} | Task activity log |
| saveTemplate | POST /templates body: {taskId, name} → {template} | Save task as template |
| getTemplates | GET /templates?projectId → {templates[]} | List templates |
| createFromTemplate | POST /from-template/:templateId body: {projectId, overrides} → {task} | Create from template |

### Comment Controller
| Method | Signature | Purpose |
|---|---|---|
| getComments | GET /tasks/:taskId → {comments[]} | All comments for task |
| addComment | POST /tasks/:taskId body: {text, mentions[], attachments[]} → {comment} | Add comment + notify mentions |
| updateComment | PUT /:id body: {text} → {comment} | Edit own comment |
| deleteComment | DELETE /:id → {message} | Delete own comment |

### Notification Controller
| Method | Signature | Purpose |
|---|---|---|
| getNotifications | GET ?page&limit → {notifications[], unreadCount} | Paginated notifications |
| markRead | PUT /:id/read → {notification} | Mark single as read |
| markAllRead | PUT /read-all → {message} | Mark all as read |
| getPreferences | GET /preferences → {preferences} | User notification preferences |
| updatePreferences | PUT /preferences body: {events{}} → {preferences} | Update preferences |

### Profile Controller
| Method | Signature | Purpose |
|---|---|---|
| getProfile | GET → {user} | Current user profile |
| updateProfile | PUT body: {displayName, avatarColor} → {user} | Update profile |
| getMyWork | GET ?status&priority → {tasks[]} | Tasks assigned to me across all projects |
| getWorkload | GET ?workspaceId → {members[{userId, taskCount, estimatedHours, tasks[]}]} | Workload per member |

---

## Frontend Key Hooks

| Hook | Purpose |
|---|---|
| useAuth() | Auth state, login/logout/register actions |
| useWorkspace() | Current workspace, switch workspace |
| useProject(id) | Project data, members, statuses |
| useTasks(projectId) | Tasks list, CRUD actions, filters |
| useTaskDetail(id) | Single task, comments, activity |
| useNotifications() | Notifications list, unread count, mark read |
| useSocket() | Socket.IO connection, event subscriptions |
| useWorkload(workspaceId) | Member workload data |
| useAnalytics(projectId) | Analytics data for charts |
| useDragDrop() | Drag-and-drop state for board/list |
| useCommandPalette() | Command palette open/close, search |
| useTheme() | Dark/light theme toggle + system preference |
