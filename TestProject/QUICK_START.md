# Quick Start Guide - Todo App

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies
```bash
cd TestProject
npm install
```

### Step 2: Start MongoDB
Make sure MongoDB is running on your system:
```bash
# Windows
mongod

# Mac/Linux
sudo systemctl start mongod
```

### Step 3: Configure Environment
The `.env` file is already configured with defaults:
```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/todo-app
JWT_SECRET=my-super-secret-jwt-key-change-this-in-production
```

**Optional**: Add Gmail credentials for email features:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
```

### Step 4: Start the Server
```bash
npm run dev
```

You should see:
```
Server running on http://localhost:3000
MongoDB connected successfully
```

### Step 5: Open in Browser
Navigate to: **http://localhost:3000**

---

## 📝 First Steps

### 1. Register an Account
- Click "Sign up"
- Enter email: `test@example.com`
- Enter password: `password123`
- Click "Create Account"

### 2. Login
- Enter your email and password
- Click "Sign In"

### 3. Create Your First List
- Click "+ New List" in sidebar
- Enter name: "My Tasks"
- Click "Create List"

### 4. Add a Todo
- Click "+ Add Todo"
- Enter title: "Complete project"
- Add description (optional)
- Set due date (optional)
- Click "Save Todo"

### 5. Manage Your Todo
- Click checkbox to change status
- Click ✏️ to edit
- Click 🗑️ to delete

---

## 🎯 Key Features

### Lists
- Create unlimited lists
- Rename and delete lists
- Share lists with others

### Todos
- Add title, description, due date
- Three statuses: To Do, In Progress, Done
- Edit and delete todos
- Track completion

### Collaboration
- Invite users by email
- Three roles: Owner, Editor, Viewer
- Manage collaborators

### Export & Share
- Export to PDF or Excel
- Share via email
- Generate public share links

---

## 🔧 Troubleshooting

### Server won't start
- Check if MongoDB is running
- Check if port 3000 is available
- Run `npm install` again

### Can't login
- Check MongoDB connection
- Clear browser cache
- Check browser console for errors

### Todos not loading
- Check browser console
- Verify you're logged in
- Refresh the page

---

## 📚 More Information

- **Full Documentation**: See `README.md`
- **Testing Guide**: See `TESTING_GUIDE.md`
- **Implementation Details**: See `IMPLEMENTATION_GUIDE.md`
- **Complete Summary**: See `COMPLETION_SUMMARY.md`

---

## 🎉 You're Ready!

Start creating lists and managing your todos!

**Access the app**: http://localhost:3000

**Need help?** Check the documentation files or browser console for errors.

---

**Happy Task Managing! ✨**
