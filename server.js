require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

// Firebase
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

// בדיקה
app.get('/twilio-test', (req, res) => {
  res.json({ ok: true });
});

// קבלת הודעת וואטסאפ
app.post('/twilio/incoming-wa', async (req, res) => {
  try {
    console.log('RAW:', req.body);

    const message = req.body.Body;
    const phone = req.body.From;

    if (!message || !phone) {
      return res.status(400).send('Missing data');
    }

    await db.collection('leads').add({
      message,
      phone,
      createdAt: new Date()
    });

    console.log('Saved:', message, phone);

    res.set('Content-Type', 'text/xml');
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
    res.status(500).json({ ok: false });
  }
});

app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
