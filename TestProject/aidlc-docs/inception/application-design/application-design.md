# Application Design — TaskFlow Pro

## Summary
TaskFlow Pro is a full-stack task management platform built on a layered architecture. The backend is a Node.js/Express REST API with Socket.IO for real-time events, backed by MongoDB. The frontend is a React 18 SPA using Vite, shadcn/ui, Tailwind CSS, and Redux Toolkit.

## Architecture Pattern
- **Backend**: Layered (Routes → Middleware → Controllers → Services → Models)
- **Frontend**: Feature-based (features/ directory per domain, shared components/, Redux slices per feature)
- **Real-time**: Socket.IO rooms per project — all project members receive task/comment events
- **Auth**: JWT Bearer tokens, 24h expiry, stored in localStorage

## Project Structure
```
TestProject/
├── backend/
│   ├── config/database.js
│   ├── controllers/          (16 controllers)
│   ├── middleware/auth.js, errorHandler.js, upload.js
│   ├── models/               (17 models)
│   ├── routes/               (16 route files)
│   ├── services/             (6 services)
│   ├── uploads/              (file storage)
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/              (10 API modules + axiosClient + socketClient)
│   │   ├── app/store.js      (Redux store)
│   │   ├── components/       (shared: Button, Modal, Avatar, Badge, Tooltip, etc.)
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── workspace/
│   │   │   ├── project/
│   │   │   ├── tasks/        (ListView, BoardView, CalendarView, TimelineView, TableView)
│   │   │   ├── taskDetail/
│   │   │   ├── dashboard/
│   │   │   ├── analytics/
│   │   │   ├── notifications/
│   │   │   └── profile/
│   │   ├── hooks/            (12 custom hooks)
│   │   ├── pages/            (route-level page components)
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── package.json              (root: concurrently runner)
```

## Component Count
- **Backend controllers**: 16
- **Backend models**: 17
- **Backend services**: 6
- **Frontend features**: 9
- **Frontend custom hooks**: 12
- **Frontend shared components**: ~20

## Key Design Decisions
1. **Columns = Statuses** in Board view — dragging a task to a column changes its status
2. **Full multi-workspace** — users can create multiple workspaces and switch between them
3. **Socket.IO rooms** per project — efficient real-time scoping
4. **Redux Toolkit** for all state — consistent patterns, DevTools support
5. **shadcn/ui + Tailwind** — accessible components, fast styling, dark mode built-in
6. **Activity log** is append-only — never deleted, provides full audit trail
7. **Notifications** stored in DB + delivered via socket — survives page refresh
8. **File uploads** stored locally in backend/uploads/ — simple for local dev, swappable for S3 later
9. **Workload threshold** configurable via env var (default: 10 tasks or 40h)

## See Also
- components.md — full component list with interfaces
- component-methods.md — method signatures
- services.md — service layer details
- component-dependency.md — dependency graph and data flows
