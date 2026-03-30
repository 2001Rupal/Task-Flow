# Testing Guide - Todo App

## Prerequisites
1. MongoDB running on `mongodb://127.0.0.1:27017/todo-app`
2. Node.js installed
3. Dependencies installed (`npm install`)
4. Server running (`npm run dev`)

## Access the Application
Open your browser and navigate to: **http://localhost:3000**

---

## Test Scenarios

### 1. User Authentication

#### Register New User
1. Click "Sign up" link on login page
2. Enter email: `test@example.com`
3. Enter password: `password123` (min 6 characters)
4. Click "Create Account"
5. ✅ Should show success message
6. ✅ Should redirect to login page

#### Login
1. Enter registered email
2. Enter password
3. Click "Sign In"
4. ✅ Should redirect to dashboard
5. ✅ Should show user email in sidebar

---

### 2. List Management

#### Create List
1. Click "+ New List" button in sidebar
2. Enter list name: "Work Tasks"
3. Click "Create List"
4. ✅ List should appear in sidebar
5. ✅ List should be automatically selected
6. ✅ Should show empty todos state

#### Rename List
1. Hover over a list in sidebar
2. Click edit icon (✏️)
3. Enter new name: "Updated Work Tasks"
4. Click "Save"
5. ✅ List name should update in sidebar

#### Delete List
1. Hover over a list in sidebar
2. Click delete icon (🗑️)
3. Confirm deletion
4. ✅ List should be removed from sidebar
5. ✅ If list was selected, should show welcome state

---

### 3. Todo Management

#### Create Todo
1. Select a list from sidebar
2. Click "+ Add Todo" button
3. Enter title: "Complete project documentation"
4. Enter description: "Write comprehensive docs for the API"
5. Select due date: Tomorrow's date
6. Click "Save Todo"
7. ✅ Todo should appear in the list
8. ✅ Stats should update (Total: 1, To Do: 1)

#### Update Todo Status
1. Click on the checkbox next to a todo
2. ✅ Status should cycle: To Do → In Progress → Done
3. ✅ Visual appearance should change (strikethrough when Done)
4. ✅ Stats should update accordingly

#### Edit Todo
1. Hover over a todo
2. Click edit icon (✏️)
3. Modify title, description, or due date
4. Change status if needed
5. Click "Save Changes"
6. ✅ Todo should update with new information

#### Delete Todo
1. Hover over a todo
2. Click delete icon (🗑️)
3. Confirm deletion
4. ✅ Todo should be removed
5. ✅ Stats should update

---

### 4. Collaboration Features

#### Invite Collaborator
1. Select a list (must be Owner)
2. Click "👥 Collaborate" button
3. Enter collaborator email: `collaborator@example.com`
4. Select role: "Editor" or "Viewer"
5. Click "Send Invite"
6. ✅ Collaborator should appear in list
7. ✅ Email notification sent (if email configured)

#### View Collaborators
1. Click "👥 Collaborate" button
2. ✅ Should see list of all collaborators
3. ✅ Should see their roles (Owner/Editor/Viewer)

#### Remove Collaborator
1. Open collaborators modal
2. Click remove button (✕) next to a collaborator
3. Confirm removal
4. ✅ Collaborator should be removed

---

### 5. Export Features

#### Export to PDF
1. Select a list with todos
2. Click "⬇ Export" button
3. Click "📄 Export PDF"
4. ✅ PDF file should download
5. ✅ PDF should contain list name and all todos

#### Export to Excel
1. Select a list with todos
2. Click "⬇ Export" button
3. Click "📊 Export Excel"
4. ✅ Excel file should download
5. ✅ Excel should have multiple sheets (List Info, Todos, Collaborators)

---

### 6. Share Features

#### Generate Share Link
1. Select a list
2. Click "🔗 Share" button
3. Click "🔗 Generate Link"
4. ✅ Share link should be generated
5. ✅ Link should be displayed in input field

#### Copy Share Link
1. After generating link
2. Click "📋 Copy Link"
3. ✅ Should show "Link copied" toast
4. ✅ Link should be in clipboard

#### Access Shared Content
1. Copy the share link
2. Open in new browser tab (or incognito)
3. ✅ Should see read-only view of list
4. ✅ No authentication required
5. ✅ Cannot edit or delete

---

### 7. UI/UX Testing

