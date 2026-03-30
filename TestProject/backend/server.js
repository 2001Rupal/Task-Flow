require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const { Server } = require('socket.io');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const socketService = require('./services/socketService');
const { verifyJWT } = require('./services/tokenService');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// ── Socket.IO setup ───────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:5173'] : '*',
    methods: ['GET', 'POST']
  }
});

socketService.init(io);

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = verifyJWT(token);
    socket.userId = decoded.userId;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  // Join personal room
  socket.join(`user:${socket.userId}`);

  // ── Presence tracking ─────────────────────────
  const userPresence = new Map() // projectId -> { userId, displayName, avatarColor, email }

  const broadcastPresence = (projectId) => {
    const room = io.sockets.adapter.rooms.get(`project:${projectId}`)
    if (!room) return
    const online = []
    for (const sid of room) {
      const s = io.sockets.sockets.get(sid)
      if (s?.presenceData?.[projectId]) online.push(s.presenceData[projectId])
    }
    io.to(`project:${projectId}`).emit('presence:update', { projectId, online })
  }

  socket.on('presence:join', async ({ projectId, displayName, avatarColor, email }) => {
    if (!socket.presenceData) socket.presenceData = {}
    socket.presenceData[projectId] = { userId: socket.userId, displayName, avatarColor, email }
    userPresence.set(projectId, socket.presenceData[projectId])
    broadcastPresence(projectId)
  })

  socket.on('presence:leave', ({ projectId }) => {
    if (socket.presenceData) delete socket.presenceData[projectId]
    userPresence.delete(projectId)
    broadcastPresence(projectId)
  })

  socket.on('joinProject', async (projectId) => {
    try {
      const Collaboration = require('./models/Collaboration');
      const WorkspaceMember = require('./models/WorkspaceMember');
      const List = require('./models/List');

      // Check direct project collaboration first
      const collab = await Collaboration.findOne({ listId: projectId, userId: socket.userId, status: 'active' }).catch(() => null);
      if (collab) { socket.join(`project:${projectId}`); return; }

      // Fall back to workspace-level membership
      const project = await List.findById(projectId).select('workspaceId').catch(() => null);
      if (project) {
        const wsMember = await WorkspaceMember.findOne({ workspaceId: project.workspaceId, userId: socket.userId }).catch(() => null);
        if (wsMember) socket.join(`project:${projectId}`);
      }
    } catch {}
  });

  socket.on('leaveProject', (projectId) => {
    socket.leave(`project:${projectId}`);
  });

  socket.on('disconnect', () => {
    // Clean up presence for all projects this socket was in
    if (socket.presenceData) {
      for (const projectId of Object.keys(socket.presenceData)) {
        broadcastPresence(projectId)
      }
    }
  });
});

// ── Connect DB ────────────────────────────────
connectDB();

// ── Middleware ────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:5173'] : '*',
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── API Routes ────────────────────────────────
app.use('/api/auth',            require('./routes/authRoutes'));
app.use('/api/workspaces',      require('./routes/workspaceRoutes'));
app.use('/api/lists',           require('./routes/listRoutes'));
app.use('/api/todos',           require('./routes/todoRoutes'));
app.use('/api/collaborations',  require('./routes/collaborationRoutes'));
app.use('/api/statuses',        require('./routes/projectStatusRoutes'));
app.use('/api/attachments',     require('./routes/attachmentRoutes'));
app.use('/api/activities',      require('./routes/activityRoutes'));
app.use('/api/notifications',   require('./routes/notificationRoutes'));
app.use('/api/export',          require('./routes/exportRoutes'));
app.use('/api/share',           require('./routes/shareRoutes'));
app.use('/api/reminders',       require('./routes/reminderRoutes'));
app.use('/api/comments',        require('./routes/commentRoutes'));
app.use('/api/tags',            require('./routes/tagRoutes'));
app.use('/api/profile',         require('./routes/profileRoutes'));

// ── Serve frontend (legacy HTML) ──────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Error handler ─────────────────────────────
app.use(errorHandler);

server.listen(PORT, () => {
  console.log(`TaskFlow Pro backend running on http://localhost:${PORT}`);
});
