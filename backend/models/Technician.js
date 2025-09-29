const mongoose = require('mongoose');

const TechnicianSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true
  },
  service: { 
    type: [String], 
    required: true,
    enum: ['plumbing', 'electrical', 'hvac', 'gas', 'other']
  },
  phone: { 
    type: String, 
    required: true 
  },
  whatsappNumber: {
    type: String
  },
  location: { 
    type: String,
    required: true
  },
  experience: {
    years: {
      type: Number,
      min: 0,
      default: 0
    },
    description: {
      type: String,
      maxlength: 500
    }
  },
  certifications: [{
    type: String
  }],
  availability: {
    emergencyAvailable: {
      type: Boolean,
      default: false
    },
    workingHours: {
      monday: { start: String, end: String },
      tuesday: { start: String, end: String },
      wednesday: { start: String, end: String },
      thursday: { start: String, end: String },
      friday: { start: String, end: String },
      saturday: { start: String, end: String },
      sunday: { start: String, end: String }
    }
  },
  pricing: {
    hourlyRate: {
      type: Number,
      min: 0
    },
    calloutFee: {
      type: Number,
      min: 0,
      default: 0
    },
    currency: {
      type: String,
      default: 'CAD'
    }
  },
  profileImage: {
    type: String
  },
  gallery: [{
    type: String
  }],
  languages: [{
    type: String
  }],
  tools: [{
    type: String
  }],
  serviceAreas: [{
    type: String
  }],
  businessLicense: {
    number: String,
    expiryDate: Date,
    verified: {
      type: Boolean,
      default: false
    }
  },
  insurance: {
    provider: String,
    policyNumber: String,
    expiryDate: Date,
    verified: {
      type: Boolean,
      default: false
    }
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0,
    min: 0
  },
  completedJobs: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
TechnicianSchema.index({ service: 1 });
TechnicianSchema.index({ location: 1 });
TechnicianSchema.index({ averageRating: -1 });
TechnicianSchema.index({ isActive: 1 });
TechnicianSchema.index({ user: 1 }, { unique: true });

// Virtual for rating percentage
TechnicianSchema.virtual('ratingPercentage').get(function() {
  return this.averageRating ? (this.averageRating / 5) * 100 : 0;
});

// Method to update rating
TechnicianSchema.methods.updateRating = async function(newRating) {
  const totalScore = this.averageRating * this.totalRatings + newRating;
  this.totalRatings += 1;
  this.averageRating = totalScore / this.totalRatings;
  await this.save();
};

// Method to increment completed jobs
TechnicianSchema.methods.incrementCompletedJobs = async function() {
  this.completedJobs += 1;
  await this.save();
};

module.exports = mongoose.model('Technician', TechnicianSchema);