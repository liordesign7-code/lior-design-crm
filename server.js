require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const admin = require('firebase-admin');

// 🔐 Firebase (מה־Secret File)
const serviceAccount = require('/etc/secrets/firebase.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const app = express();
const PORT = process.env.PORT || 3000;

// middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// לוגים
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleString('he-IL')}] ${req.method} ${req.url}`);
  next();
});

// בדיקה
app.get('/twilio/test', (req, res) => {
  res.json({ ok: true, msg: 'twilio route works' });
});

// קבלת הודעה מוואטסאפ
app.post('/twilio/incoming-wa', async (req, res) => {
  try {
    const { Body, From } = req.body;

    await db.collection('leads').add({
      message: Body,
      phone: From,
      createdAt: new Date()
    });

    console.log('Saved to Firebase:', Body);

    res.send('<Response></Response>');
  } catch (err) {
    console.error(err);
    res.status(500).send('error');
  }
});

// שליפת לידים
app.get('/leads', async (req, res) => {
  try {
    const snapshot = await db
      .collection('leads')
      .orderBy('createdAt', 'desc')
      .get();

    const leads = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({ ok: true, leads });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// הפעלת שרת
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
