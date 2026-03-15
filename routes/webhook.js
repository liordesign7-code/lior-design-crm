const express = require('express');
const router = express.Router();
const db = require('../database');

router.post('/website', (req, res) => {
  const { name, phone, product, source } = req.body;
  const lead = db.addLead({ name, phone, product, source: source || 'אתר', status: 'new' });
  res.json({ ok: true, lead });
});

router.get('/test', (req, res) => {
  res.json({ ok: true, message: 'Webhook עובד' });
});

module.exports = router;
