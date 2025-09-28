const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  technician: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  serviceRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceRequest',
    default: null
  },
  serviceType: {
    type: String,
    required: true,
    enum: ['plumbing', 'electrical', 'hvac', 'gas', 'other']
  },
  date: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'anytime'],
    default: 'anytime'
  },
  estimatedDuration: {
    type: Number, // in hours
    default: 2,
    min: 0.5,
    max: 8
  },
  description: {
    type: String,
    maxlength: 1000
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    accessInstructions: String
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled'],
    default: 'scheduled'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'emergency'],
    default: 'normal'
  },
  pricing: {
    estimatedCost: {
      type: Number,
      min: 0
    },
    finalCost: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'CAD'
    }
  },
  notes: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 500
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['general', 'technical', 'customer_request', 'issue'],
      default: 'general'
    }
  }],
  attachments: [{
    filename: String,
    url: String,
    fileType: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Status tracking
  confirmedAt: Date,
  startedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Feedback
  customerFeedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    submittedAt: Date
  },
  technicianFeedback: {
    workCompleted: String,
    issuesEncountered: String,
    recommendations: String,
    submittedAt: Date
  },
  // Notifications
  remindersSent: [{
    type: {
      type: String,
      enum: ['24h', '2h', '30min']
    },
    sentAt: Date,
    recipient: String // 'customer' or 'technician'
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
appointmentSchema.index({ user: 1, date: -1 });
appointmentSchema.index({ technician: 1, date: 1 });
appointmentSchema.index({ date: 1, status: 1 });
appointmentSchema.index({ serviceType: 1, status: 1 });

// Virtual for appointment duration in a readable format
appointmentSchema.virtual('durationFormatted').get(function() {
  const hours = Math.floor(this.estimatedDuration);
  const minutes = Math.round((this.estimatedDuration - hours) * 60);
  
  if (hours === 0) {
    return `${minutes} minutes`;
  } else if (minutes === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minutes`;
  }
});

// Virtual for time until appointment
appointmentSchema.virtual('timeUntilAppointment').get(function() {
  const now = new Date();
  const appointmentDate = new Date(this.date);
  const diffMs = appointmentDate - now;
  
  if (diffMs <= 0) {
    return 'Past due';
  }
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  } else {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
  }
});

// Virtual for status display
appointmentSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    'scheduled': 'Scheduled',
    'confirmed': 'Confirmed',
    'in_progress': 'In Progress',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    'rescheduled': 'Rescheduled'
  };
  return statusMap[this.status] || this.status;
});

// Instance methods
appointmentSchema.methods.canBeCancelled = function() {
  return ['scheduled', 'confirmed'].includes(this.status);
};

appointmentSchema.methods.canBeRescheduled = function() {
  return ['scheduled', 'confirmed'].includes(this.status);
};

appointmentSchema.methods.canBeStarted = function() {
  return this.status === 'confirmed';
};

appointmentSchema.methods.canBeCompleted = function() {
  return this.status === 'in_progress';
};

appointmentSchema.methods.addNote = function(authorId, content, type = 'general') {
  this.notes.push({
    author: authorId,
    content,
    type,
    timestamp: new Date()
  });
  return this.save();
};

appointmentSchema.methods.updateStatus = function(newStatus, userId) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  const now = new Date();
  
  switch (newStatus) {
    case 'confirmed':
      this.confirmedAt = now;
      break;
    case 'in_progress':
      this.startedAt = now;
      break;
    case 'completed':
      this.completedAt = now;
      break;
    case 'cancelled':
      this.cancelledAt = now;
      this.cancelledBy = userId;
      break;
  }
  
  // Add status change note
  this.notes.push({
    author: userId,
    content: `Status changed from ${oldStatus} to ${newStatus}`,
    type: 'general',
    timestamp: now
  });
  
  return this.save();
};

// Static methods
appointmentSchema.statics.findByDateRange = function(startDate, endDate, technicianId = null) {
  const query = {
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };
  
  if (technicianId) {
    query.technician = technicianId;
  }
  
  return this.find(query)
    .populate('user', 'name email phone')
    .populate('technician', 'name email phone')
    .sort({ date: 1 });
};

appointmentSchema.statics.findUpcoming = function(userId, userType = 'user') {
  const query = {
    date: { $gte: new Date() },
    status: { $in: ['scheduled', 'confirmed'] }
  };
  
  if (userType === 'technician') {
    query.technician = userId;
  } else {
    query.user = userId;
  }
  
  return this.find(query)
    .populate('user', 'name email phone')
    .populate('technician', 'name email phone')
    .sort({ date: 1 })
    .limit(10);
};

appointmentSchema.statics.getTechnicianSchedule = function(technicianId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.find({
    technician: technicianId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['scheduled', 'confirmed', 'in_progress'] }
  })
    .populate('user', 'name phone')
    .sort({ date: 1 });
};

// Pre-save middleware
appointmentSchema.pre('save', function(next) {
  // Validate appointment date is in the future (for new appointments)
  if (this.isNew && this.date < new Date()) {
    return next(new Error('Appointment date must be in the future'));
  }
  
  // Set default address from user if not provided
  if (this.isNew && !this.address.street) {
    // This would be populated from user's default address
    // We'll handle this in the controller
  }
  
  next();
});

// Post-save middleware for notifications
appointmentSchema.post('save', function(doc) {
  // Here you would trigger notifications
  // For example, send email/SMS to both parties
  console.log(`Appointment ${doc._id} saved with status: ${doc.status}`);
});

module.exports = mongoose.model('Appointment', appointmentSchema);