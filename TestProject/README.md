# Todo Application

A full-stack web-based todo application with user authentication, list management, collaboration features, and sharing capabilities.

## Features

- User registration and JWT-based authentication
- Create, read, update, delete todo lists and items
- Role-based collaboration (Owner, Editor, Viewer)
- Export todos to PDF and Excel
- Share todos via email or public links
- Email reminders for upcoming due dates
- Responsive web interface

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Nodemailer with Gmail SMTP
- **File Generation**: PDFKit (PDF), ExcelJS (Excel)

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4 or higher)
- Gmail account with App Password enabled

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure MongoDB

Make sure MongoDB is running locally:
```bash
mongod
```

### 3. Configure Gmail App Password

1. Enable 2-Factor Authentication on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Select "Mail" and your device
4. Copy the generated 16-character password

### 4. Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: A secure random string
- `EMAIL_USER`: Your Gmail address
- `EMAIL_PASSWORD`: Your Gmail App Password

### 5. Start the Application

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

### 6. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## Project Structure

```
TestProject/
├── config/
│   └── database.js          # MongoDB connection
├── models/
│   ├── User.js              # User model
│   ├── List.js              # List model
│   ├── Todo.js              # Todo model
│   ├── Collaboration.js     # Collaboration model
│   └── ShareLink.js         # ShareLink model
├── controllers/
│   ├── authController.js
│   ├── listController.js
│   ├── todoController.js
│   ├── collaborationController.js
│   ├── exportController.js
│   ├── shareController.js
│   └── reminderController.js
├── services/
│   ├── tokenService.js      # JWT and UUID generation
│   ├── emailService.js      # Email sending
│   └── fileService.js       # PDF/Excel generation
├── middleware/
│   ├── auth.js              # JWT authentication
│   └── errorHandler.js      # Error handling
├── routes/
│   ├── authRoutes.js
│   ├── listRoutes.js
│   ├── todoRoutes.js
│   ├── collaborationRoutes.js
│   ├── exportRoutes.js
│   └── shareRoutes.js
├── public/
│   ├── index.html           # Login page
│   ├── register.html        # Registration page
│   ├── dashboard.html       # Main application
│   ├── share.html           # Public share view
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── api.js
│       ├── auth.js
│       ├── dashboard.js
│       ├── list.js
│       ├── todo.js
│       └── share.js
├── server.js                # Application entry point
├── package.json
├── .env.example
└── README.md
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user
- POST `/api/auth/logout` - Logout user

### Lists
- POST `/api/lists` - Create list
- GET `/api/lists` - Get all accessible lists
- GET `/api/lists/:id` - Get list by ID
- PUT `/api/lists/:id` - Update list
- DELETE `/api/lists/:id` - Delete list

### Todos
- POST `/api/lists/:listId/todos` - Create todo
- GET `/api/lists/:listId/todos` - Get todos in list
- GET `/api/todos/:id` - Get todo by ID
- PUT `/api/todos/:id` - Update todo
- DELETE `/api/todos/:id` - Delete todo

### Collaboration
- POST `/api/lists/:listId/collaborators` - Invite collaborator
- GET `/api/lists/:listId/collaborators` - Get collaborators
- PUT `/api/lists/:listId/collaborators/:userId` - Update role
- DELETE `/api/lists/:listId/collaborators/:userId` - Remove collaborator

### Export
- GET `/api/todos/:id/export/pdf` - Export todo to PDF
- GET `/api/todos/:id/export/excel` - Export todo to Excel
- GET `/api/lists/:listId/export/pdf` - Export list to PDF
- GET `/api/lists/:listId/export/excel` - Export list to Excel

### Share
- POST `/api/todos/:id/share/email` - Share todo via email
- POST `/api/lists/:listId/share/email` - Share list via email
- POST `/api/todos/:id/share/link` - Generate share link for todo
- POST `/api/lists/:listId/share/link` - Generate share link for list
- GET `/api/share/:token` - Access shared content (public)
- DELETE `/api/share/:token` - Revoke share link

## Usage

1. **Register**: Create a new account with email and password
2. **Login**: Access your dashboard
3. **Create Lists**: Organize your todos into lists
4. **Add Todos**: Create tasks with titles, descriptions, and due dates
5. **Collaborate**: Invite others to work on your lists
6. **Export**: Download todos as PDF or Excel
7. **Share**: Send todos via email or generate public links

## Development Notes

- Password minimum length: 6 characters
- List names: 1-100 characters
- Todo titles: 1-200 characters
- Todo descriptions: 0-1000 characters
- Due dates must be in the future
- Email reminders sent once per day on login

## License

ISC
