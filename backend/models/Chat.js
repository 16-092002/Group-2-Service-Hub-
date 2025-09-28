const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'location', 'system'],
    default: 'text'
  },
  fileUrl: String,
  fileName: String,
  fileSize: Number,
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  edited: {
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: Date,
    originalContent: String
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }
}, { 
  timestamps: true 
});

const chatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  chatType: {
    type: String,
    enum: ['direct', 'support', 'group'],
    default: 'direct'
  },
  title: {
    type: String,
    maxlength: 100
  },
  messages: [messageSchema],
  lastMessage: {
    content: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: Date,
    messageType: {
      type: String,
      default: 'text'
    }
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  serviceRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceRequest'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    allowFileSharing: {
      type: Boolean,
      default: true
    },
    allowLocationSharing: {
      type: Boolean,
      default: true
    },
    allowVideoCall: {
      type: Boolean,
      default: true
    },
    autoDeleteAfter: {
      type: Number, // days
      default: null
    }
  },
  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    tags: [String],
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal'
    }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
chatSchema.index({ participants: 1 });
chatSchema.index({ 'lastMessage.timestamp': -1 });
chatSchema.index({ appointmentId: 1 });
chatSchema.index({ serviceRequestId: 1 });
chatSchema.index({ 'messages.sender': 1, 'messages.createdAt': -1 });

// Virtual for unread message count per participant
chatSchema.virtual('unreadCounts').get(function() {
  const counts = {};
  
  this.participants.forEach(participantId => {
    const participantIdStr = participantId.toString();
    let unreadCount = 0;
    
    this.messages.forEach(message => {
      const hasRead = message.readBy.some(
        readInfo => readInfo.user.toString() === participantIdStr
      );
      
      if (!hasRead && message.sender.toString() !== participantIdStr) {
        unreadCount++;
      }
    });
    
    counts[participantIdStr] = unreadCount;
  });
  
  return counts;
});

// Virtual for message count
chatSchema.virtual('messageCount').get(function() {
  return this.messages.length;
});

// Virtual for other participant (for direct chats)
chatSchema.virtual('otherParticipant').get(function() {
  if (this.chatType === 'direct' && this.participants.length === 2) {
    // This would be set by the controller based on the requesting user
    return this._otherParticipant;
  }
  return null;
});

// Instance methods
chatSchema.methods.addMessage = function(senderId, content, messageType = 'text', additionalData = {}) {
  const message = {
    sender: senderId,
    content,
    messageType,
    ...additionalData
  };
  
  this.messages.push(message);
  
  // Update last message
  this.lastMessage = {
    content: messageType === 'text' ? content : `Sent a ${messageType}`,
    sender: senderId,
    timestamp: new Date(),
    messageType
  };
  
  this.updatedAt = new Date();
  
  return this.save();
};

chatSchema.methods.markAsRead = function(userId, messageIds = []) {
  if (messageIds.length === 0) {
    // Mark all messages as read
    this.messages.forEach(message => {
      if (message.sender.toString() !== userId.toString()) {
        const hasRead = message.readBy.some(
          readInfo => readInfo.user.toString() === userId.toString()
        );
        
        if (!hasRead) {
          message.readBy.push({
            user: userId,
            readAt: new Date()
          });
        }
      }
    });
  } else {
    // Mark specific messages as read
    messageIds.forEach(messageId => {
      const message = this.messages.id(messageId);
      if (message && message.sender.toString() !== userId.toString()) {
        const hasRead = message.readBy.some(
          readInfo => readInfo.user.toString() === userId.toString()
        );
        
        if (!hasRead) {
          message.readBy.push({
            user: userId,
            readAt: new Date()
          });
        }
      }
    });
  }
  
  return this.save();
};

chatSchema.methods.getUnreadCount = function(userId) {
  let unreadCount = 0;
  
  this.messages.forEach(message => {
    if (message.sender.toString() !== userId.toString()) {
      const hasRead = message.readBy.some(
        readInfo => readInfo.user.toString() === userId.toString()
      );
      
      if (!hasRead) {
        unreadCount++;
      }
    }
  });
  
  return unreadCount;
};

chatSchema.methods.editMessage = function(messageId, newContent, editorId) {
  const message = this.messages.id(messageId);
  
  if (!message) {
    throw new Error('Message not found');
  }
  
  if (message.sender.toString() !== editorId.toString()) {
    throw new Error('Only message sender can edit the message');
  }
  
  message.edited = {
    isEdited: true,
    editedAt: new Date(),
    originalContent: message.content
  };
  
  message.content = newContent;
  
  return this.save();
};

chatSchema.methods.deleteMessage = function(messageId, deleterId) {
  const message = this.messages.id(messageId);
  
  if (!message) {
    throw new Error('Message not found');
  }
  
  if (message.sender.toString() !== deleterId.toString()) {
    throw new Error('Only message sender can delete the message');
  }
  
  this.messages.pull(messageId);
  
  // Update last message if the deleted message was the last one
  if (this.lastMessage && this.messages.length > 0) {
    const lastMsg = this.messages[this.messages.length - 1];
    this.lastMessage = {
      content: lastMsg.messageType === 'text' ? lastMsg.content : `Sent a ${lastMsg.messageType}`,
      sender: lastMsg.sender,
      timestamp: lastMsg.createdAt,
      messageType: lastMsg.messageType
    };
  } else if (this.messages.length === 0) {
    this.lastMessage = null;
  }
  
  return this.save();
};

// Static methods
chatSchema.statics.findOrCreateDirectChat = async function(userId1, userId2, appointmentId = null, serviceRequestId = null) {
  // Check if chat already exists
  let existingChat = await this.findOne({
    chatType: 'direct',
    participants: { $all: [userId1, userId2], $size: 2 }
  }).populate('participants', 'name email role');
  
  if (existingChat) {
    return existingChat;
  }
  
  // Create new chat
  const newChat = new this({
    participants: [userId1, userId2],
    chatType: 'direct',
    appointmentId,
    serviceRequestId,
    metadata: {
      createdBy: userId1
    }
  });
  
  await newChat.save();
  await newChat.populate('participants', 'name email role');
  
  return newChat;
};

chatSchema.statics.getUserChats = function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({
    participants: userId,
    isActive: true
  })
    .populate('participants', 'name email role profileImage')
    .populate('lastMessage.sender', 'name')
    .sort({ 'lastMessage.timestamp': -1, updatedAt: -1 })
    .skip(skip)
    .limit(limit);
};

chatSchema.statics.searchChats = function(userId, searchTerm, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  return this.find({
    participants: userId,
    isActive: true,
    $or: [
      { title: { $regex: searchTerm, $options: 'i' } },
      { 'messages.content': { $regex: searchTerm, $options: 'i' } }
    ]
  })
    .populate('participants', 'name email role')
    .sort({ 'lastMessage.timestamp': -1 })
    .skip(skip)
    .limit(limit);
};

// Pre-save middleware
chatSchema.pre('save', function(next) {
  // Ensure at least 2 participants for direct chat
  if (this.chatType === 'direct' && this.participants.length !== 2) {
    return next(new Error('Direct chat must have exactly 2 participants'));
  }
  
  // Set title for direct chats if not provided
  if (this.chatType === 'direct' && !this.title) {
    this.title = 'Direct Chat';
  }
  
  next();
});

// Post-save middleware for real-time updates
chatSchema.post('save', function(doc) {
  // Emit socket event for real-time updates
  // This would be handled by the socket service
  console.log(`Chat ${doc._id} updated`);
});

module.exports = mongoose.model('Chat', chatSchema);