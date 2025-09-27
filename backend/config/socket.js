const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Chat = require('../models/Chat');

let io;

// Socket authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
};

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Use authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.name} connected with socket ID: ${socket.id}`);

    // Join user to their personal room
    socket.join(socket.userId);

    // Handle joining chat rooms
    socket.on('join_chat', async (data) => {
      try {
        const { chatId, otherUserId } = data;
        
        // Verify user is part of this chat
        const chat = await Chat.findOne({
          _id: chatId,
          participants: socket.userId
        });

        if (!chat) {
          socket.emit('error', { message: 'Unauthorized to join this chat' });
          return;
        }

        socket.join(chatId);
        socket.currentChatId = chatId;
        
        // Notify others in the chat that user joined
        socket.to(chatId).emit('user_joined', {
          userId: socket.userId,
          userName: socket.user.name
        });

        console.log(`User ${socket.user.name} joined chat ${chatId}`);
      } catch (error) {
        console.error('Join chat error:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const { chatId, message, messageType = 'text', fileUrl = null } = data;

        // Verify user is part of this chat
        const chat = await Chat.findById(chatId);
        if (!chat || !chat.participants.includes(socket.userId)) {
          socket.emit('error', { message: 'Unauthorized to send message' });
          return;
        }

        // Create message object
        const newMessage = {
          sender: socket.userId,
          content: message,
          messageType,
          fileUrl,
          timestamp: new Date(),
          readBy: [{ user: socket.userId, readAt: new Date() }]
        };

        // Add message to chat
        chat.messages.push(newMessage);
        chat.lastMessage = {
          content: messageType === 'text' ? message : `Sent a ${messageType}`,
          sender: socket.userId,
          timestamp: new Date()
        };
        chat.updatedAt = new Date();

        await chat.save();

        // Get the saved message with populated sender info
        await chat.populate('messages.sender', 'name');
        const savedMessage = chat.messages[chat.messages.length - 1];

        // Emit to all users in the chat
        io.to(chatId).emit('new_message', {
          chatId,
          message: savedMessage,
          chat: {
            _id: chat._id,
            lastMessage: chat.lastMessage,
            updatedAt: chat.updatedAt
          }
        });

        // Send push notification to offline users
        const otherParticipants = chat.participants.filter(
          p => p.toString() !== socket.userId
        );
        
        // Here you would implement push notifications
        // notificationService.sendToUsers(otherParticipants, notification);

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { chatId } = data;
      socket.to(chatId).emit('user_typing', {
        userId: socket.userId,
        userName: socket.user.name,
        isTyping: true
      });
    });

    socket.on('typing_stop', (data) => {
      const { chatId } = data;
      socket.to(chatId).emit('user_typing', {
        userId: socket.userId,
        userName: socket.user.name,
        isTyping: false
      });
    });

    // Handle message read receipts
    socket.on('mark_read', async (data) => {
      try {
        const { chatId, messageIds } = data;

        await Chat.updateOne(
          { _id: chatId },
          {
            $addToSet: {
              'messages.$[elem].readBy': {
                user: socket.userId,
                readAt: new Date()
              }
            }
          },
          {
            arrayFilters: [
              { 'elem._id': { $in: messageIds } }
            ]
          }
        );

        // Notify other users about read status
        socket.to(chatId).emit('messages_read', {
          chatId,
          messageIds,
          readBy: {
            user: socket.userId,
            userName: socket.user.name,
            readAt: new Date()
          }
        });

      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    // Handle video call signaling
    socket.on('video_call_offer', (data) => {
      const { to, offer, callId } = data;
      socket.to(to).emit('video_call_offer', {
        from: socket.userId,
        fromName: socket.user.name,
        offer,
        callId
      });
    });

    socket.on('video_call_answer', (data) => {
      const { to, answer, callId } = data;
      socket.to(to).emit('video_call_answer', {
        from: socket.userId,
        answer,
        callId
      });
    });

    socket.on('video_call_ice_candidate', (data) => {
      const { to, candidate, callId } = data;
      socket.to(to).emit('video_call_ice_candidate', {
        from: socket.userId,
        candidate,
        callId
      });
    });

    socket.on('video_call_end', (data) => {
      const { to, callId } = data;
      socket.to(to).emit('video_call_ended', {
        from: socket.userId,
        callId
      });
    });

    // Handle service request updates
    socket.on('service_request_update', (data) => {
      const { serviceRequestId, status, updates } = data;
      
      // Broadcast to relevant users (customer and assigned technician)
      io.emit('service_request_updated', {
        serviceRequestId,
        status,
        updates,
        updatedBy: socket.userId
      });
    });

    // Handle location sharing
    socket.on('share_location', (data) => {
      const { chatId, latitude, longitude, address } = data;
      
      socket.to(chatId).emit('location_shared', {
        from: socket.userId,
        fromName: socket.user.name,
        location: { latitude, longitude, address },
        timestamp: new Date()
      });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`User ${socket.user.name} disconnected: ${reason}`);
      
      // Leave all rooms
      if (socket.currentChatId) {
        socket.to(socket.currentChatId).emit('user_left', {
          userId: socket.userId,
          userName: socket.user.name
        });
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return io;
};

// Helper function to emit to specific user
const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(userId).emit(event, data);
  }
};

// Helper function to emit to chat room
const emitToChat = (chatId, event, data) => {
  if (io) {
    io.to(chatId).emit(event, data);
  }
};

module.exports = {
  initializeSocket,
  emitToUser,
  emitToChat
};