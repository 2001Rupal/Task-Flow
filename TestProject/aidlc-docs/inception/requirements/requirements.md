# Todo App Requirements

## Intent Analysis

### User Request
Create a web-based Todo application with CRUD operations, sharing capabilities (PDF/Excel export via email or links), multi-user authentication, and collaboration features.

### Request Type
New Project (Greenfield)

### Scope Estimate
Multiple Components - Full-stack web application with frontend, backend API, database, authentication, file generation, and email services.

### Complexity Estimate
Moderate to Complex - Involves multiple integrated features including authentication, CRUD operations, file generation (PDF/Excel), email integration, sharing via links, and role-based collaboration.

---

## Functional Requirements

### FR-1: User Authentication & Authorization
- **FR-1.1**: Users must register with email and password
- **FR-1.2**: Users must log in with email and password (JWT-based authentication)
- **FR-1.3**: System must validate email format and password strength
- **FR-1.4**: System must maintain user sessions using JWT tokens
- **FR-1.5**: Users must be able to log out

### FR-2: Todo List Management
- **FR-2.1**: Users can create named lists/categories
- **FR-2.2**: Users can view all their lists
- **FR-2.3**: Users can update list names
- **FR-2.4**: Users can delete lists (with confirmation)
- **FR-2.5**: Each list belongs to a specific user (owner)

### FR-3: Todo Item Management
- **FR-3.1**: Users can create todo items within a list
- **FR-3.2**: Each todo must have: title (required), description (optional), status, due date (optional)
- **FR-3.3**: Todo status options: "To Do", "In Progress", "Done"
- **FR-3.4**: Users can update todo items (title, description, status, due date)
- **FR-3.5**: Users can delete todo items
- **FR-3.6**: Users can view all todos in a list
- **FR-3.7**: Users can filter/sort todos by status or due date

### FR-4: Due Dates & Reminders
- **FR-4.1**: Users can set due dates for todo items
- **FR-4.2**: System must send email reminders for todos with upcoming due dates
- **FR-4.3**: Reminders should be sent 24 hours before the due date
- **FR-4.4**: Users receive reminders only for incomplete todos (status != "Done")

### FR-5: Collaboration & Sharing (Role-Based)
- **FR-5.1**: List owners can invite other users to collaborate on a list via email
- **FR-5.2**: System supports three roles: Owner, Editor, Viewer
  - **Owner**: Full control (edit list, manage todos, invite/remove collaborators, delete list)
  - **Editor**: Can create, update, delete todos; cannot manage collaborators or delete list
  - **Viewer**: Read-only access to list and todos
- **FR-5.3**: Owners can assign roles when inviting collaborators
- **FR-5.4**: Owners can change collaborator roles
- **FR-5.5**: Owners can remove collaborators from a list
- **FR-5.6**: Collaborators can view all lists they have access to

### FR-6: Export to PDF/Excel
- **FR-6.1**: Users can export a single todo item to PDF or Excel
- **FR-6.2**: Users can export an entire list to PDF or Excel
- **FR-6.3**: Exported files must include: title, description, status, due date, priority (if applicable), creation date, completion date
- **FR-6.4**: PDF format should be well-formatted and readable
- **FR-6.5**: Excel format should have proper columns and headers

### FR-7: Sharing via Email
- **FR-7.1**: Users can share a todo or list via email
- **FR-7.2**: System sends the PDF or Excel file as an email attachment
- **FR-7.3**: User provides recipient email address(es)
- **FR-7.4**: Email includes a brief message about the shared content

### FR-8: Sharing via Link
- **FR-8.1**: Users can generate a public read-only link for a todo item
- **FR-8.2**: Users can generate a public read-only link for an entire list
- **FR-8.3**: Anyone with the link can view the content (no login required)
- **FR-8.4**: Shared links display todos in a clean, read-only view
- **FR-8.5**: Links remain active until manually revoked by the owner

---

## Non-Functional Requirements

### NFR-1: Technology Stack
- **NFR-1.1**: Frontend: Vanilla JavaScript (no framework)
- **NFR-1.2**: Backend: Node.js with Express.js
- **NFR-1.3**: Database: MongoDB
- **NFR-1.4**: Authentication: JWT (JSON Web Tokens)
- **NFR-1.5**: PDF Generation: Library like PDFKit or Puppeteer
- **NFR-1.6**: Excel Generation: Library like ExcelJS or xlsx
- **NFR-1.7**: Email Service: Nodemailer with Gmail SMTP (using App Password)

