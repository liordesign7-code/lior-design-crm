const express = require('express');
const router = express.Router();

// בדיקה
router.get('/test', (req, res) => {
  res.json({ ok: true, msg: 'twilio route works' });
});

// קבלת הודעות וואטסאפ
router.post('/incoming-wa', (req, res) => {
  res.set('Content-Type', 'text/xml');
  res.send('<Response></Response>');

  const from = (req.body && req.body.From) ? req.body.From : '';
  const body = (req.body && req.body.Body) ? req.body.Body : '';

  console.log('Incoming message:', from, body);
});

module.exports = router;
