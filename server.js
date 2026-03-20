require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// זיכרון זמני ללידים
let leads = [];

// בדיקה
app.get('/', (req, res) => {
  res.send('API is working 🚀');
});

// קבלת ליד מהאתר
app.post('/leads', (req, res) => {
  try {
    const { phone, name } = req.body;

    if (!phone || !name) {
      return res.status(400).json({ error: 'Missing data' });
    }

    const newLead = {
      id: Date.now(),
      phone,
      name,
      createdAt: new Date()
    };

    leads.push(newLead);

    console.log('New lead:', newLead);

    res.json({ success: true, lead: newLead });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// שליפת לידים (לא חובה אבל טוב לבדיקה)
app.get('/leads', (req, res) => {
  res.json(leads);
});

// הפעלת שרת
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
