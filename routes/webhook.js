const express = require('express');
const router = express.Router();
const db = require('../database');

router.post('/website', async (req, res) => {
  try {
    const { name, phone, product, source } = req.body;
    const lead = await db.addLead({ name, phone, product, source: source || 'אתר', status: 'new' });
    res.json({ ok: true, lead });
  } catch(e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.get('/test', (req, res) => {
  res.json({ ok: true, message: 'Webhook עובד' });
});

module.exports = router;
