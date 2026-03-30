# Business Logic Model - Todo Application

## Overview
This document defines the core business logic workflows and algorithms for the Todo Application.

---

## Authentication Workflows

### Workflow 1: User Registration
**Input**: email, password
**Process**:
1. Validate email format
2. Check if email already exists
3. If exists, return 409 Conflict error
4. Hash password with bcrypt (salt rounds: 10)
5. Create User record in database
6. Return success with userId

**Output**: { userId, message }
**Error Cases**: Invalid email format (400), Email already exists (409), Database error (500)

---

### Workflow 2: User Login
**Input**: email, password
**Process**:
1. Find user by email
2. If not found, return 401 Unauthorized
3. Compare provided password with hashed password (bcrypt.compare)
4. If mismatch, return 401 Unauthorized
5. Generate JWT token (userId, email, 24h expiration)
6. Trigger reminder check (call Reminder Controller)
7. Return token and user info

**Output**: { token, userId, email }
**Error Cases**: Invalid credentials (401), Database error (500)

---

### Workflow 3: Reminder Check (On Login)
**Input**: userId
**Process**:
1. Get current date/time
2. Calculate 24 hours from now
3. Query todos where:
   - User has access (owned or collaborated lists)
   - dueDate between now and 24 hours from now
   - status != "Done"
   - No reminder sent today for this todo
4. For each todo:
   - Send reminder email
   - Mark reminder as sent (track last sent date)
5. Return (no output to user)