### NFR-2: Security
- **NFR-2.1**: Passwords must be hashed using bcrypt or similar
- **NFR-2.2**: JWT tokens must have expiration times
- **NFR-2.3**: API endpoints must validate user authentication
- **NFR-2.4**: Role-based access control must be enforced on all list/todo operations
- **NFR-2.5**: Input validation and sanitization to prevent injection attacks
- **NFR-2.6**: HTTPS should be used in production (not enforced for local dev)

### NFR-3: Performance
- **NFR-3.1**: API response time should be under 500ms for CRUD operations
- **NFR-3.2**: File generation (PDF/Excel) should complete within 5 seconds for lists up to 100 items
- **NFR-3.3**: Database queries should be optimized with proper indexing

### NFR-4: Usability
- **NFR-4.1**: UI should be responsive and work on desktop and mobile browsers
- **NFR-4.2**: Clear error messages for validation failures
- **NFR-4.3**: Intuitive navigation between lists and todos
- **NFR-4.4**: Visual feedback for actions (loading states, success/error messages)

### NFR-5: Deployment
- **NFR-5.1**: Initial deployment target: Local development environment
- **NFR-5.2**: Application should be runnable with simple setup instructions
- **NFR-5.3**: Environment variables for configuration (DB connection, JWT secret, email credentials)

### NFR-6: Scalability
- **NFR-6.1**: Architecture should support future cloud deployment
- **NFR-6.2**: Database schema should allow for future feature additions
- **NFR-6.3**: API design should follow RESTful principles for maintainability

### NFR-7: Email Reminders
- **NFR-7.1**: Background job or scheduled task to check for upcoming due dates
- **NFR-7.2**: Email service must handle failures gracefully (retry logic)
- **NFR-7.3**: Users should not receive duplicate reminders

---

## Extension Configuration

### Security Baseline Extension
**Status**: Disabled (as per user preference for local development/prototype)

---

## User Scenarios

### Scenario 1: New User Registration & First Todo
1. User visits the app and registers with email/password
2. User logs in and is redirected to the dashboard
3. User creates their first list (e.g., "Work Tasks")
4. User adds a todo item with title, description, and due date
5. User sets status to "In Progress"

### Scenario 2: Collaborating on a Shared List
1. User A creates a list "Team Project"
2. User A invites User B as an Editor
3. User B receives invitation and accepts
4. User B adds new todos to the shared list
5. User A reviews and marks todos as "Done"

### Scenario 3: Exporting and Sharing via Email
1. User creates a list with multiple todos
2. User selects "Export to PDF"
3. User chooses "Share via Email"
4. User enters recipient email address
5. System generates PDF and sends email with attachment
6. Recipient receives email with the PDF file

### Scenario 4: Sharing via Public Link
1. User creates a todo or list
2. User generates a public share link
3. User copies the link and shares it (via chat, social media, etc.)
4. Recipient opens the link in browser (no login required)
5. Recipient views the read-only content

### Scenario 5: Receiving Due Date Reminder
1. User creates a todo with a due date set for tomorrow
2. System's background job runs daily
3. System detects the upcoming due date (24 hours before)
4. System sends email reminder to the user
5. User receives email and completes the todo

---

## Assumptions & Constraints

### Assumptions
- Users have valid email addresses for registration and reminders
- Users have access to a modern web browser (Chrome, Firefox, Safari, Edge)
- MongoDB is installed and running locally for development
- Gmail account with App Password configured for sending emails (2FA must be enabled)

### Constraints
- Initial version targets local development only (no cloud deployment yet)
- No mobile native apps (web-based only)
- No offline support (requires internet connection)
- Email reminders sent once per todo (no recurring reminders)
- Public share links do not expire automatically (manual revocation only)

---

## Success Criteria

1. Users can successfully register, log in, and manage their todos
2. CRUD operations work correctly for lists and todos
3. Role-based collaboration allows multiple users to work on shared lists
4. PDF and Excel exports contain complete todo information
5. Email sharing delivers files as attachments successfully
6. Public share links provide read-only access without authentication
7. Email reminders are sent 24 hours before due dates
8. Application runs locally without errors
9. Code is well-structured and maintainable for future enhancements

---

## Out of Scope (Future Enhancements)

- Social login (Google, GitHub, etc.)
- Recurring tasks (daily, weekly, monthly)
- Custom user-defined statuses
- Link expiry for shared links
- Real-time collaboration (WebSockets)
- Mobile native applications
- Advanced filtering and search
- Task dependencies and subtasks
- File attachments to todos
- Activity logs and audit trails
- Notifications (in-app, push notifications)
- Dark mode / theme customization
