const Technician = require('../models/Technician');
const User = require('../models/User');

exports.getTechnicians = async (req, res) => {
  try {
    const technicians = await Technician.find().populate('user', 'name email role');
    res.json(technicians);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addTechnician = async (req, res) => {
  const { userId, service, phone, location } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role !== 'technician') {
      return res.status(400).json({ error: 'User role is not technician' });
    }

    const existing = await Technician.findOne({ user: userId });
    if (existing) return res.status(400).json({ error: 'Technician profile already exists' });

    const tech = new Technician({ user: userId, service, phone, location });
    await tech.save();
    res.status(201).json(tech);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
