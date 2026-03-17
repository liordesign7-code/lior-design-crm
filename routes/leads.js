const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', async (req, res) => {
  try {
    const leads = await db.getLeads();
    res.json({ ok: true, leads });
  } catch(e) {
    res.json({ ok: true, leads: [] });
  }
});

router.post('/', async (req, res) => {
  try {
    const lead = await db.addLead(req.body);
    res.json({ ok: true, lead });
  } catch(e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const lead = await db.updateLead(req.params.id, req.body);
    res.json({ ok: true, lead });
  } catch(e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.deleteLead(req.params.id);
    res.json({ ok: true });
  } catch(e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
