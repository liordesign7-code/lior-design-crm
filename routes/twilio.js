const express = require('express');
const router = express.Router();
const admin = require("firebase-admin");

// טעינת Firebase בצורה יציבה
const serviceAccount = require("/etc/secrets/firebase.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// בדיקה
router.get('/test', (req, res) => {
  return res.json({ ok: true, msg: 'twilio route works' });
});

// קבלת הודעות וואטסאפ
router.post('/incoming-wa', async (req, res) => {
  try {
    const from = req.body?.From || '';
    const body = req.body?.Body || '';

    console.log("Incoming:", from, body);

    if (!from || !body) {
      console.log("Missing data");
      res.set('Content-Type', 'text/xml');
      return res.send('<Response></Response>');
    }

    const doc = await db.collection("leads").add({
      phone: from,
      message: body,
      createdAt: new Date()
    });

    console.log("Saved to Firebase:", doc.id);

    res.set('Content-Type', 'text/xml');
    return res.send('<Response></Response>');

  } catch (error) {
    console.error("Firebase error:", error.message);
    return res.status(500).send("Error");
  }
});

module.exports = router;
