const Chat = require('../models/Chat');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const ServiceRequest = require('../models/ServiceRequest');

// Get or create a chat between two users
exports.getOrCreateChat = async (req, res) => {
  try {
    const { otherUserId, appointmentId, serviceRequestId } = req.body;
    const currentUserId = req.user._id;

    if (!otherUserId) {
      return res.status(400).json({ error: 'Other user ID is required' });
    }

    if (otherUserId === currentUserId.toString()) {
      return res.status(400).json({ error: 'Cannot create chat with yourself' });
    }

    // Verify other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create or find existing chat
    const chat = await Chat.findOrCreateDirectChat(
      currentUserId,
      otherUserId,
      appointmentId,
      serviceRequestId
    );

    // Set the other participant for the virtual field
    chat._otherParticipant = otherUser;

    res.json({
      chat,
      otherUser: {
        _id: otherUser._id,
        name: otherUser.name,
        email: otherUser.email,
        role: otherUser.role
      }
    });

  } catch (error) {
    console.error('Get or create chat error:', error);
    res.status(500).json({ error: 'Failed to create chat' });
  }
};

// Get user's chats
exports.getUserChats = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user._id;

    const chats = await Chat.getUserChats(userId, parseInt(page), parseInt(limit));

    // Add other participant info and unread counts
    const chatsWithInfo = chats.map(chat => {
      const otherParticipant = chat.participants.find(
        p => p._id.toString() !== userId.toString()
      );
      
      const unreadCount = chat.getUnreadCount(userId);

      return {
        ...chat.toObject(),
        otherParticipant,
        unreadCount
      };
    });

    res.json({
      chats: chatsWithInfo,
      pagination: {
        currentPage: parseInt(page),
        hasNext: chats.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get user chats error:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
};

// Get specific chat
exports.getChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    const chat = await Chat.findById(chatId)
      .populate('participants', 'name email role profileImage')
      .populate('messages.sender', 'name email role')
      .populate('appointmentId')
      .populate('serviceRequestId');

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Verify user is participant
    const isParticipant = chat.participants.some(
      p => p._id.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized to access this chat' });
    }

    // Get other participant info
    const otherParticipant = chat.participants.find(
      p => p._id.toString() !== userId.toString()
    );

    // Mark messages as read
    await chat.markAsRead(userId);

    res.json({
      chat,
      otherParticipant,
      unreadCount: 0 // Now 0 since we marked as read
    });

  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ error: 'Failed to fetch chat' });
  }
};

// Send message
exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, messageType = 'text', fileUrl, fileName, location, replyTo } = req.body;
    const senderId = req.user._id;

    if (!content && !fileUrl && !location) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Verify user is participant
    const isParticipant = chat.participants.some(
      p => p._id.toString() === senderId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized to send message' });
    }

    // Prepare message data
    const messageData = {
      content: content || '',
      messageType
    };

    if (fileUrl) {
      messageData.fileUrl = fileUrl;
      messageData.fileName = fileName;
    }

    if (location) {
      messageData.location = location;
    }

    if (replyTo) {
      messageData.replyTo = replyTo;
    }

    // Add message to chat
    await chat.addMessage(senderId, messageData.content, messageType, messageData);

    // Populate the new message
    await chat.populate('messages.sender', 'name email role');
    const newMessage = chat.messages[chat.messages.length - 1];

    // Emit socket event for real-time updates
    // This would be handled by socket.io
    const io = req.app.get('io');
    if (io) {
      chat.participants.forEach(participantId => {
        if (participantId.toString() !== senderId.toString()) {
          io.to(participantId.toString()).emit('new_message', {
            chatId,
            message: newMessage,
            chat: {
              _id: chat._id,
              lastMessage: chat.lastMessage,
              updatedAt: chat.updatedAt
            }
          });
        }
      });
    }

    res.status(201).json({
      message: newMessage,
      chat: {
        _id: chat._id,
        lastMessage: chat.lastMessage,
        updatedAt: chat.updatedAt
      }
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { messageIds } = req.body;
    const userId = req.user._id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Verify user is participant
    const isParticipant = chat.participants.some(
      p => p._id.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await chat.markAsRead(userId, messageIds);

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      chat.participants.forEach(participantId => {
        if (participantId.toString() !== userId.toString()) {
          io.to(participantId.toString()).emit('messages_read', {
            chatId,
            messageIds: messageIds || [],
            readBy: {
              user: userId,
              readAt: new Date()
            }
          });
        }
      });
    }

    res.json({ message: 'Messages marked as read' });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
};

// Edit message
exports.editMessage = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content) {
      return res.status(400).json({ error: 'New content is required' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    await chat.editMessage(messageId, content, userId);
    await chat.populate('messages.sender', 'name email role');

    const editedMessage = chat.messages.id(messageId);

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      chat.participants.forEach(participantId => {
        io.to(participantId.toString()).emit('message_edited', {
          chatId,
          message: editedMessage
        });
      });
    }

    res.json({
      message: 'Message edited successfully',
      editedMessage
    });

  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ error: error.message || 'Failed to edit message' });
  }
};

