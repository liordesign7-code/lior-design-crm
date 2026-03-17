const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  Promise.resolve(db.getLeads())
    .then(leads => res.json({ ok: true, leads: leads || [] }))
    .catch(() => res.json({ ok: true, leads: [] }));
});

router.post('/', (req, res) => {
  Promise.resolve(db.addLead(req.body))
    .then(lead => res.json({ ok: true, lead }))
    .catch(e => res.status(500).json({ ok: false, error: e.message }));
});

router.put('/:id', (req, res) => {
  Promise.resolve(db.updateLead(req.params.id, req.body))
    .then(lead => res.json({ ok: true, lead }))
    .catch(e => res.status(500).json({ ok: false, error: e.message }));
});

router.delete('/:id', (req, res) => {
  Promise.resolve(db.deleteLead(req.params.id))
    .then(() => res.json({ ok: true }))
    .catch(e => res.status(500).json({ ok: false, error: e.message }));
});

module.exports = router;
