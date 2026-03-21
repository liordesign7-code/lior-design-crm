require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');
const twilioRouter = require('./routes/twilio');
const webhookRouter = require('./routes/webhook');
const leadsRouter = require('./routes/leads');

const app = express();
app.use(express.static('public'));
const PORT = process.env.PORT || 3000;
const PASS = process.env.CRM_PASSWORD || 'lhlh19841984';

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

function auth(req, res, next) {
  const key = req.headers['x-crm-key'] || req.query.key;
  if (key !== PASS) return res.status(401).json({ ok: false, error: 'לא מורשה' });
  next();
}

app.use('/twilio', twilioRouter);
app.use('/webhook', webhookRouter);
app.use('/api/leads', leadsRouter);

app.get('/leads', auth, async (req, res) => {
  try {
    const leads = await db.getLeads();
    res.json({ ok: true, leads: leads || [] });
  } catch(e) {
    res.json({ ok: true, leads: [] });
  }
});

app.post('/leads', async (req, res) => {
  try {
    const lead = await db.addLead({
      name: req.body.fullName || req.body.name || 'לקוח חדש',
      phone: req.body.phone || '',
      message: req.body.message || '',
      source: req.body.source || 'אתר',
      status: 'new',
    });
    res.json({ ok: true, lead });
  } catch(e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ ok: true, server: 'Lior Design CRM', uptime: Math.floor(process.uptime()) });
});

app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('Server running on port ' + PORT);
});