**Output**: void (emails sent in background)
**Error Cases**: Email send failure (log error, don't block login)

---

## List Management Workflows

### Workflow 4: Create List
**Input**: name, userId (from JWT)
**Process**:
1. Validate name (1-100 chars)
2. Create List record (name, ownerId=userId)
3. Create Collaboration record (listId, userId, role="Owner", invitedBy=userId)
4. Return list info

**Output**: { listId, name, ownerId }
**Error Cases**: Validation error (400), Database error (500)

---

### Workflow 5: Get Accessible Lists
**Input**: userId (from JWT)
**Process**:
1. Query Collaboration table for userId
2. Get all listIds where user has access
3. Query List table for those listIds
4. Join with Collaboration to get user's role for each list
5. Return lists with role information

**Output**: { lists: [{ listId, name, role, ownerId }] }
**Error Cases**: Database error (500)

---

### Workflow 6: Delete List
**Input**: listId, userId (from JWT)
**Process**:
1. Query Collaboration to check if user is Owner
2. If not Owner, return 403 Forbidden
3. Delete all Todos where listId matches (cascade)
4. Delete all Collaborations where listId matches (cascade)
5. Delete all ShareLinks where resourceType="list" and resourceId=listId (cascade)
6. Delete List record
7. Return success

**Output**: { message: "List deleted" }
**Error Cases**: Not owner (403), List not found (404), Database error (500)

---

## Todo Management Workflows

### Workflow 7: Create Todo
**Input**: listId, title, description, dueDate, userId (from JWT)
**Process**:
1. Check user has Editor or Owner role for list
2. Validate title (1-200 chars)
3. Validate description (0-1000 chars)
4. Validate dueDate (must be future)
5. Create Todo record (listId, title, description, status="To Do", dueDate)
6. Return todo info

**Output**: { todoId, title, description, status, dueDate, listId }
**Error Cases**: No access (403), Validation error (400), List not found (404), Database error (500)

---

### Workflow 8: Update Todo Status
**Input**: todoId, newStatus, userId (from JWT)
**Process**:
1. Find todo by todoId
2. Check user has Editor or Owner role for todo's list
3. Validate newStatus (must be "To Do", "In Progress", or "Done")
4. Update todo status
5. If newStatus == "Done" and current completedAt is null:
   - Set completedAt = current timestamp
6. If newStatus != "Done":
   - Do NOT clear completedAt (preserve historical data)
7. Return updated todo

**Output**: { todoId, status, completedAt, updatedAt }
**Error Cases**: No access (403), Invalid status (400), Todo not found (404), Database error (500)

---

## Collaboration Workflows

### Workflow 9: Invite Collaborator
**Input**: listId, email, role, userId (from JWT)
**Process**:
1. Check user is Owner of list
2. Find user by email
3. If user not found, return 404
4. Check if collaboration already exists
5. If exists, update role (replace existing)
6. If not exists, create Collaboration record
7. Send invitation email (async, don't block)
8. Return collaboration info

**Output**: { collaborationId, listId, userId, role }
**Error Cases**: Not owner (403), User not found (404), List not found (404), Database error (500)

---

## Export & Sharing Workflows

### Workflow 10: Export to PDF
**Input**: resourceType ("todo" or "list"), resourceId, includeCollaborators, userId (from JWT)
**Process**:
1. Check user has access to resource
2. Fetch resource data (todo or list with todos)
3. If includeCollaborators, fetch collaborators
4. Generate PDF using PDFKit:
   - Title section
   - Todo details (title, description, status, due date, dates)
   - Collaborators section (if included)
5. Return PDF buffer in HTTP response

**Output**: PDF file (Content-Type: application/pdf)
**Error Cases**: No access (403), Resource not found (404), PDF generation error (500)

---

### Workflow 11: Generate Share Link
**Input**: resourceType, resourceId, userId (from JWT)
**Process**:
1. Check user has access to resource
2. Check if share link already exists for resource
3. If exists, delete old link
4. Generate UUID v4 token
5. Create ShareLink record (token, resourceType, resourceId, createdBy=userId)
6. Return share URL

**Output**: { shareLink: "http://localhost:3000/share/{token}", token }
**Error Cases**: No access (403), Resource not found (404), Database error (500)

---

### Workflow 12: Access Shared Content
**Input**: token (from URL, no authentication)
**Process**:
1. Find ShareLink by token
2. If not found, return 404
3. Fetch resource (todo or list) based on resourceType and resourceId
4. If resourceType == "list", fetch all todos in list
5. Return read-only data

**Output**: { resourceType, data: { todo or list with todos } }
**Error Cases**: Invalid token (404), Resource deleted (404), Database error (500)

---

### Workflow 13: Share via Email
**Input**: resourceType, resourceId, recipientEmail, format ("pdf" or "excel"), includeCollaborators, userId (from JWT)
**Process**:
1. Check user has access to resource
2. Generate file (PDF or Excel) using export workflow
3. Compose email:
   - To: recipientEmail
   - Subject: "Shared: [Resource Name]"
   - Body: Brief message about shared content
   - Attachment: Generated file
4. Send email via Nodemailer (Gmail SMTP)
5. Return success

**Output**: { message: "Email sent successfully" }
**Error Cases**: No access (403), Resource not found (404), Email send failure (500)

---

## Permission Check Algorithm

### Algorithm: Check User Access to List
**Input**: userId, listId
**Process**:
1. Query Collaboration table: `{ listId, userId }`
2. If record found, return role
3. If not found, return null (no access)

**Output**: role ("Owner", "Editor", "Viewer") or null

---

### Algorithm: Check User Access to Todo
**Input**: userId, todoId
**Process**:
1. Find todo by todoId
2. Get listId from todo
3. Check user access to list (use above algorithm)
4. Return role or null

**Output**: role or null

---

## Data Transformation Logic

### Transform: Todo to Export Format
**Input**: Todo entity
**Process**:
1. Extract fields: title, description, status, dueDate, createdAt, completedAt
2. Format dates: ISO 8601 or human-readable
3. Format status: Display-friendly text
4. Return formatted object

**Output**: { title, description, status, dueDate, createdAt, completedAt }

---

### Transform: List to Export Format
**Input**: List entity, array of Todos, array of Collaborators (optional)
**Process**:
1. Extract list fields: name, ownerId
2. Transform each todo using above algorithm
3. If includeCollaborators, format collaborator list
4. Return formatted object

**Output**: { name, ownerId, todos: [...], collaborators: [...] }

---

## Error Handling Logic

### Global Error Handler
**Input**: Error object, request, response
**Process**:
1. Log error details (message, stack trace)
2. Determine HTTP status code:
   - ValidationError → 400
   - AuthenticationError → 401
   - AuthorizationError → 403
   - NotFoundError → 404
   - ConflictError → 409
   - Default → 500
3. Return error response: { error: message }

**Output**: HTTP error response

---

## Summary

**Total Workflows**: 13
- Authentication: 3 workflows
- List Management: 3 workflows
- Todo Management: 2 workflows
- Collaboration: 1 workflow
- Export & Sharing: 4 workflows

**Key Algorithms**: 2 permission check algorithms, 2 data transformation algorithms, 1 error handling algorithm
