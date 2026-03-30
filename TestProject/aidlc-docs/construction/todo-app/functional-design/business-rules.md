# Business Rules - Todo Application

## Overview
This document defines all validation rules, constraints, and business policies for the Todo Application.

---

## Authentication & User Management Rules

### BR-AUTH-001: Email Validation
- Email must match format: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Email must be unique across all users
- No email verification required (format validation only)

### BR-AUTH-002: Password Validation
- Minimum 6 characters
- No complexity requirements (uppercase, lowercase, numbers, special chars not required)
- Must be hashed with bcrypt (salt rounds: 10) before storage

### BR-AUTH-003: JWT Token
- Token expiration: 24 hours
- Token includes: userId, email
- Token must be validated on all protected routes

### BR-AUTH-004: Session Management
- Logout is client-side (remove token from localStorage)
- No server-side session tracking

---

## List Management Rules

### BR-LIST-001: List Name Validation
- Required field
- Length: 1-100 characters
- Any characters allowed (including special characters, emojis, spaces)

### BR-LIST-002: List Ownership
- Every list must have exactly one owner (creator)
- Owner is automatically set to the user who creates the list
- Owner role is automatically created in Collaboration table

### BR-LIST-003: List Deletion
- Only the owner can delete a list
- Cascade delete: All todos in the list are deleted
- Cascade delete: All collaborations for the list are deleted
- Cascade delete: All share links for the list are deleted
- No confirmation required at API level (frontend handles confirmation)

---

## Todo Management Rules

### BR-TODO-001: Todo Title Validation
- Required field
- Length: 1-200 characters
- Any characters allowed

### BR-TODO-002: Todo Description Validation
- Optional field
- Length: 0-1000 characters
- Empty string allowed

### BR-TODO-003: Todo Status Validation
- Required field
- Must be one of: "To Do", "In Progress", "Done"
- Default value: "To Do"
- Status can change in any order (no sequential restrictions)

### BR-TODO-004: Due Date Validation
- Optional field
- Must be a future date (not past or today)
- Validation: `dueDate > new Date()`

### BR-TODO-005: Completion Date Logic
- completedAt is automatically set when status changes to "Done"
- completedAt is set to current timestamp
- completedAt is NOT cleared if status changes back from "Done"
- completedAt preserves historical completion time

### BR-TODO-006: Todo Deletion
- Editors and Owners can delete todos
- Viewers cannot delete todos
- Cascade delete: All share links for the todo are deleted

---

## Collaboration Rules

### BR-COLLAB-001: Role Types
- Three roles: "Owner", "Editor", "Viewer"
- Owner: Full control (all operations)
- Editor: Create, update, delete todos; update list name; cannot manage collaborators or delete list
- Viewer: Read-only access; cannot modify anything

### BR-COLLAB-002: Invitation Workflow
- Immediate access (no pending/acceptance workflow)
- User is added to list instantly when invited
- Invitation email is sent but not required for access

### BR-COLLAB-003: Role Assignment
- Only Owner can invite collaborators
- Only Owner can change collaborator roles
- Only Owner can remove collaborators
- One user can only have one role per list

### BR-COLLAB-004: Permission Enforcement
- Frontend hides edit/delete buttons for Viewers
- API does NOT validate permissions (relies on frontend)
- Database queries filter results based on user access

---

## Export & Sharing Rules

### BR-EXPORT-001: File Generation
- Synchronous generation (immediate response)
- PDF format: Well-formatted document with all fields
- Excel format: Proper columns and headers

### BR-EXPORT-002: Export Content
- User chooses whether to include collaborator information
- Always include: title, description, status, due date, creation date, completion date
- Optional: list of collaborators with roles

### BR-EXPORT-003: Share Link Generation
- One active link per resource (creating new revokes old)
- Token: UUID v4 (random, unpredictable)
- Public access (no authentication required)
- Read-only view

### BR-EXPORT-004: Share Link Revocation
- Only creator can revoke a share link
- Revocation deletes the ShareLink record
- Link becomes invalid (404 on access)

### BR-EXPORT-005: Email Sharing
- Sends PDF or Excel as email attachment
- User provides recipient email address
- Email includes brief message about shared content
- Uses Gmail SMTP with Nodemailer

---

## Reminder Rules

### BR-REMIND-001: Reminder Trigger
- Reminders sent when user logs in (on-demand check)
- Check for todos with due date within next 24 hours
- Only send reminders for incomplete todos (status != "Done")

### BR-REMIND-002: Reminder Frequency
- Send reminders only once per day per todo
- Track last reminder sent date (implementation: check if reminder sent today)
- Multiple logins in one day do not trigger duplicate reminders

### BR-REMIND-003: Reminder Content
- Email subject: "Reminder: [Todo Title] due soon"
- Email body includes:
  - Todo title
  - Due date
  - List name
  - Link to view todo (e.g., `http://localhost:3000/list/{listId}`)

### BR-REMIND-004: Reminder Scope
- Only send reminders for lists the user owns or collaborates on
- Check user's access via Collaboration table

---

## Frontend Validation Rules

### BR-UI-001: Form Validation Timing
- Real-time validation as user types (immediate feedback)
- Show validation errors inline near the field
- Disable submit button if validation fails

### BR-UI-002: Error Display
- API errors shown as alert/modal popup
- Validation errors shown inline near form fields
- Error messages are clear and actionable

### BR-UI-003: Loading States
- Show loading indicator near the affected component
- Disable buttons during API calls
- Show spinner icon next to button text

### BR-UI-004: Permission-Based UI
- Hide edit/delete buttons for Viewers
- Show read-only indicators for Viewer role
- Disable form fields for Viewers

---

## Data Validation Summary

### Required Fields
- User: email, password
- List: name, ownerId
- Todo: listId, title, status
- Collaboration: listId, userId, role, invitedBy
- ShareLink: token, resourceType, resourceId, createdBy

### Optional Fields
- Todo: description, dueDate, completedAt
- All: createdAt, updatedAt (auto-generated)

### Unique Constraints
- User.email
- ShareLink.token
- Collaboration (listId, userId) compound

### Length Constraints
- User.password: min 6 chars
- List.name: 1-100 chars
- Todo.title: 1-200 chars
- Todo.description: 0-1000 chars

### Enum Constraints
- Todo.status: "To Do", "In Progress", "Done"
- Collaboration.role: "Owner", "Editor", "Viewer"
- ShareLink.resourceType: "todo", "list"

---

## Business Policy Summary

**Total Business Rules**: 25+
- Authentication: 4 rules
- List Management: 3 rules
- Todo Management: 6 rules
- Collaboration: 4 rules
- Export & Sharing: 5 rules
- Reminders: 4 rules
- Frontend: 4 rules
