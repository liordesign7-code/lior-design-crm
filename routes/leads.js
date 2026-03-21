const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../leads.json');

// שליפת לידים
router.get('/', (req, res) => {
  const data = fs.readFileSync(DATA_FILE);
  const leads = JSON.parse(data);
  res.json({ ok: true, leads });
});

// הוספת ליד
router.post('/', (req, res) => {
  const { phone, name } = req.body;

  const data = fs.readFileSync(DATA_FILE);
  const leads = JSON.parse(data);

  const newLead = {
    id: Date.now(),
    phone,
    name,
    createdAt: new Date()
  };

  leads.push(newLead);

  fs.writeFileSync(DATA_FILE, JSON.stringify(leads, null, 2));

  res.json({ success: true, lead: newLead });
});

module.exports = router;
