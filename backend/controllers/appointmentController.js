const Appointment = require('../models/Appointment');

exports.createAppointment = async (req, res) => {
  const { technicianId, service, appointmentDate } = req.body;

  try {
    const appointment = new Appointment({
      user: req.user._id,
      technician: technicianId,
      service,
      appointmentDate,
      status: 'scheduled',
    });
    await appointment.save();
    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ user: req.user._id })
      .populate('technician', 'user service phone')
      .sort({ appointmentDate: 1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
