const express = require('express');
const router  = express.Router();
const twilio  = require('twilio');
const db      = require('../database');

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN  = process.env.TWILIO_AUTH_TOKEN;
const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const WA_FROM     = process.env.TWILIO_WA_NUMBER;
const OLGA_PHONE  = process.env.OLGA_PHONE;
const TIMEZONE    = 'Asia/Jerusalem';

const WEEKDAY_HOURS = {
  0: { start: 8, end: 19 },
  1: { start: 8, end: 19 },
  2: { start: 8, end: 19 },
  3: { start: 8, end: 19 },
  4: { start: 8, end: 19 },
  5: { start: 8, end: 12 },
};

const HOLIDAY_EVES = ['2026-04-01','2026-04-08','2026-05-21','2026-09-21','2026-09-29','2026-10-06','2026-10-13'];

function getNow() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: TIMEZONE }));
}

function isBusinessHours(date) {
  const d = date || getNow();
  const day = d.getDay();
  const dateStr = d.toISOString().slice(0, 10);
  const isHolidayEve = HOLIDAY_EVES.includes(dateStr);
  const hours = isHolidayEve ? { start: 8, end: 12 } : WEEKDAY_HOURS[day];
  if (!hours) return false;
  const t = d.getHours() + d.getMinutes() / 60;
  return t >= hours.start && t < hours.end;
}

function nextBusinessTime() {
  const d = getNow();
  for (let i = 1; i <= 7; i++) {
    const next = new Date(d);
    next.setDate(d.getDate() + i);
    next.setHours(8, 5, 0, 0);
    if (isBusinessHours(next)) return next;
  }
  return null;
}

function normalizePhone(num) {
  if (!num) return '';
  return num.replace('whatsapp:', '').replace(/\D/g, '').replace(/^972/, '0');
}

function toE164(num) {
  return '+972' + normalizePhone(num).replace(/^0/, '');
}

const DEFAULT_MESSAGES = {
  missed1: 'היי 🙂\nכאן אולגה ממרכז החיפויים ליאור דיזיין.\n\nראיתי שחיפשת אותי עכשיו בטלפון.\nאני כרגע עם לקוח אבל כבר מתפנה אליך.\n\nכדי שאדע למי אני חוזרת, מה השם שלך?',
  missed2: 'רק כדי שאדע למי לחזור 🙂\nמה השם שלך?',
  gotName: 'נעים מאוד {name} 🙂\nאני כבר מסיימת עם הלקוח הנוכחי וחוזרת אליך ממש עוד רגע.',
  followup30: 'מתנצלת על ההמתנה 🙂\nהיה עומס עם לקוחות.\nאני כבר חוזרת אליך.',
};

function getMsg(key) {
  try {
    const msgs = db.getMessages();
    return (msgs && msgs[key]) || DEFAULT_MESSAGES[key] || '';
  } catch(e) { return DEFAULT_MESSAGES[key] || ''; }
}

async function sendMsg(toNumber, text) {
  const client = twilio(ACCOUNT_SID, AUTH_TOKEN);
  const to = toE164(toNumber);
  try {
    await client.messages.create({ from: 'whatsapp:' + toE164(WA_FROM), to: 'whatsapp:' + to, body: text });
    return 'whatsapp';
  } catch(e) {
    await client.messages.create({ from: FROM_NUMBER, to, body: text });
    return 'sms';
  }
}

function getOrCreateLead(phone, source) {
  const clean = normalizePhone(phone);
  const leads = db.getLeads();
  let lead = leads.find(l => normalizePhone(l.phone) === clean);
  if (!lead) {
    lead = db.addLead({ name: 'לקוח מהחטאת שיחה', phone: clean, source, status: 'new', waitingForName: true, missedCallAt: Date.now() });
  }
  return lead;
}

