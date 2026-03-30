# Domain Entities — UNIT-1: Backend Foundation

## Entity Relationship Overview
```
User ──< WorkspaceMember >── Workspace ──< Project ──< Task
                                              │           │
                                              │           ├──< Subtask (embedded)
                                              │           ├──< Comment
                                              │           ├──< Activity
                                              │           ├──< Attachment
                                              │           ├──< CustomFieldValue
                                              │           └──< TaskWatcher (embedded)
                                              │
                                              ├──< ProjectMember (Collaboration)
                                              ├──< ProjectStatus
                                              ├──< CustomField
                                              ├──< Tag
                                              └──< TaskTemplate
User ──< Notification
User ──< ShareLink
```

---

## Entities

### User (extend existing)
| Field | Type | Constraints | Notes |
|---|---|---|---|
| _id | ObjectId | auto | |
| email | String | required, unique, lowercase | |
| password | String | required, bcrypt hashed | |
| displayName | String | max 50, default '' | |
| avatarColor | String | hex color, random default | |
| notificationPreferences | Object | see below | |
| createdAt | Date | auto | |
| updatedAt | Date | auto | |

notificationPreferences shape:
```js
{
  taskAssigned: { inApp: true, email: true },
  taskStatusChanged: { inApp: true, email: false },
  commentAdded: { inApp: true, email: true },
  mentioned: { inApp: true, email: true },
  dueDateApproaching: { inApp: true, email: true },
  projectUpdates: { inApp: true, email: false },
  memberChanges: { inApp: true, email: false }
}
```

---

### Workspace (new)
| Field | Type | Constraints | Notes |
|---|---|---|---|
| _id | ObjectId | auto | |
| name | String | required, max 100 | |
| description | String | max 500, default '' | |
| ownerId | ObjectId ref User | required | |
| createdAt | Date | auto | |
| updatedAt | Date | auto | |

Indexes: `{ ownerId: 1 }`

---

### WorkspaceMember (new)
| Field | Type | Constraints | Notes |
|---|---|---|---|
| _id | ObjectId | auto | |
| workspaceId | ObjectId ref Workspace | required | |
| userId | ObjectId ref User | required | |
| role | String enum | Owner, Admin, Member | |
| joinedAt | Date | default now | |

Indexes: `{ workspaceId: 1, userId: 1 }` unique, `{ userId: 1 }`

---

### WorkspaceInvite (new)
| Field | Type | Constraints | Notes |
|---|---|---|---|
| _id | ObjectId | auto | |
| workspaceId | ObjectId ref Workspace | required | |
| email | String | required, lowercase | invited email |
| role | String enum | Admin, Member | |
| token | String | UUID, unique | for invite link |
| invitedBy | ObjectId ref User | required | |
| status | String enum | pending, accepted, expired | default pending |
| expiresAt | Date | 7 days from creation | |
| createdAt | Date | auto | |

Indexes: `{ token: 1 }` unique, `{ workspaceId: 1, email: 1 }`

---

### List → Project (extend existing)
| Field | Type | Constraints | Notes |
|---|---|---|---|
| _id | ObjectId | auto | |
| workspaceId | ObjectId ref Workspace | required (new) | |
| name | String | required, max 100 | |
| color | String | hex, default '#6366f1' | new |
| icon | String | emoji or icon name, default '📋' | new |
| description | String | max 1000, default '' | new |
| status | String enum | Active, Archived, On Hold | default Active, new |
| startDate | Date | optional | new |
| endDate | Date | optional | new |
| ownerId | ObjectId ref User | required | |
| createdAt | Date | auto | |
| updatedAt | Date | auto | |

Indexes: `{ workspaceId: 1 }`, `{ ownerId: 1 }`

---

### ProjectStatus (new)
| Field | Type | Constraints | Notes |
|---|---|---|---|
| _id | ObjectId | auto | |
| projectId | ObjectId ref List | required | |
| name | String | required, max 50 | e.g. "Backlog", "In Review" |
| color | String | hex, required | |
| order | Number | default 0 | display order |
| isDefault | Boolean | default false | one of the 3 built-ins |
| createdAt | Date | auto | |

