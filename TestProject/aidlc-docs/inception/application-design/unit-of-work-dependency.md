# Unit of Work Dependencies — TaskFlow Pro

## Dependency Matrix

| Unit | Depends On | Reason |
|---|---|---|
| UNIT-1: Backend | None | Foundation — no dependencies |
| UNIT-2: React Shell | UNIT-1 | Needs auth API, workspace API, socket server |
| UNIT-3: Core Features | UNIT-2 | Needs app shell, routing, auth state, project/task APIs |
| UNIT-4: Advanced | UNIT-3 | Needs project views, task detail, notification infrastructure |

## Execution Sequence
```
UNIT-1 ──► UNIT-2 ──► UNIT-3 ──► UNIT-4
```
Sequential — each unit must be fully complete before the next begins.

## Internal Phase Dependencies (UNIT-1)
```
Project Restructure
    │
    ▼
Bug Fixes (on existing code)
    │
    ▼
Model Extensions + New Models (parallel)
    │
    ▼
New Services (socketService, activityService, notificationService)
    │
    ▼
New Controllers + Routes
    │
    ▼
Socket.IO + Multer Integration
```

## Internal Phase Dependencies (UNIT-2)
```
Scaffold (Vite + deps)
    │
    ▼
API Layer + Redux Store
    │
    ▼
Auth Pages + Protected Routes
    │
    ▼
App Shell (Sidebar, Topbar, Routing)
    │
    ▼
Workspace Pages + Theme + Command Palette
```

## Internal Phase Dependencies (UNIT-3)
```
Project Pages + projectSlice + taskSlice
    │
    ▼
List View (simplest view — baseline)
    │
    ├──► Board View (needs statuses)
    ├──► Calendar View (needs due dates)
    ├──► Timeline View (needs start+due dates, drag-drop)
    └──► Table View (needs all fields)
    │
    ▼
Task Detail Panel
    │
    ├──► Comments + Activity Feed
    ├──► Subtasks + Watchers + Custom Fields
    └──► Attachments
    │
    ▼
Bulk Operations + My Work View
```

## Internal Phase Dependencies (UNIT-4)
```
Dashboard Page (needs task + project data from UNIT-3)
    │
    ▼
Analytics Page (needs project stats API)
    │
    ▼
Notification System (needs notification API + socket)
    │
    ▼
Workload Balancing (needs workload API)
    │
    ▼
Export/Share Modals + Profile + Public Share Page
    │
    ▼
Polish (shortcuts, skeletons, empty states)
```

## Critical Path
UNIT-1 (Backend) → UNIT-2 (Shell) → UNIT-3 (Core) → UNIT-4 (Advanced) → Build & Test

No parallelization — each unit is a prerequisite for the next.
