const mongoose = require('mongoose');

const TechnicianSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  service: { type: String, required: true }, // e.g. Plumbing, Electrical
  phone: { type: String, required: true },
  location: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Technician', TechnicianSchema);
