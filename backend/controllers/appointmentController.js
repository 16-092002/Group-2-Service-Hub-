const Appointment = require('../models/Appointment');

exports.createAppointment = async (req, res) => {
  try {
    const { technician, serviceType, date } = req.body;

    const newAppointment = new Appointment({
      user: req.user._id,
      technician,
      serviceType,
      date
    });

    const saved = await newAppointment.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ user: req.user._id }).populate('technician');
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTechnicianAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ technician: req.user._id }).populate('user');
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
