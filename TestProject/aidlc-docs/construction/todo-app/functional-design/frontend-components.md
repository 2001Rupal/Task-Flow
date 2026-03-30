# Frontend Components - Todo Application

## Overview
This document defines the UI component structure, user interactions, state management, and API integration for the Todo Application frontend.

---

## Page Structure

### Page 1: Login Page (index.html)
**Purpose**: User authentication entry point
**Components**: LoginForm
**Navigation**: Register link → register.html, Success → dashboard.html

### Page 2: Register Page (register.html)
**Purpose**: New user registration
**Components**: RegisterForm
**Navigation**: Login link → index.html, Success → index.html (then login)

### Page 3: Dashboard Page (dashboard.html)
**Purpose**: Main application interface
**Layout**: Sidebar with lists, main area with selected list's todos
**Components**: Sidebar, TodoList, TodoCard, TodoForm, FilterBar
**Navigation**: Logout → index.html

### Page 4: Share View Page (share.html)
**Purpose**: Public read-only view of shared content
**Components**: SharedContent (read-only)
**Navigation**: No authentication, standalone page

---

## Component Definitions

### Component: LoginForm
**Location**: public/js/auth.js
**Purpose**: Handle user login
**State**:
- email: string
- password: string
- error: string
- loading: boolean
**User Interactions**:
- Input email (real-time validation)
- Input password (real-time validation)
- Click "Login" button
- Click "Register" link
**Validation**:
- Email format validation (real-time)
- Password min 6 chars (real-time)
**API Integration**:
- POST /api/auth/login
- On success: Store JWT in localStorage, redirect to dashboard
- On error: Show alert popup with error message


### Component: RegisterForm
**Location**: public/js/auth.js
**State**: email, password, confirmPassword, error, loading
**Interactions**: Input fields, submit button, login link
**Validation**: Email format, password min 6 chars, passwords match
**API**: POST /api/auth/register

### Component: Sidebar
**Location**: public/js/dashboard.js
**State**: lists (array), selectedListId, loading
**Interactions**: Click list to select, click "New List" button, click "Logout"
**API**: GET /api/lists, POST /api/lists
**Rendering**: List of list names, highlight selected list

### Component: TodoList
**Location**: public/js/list.js
**State**: todos (array), listId, loading
**Interactions**: View todos, click todo to expand, click "Add Todo"
**API**: GET /api/lists/:listId/todos
**Rendering**: Card view with expandable details

### Component: TodoCard
**Location**: public/js/todo.js
**State**: todo (object), expanded (boolean), editing (boolean)
**Interactions**: Click to expand, edit button, delete button, status dropdown
**Rendering**: Title, status badge, due date, expandable description
**API**: PUT /api/todos/:id, DELETE /api/todos/:id

### Component: TodoForm
**Location**: public/js/todo.js
**State**: title, description, dueDate, error, loading
**Interactions**: Input fields, submit button, cancel button
**Validation**: Title 1-200 chars, description 0-1000 chars, due date future
**API**: POST /api/lists/:listId/todos

### Component: FilterBar
**Location**: public/js/list.js
**State**: statusFilter, dueDateFilter, sortBy
**Interactions**: Status dropdown, date range picker, sort dropdown
**Rendering**: Filter controls above todo list
**Logic**: Client-side filtering and sorting of todos array

---

## State Management

**Approach**: Simple JavaScript state (no framework)
**Storage**: localStorage for JWT token
**State Updates**: Direct DOM manipulation on state changes

---

## API Integration Pattern

**Base URL**: http://localhost:3000/api
**Authentication**: JWT token in Authorization header (Bearer {token})
**Error Handling**: Alert popup for all API errors
**Loading States**: Spinner near affected component

---

## Summary

**Total Pages**: 4
**Total Components**: 8
**Validation**: Real-time (as user types)
**Error Display**: Alert popups
**Loading Indicators**: Component-level spinners
