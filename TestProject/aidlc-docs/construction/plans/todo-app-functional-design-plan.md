# Functional Design Plan - Todo Application

## Overview
This plan defines the detailed business logic, domain models, business rules, and validation logic for the Todo Application unit.

---

## Functional Design Questions

Please answer the following questions to guide the detailed functional design. Fill in your choice after each `[Answer]:` tag.

### Question 1: Password Validation Rules
What password strength requirements should be enforced?

A) Minimum 8 characters, at least one uppercase, one lowercase, one number
B) Minimum 6 characters, no special requirements
C) Minimum 10 characters, uppercase, lowercase, number, and special character
D) Other (please describe after [Answer]: tag below)

[Answer]: B.

---

### Question 2: Email Validation
Beyond format validation, should email verification be required?

A) No verification - just validate email format
B) Send verification email, but allow login before verification
C) Send verification email, block login until verified
D) Other (please describe after [Answer]: tag below)

[Answer]: A.

---

### Question 3: List Name Constraints
What constraints should apply to list names?

A) 1-100 characters, any characters allowed
B) 1-50 characters, alphanumeric and spaces only
C) 3-100 characters, any characters allowed
D) Other (please describe after [Answer]: tag below)

[Answer]: A.

---

### Question 4: Todo Title and Description Constraints
What length limits should apply to todo fields?

A) Title: 1-200 chars (required), Description: 0-1000 chars (optional)
B) Title: 1-100 chars (required), Description: 0-500 chars (optional)
C) Title: 1-500 chars (required), Description: 0-5000 chars (optional)
D) Other (please describe after [Answer]: tag below)

[Answer]: A.

---

### Question 5: Due Date Validation
What constraints should apply to due dates?

A) Any date (past or future) allowed
B) Only future dates allowed
C) Only dates within next 365 days allowed
D) Other (please describe after [Answer]: tag below)

[Answer]: B.

---

### Question 6: Status Transition Rules
Can users change todo status in any order, or are there restrictions?

A) Any status change allowed (To Do → Done, Done → To Do, etc.)
B) Sequential only (To Do → In Progress → Done, no backwards)
C) Forward only (To Do → In Progress → Done), but can go back one step
D) Other (please describe after [Answer]: tag below)

[Answer]: A.

---

### Question 7: Completion Date Logic
When should the completedAt timestamp be set?

A) Automatically when status changes to "Done"
B) Manually set by user
C) Automatically when status is "Done", cleared if status changes back
D) Other (please describe after [Answer]: tag below)

[Answer]: A.

---

### Question 8: List Deletion Behavior
What happens to todos when a list is deleted?

A) Cascade delete - all todos in the list are deleted
B) Prevent deletion if list has todos
C) Move todos to a default "Uncategorized" list
D) Other (please describe after [Answer]: tag below)

[Answer]: A.

---

### Question 9: Collaborator Invitation
How should collaborator invitations work?

A) Immediate access - user added to list instantly
B) Email invitation - user must accept before getting access
C) Pending state - owner sees pending, collaborator must accept
D) Other (please describe after [Answer]: tag below)

[Answer]: A.

---

### Question 10: Permission Enforcement Detail
When a Viewer tries to edit a todo, what happens?

A) API returns 403 Forbidden error
B) Frontend hides edit buttons for Viewers (no API call)
C) Both - frontend hides buttons AND API validates permissions
D) Other (please describe after [Answer]: tag below)

[Answer]: B.

---

### Question 11: Share Link Uniqueness
Can multiple share links exist for the same todo/list?

A) Yes - users can create multiple links for the same resource
B) No - only one active link per resource, creating new one revokes old
C) Limited - maximum 5 active links per resource
D) Other (please describe after [Answer]: tag below)

[Answer]: B.

---

### Question 12: PDF/Excel Content Detail
Should exported files include collaborator information?

A) Yes - include list of collaborators with roles
B) No - only include todos and list information
C) Optional - user chooses whether to include collaborators
D) Other (please describe after [Answer]: tag below)

[Answer]: C.

---

### Question 13: Email Reminder Frequency
If a user logs in multiple times in one day, should reminders be sent each time?

A) Yes - send reminders every login
B) No - send reminders only once per day per todo
C) No - send reminders only once ever per todo
D) Other (please describe after [Answer]: tag below)

[Answer]: B.

---

### Question 14: Reminder Email Content
What information should reminder emails include?

A) Todo title and due date only
B) Todo title, description, due date, and list name
C) Todo title, due date, list name, and link to view todo
D) Other (please describe after [Answer]: tag below)

[Answer]: C.

---

### Question 15: Frontend Page Structure
How should the main dashboard be organized?

A) Single page showing all lists and todos
B) Dashboard shows lists, clicking a list navigates to separate list page
C) Sidebar with lists, main area shows selected list's todos
D) Other (please describe after [Answer]: tag below)

[Answer]: C

---

### Question 16: Frontend Form Validation
When should validation errors be shown to users?

A) On form submit only
B) Real-time as user types (immediate feedback)
C) On field blur (when user leaves the field)
D) Other (please describe after [Answer]: tag below)

[Answer]: B.

---

### Question 17: Frontend Todo Display
How should todos be displayed in a list?

A) Simple list view (title, status, due date)
B) Card view with expandable details
C) Table view with sortable columns
D) Other (please describe after [Answer]: tag below)

[Answer]: B.

---

### Question 18: Frontend Filtering and Sorting
What filtering/sorting options should be available?

A) Filter by status, sort by due date or creation date
B) Filter by status and due date range, sort by multiple fields
C) No filtering/sorting - show all todos in creation order
D) Other (please describe after [Answer]: tag below)

[Answer]: B

---

### Question 19: Frontend Error Handling
How should API errors be displayed to users?

A) Alert/modal popup with error message
B) Inline error message near the relevant form/action
C) Toast notification (temporary message at top/bottom)
D) Other (please describe after [Answer]: tag below)

[Answer]: A.

---

### Question 20: Frontend Loading States
How should loading states be indicated during API calls?

A) Disable buttons and show spinner
B) Show loading overlay on entire page
C) Show loading indicator near the affected component
D) Other (please describe after [Answer]: tag below)

[Answer]: C.

---

## Functional Design Artifacts Checklist

Once questions are answered, the following artifacts will be generated:

- [x] Analyze user answers for ambiguities
- [x] Resolve any ambiguous or contradictory responses
- [x] Generate `business-logic-model.md` - Core business logic and workflows
- [x] Generate `domain-entities.md` - Detailed entity definitions with fields and relationships
- [x] Generate `business-rules.md` - Validation rules, constraints, and business policies
- [x] Generate `frontend-components.md` - UI component structure, props, state, and interactions
- [x] Validate functional design completeness
- [ ] Present functional design for user approval

---

## Instructions

1. Fill in your answer choice (A, B, C, or D) after each `[Answer]:` tag
2. If you choose "Other", provide a brief description after the tag
3. Let me know when you've completed all answers
4. I'll analyze your responses and generate the functional design artifacts
