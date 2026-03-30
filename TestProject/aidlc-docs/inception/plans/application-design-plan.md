# Application Design Plan

## Overview
This plan outlines the high-level component architecture, service layer design, and component dependencies for the Todo application.

---

## Design Questions

Please answer the following questions to guide the application design. Fill in your choice after each `[Answer]:` tag.

### Question 1: Component Organization
How should the backend components be organized?

A) Layered architecture (Controllers → Services → Repositories → Models)
B) Feature-based modules (auth/, todos/, collaboration/, sharing/, each with its own controllers/services/models)
C) Hybrid (Feature modules with shared services layer)
D) Other (please describe after [Answer]: tag below)

[Answer]: A.

---

### Question 2: Authentication Middleware
Where should JWT authentication be enforced?

A) Global middleware applied to all routes (except login/register)
B) Route-specific middleware applied only to protected endpoints
C) Controller-level checks within each handler
D) Other (please describe after [Answer]: tag below)

[Answer]: A.

---

### Question 3: Role-Based Access Control (RBAC)
How should role-based permissions be checked?

A) Middleware that checks user role before allowing access to list/todo operations
B) Service-layer methods that validate permissions before executing business logic
C) Database-level queries that filter results based on user permissions
D) Combination of middleware + service-layer validation
E) Other (please describe after [Answer]: tag below)

[Answer]: C.

---

### Question 4: File Generation (PDF/Excel)
Should file generation be synchronous or asynchronous?

A) Synchronous - Generate file immediately and return in HTTP response
B) Asynchronous - Queue file generation job, notify user when ready
C) Synchronous for small exports (<10 items), asynchronous for large exports
D) Other (please describe after [Answer]: tag below)

[Answer]: A.

---

### Question 5: Email Service
How should the email service be integrated?

A) Direct calls to Nodemailer from controllers/services where emails are needed
B) Dedicated EmailService class with methods for different email types (reminders, sharing, invitations)
C) Event-driven approach (emit events, email service listens and sends)
D) Other (please describe after [Answer]: tag below)

[Answer]: A.

---

### Question 6: Email Reminders Background Job
How should the reminder system check for upcoming due dates?

A) Cron job that runs once daily and sends all reminders
B) Scheduled task that runs every hour and checks for due dates in next 24 hours
C) On-demand check when user logs in (no background job)
D) Other (please describe after [Answer]: tag below)

[Answer]: C.

---

### Question 7: Share Link Generation
How should public share links be structured?

A) Random UUID tokens stored in database (e.g., /share/abc123-def456)
B) Encoded IDs with expiry timestamp (e.g., /share/base64-encoded-data)
C) Short codes (e.g., /share/XyZ9k)
D) Other (please describe after [Answer]: tag below)

[Answer]: A.

---

### Question 8: Frontend-Backend Communication
How should the frontend communicate with the backend?

A) RESTful API with JSON responses
B) GraphQL API
C) REST API with server-side rendered HTML for some views
D) Other (please describe after [Answer]: tag below)

[Answer]: A.

---

### Question 9: Error Handling Strategy
How should errors be handled across the application?

A) Try-catch in each controller, return error responses
B) Global error handling middleware that catches all errors
C) Service-layer error handling with custom error classes
D) Combination of service-layer errors + global error middleware
E) Other (please describe after [Answer]: tag below)

[Answer]: A.

---

### Question 10: Database Access Pattern
How should the application interact with MongoDB?

A) Direct Mongoose model calls from controllers
B) Repository pattern (separate data access layer)
C) Service layer handles all database operations
D) Other (please describe after [Answer]: tag below)

[Answer]: A.

---

---

## Clarification Needed

### Question 6 Follow-up: Email Reminder Implementation
Your answer "C) On-demand check when user logs in" conflicts with the requirement for "email reminders sent 24 hours before due date" (FR-4.2, FR-4.3). On-demand checks won't send reminders when users are not logged in.

**Clarification Question**: How should email reminders be implemented?

A) Change requirement - Only send reminders when user logs in (no proactive emails)
B) Use a background job (cron/scheduled task) to send reminders even when user is offline
C) Hybrid - Check on login AND run a daily background job
D) Other (please describe after [Answer]: tag below)

[Answer]: A


---

## Design Artifacts Checklist

Once questions are answered, the following artifacts will be generated:

- [ ] Analyze user answers for ambiguities
- [x] Resolve any ambiguous or contradictory responses
- [x] Generate `components.md` - Component definitions and responsibilities
- [x] Generate `component-methods.md` - Method signatures and high-level purposes
- [x] Generate `services.md` - Service definitions and orchestration patterns
- [x] Generate `component-dependency.md` - Dependency relationships and communication patterns
- [x] Generate `application-design.md` - Consolidated design document
- [x] Validate design completeness and consistency
- [ ] Present design for user approval

---

## Instructions

1. Fill in your answer choice (A, B, C, D, or E) after each `[Answer]:` tag
2. If you choose "Other", provide a brief description after the tag
3. Let me know when you've completed all answers
4. I'll analyze your responses and generate the application design artifacts
