const express = require('express');
const router = express.Router();

const { signup, login } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');

// Auth Routes
router.post('/signup', signup);
router.post('/login', login);

// Get current user (protected)
router.get('/me', protect, async (req, res) => {
  res.json(req.user); // `req.user` is set by protect middleware
});

// Update profile (protected)
router.put('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { name, email, password } = req.body;

    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = password; // Will hash due to pre-save middleware

    await user.save();

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