Indexes: `{ projectId: 1, order: 1 }`
Default statuses seeded on project creation: To Do (#94a3b8), In Progress (#6366f1), Done (#10b981)

---

### Collaboration → ProjectMember (extend existing)
| Field | Type | Constraints | Notes |
|---|---|---|---|
| _id | ObjectId | auto | |
| listId | ObjectId ref List | required | (keep field name for compat) |
| userId | ObjectId ref User | required, nullable | null = pending invite |
| role | String enum | Owner, Editor, Viewer | |
| invitedBy | ObjectId ref User | required | |
| invitedAt | Date | default now | |
| status | String enum | active, pending | default active, new |
| inviteEmail | String | optional | for pending invites |
| inviteToken | String | UUID, optional | for pending invite link |

Indexes: `{ listId: 1, userId: 1 }` unique (sparse on userId), `{ userId: 1 }`, `{ inviteToken: 1 }`

---

### Todo → Task (extend existing)
| Field | Type | Constraints | Notes |
|---|---|---|---|
| _id | ObjectId | auto | |
| listId | ObjectId ref List | required | (keep field name) |
| title | String | required, max 200 | |
| description | String | max 5000, default '' | rich text HTML |
| status | String | default 'To Do' | matches ProjectStatus.name |
| priority | String enum | Low, Medium, High, Urgent | default Medium |
| dueDate | Date | optional | |
| startDate | Date | optional | |
| assignedTo | ObjectId ref User | optional | |
| watchers | [ObjectId ref User] | default [] | new |
| subtasks | [SubtaskSchema] | embedded | |
| tags | [ObjectId ref Tag] | default [] | |
| estimatedHours | Number | min 0 | |
| loggedHours | Number | min 0, default 0 | |
| recurrence | String enum | none, daily, weekly, monthly | default none |
| blockedBy | [ObjectId ref Todo] | default [] | |
| order | Number | default 0 | |
| lastReminderSent | Date | optional | |
| completedAt | Date | optional | |
| createdAt | Date | auto | |
| updatedAt | Date | auto | |

Indexes: `{ listId: 1 }`, `{ listId: 1, status: 1 }`, `{ dueDate: 1 }`, `{ assignedTo: 1 }`, `{ watchers: 1 }`

---

### Attachment (new)
| Field | Type | Constraints | Notes |
|---|---|---|---|
| _id | ObjectId | auto | |
| taskId | ObjectId ref Todo | required | |
| filename | String | required | stored filename (UUID-based) |
| originalName | String | required | original upload name |
| mimetype | String | required | |
| size | Number | required, max 10485760 (10MB) | bytes |
| uploadedBy | ObjectId ref User | required | |
| createdAt | Date | auto | |

Indexes: `{ taskId: 1 }`

---

### CustomField (new)
| Field | Type | Constraints | Notes |
|---|---|---|---|
| _id | ObjectId | auto | |
| projectId | ObjectId ref List | required | |
| name | String | required, max 50 | |
| type | String enum | text, number, date, dropdown | |
| options | [String] | for dropdown type | |
| order | Number | default 0 | |
| createdAt | Date | auto | |

Indexes: `{ projectId: 1 }`

---

### CustomFieldValue (new)
| Field | Type | Constraints | Notes |
|---|---|---|---|
| _id | ObjectId | auto | |
| taskId | ObjectId ref Todo | required | |
| fieldId | ObjectId ref CustomField | required | |
| value | Mixed | string/number/date/string | |
| updatedAt | Date | auto | |

Indexes: `{ taskId: 1 }`, `{ taskId: 1, fieldId: 1 }` unique

---

### TaskTemplate (new)
| Field | Type | Constraints | Notes |
|---|---|---|---|
| _id | ObjectId | auto | |
| projectId | ObjectId ref List | required | |
| name | String | required, max 100 | template display name |
| createdBy | ObjectId ref User | required | |
| taskData | Object | snapshot of task fields | title, description, priority, subtasks, tags, estimatedHours |
| createdAt | Date | auto | |

Indexes: `{ projectId: 1 }`

---

### Comment (extend existing)
| Field | Type | Constraints | Notes |
|---|---|---|---|
| _id | ObjectId | auto | |
| todoId | ObjectId ref Todo | required | (keep field name) |
| userId | ObjectId ref User | required | |
| text | String | required, max 10000 | rich text HTML |
| mentions | [ObjectId ref User] | default [] | new |
| attachments | [ObjectId ref Attachment] | default [] | new |
| editedAt | Date | optional | new |
| createdAt | Date | auto | |
| updatedAt | Date | auto | |

Indexes: `{ todoId: 1, createdAt: 1 }`

---

### Activity (new)
| Field | Type | Constraints | Notes |
|---|---|---|---|
| _id | ObjectId | auto | |
| taskId | ObjectId ref Todo | required | |
| userId | ObjectId ref User | required | who made the change |
| action | String enum | created, updated, commented, status_changed, assigned, unassigned, due_date_changed, priority_changed, subtask_added, subtask_completed, attachment_added, attachment_removed, watcher_added, watcher_removed, tag_added, tag_removed | |
| field | String | optional | which field changed |
| oldValue | Mixed | optional | previous value |
| newValue | Mixed | optional | new value |
| createdAt | Date | auto | |

Indexes: `{ taskId: 1, createdAt: -1 }`

---

### Notification (new)
| Field | Type | Constraints | Notes |
|---|---|---|---|
| _id | ObjectId | auto | |
| userId | ObjectId ref User | required | recipient |
| type | String enum | task_assigned, task_status_changed, comment_added, mentioned, due_date_approaching, project_member_added, project_member_removed, workspace_invite | |
| title | String | required, max 200 | |
| body | String | max 500 | |
| link | String | optional | deep link to resource |
| read | Boolean | default false | |
| payload | Object | optional | extra data (taskId, projectId, etc.) |
| createdAt | Date | auto | |

Indexes: `{ userId: 1, read: 1, createdAt: -1 }`, `{ userId: 1, createdAt: -1 }`

---

### Tag (existing, unchanged)
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | |
| listId | ObjectId ref List | |
| name | String | max 30 |
| color | String | hex |

---

### ShareLink (existing, unchanged)
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | |
| token | String | UUID, unique |
| resourceType | String enum | todo, list |
| resourceId | ObjectId | |
| createdBy | ObjectId ref User | |
| createdAt | Date | |
