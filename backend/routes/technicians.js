const express = require('express');
const router = express.Router(); 

const { protect } = require('../middleware/authMiddleware');
const Technician = require('../models/Technician');

// Example route - get technician profile
router.get('/me', protect, async (req, res) => {
  try {
    const technician = await Technician.findOne({ user: req.user._id });
    if (!technician) return res.status(404).json({ error: 'Technician profile not found' });

    res.json(technician);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add other technician routes here...

module.exports = router;
