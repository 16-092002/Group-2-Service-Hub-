// backend/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

// Import routes
const authRoutes = require('./routes/auth');
const technicianRoutes = require('./routes/technicians');
const serviceRequestRoutes = require('./routes/serviceRequestRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminRoutes = require('./routes/admin');

// Import middleware
const { allowRoles } = require('./middleware/roleMiddleware');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => {
  console.error('MongoDB connection error:', err.message);
  process.exit(1);
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user joining their room
  socket.on('join_user_room', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  // Handle joining specific chat rooms
  socket.on('join_chat', (chatId) => {
    socket.join(`chat_${chatId}`);
    console.log(`Socket ${socket.id} joined chat ${chatId}`);
  });

  // Handle leaving chat rooms
  socket.on('leave_chat', (chatId) => {
    socket.leave(`chat_${chatId}`);
    console.log(`Socket ${socket.id} left chat ${chatId}`);
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    socket.to(`chat_${data.chatId}`).emit('user_typing', {
      userId: data.userId,
      isTyping: true
    });
  });

  socket.on('typing_stop', (data) => {
    socket.to(`chat_${data.chatId}`).emit('user_typing', {
      userId: data.userId,
      isTyping: false
    });
  });

  // Handle video call signaling
  socket.on('video_call_offer', (data) => {
    socket.to(data.to).emit('video_call_offer', {
      from: socket.userId,
      offer: data.offer,
      callId: data.callId
    });
  });

  socket.on('video_call_answer', (data) => {
    socket.to(data.to).emit('video_call_answer', {
      from: socket.userId,
      answer: data.answer,
      callId: data.callId
    });
  });

  socket.on('video_call_ice_candidate', (data) => {
    socket.to(data.to).emit('video_call_ice_candidate', {
      from: socket.userId,
      candidate: data.candidate,
      callId: data.callId
    });
  });

  socket.on('video_call_end', (data) => {
    socket.to(data.to).emit('video_call_ended', {
      from: socket.userId,
      callId: data.callId
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Routes
app.use('/auth', authRoutes);
app.use('/technicians', technicianRoutes);
app.use('/service-requests', serviceRequestRoutes);
app.use('/appointments', appointmentRoutes);
app.use('/chat', chatRoutes);
app.use('/admin', adminRoutes);

// Health check route
app.get('/ping', (req, res) => {
  res.json({ 
    message: 'pong',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API info route
app.get('/api/info', (req, res) => {
  res.json({
    name: 'ServiceHub API',
    version: '1.0.0',
    description: 'Professional Home Services Platform API',
    endpoints: {
      auth: '/auth',
      technicians: '/technicians',
      serviceRequests: '/service-requests',
      appointments: '/appointments',
      chat: '/chat',
      admin: '/admin'
    }
  });
});

// File upload handling (basic setup)
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept images and common document formats
    if (file.mimetype.startsWith('image/') || 
        file.mimetype === 'application/pdf' ||
        file.mimetype.includes('document')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// File upload routes
app.post('/upload/image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  res.json({
    message: 'File uploaded successfully',
    url: `/uploads/${req.file.filename}`,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size
  });
});

app.post('/upload/chat-file', upload.single('chatFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  res.json({
    message: 'Chat file uploaded successfully',
    url: `/uploads/${req.file.filename}`,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype
  });
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
    return res.status(400).json({ error: err.message });
  }
  
  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: 'Validation Error', details: errors });
  }
  
  // Mongoose cast errors
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }
  
  // Default error
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  });
});

// Start the server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🗄️  Database: ${process.env.MONGO_URI ? 'Connected' : 'Not configured'}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📋 API Documentation: http://localhost:${PORT}/api/info`);
    console.log(`❤️  Health Check: http://localhost:${PORT}/ping`);
  }
});

// Export for testing
module.exports = { app, server, io };