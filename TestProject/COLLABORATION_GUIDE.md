# TaskFlow Pro — Collaboration Guide

---

## WORKSPACE-LEVEL MEMBERSHIP

Workspace membership controls who can see and access the workspace and all its projects.

### Roles
| Role   | Can do |
|--------|--------|
| Owner  | Everything — invite, remove, change roles, delete workspace |
| Admin  | Invite members, remove non-admin members, update workspace settings |
| Member | View and work inside projects they are added to |

### How to invite someone to a workspace

1. Go to **Workspace Settings** (bottom-left sidebar link)
2. Under **Members**, enter the person's email and pick a role (Admin or Member)
3. Click **Invite** — an email is sent with an "Accept Invitation" button
4. The invite link points to `http://localhost:5173/invite/workspace?token=...`

### What the invited person does

**If they already have an account:**
- Click "Accept Invitation" in the email
- They are taken to `/invite/workspace?token=...`
- If logged in → automatically joined, redirected to dashboard
- If not logged in → shown "Sign in" / "Create account" buttons
  - After signing in, they land back on the invite page and are joined automatically

**If they don't have an account yet:**
- Click "Accept Invitation" → shown "Create account" button
- After registering, they land back on the invite page and are joined automatically

### What workspace membership gives you
- You appear in the workspace member list
- You can be invited to individual projects within that workspace
- You can be assigned tasks in any project you are a project member of

### Backend endpoints
```
POST   /api/workspaces/:id/invite          — send invite email
GET    /api/workspaces/invite/accept?token — accept invite (public, no auth)
DELETE /api/workspaces/:id/members/:memberId — remove member
GET    /api/workspaces/:id                 — get workspace + members
```

---

## PROJECT-LEVEL MEMBERSHIP (COLLABORATION)

Project membership controls who can see and work inside a specific project. A workspace member must be explicitly added to a project to access it.

### Roles
| Role   | Can do |
|--------|--------|
| Owner  | Everything — invite, remove, change roles, delete project |
| Editor | Create, edit, delete tasks, add comments, upload attachments |
| Viewer | Read-only — can view tasks and comments, cannot make changes |

### How to invite someone to a project

1. Open the project → click the **⚙ Settings** icon (top-right of project header)
2. Go to the **Members** tab
3. Enter the person's email and pick a role (Editor or Viewer)
4. Click **Invite**
   - If the email matches an existing user → they are added immediately (active)
   - If the email has no account → a pending invite is created and an email is sent

### Important: the person must be a workspace member first
Project invites work independently of workspace membership, but for the assignee picker and task notifications to work correctly, the person should also be a workspace member.

### What project membership gives you
- You appear in the project member list
- You can be assigned tasks via the **Assignee Picker** in task detail
- You receive notifications when assigned to a task
- You can comment, upload attachments (Editor), or view-only (Viewer)
- You join the real-time Socket.IO room for that project (live updates)

### Backend endpoints
```
POST   /api/collaborations/lists/:projectId/collaborators              — invite
GET    /api/collaborations/lists/:projectId/collaborators              — list members
GET    /api/collaborations/lists/:projectId/collaborators/pending      — pending invites
PUT    /api/collaborations/lists/:projectId/collaborators/:collabId    — change role
DELETE /api/collaborations/lists/:projectId/collaborators/:collabId    — remove member
GET    /api/invite/accept?token                                        — accept project invite
```

---

## TASK ASSIGNMENT

Once someone is a project member (Editor or Viewer), they can be assigned tasks.

### How to assign a task

**From task detail panel:**
1. Click any task to open the detail panel (right side)
2. Click the **Assign** button (shows avatar + name if already assigned)
3. Search by name or email in the dropdown
4. Click a member to assign — saves instantly

**From create task modal:**
1. Click **+ Add task** in the project header
2. Fill in title, status, priority, due date
3. Click the **Assignee** field and pick a member
4. Click **Create task**

### What happens when a task is assigned
- The assignee receives an **in-app notification** (bell icon)
- The assignee receives an **email notification** with task details
- The task shows the assignee's **avatar** in list view and board cards
- The task appears in the assignee's **My Work** page

---

## SUMMARY: TWO-LEVEL MODEL

```
Workspace
├── Members (Owner / Admin / Member)
│   └── Managed in: Workspace Settings → Members tab
│
└── Projects
    └── Project Members (Owner / Editor / Viewer)
        └── Managed in: Project → ⚙ Settings → Members tab
            └── Tasks
                └── Assigned to project members
                    └── Shown in: Task detail panel → Assignee picker
```

**Key rule:** A person needs to be a project member to be assigned tasks and to appear in the assignee picker. Workspace membership alone is not enough.
