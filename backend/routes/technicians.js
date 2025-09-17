const { protect } = require('../middleware/authMiddleware');

// GET technician profile for logged-in user
router.get('/me', protect, async (req, res) => {
  try {
    const technician = await Technician.findOne({ user: req.user._id });
    if (!technician) return res.status(404).json({ error: 'Technician profile not found' });
    res.json(technician);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST or PUT technician profile for logged-in user (upsert)
router.post('/me', protect, async (req, res) => {
  const { service, phone, location } = req.body;

  try {
    let technician = await Technician.findOne({ user: req.user._id });

    if (technician) {
      // Update
      technician.service = service || technician.service;
      technician.phone = phone || technician.phone;
      technician.location = location || technician.location;
      await technician.save();
    } else {
      // Create
      technician = new Technician({
        user: req.user._id,
        service,
        phone,
        location,
      });
      await technician.save();
    }
    res.json(technician);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