router.post('/missed-call', async (req, res) => {
  res.set('Content-Type', 'text/xml');
  res.send('<Response></Response>');
  const status = req.body.CallStatus || '';
  const fromRaw = req.body.From || '';
  if (!['no-answer','busy','failed','canceled'].includes(status) || !fromRaw) return;
  const phone = normalizePhone(fromRaw);
  const lead = getOrCreateLead(phone, 'טלפון');
  db.updateLead(lead.id, { missedCallAt: Date.now(), waitingForName: true });
  db.addLog(lead.id, '📞 שיחה שלא נענתה – ' + getNow().toLocaleTimeString('he-IL'));
  if (!isBusinessHours()) {
    const next = nextBusinessTime();
    if (next) setTimeout(async () => { try { await sendMsg(phone, getMsg('missed1')); scheduleFollowups(lead.id, phone); } catch(e){} }, next.getTime() - Date.now());
    return;
  }
  try {
    await sendMsg(phone, getMsg('missed1'));
    scheduleFollowups(lead.id, phone);
  } catch(e) {}
});

function scheduleFollowups(leadId, phone) {
  setTimeout(async () => {
    try {
      const l = db.getLeads().find(x => x.id === leadId);
      if (!l || !l.waitingForName) return;
      await sendMsg(phone, getMsg('missed2'));
      db.addLog(leadId, '💬 הודעה שנייה נשלחה');
    } catch(e) {}
  }, 5 * 60 * 1000);

  setTimeout(async () => {
    try {
      const l = db.getLeads().find(x => x.id === leadId);
      if (!l) return;
      await sendMsg(phone, getMsg('followup30'));
      const callTime = new Date(l.missedCallAt || Date.now()).toLocaleTimeString('he-IL', {hour:'2-digit',minute:'2-digit'});
      db.addAlert({ type: 'missed_call', leadId, phone, message: 'אולגה, לקוח (' + phone + ') חיפש אותך בשעה ' + callTime + '.\nנשלחה הודעה אוטומטית אבל עדיין לא חזרת אליו.', ts: Date.now(), read: false });
      if (OLGA_PHONE) await sendMsg(OLGA_PHONE, '⏰ תזכורת – לקוח מחכה!\n📞 ' + phone + '\n🕐 ' + callTime).catch(()=>{});
    } catch(e) {}
  }, 30 * 60 * 1000);
}

router.post('/incoming-wa', async (req, res) => {
  res.set('Content-Type', 'text/xml');
  res.send('<Response></Response>');
  const fromRaw = req.body.From || '';
  const body = (req.body.Body || '').trim();
  if (!fromRaw || !body) return;
  const phone = normalizePhone(fromRaw);
  const lead = db.getLeads().find(l => normalizePhone(l.phone) === phone);
  if (!lead) {
    db.addLead({ name: 'ליד מ-WhatsApp', phone, source: 'וואטסאפ', status: 'new', notes: '💬 ' + body.slice(0,100) });
    if (OLGA_PHONE) await sendMsg(OLGA_PHONE, '💬 הודעה חדשה!\n📞 ' + phone + '\n' + body.slice(0,80)).catch(()=>{});
    return;
  }
  if (lead.waitingForName && body.length <= 30 && !body.includes('http') && !/^\d+$/.test(body)) {
    db.updateLead(lead.id, { name: body, waitingForName: false });
    db.addLog(lead.id, '✅ שם: ' + body);
    await sendMsg(phone, getMsg('gotName').replace('{name}', body)).catch(()=>{});
    if (OLGA_PHONE) await sendMsg(OLGA_PHONE, '✅ שם: ' + body + '\n📞 ' + phone).catch(()=>{});
    return;
  }
  db.addLog(lead.id, '💬 ' + body.slice(0,100));
  if (OLGA_PHONE) await sendMsg(OLGA_PHONE, '💬 ' + lead.name + '\n📞 ' + phone + '\n' + body.slice(0,80)).catch(()=>{});
});

router.get('/test', (req, res) => {
  const now = getNow();
  res.json({ ok: true, isBusinessHours: isBusinessHours(), time: now.toLocaleTimeString('he-IL'), day: ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'][now.getDay()], config: { hasAccountSid: !!ACCOUNT_SID, hasAuthToken: !!AUTH_TOKEN, hasFromNumber: !!FROM_NUMBER, hasWaFrom: !!WA_FROM, hasOlgaPhone: !!OLGA_PHONE } });
});

module.exports = router;
