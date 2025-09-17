const mongoose = require('mongoose');

const ServiceRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  serviceType: { type: String, required: true },
  description: { type: String, required: true },
  phone: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'completed'], default: 'pending' },
  assignedTechnician: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician' },
}, { timestamps: true });

module.exports = mongoose.model('ServiceRequest', ServiceRequestSchema);