#### Responsive Design
1. Resize browser window to mobile size (< 768px)
2. ✅ Sidebar should hide
3. ✅ Hamburger menu (☰) should appear
4. ✅ Click hamburger to toggle sidebar
5. ✅ Buttons should stack properly
6. ✅ Stats should show 2 columns

#### Animations
1. Create a new todo
2. ✅ Should fade in smoothly
3. Hover over todos and lists
4. ✅ Should show smooth hover effects
5. Open/close modals
6. ✅ Should slide in/out smoothly

#### Toast Notifications
1. Perform any action (create, update, delete)
2. ✅ Toast should appear in top-right
3. ✅ Should auto-dismiss after 3 seconds
4. ✅ Should show appropriate color (success/error/info)

---

### 8. Error Handling

#### Invalid Login
1. Enter wrong email/password
2. ✅ Should show "Invalid credentials" error

#### Empty Form Submission
1. Try to create list without name
2. ✅ Should show "List name is required" error
3. Try to create todo without title
4. ✅ Should show "Title is required" error

#### Permission Errors
1. Login as Viewer
2. Try to create/edit/delete todo
3. ✅ Should show permission error

---

### 9. Stats Dashboard

#### Verify Stats
1. Create multiple todos with different statuses
2. ✅ Total should show all todos
3. ✅ To Do should show todos with "To Do" status
4. ✅ In Progress should show todos with "In Progress" status
5. ✅ Done should show completed todos
6. Change todo status
7. ✅ Stats should update in real-time

---

### 10. Logout

#### Logout
1. Click logout button (⏻) in sidebar
2. ✅ Should redirect to login page
3. ✅ Should clear authentication token
4. Try to access dashboard directly
5. ✅ Should redirect to login page

---

## Known Issues to Check

### Email Features
- ⚠️ Email features require Gmail App Password in `.env`
- ⚠️ Without email config, collaboration invites won't send emails
- ⚠️ Share by email won't work without email config

### MongoDB
- ⚠️ Ensure MongoDB is running before starting server
- ⚠️ Check connection string in `.env`

### Browser Compatibility
- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ⚠️ IE not supported

---

## Performance Testing

### Load Testing
1. Create 50+ todos in a list
2. ✅ Should load smoothly
3. ✅ Scrolling should be smooth
4. ✅ No lag in UI interactions

### Network Testing
1. Open browser DevTools → Network tab
2. Perform actions
3. ✅ API calls should complete in < 500ms
4. ✅ No failed requests
5. ✅ Proper error handling for network failures

---

## Security Testing

### Authentication
1. Try to access `/dashboard.html` without login
2. ✅ Should redirect to login
3. Try to access API endpoints without token
4. ✅ Should return 401 Unauthorized

### Authorization
1. Login as Viewer
2. Try to delete a todo via API
3. ✅ Should return 403 Forbidden

### Input Validation
1. Try to create todo with 300 character title
2. ✅ Should show validation error (max 200)
3. Try to set past due date
4. ✅ Should show validation error

---

## Accessibility Testing

### Keyboard Navigation
1. Use Tab key to navigate
2. ✅ Should highlight focused elements
3. Press Enter on buttons
4. ✅ Should trigger actions
5. Press Escape in modals
6. ✅ Should close modals

### Screen Reader
1. Use screen reader (if available)
2. ✅ Form labels should be read
3. ✅ Button purposes should be clear
4. ✅ Error messages should be announced

---

## Bug Reporting Template

If you find any issues, report them with:

```
**Bug Title**: [Brief description]

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior**: What should happen

**Actual Behavior**: What actually happened

**Browser**: Chrome/Firefox/Safari/Edge

**Screenshots**: [If applicable]

**Console Errors**: [Copy any errors from browser console]
```

---

## Success Criteria

✅ All authentication flows work
✅ CRUD operations for lists and todos work
✅ Collaboration features work
✅ Export features generate files
✅ Share links work
✅ UI is responsive on mobile
✅ No console errors
✅ Smooth animations and transitions
✅ Proper error handling
✅ Stats update correctly

---

## Next Steps After Testing

1. Configure email credentials in `.env` for full functionality
2. Deploy to production server
3. Set up MongoDB Atlas for cloud database
4. Configure proper JWT secret for production
5. Add SSL certificate for HTTPS
6. Set up monitoring and logging
7. Create user documentation
8. Plan for future features

---

**Happy Testing! 🚀**
