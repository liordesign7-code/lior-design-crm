const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  res.json({ ok: true, leads: db.getLeads() });
});

router.post('/', (req, res) => {
  const lead = db.addLead(req.body);
  res.json({ ok: true, lead });
});

router.put('/:id', (req, res) => {
  const lead = db.updateLead(req.params.id, req.body);
  res.json({ ok: true, lead });
});

router.delete('/:id', (req, res) => {
  db.deleteLead(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
