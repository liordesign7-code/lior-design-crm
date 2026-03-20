const express = require('express');
const router = express.Router();

router.get('/test', (req, res) => {
  res.json({ ok: true, msg: 'twilio route works' });
});

module.exports = router;
