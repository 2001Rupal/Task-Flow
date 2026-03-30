# Domain Entities - Todo Application

## Overview
This document defines the detailed domain entities (data models) for the Todo Application, including all fields, data types, constraints, and relationships.

---

## Entity Definitions

### 1. User Entity

**Purpose**: Represents a user account in the system

**Fields**:
| Field | Type | Constraints | Description |
|---|---|---|---|
| _id | ObjectId | Primary key, auto-generated | Unique user identifier |
| email | String | Required, unique, valid email format | User's email address |
| password | String | Required, min 6 chars, hashed with bcrypt | User's password (hashed) |
| createdAt | Date | Auto-generated | Account creation timestamp |
| updatedAt | Date | Auto-updated | Last update timestamp |

**Validation Rules**:
- Email must be valid format (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- Email must be unique (no duplicate accounts)
- Password minimum 6 characters (no complexity requirements)
- Password must be hashed with bcrypt before storage (never store plain text)

**Indexes**:
- Unique index on `email` for fast lookup and uniqueness enforcement

**Relationships**:
- One user can own many lists (1:N with List)
- One user can collaborate on many lists (N:M with List through Collaboration)
- One user can create many share links (1:N with ShareLink)

---

### 2. List Entity

**Purpose**: Represents a todo list/category

**Fields**:
| Field | Type | Constraints | Description |
|---|---|---|---|
| _id | ObjectId | Primary key, auto-generated | Unique list identifier |
| name | String | Required, 1-100 chars | List name |
| ownerId | ObjectId | Required, ref: User | User who created the list |
| createdAt | Date | Auto-generated | List creation timestamp |
| updatedAt | Date | Auto-updated | Last update timestamp |

**Validation Rules**:
- Name required, 1-100 characters
- Any characters allowed in name (including special characters, emojis)
- ownerId must reference an existing User

**Indexes**:
- Index on `ownerId` for fast owner lookup
- Compound index on `(ownerId, name)` for duplicate name prevention per user (optional)

**Relationships**:
- One list belongs to one owner (N:1 with User)
- One list can have many todos (1:N with Todo)
- One list can have many collaborators (N:M with User through Collaboration)
- One list can have many share links (1:N with ShareLink)

**Business Rules**:
- When list is deleted, all associated todos are cascade deleted
- When list is deleted, all collaborations are cascade deleted
- When list is deleted, all share links are cascade deleted

---

### 3. Todo Entity

**Purpose**: Represents an individual todo item

**Fields**:
| Field | Type | Constraints | Description |
|---|---|---|---|
| _id | ObjectId | Primary key, auto-generated | Unique todo identifier |
| listId | ObjectId | Required, ref: List | List this todo belongs to |
| title | String | Required, 1-200 chars | Todo title |
| description | String | Optional, 0-1000 chars | Todo description |
| status | String | Required, enum, default: "To Do" | Todo status |
| dueDate | Date | Optional, must be future date | Due date for todo |
| createdAt | Date | Auto-generated | Todo creation timestamp |
| updatedAt | Date | Auto-updated | Last update timestamp |
| completedAt | Date | Optional, auto-set | Completion timestamp |

**Validation Rules**:
- Title required, 1-200 characters
- Description optional, max 1000 characters
- Status must be one of: "To Do", "In Progress", "Done"
- Default status: "To Do"
- Due date must be in the future (if provided)
- completedAt automatically set when status changes to "Done"
- completedAt NOT cleared if status changes back (keeps historical completion time)
- listId must reference an existing List

**Indexes**:
- Index on `listId` for fast list lookup
- Compound index on `(listId, status)` for filtered queries
- Index on `dueDate` for reminder queries

**Relationships**:
- One todo belongs to one list (N:1 with List)
- One todo can have many share links (1:N with ShareLink)

**Business Rules**:
- Status can change in any order (no restrictions)
- When status changes to "Done", completedAt is set to current timestamp
- When status changes from "Done" to another status, completedAt remains unchanged (historical record)
- When todo is deleted, all associated share links are cascade deleted

---

### 4. Collaboration Entity

**Purpose**: Represents user access to a shared list with role-based permissions

**Fields**:
| Field | Type | Constraints | Description |
|---|---|---|---|
| _id | ObjectId | Primary key, auto-generated | Unique collaboration identifier |
| listId | ObjectId | Required, ref: List | List being shared |
| userId | ObjectId | Required, ref: User | User with access |
| role | String | Required, enum | User's role for this list |
| invitedAt | Date | Auto-generated | Invitation timestamp |
| invitedBy | ObjectId | Required, ref: User | User who sent invitation |

**Validation Rules**:
- Role must be one of: "Owner", "Editor", "Viewer"
- Compound unique constraint on (listId, userId) - one user can only have one role per list
- listId must reference an existing List
- userId must reference an existing User
- invitedBy must reference an existing User

**Indexes**:
- Compound unique index on `(listId, userId)` for uniqueness and fast permission lookups
- Index on `userId` for finding all lists a user has access to

**Relationships**:
- One collaboration links one user to one list (N:M relationship)
- One collaboration references the inviting user (N:1 with User)

**Business Rules**:
- Owner role is automatically created when a list is created (owner = creator)
- Immediate access - no pending/acceptance workflow
- Only one role per user per list (updating role replaces existing collaboration)
- When list is deleted, all collaborations are cascade deleted

**Role Permissions**:
- **Owner**: Full control (edit list, manage todos, invite/remove collaborators, delete list)
- **Editor**: Can create, update, delete todos; can update list name; cannot manage collaborators or delete list
- **Viewer**: Read-only access to list and todos; cannot modify anything

---

### 5. ShareLink Entity

**Purpose**: Represents a public share link for a todo or list

**Fields**:
| Field | Type | Constraints | Description |
|---|---|---|---|
| _id | ObjectId | Primary key, auto-generated | Unique share link identifier |
| token | String | Required, unique, UUID v4 | Public share token |
| resourceType | String | Required, enum | Type of resource being shared |
| resourceId | ObjectId | Required | ID of todo or list |
| createdBy | ObjectId | Required, ref: User | User who created the link |
| createdAt | Date | Auto-generated | Link creation timestamp |

**Validation Rules**:
- token must be unique UUID v4
- resourceType must be one of: "todo", "list"
- resourceId must reference an existing Todo or List (depending on resourceType)
- createdBy must reference an existing User
- Only one active link per resource (creating new link revokes old one)

**Indexes**:
- Unique index on `token` for fast public lookups
- Compound index on `(resourceType, resourceId)` for finding existing links

**Relationships**:
- One share link belongs to one user (N:1 with User)
- One share link references one todo OR one list (polymorphic relationship)

**Business Rules**:
- Creating a new share link for a resource automatically deletes any existing link for that resource
- Share links are public (no authentication required to view)
- Share links provide read-only access
- When todo/list is deleted, associated share links are cascade deleted
- Links remain active until manually revoked (no expiration)

---

## Entity Relationship Diagram

```
+--------+
|  User  |
+--------+
    |
    | 1:N (owns)
    v
+--------+       1:N        +--------+
|  List  |----------------->|  Todo  |
+--------+                  +--------+
    |                           |
    | N:M                       | 1:N
    v                           v
+---------------+         +-----------+
| Collaboration |         | ShareLink |
+---------------+         +-----------+
    |                           ^
    | N:1                       |
    v                           | 1:N
+--------+                      |
|  User  |----------------------+
+--------+
```

---

## Data Integrity Rules

### Cascade Deletes
- Delete List → Delete all Todos in that list
- Delete List → Delete all Collaborations for that list
- Delete List → Delete all ShareLinks for that list
- Delete Todo → Delete all ShareLinks for that todo
- Delete User → Reassign or delete owned lists (implementation decision needed)

### Referential Integrity
- All foreign keys (ObjectId references) must point to existing documents
- Mongoose will enforce referential integrity through validation

### Uniqueness Constraints
- User.email must be unique
- ShareLink.token must be unique
- Collaboration (listId, userId) must be unique (one role per user per list)

---

## Summary

**Total Entities**: 5
- User (authentication and ownership)
- List (todo categories)
- Todo (individual tasks)
- Collaboration (role-based access)
- ShareLink (public sharing)

**Total Fields**: 38 fields across all entities
**Relationships**: 1:N, N:M, and polymorphic relationships
**Indexes**: 10+ indexes for query optimization
**Cascade Deletes**: 4 cascade delete rules
