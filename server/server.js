import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import expertRoutes from './routes/expertRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import { Server } from 'socket.io';
import http from 'http';
import jwt from './utils/jwt.js';
import userModel from './models/userModel.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Track online users in memory
const onlineUsersMap = new Map();

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const cookies = socket.handshake.headers.cookie;
    if (!cookies) {
      return next(new Error('Authentication error: No cookies provided'));
    }
    
    // Parse cookies
    const cookieParser = (cookies) => {
      return cookies.split(';').reduce((res, item) => {
        const data = item.trim().split('=');
        return { ...res, [data[0]]: data[1] };
      }, {});
    };
    
    const parsedCookies = cookieParser(cookies);
    const accessToken = parsedCookies.accessToken;

    if (!accessToken) {
      return next(new Error('Authentication error: No access token'));
    }
    
    // Verify access token
    const decoded = jwt.verifyAccessToken(accessToken);
    if (!decoded) {
      return next(new Error('Authentication error: Invalid token'));
    }
    
    // Get user from database
    const user = await userModel.findById(decoded.id);
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }
    
    // Add user data to socket
    socket.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user._id}`);
  
  // Track which conversation the user is currently viewing
  let activeConversation = null;
  
  // Join a room with the user's ID
  socket.join(socket.user._id.toString());
  
  // Add user to online users and broadcast status
  const userId = socket.user._id.toString();
  onlineUsersMap.set(userId, {
    userId,
    lastSeen: new Date(),
    socketId: socket.id
  });
  
  // Broadcast to all connected clients that this user is online
  socket.broadcast.emit('user-online', userId);
  
  // Send list of online users to the newly connected user
  const onlineUsers = {};
  for (const [id, data] of onlineUsersMap.entries()) {
    onlineUsers[id] = true;
  }
  socket.emit('online-users', onlineUsers);
  
  // Handle joining a specific conversation
  socket.on('join-conversation', (conversationId) => {
    socket.join(`conversation:${conversationId}`);
    console.log(`${socket.user._id} joined conversation: ${conversationId}`);
    
    // Update active conversation
    activeConversation = conversationId;
    
    // Notify other participants that this user is viewing the conversation
    socket.to(`conversation:${conversationId}`).emit('user-viewing', {
      userId: socket.user._id,
      conversationId
    });
  });
  
  // Handle leaving a specific conversation
  socket.on('leave-conversation', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
    console.log(`${socket.user._id} left conversation: ${conversationId}`);
    
    // Reset active conversation
    activeConversation = null;
  });
  
  // Handle new messages
  socket.on('send-message', (messageData) => {
    // Broadcast to all users in this conversation
    socket.to(`conversation:${messageData.conversationId}`).emit('receive-message', {
      ...messageData,
      sender: socket.user._id
    });
    
    // Also send to all participants individually for notifications
    if (messageData.participants && Array.isArray(messageData.participants)) {
      messageData.participants.forEach(participantId => {
        if (participantId !== socket.user._id.toString()) {
          socket.to(participantId).emit('new-message-notification', {
            conversationId: messageData.conversationId,
            senderId: socket.user._id,
            senderName: socket.user.name,
            content: messageData.content
          });
        }
      });
    }
  });
  
  // Handle read status updates
  socket.on('mark-read', ({ conversationId, participantIds }) => {
    console.log('Received mark-read event:', {
      userId: socket.user._id,
      conversationId,
      participantIds
    });
    
    // Notify other participants that messages have been read
    if (participantIds && Array.isArray(participantIds)) {
      participantIds.forEach(participantId => {
        if (participantId !== socket.user._id.toString()) {
          console.log(`Sending messages-read notification to ${participantId}`);
          
          socket.to(participantId).emit('messages-read', {
            conversationId,
            readBy: socket.user._id
          });
        }
      });
    }
  });
  
  // Handle typing indicators
  socket.on('typing', ({ conversationId, isTyping }) => {
    socket.to(`conversation:${conversationId}`).emit('user-typing', {
      userId: socket.user._id,
      name: socket.user.name,
      isTyping,
      conversationId
    });
  });
  
  // Handle request for online status
  socket.on('get-online-status', ({ userIds }) => {
    const statuses = {};
    
    if (Array.isArray(userIds)) {
      userIds.forEach(id => {
        const isOnline = onlineUsersMap.has(id);
        statuses[id] = isOnline;
      });
    }
    
    socket.emit('online-status-response', statuses);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user._id}`);
    
    // If user was viewing a conversation, notify others they've left
    if (activeConversation) {
      socket.to(`conversation:${activeConversation}`).emit('user-left-view', {
        userId: socket.user._id,
        conversationId: activeConversation
      });
    }
    
    // Update user's last seen timestamp
    if (onlineUsersMap.has(userId)) {
      const userData = onlineUsersMap.get(userId);
      userData.lastSeen = new Date();
      onlineUsersMap.delete(userId);
    }
    
    // Broadcast to all connected clients that this user is offline
    socket.broadcast.emit('user-offline', userId);
  });
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Middleware để đo lường hiệu suất request
app.use((req, res, next) => {
  // Thời điểm bắt đầu xử lý request
  const requestStart = process.hrtime();
  
  // Lưu thời điểm bắt đầu vào request object
  req.requestTime = requestStart;
  
  // Bắt sự kiện 'finish' khi response hoàn tất
  res.on('finish', () => {
    // Tính toán thời gian xử lý
    const requestEnd = process.hrtime(requestStart);
    const totalTime = requestEnd[0] * 1000 + requestEnd[1] / 1000000;
    
    // Log thông tin
    console.log(`[REQUEST PERFORMANCE] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} - Total time: ${totalTime.toFixed(2)}ms`);
  });
  
  next();
});

// Connect to database
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/experts', expertRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/chat', chatRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: 'Something went wrong!' });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
