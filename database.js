const fs = require('fs');
const path = require('path');
const DB_PATH = path.join(__dirname, 'crm-data.json');
const MONGO_URI = process.env.MONGODB_URI;
let mongoose, Lead, isConnected = false;

async function connectMongo() {
  if (!MONGO_URI) return false;
  try {
    mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) { isConnected = true; return true; }
    await mongoose.connect(MONGO_URI);
    isConnected = true;
    console.log('[DB] MongoDB מחובר!');
    const s = new mongoose.Schema({ id:String, name:String, phone:String, message:String, source:String, status:String, notes:String, waitingForName:Boolean, missedCallAt:Number, createdAt:Number, updatedAt:Number, history:Array, tasks:Object }, { strict:false });
    Lead = mongoose.models.Lead || mongoose.model('Lead', s);
    return true;
  } catch(e) {
    console.log('[DB] MongoDB נכשל:', e.message);
    isConnected = false;
    return false;
  }
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

function loadJSON() {
  try { if (fs.existsSync(DB_PATH)) return JSON.parse(fs.readFileSync(DB_PATH,'utf8')); } catch(e) {}
  return { leads:[], messages:{}, alerts:[] };
}

function saveJSON(data) { fs.writeFileSync(DB_PATH, JSON.stringify(data,null,2),'utf8'); }

async function getLeads() {
  await connectMongo();
  if (isConnected && Lead) {
    const leads = await Lead.find().sort({createdAt:-1}).lean();
    return leads.map(l => { const {_id,__v,...r} = l; return r; });
  }
  return loadJSON().leads;
}

async function addLead(data) {
  await connectMongo();
  const now = Date.now();
  const lead = {
    id: data.id || uid(),
    name: data.name || 'לקוח חדש',
    phone: data.phone || '',
    message: data.message || '',
    source: data.source || 'ידני',
    status: data.status || 'new',
    notes: data.notes || '',
    waitingForName: data.waitingForName || false,
    missedCallAt: data.missedCallAt || null,
    createdAt: now,
    updatedAt: now,
    tasks: {},
    history: [{ action: 'ליד נוצר', ts: now }],
  };
  if (isConnected && Lead) {
    await Lead.create(lead);
  } else {
    const db = loadJSON();
    db.leads.unshift(lead);
    saveJSON(db);
  }
  return lead;
}

async function updateLead(id, data) {
  await connectMongo();
  if (isConnected && Lead) {
    const u = await Lead.findOneAndUpdate({id}, {...data, updatedAt:Date.now()}, {new:true}).lean();
    if (u) { const {_id,__v,...r} = u; return r; }
    return null;
  }
  const db = loadJSON();
  const idx = db.leads.findIndex(l => l.id === id);
  if (idx === -1) return null;
  db.leads[idx] = { ...db.leads[idx], ...data, updatedAt: Date.now() };
  saveJSON(db);
  return db.leads[idx];
}

async function addLog(id, action) {
  await connectMongo();
  if (isConnected && Lead) {
    await Lead.findOneAndUpdate({id}, {$push:{history:{$each:[{action,ts:Date.now()}],$position:0}}});
    return;
  }
  const db = loadJSON();
  const lead = db.leads.find(l => l.id === id);
  if (!lead) return;
  if (!lead.history) lead.history = [];
  lead.history.unshift({action, ts:Date.now()});
  saveJSON(db);
}

async function deleteLead(id) {
  await connectMongo();
  if (isConnected && Lead) { await Lead.deleteOne({id}); return; }
  const db = loadJSON();
  db.leads = db.leads.filter(l => l.id !== id);
  saveJSON(db);
}

function getMessages() { return loadJSON().messages || {}; }
function saveMessages(msgs) { const db = loadJSON(); db.messages = msgs; saveJSON(db); }
function getAlerts() { return loadJSON().alerts || []; }
function addAlert(data) {
  const db = loadJSON();
  if (!db.alerts) db.alerts = [];
  db.alerts.unshift({id:uid(), ...data, ts:data.ts||Date.now()});
  if (db.alerts.length > 50) db.alerts = db.alerts.slice(0,50);
  saveJSON(db);
}
function markAlertRead(id) {
  const db = loadJSON();
  const a = (db.alerts||[]).find(x => x.id === id);
  if (a) { a.read = true; saveJSON(db); }
}
function getInstalls() { return loadJSON().installs || []; }
function getMeetings() { return loadJSON().meetings || []; }

connectMongo().catch(() => {});

module.exports = {
  getLeads, addLead, updateLead, addLog, deleteLead,
  getMessages, saveMessages,
  getAlerts, addAlert, markAlertRead,
  getInstalls, getMeetings,
  leadsDB: {
    getAll: getLeads,
    getById: async (id) => (await getLeads()).find(l => l.id === id) || null,
    findByPhone: async (phone) => { const c = phone.replace(/\D/g,''); return (await getLeads()).find(l => (l.phone||'').replace(/\D/g,'') === c) || null; },
    create: addLead,
    update: updateLead,
    delete: deleteLead,
  }
};
