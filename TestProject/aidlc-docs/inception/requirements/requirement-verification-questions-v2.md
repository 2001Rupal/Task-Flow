# Requirement Verification Questions — Asana-Like Task Management Platform

## Context
We are evolving the existing basic Todo App into a full task management platform similar to Asana, built with a React frontend and the existing Node.js/MongoDB backend (extended). Please answer all questions below using the `[Answer]:` tag.

---

## Section 1: Project Structure & Workspace

**Q1**: In Asana, the top-level container is a "Workspace" or "Organization" that holds multiple "Projects". Should this app have:

A) A single workspace per user — users own projects directly (simpler, like the current lists model)  
B) Multi-workspace support — users can belong to multiple workspaces/organizations, each with their own projects and members  
C) Team-based — users belong to teams, teams own projects (like Asana's free tier)  
D) Other (please describe after [Answer]: tag)

[Answer]: B

---

**Q2**: What should "Projects" (currently called "Lists") support beyond a name?

A) Name only (keep it simple)  
B) Name + color/icon  
C) Name + color/icon + description + status (Active/Archived/On Hold)  
D) Name + color/icon + description + status + start/end dates + project owner  
E) Other (please describe)

[Answer]: D

---

## Section 2: Task Features

**Q3**: The current Todo model already has: title, description, status, priority, due date, start date, assignee, subtasks, tags, time tracking, recurrence, dependencies. What additional task fields do you want?

A) Keep what's there — it's sufficient  
B) Add: attachments (file uploads), custom fields per project  
C) Add: attachments + custom fields + task watchers (people who get notified but aren't assignees)  
D) Add: attachments + custom fields + watchers + task templates  
E) Other (please describe)

[Answer]: C

---

**Q4**: For task status, Asana uses customizable statuses per project (e.g., "Backlog", "In Review", "Blocked"). Should this app:

A) Keep fixed statuses: To Do, In Progress, Done  
B) Allow custom statuses per project (user defines their own columns/statuses)  
C) Hybrid: fixed defaults (To Do, In Progress, Done) but allow adding custom ones  
D) Other (please describe)

[Answer]: C

---

**Q5**: For the Kanban/Board view, should columns be:

A) Fixed: To Do | In Progress | Done  
B) Dynamic — one column per status (so custom statuses = custom columns)  
C) Fully customizable columns independent of status  
D) Other (please describe)

[Answer]: C

---

## Section 3: Views

**Q6**: Which views should be available per project?

A) List + Board (Kanban) only  
B) List + Board + Calendar  
C) List + Board + Calendar + Timeline (Gantt-style)  
D) List + Board + Calendar + Timeline + Table (spreadsheet-like)  
E) Other (please describe)

[Answer]: D

---

**Q7**: For the Timeline/Gantt view (if included), should it support:

A) Read-only visualization of tasks with start/due dates  
B) Interactive — drag to resize/move task bars to change dates  
C) Skip Timeline view entirely  
D) Other (please describe)

[Answer]: B

---

## Section 4: Collaboration & Notifications

**Q8**: For collaboration invitations, currently only registered users can be invited. Should the app:

A) Keep current behavior — only registered users can be invited  
B) Allow inviting by email — send invite link, user registers then gets access  
C) Allow inviting by email with a pending state shown in the members list  
D) Other (please describe)

[Answer]: C

---

**Q9**: For in-app notifications, what events should trigger a notification?

A) Task assigned to me only  
B) Task assigned + task commented on (when I'm involved) + due date approaching  
C) All of the above + task status changed + mentioned in a comment (@mention)  
D) Full Asana-like: all above + project updates + collaborator added/removed  
E) Other (please describe)

[Answer]: D

---

**Q10**: Should notifications be:

A) In-app only (notification bell in the UI)  
B) In-app + email  
C) In-app + email + browser push notifications  
D) Other (please describe)

[Answer]: B

---

## Section 5: Activity Feed & Comments

**Q11**: For the task activity feed (history of changes), should it track:

