const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  serviceType: { type: String, required: true }, // e.g., Plumbing, HVAC
  description: String,
  location: String,
  preferredDate: Date,
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_progress', 'completed'],
    default: 'pending',
  },
  assignedTechnician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
