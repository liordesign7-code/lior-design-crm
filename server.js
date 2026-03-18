require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const admin = require('firebase-admin');

// 🔐 חיבור ל־Firebase מה־Secret File
const serviceAccount = require('/etc/secrets/firebase.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const app = express();
const PORT = process.env.PORT || 3000;
const PASS = process.env.CRM_PASSWORD || '1234';

// middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// לוגים
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleString('he-IL')}] ${req.method} ${req.url}`);
  next();
});

// בדיקת שרת
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
