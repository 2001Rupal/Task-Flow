# Requirements Clarification Questions

Please answer the following questions by filling in the letter choice after each `[Answer]:` tag.
If none of the options match your needs, choose the last option (Other) and describe your preference.

Let me know when you're done answering.

---

## Question 1
What type of user authentication do you want?

A) Email and password (JWT-based)
B) Email/password + social login (Google, GitHub, etc.)
C) Email/password + OTP / magic link
D) Other (please describe after [Answer]: tag below)

[Answer]: A.

---

## Question 2
Should users be able to organize todos into categories, lists, or projects?

A) Yes — users can create named lists/categories and assign todos to them
B) No — a flat list of todos per user is sufficient
C) Yes — but only simple tags/labels (no nested structure)
D) Other (please describe after [Answer]: tag below)

[Answer]: A.

---

## Question 3
What priority or status options should a todo item support?

A) Simple done/not-done checkbox only
B) Status: To Do, In Progress, Done
C) Status + Priority (Low, Medium, High)
D) Custom statuses defined by the user
E) Other (please describe after [Answer]: tag below)

[Answer]: B.

---

## Question 4
Should todos support due dates, reminders, or recurring tasks?

A) Due dates only
B) Due dates + email reminders
C) Due dates + recurring tasks (daily, weekly, monthly)
D) None of the above — just title and description
E) Other (please describe after [Answer]: tag below)

[Answer]: B.

---

## Question 5
For the sharing feature, what should be shared?

A) Share a single todo item (as PDF or Excel via email or link)
B) Share an entire list/category of todos
C) Both — share individual todos and entire lists
D) Other (please describe after [Answer]: tag below)

[Answer]: C.

---

## Question 6
How should sharing via link work?

A) Public read-only link (anyone with the link can view)
B) Link with expiry (link expires after a set time)
C) Link requires recipient to log in to view
D) Other (please describe after [Answer]: tag below)

[Answer]: A.

---

## Question 7
For email sharing, should the app send emails directly?

A) Yes — the app sends the PDF/Excel file as an email attachment
B) Yes — the app sends a link via email (no attachment)
C) No — just generate the file for the user to send manually
D) Other (please describe after [Answer]: tag below)

[Answer]: A.

---

## Question 8
What should the exported PDF/Excel include?

A) Just the todo title and status
B) Title, description, status, and due date
C) Full details including priority, tags, creation date, and completion date
D) Other (please describe after [Answer]: tag below)

[Answer]: C.

---

## Question 9
Should multiple users be able to collaborate on the same todo list (shared workspace)?

A) No — each user has their own private todos only
B) Yes — users can invite others to collaborate on a list
C) Yes — with role-based access (viewer, editor, owner)
D) Other (please describe after [Answer]: tag below)

[Answer]: B,C.

---

## Question 10
What is the target deployment environment?

A) Local development only (for now)
B) Cloud deployment (e.g., AWS, Heroku, Render, Vercel + backend)
C) Docker-based self-hosted
D) Other (please describe after [Answer]: tag below)

[Answer]: A.

---

## Question 11
For the frontend, which JavaScript framework do you prefer?

A) React (with Vite or Create React App)
B) Vue.js
C) Vanilla JavaScript (no framework)
D) Next.js (React with SSR)
E) Other (please describe after [Answer]: tag below)

[Answer]: C.

---

## Question 12
For the backend, which Node.js framework do you prefer?

A) Express.js
B) Fastify
C) NestJS
D) Other (please describe after [Answer]: tag below)

[Answer]: A.

---

## Question 13: Security Extensions
Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)
B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)
X) Other (please describe after [Answer]: tag below)

[Answer]: B.

---
