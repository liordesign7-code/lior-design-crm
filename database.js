const fs   = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'crm-data.json');

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function load() {
  try {
    if (fs.existsSync(DB_PATH)) return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch(e) {}
  return { leads: [], installs: [], meetings: [], messages: {}, alerts: [] };
}

function save(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function getLeads() { return load().leads; }

function addLead(data) {
  const db = load();
  const now = Date.now();
  const lead = {
    id: uid(),
    name: data.name || 'לקוח חדש',
    phone: data.phone || '',
    source: data.source || 'ידני',
    status: data.status || 'new',
    notes: data.notes || '',
    tasks: {},
    history: [{ action: 'ליד נוצר – מקור: ' + (data.source || 'ידני'), ts: now }],
    waitingForName: data.waitingForName || false,
    missedCallAt: data.missedCallAt || null,
    createdAt: now,
    updatedAt: now,
  };
  db.leads.unshift(lead);
  save(db);
  return lead;
}

function updateLead(id, data) {
  const db = load();
  const idx = db.leads.findIndex(l => l.id === id);
  if (idx === -1) return null;
  db.leads[idx] = { ...db.leads[idx], ...data, updatedAt: Date.now() };
  save(db);
  return db.leads[idx];
}

function addLog(id, action) {
  const db = load();
  const lead = db.leads.find(l => l.id === id);
  if (!lead) return;
  if (!lead.history) lead.history = [];
  lead.history.unshift({ action, ts: Date.now() });
  save(db);
}

function deleteLead(id) {
  const db = load();
  db.leads = db.leads.filter(l => l.id !== id);
  save(db);
}

function getMessages() { return load().messages || {}; }

function saveMessages(msgs) {
  const db = load();
  db.messages = msgs;
  save(db);
}

function getAlerts() { return load().alerts || []; }

function addAlert(data) {
  const db = load();
  if (!db.alerts) db.alerts = [];
  db.alerts.unshift({ id: uid(), ...data, ts: data.ts || Date.now() });
  if (db.alerts.length > 50) db.alerts = db.alerts.slice(0, 50);
  save(db);
}

function markAlertRead(id) {
  const db = load();
  const a = (db.alerts || []).find(x => x.id === id);
  if (a) { a.read = true; save(db); }
}

function getInstalls() { return load().installs || []; }
function getMeetings() { return load().meetings || []; }

module.exports = {
  getLeads, addLead, updateLead, addLog, deleteLead,
  getMessages, saveMessages,
  getAlerts, addAlert, markAlertRead,
  getInstalls, getMeetings,
  leadsDB: {
    getAll: getLeads,
    getById: (id) => getLeads().find(l => l.id === id) || null,
    findByPhone: (phone) => { const c = phone.replace(/\D/g,''); return getLeads().find(l => (l.phone||'').replace(/\D/g,'') === c) || null; },
    create: addLead,
    update: (id, data) => updateLead(id, data),
    delete: deleteLead,
  }
};
