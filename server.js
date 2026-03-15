require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const bodyParser = require('body-parser');
const path       = require('path');

const db = require('./database');
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

app.get('/api/messages', auth, (req, res) => {
  res.json({ ok: true, messages: db.getMessages() });
});
app.post('/api/messages', auth, (req, res) => {
  db.saveMessages(req.body);
  res.json({ ok: true });
});

app.get('/api/alerts', auth, (req, res) => {
  res.json({ ok: true, alerts: db.getAlerts() });
});
app.post('/api/alerts/:id/read', auth, (req, res) => {
  db.markAlertRead(req.params.id);
  res.json({ ok: true });
});

app.get('/health', (req, res) => {
  res.json({ ok: true, server: 'Lior Design CRM', uptime: Math.floor(process.uptime()) });
});

app.get('/', (req, res) => {
  const f = path.join(__dirname, 'public', 'crm.html');
  const fs = require('fs');
  if (fs.existsSync(f)) res.sendFile(f);
  else res.json({ ok: true, message: 'שרת CRM פועל' });
});

app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
