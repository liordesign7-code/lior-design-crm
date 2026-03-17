function safeFindLeadById(leadId) {
  const leads = db.getLeads() || [];
  const arr = Array.isArray(leads) ? leads : Object.values(leads);
  return arr.find(x => x.id === leadId);
}

function safeFindLeadByPhone(phone) {
  const leads = db.getLeads() || [];
  const arr = Array.isArray(leads) ? leads : Object.values(leads);
  return arr.find(l => normalizePhone(l.phone) === phone);
}
