const express = require('express');
const router  = express.Router();
const twilio  = require('twilio');
const db      = require('../database');

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN  = process.env.TWILIO_AUTH_TOKEN;
const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const WA_FROM     = process.env.TWILIO_WA_NUMBER;
const OLGA_PHONE  = process.env.OLGA_PHONE;
const CRM_URL     = process.env.CRM_URL || '';
const TIMEZONE    = 'Asia/Jerusalem';

const WEEKDAY_HOURS = {
  0: { start: 8, end: 19 },
  1: { start: 8, end: 19 },
  2: { start: 8, end: 19 },
  3: { start: 8, end: 19 },
  4: { start: 8, end: 19 },
  5: { start: 8, end: 12 },
};

const HOLIDAY_EVES = [
  '2026-04-01','2026-04-08','2026-05-21',
  '2026-09-21','2026-09-29','2026-10-06','2026-10-13',
];

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
