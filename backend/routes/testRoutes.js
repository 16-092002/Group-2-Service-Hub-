const express = require('express');
const router = express.Router();

router.get('/ping', (req, res) => {
  res.json({ message: 'Backend is alive!' });
});

module.exports = router;