A) Comments only  
B) Comments + status changes  
C) Comments + all field changes (status, priority, assignee, due date, etc.)  
D) Other (please describe)

[Answer]: C

---

**Q12**: Should comments support:

A) Plain text only  
B) Plain text + @mentions (notify a team member)  
C) Plain text + @mentions + file attachments  
D) Rich text (bold, italic, lists) + @mentions + file attachments  
E) Other (please describe)

[Answer]: D

---

## Section 6: Dashboard & Analytics

**Q13**: Should there be a global dashboard/home screen (beyond "My Work") showing:

A) No global dashboard — just the project list and My Work view  
B) Simple dashboard: My assigned tasks + overdue count + upcoming deadlines  
C) Full dashboard: assigned tasks + project progress charts + team workload + recent activity  
D) Other (please describe)

[Answer]: C

---

**Q14**: For project-level analytics/reporting, should there be:

A) No analytics — just the stats bar (total/todo/in-progress/done counts)  
B) Basic: completion rate chart + tasks by status  
C) Full: completion rate + tasks by assignee + tasks by priority + time tracking report  
D) Other (please describe)

[Answer]: C

---

## Section 7: New Features (Beyond Asana)

**Q15**: You mentioned wanting new features beyond Asana. Which of these interest you?

A) AI task suggestions — auto-generate subtasks from a task title using an AI API  
B) Natural language due dates — type "next Friday" and it parses to a date  
C) Smart workload balancing — warn when a team member is overloaded  
D) All of the above  
E) Other (please describe your new feature ideas)

[Answer]: C

---

**Q16**: For AI features (if selected), which AI provider should be used?

A) OpenAI (GPT-4) — requires OpenAI API key  
B) AWS Bedrock — requires AWS credentials  
C) Anthropic Claude — requires Anthropic API key  
D) Keep it provider-agnostic with a configurable API key in .env  
E) Skip AI features for now  

[Answer]: E

---

## Section 8: Frontend & UX

**Q17**: For the React frontend tech stack, which styling approach?

A) Tailwind CSS (utility-first, fast to build)  
B) CSS Modules + custom design system  
C) shadcn/ui components + Tailwind (pre-built accessible components)  
D) Material UI (MUI)  
E) Other (please describe)

[Answer]: C

---

**Q18**: For state management in React:

A) React Context + useReducer (built-in, no extra library)  
B) Zustand (lightweight, simple)  
C) Redux Toolkit (powerful, more boilerplate)  
D) TanStack Query (React Query) for server state + Zustand for UI state  
E) Other (please describe)

[Answer]: C

---

**Q19**: Should the app support dark mode?

A) Yes — dark/light toggle  
B) Yes — follows system preference automatically  
C) Yes — both toggle and system preference  
D) No — light mode only  

[Answer]: C

---

## Section 9: Backend & Infrastructure

**Q20**: The existing backend needs these improvements (identified during audit). Which should be included?

A) Fix only the critical bugs (reminder arg order, hardcoded URLs, login response missing displayName)  
B) Fix bugs + add Activity Log model + Notification model  
C) Fix bugs + Activity Log + Notifications + WebSocket for real-time updates  
D) Fix bugs + Activity Log + Notifications + WebSocket + file upload support (for task attachments)  
E) Other (please describe)

[Answer]: D

---

**Q21**: For the React app location within the project:

A) `TestProject/client/` — React app alongside the existing backend  
B) Keep backend in `TestProject/` root, React app in `TestProject/client/`  
C) Restructure: `TestProject/server/` for backend, `TestProject/client/` for React  
D) Other (please describe)

[Answer]: D-> keep all the stuff in TestProject incide of TESTPROJECT, and there we can make frontend and backend folder 

---

**Q22**: For running the app in development, should there be:

A) Two separate terminals: `npm run dev` in server root + `npm run dev` in client/  
B) A root-level `package.json` with `npm run dev` that starts both concurrently  
C) Docker Compose setup  
D) Other (please describe)

[Answer]: B

