require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let leads = [];

// בדיקה שהשרת עובד
app.get('/', (req, res) => {
  res.send('API is working 🚀');
});

// GET כל הלידים
app.get('/leads', (req, res) => {
  res.json({ ok: true, leads });
});

// POST ליד חדש
app.post('/leads', (req, res) => {
  const lead = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2),
    phone: req.body.phone || '',
    name: req.body.name || '',
    message: req.body.message || req.body.Body || '',
    createdAt: new Date()
  };

  if (lead.phone) {
    leads.unshift(lead);
  }

  res.json({ ok: true, lead });
});

// בדיקת בריאות
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// אם אין נתיב
app.use((req, res) => {
  res.status(404).json({ ok: false, message: 'Not Found' });
});

app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