// Delete message
exports.deleteMessage = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const userId = req.user._id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    await chat.deleteMessage(messageId, userId);

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      chat.participants.forEach(participantId => {
        io.to(participantId.toString()).emit('message_deleted', {
          chatId,
          messageId,
          deletedBy: userId
        });
      });
    }

    res.json({ message: 'Message deleted successfully' });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete message' });
  }
};

// Search chats and messages
exports.searchChats = async (req, res) => {
  try {
    const { q: searchTerm, page = 1, limit = 10 } = req.query;
    const userId = req.user._id;

    if (!searchTerm) {
      return res.status(400).json({ error: 'Search term is required' });
    }

    const chats = await Chat.searchChats(userId, searchTerm, parseInt(page), parseInt(limit));

    const chatsWithInfo = chats.map(chat => {
      const otherParticipant = chat.participants.find(
        p => p._id.toString() !== userId.toString()
      );
      
      return {
        ...chat.toObject(),
        otherParticipant
      };
    });

    res.json({
      chats: chatsWithInfo,
      searchTerm,
      pagination: {
        currentPage: parseInt(page),
        hasNext: chats.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Search chats error:', error);
    res.status(500).json({ error: 'Failed to search chats' });
  }
};

// Get chat statistics
exports.getChatStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const [
      totalChats,
      activeChats,
      totalMessages,
      unreadMessages
    ] = await Promise.all([
      Chat.countDocuments({ participants: userId }),
      Chat.countDocuments({ 
        participants: userId, 
        isActive: true,
        'lastMessage.timestamp': { 
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }),
      Chat.aggregate([
        { $match: { participants: userId } },
        { $project: { messageCount: { $size: '$messages' } } },
        { $group: { _id: null, total: { $sum: '$messageCount' } } }
      ]),
      Chat.aggregate([
        { $match: { participants: userId } },
        { $unwind: '$messages' },
        { 
          $match: { 
            'messages.sender': { $ne: userId },
            'messages.readBy.user': { $ne: userId }
          } 
        },
        { $count: 'unread' }
      ])
    ]);

    res.json({
      totalChats,
      activeChats,
      totalMessages: totalMessages[0]?.total || 0,
      unreadMessages: unreadMessages[0]?.unread || 0
    });

  } catch (error) {
    console.error('Get chat stats error:', error);
    res.status(500).json({ error: 'Failed to fetch chat statistics' });
  }
};

// Create support chat
exports.createSupportChat = async (req, res) => {
  try {
    const { subject, initialMessage } = req.body;
    const userId = req.user._id;

    // Find support user (admin role)
    const supportUser = await User.findOne({ role: 'admin' });
    if (!supportUser) {
      return res.status(500).json({ error: 'Support not available at the moment' });
    }

    // Create support chat
    const chat = new Chat({
      participants: [userId, supportUser._id],
      chatType: 'support',
      title: subject || 'Support Request',
      metadata: {
        createdBy: userId,
        tags: ['support'],
        priority: 'normal'
      }
    });

    await chat.save();

    // Add initial message if provided
    if (initialMessage) {
      await chat.addMessage(userId, initialMessage, 'text');
    }

    await chat.populate('participants', 'name email role');

    res.status(201).json({
      message: 'Support chat created successfully',
      chat
    });

  } catch (error) {
    console.error('Create support chat error:', error);
    res.status(500).json({ error: 'Failed to create support chat' });
  }
};