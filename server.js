require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const bodyParser = require('body-parser');
const path       = require('path');

const db            = require('./database');
const leadsRouter   = require('./routes/leads');
const webhookRouter = require('./routes/webhook');
const twilioRouter  = require('./routes/twilio');

const app  = express();
const PORT = process.env.PORT || 3000;
const PASS = process.env.CRM_PASSWORD || 'lhlh19841984';

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString('he-IL')}] ${req.method} ${req.path}`);
  next();
});

function auth(req, res, next) {
  const key = req.headers['x-crm-key'] || req.query.key;
  if (key !== PASS) return res.status(401).json({ ok: false, error: 'לא מורשה' });
  next();
}

app.use('/api/leads',   auth, leadsRouter);
app.use('/webhook',     webhookRouter);
app.use('/twilio',      twilioRouter);

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
app.get('/leads', async (req, res) => {
  try {
    const snapshot = await db.collection('leads').orderBy('createdAt', 'desc').get();
    const leads = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({ ok: true, leads });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});
