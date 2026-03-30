# Requirement Clarification Questions — Asana-Like Platform

## Context
Thank you for answering all questions. One clarification is needed before generating the requirements document.

---

## Clarification 1: Custom Statuses vs Custom Columns (Q4 + Q5)

You answered:
- **Q4**: Hybrid statuses — fixed defaults (To Do, In Progress, Done) but allow adding custom ones per project
- **Q5**: Fully customizable columns **independent of status**

These two answers create a design question: if columns are independent of statuses, a task could have a status that doesn't match its column, which gets confusing.

How should statuses and columns relate in the Board view?

A) **Columns = Statuses** — each column represents a status. Custom columns automatically create a new status. Dragging a task to a column changes its status. (Simpler, consistent — like Asana's board)

B) **Columns independent of statuses** — columns are just visual groupings (like swimlanes), and status is a separate field on the task. A task in the "Design" column could have status "In Progress". (More flexible but more complex)

C) **Both** — Board view uses statuses as columns, but there's also a separate "Section" grouping within each column (like Asana's sections within a project list)

D) Other (please describe)

[Answer]: A

---

## Clarification 2: Multi-Workspace Scope (Q1)

You answered **B — Multi-workspace support**. To clarify the scope:

A) **Full multi-workspace** — a user can create multiple workspaces, invite different people to each, and switch between them. Projects belong to a workspace. (Like Asana's organization model — more complex to build)

B) **Simplified multi-workspace** — a user has one personal workspace by default, but can also be invited into other people's workspaces. No workspace creation UI needed beyond the default. (Simpler to build, still multi-workspace)

C) **Team-based within one workspace** — one workspace per user, but they can create "Teams" inside it to group projects (like Asana free tier)

D) Other (please describe)

[Answer]: A

