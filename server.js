const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('.'));

const MONGO_URI = process.env.MONGO_URI || 
  'mongodb+srv://liordesign7_bd_user:9sLtL3gs809QLeZs@cluster0.8l5rfrh.mongodb.net/lior-design-crm?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB מחובר'))
  .catch(err => console.error('❌ שגיאת MongoDB:', err));

const LeadSchema = new mongoose.Schema({ id: String, name: String, phone: String, city: String, address: String, product: String, source: String, notes: String, status: { type: String, default: 'new' }, checkedItems: [String], packagesImage: String, addrDetails: mongoose.Schema.Types.Mixed, history: mongoose.Schema.Types.Mixed, createdAt: { type: Number, default: Date.now }, ts: { type: Number, default: Date.now } }, { strict: false });

const StoreSchema = new mongoose.Schema({ key: { type: String, unique: true }, value: mongoose.Schema.Types.Mixed });

const Lead = mongoose.model('Lead', LeadSchema);
const Store = mongoose.model('Store', StoreSchema);

app.get('/api/leads', async (req, res) => { try { res.json(await Lead.find().lean()); } catch(e) { res.status(500).json({error:e.message}); } });
app.post('/api/leads', async (req, res) => { try { res.json(await new Lead(req.body).save()); } catch(e) { res.status(500).json({error:e.message}); } });
app.put('/api/leads/:id', async (req, res) => { try { res.json(await Lead.findOneAndUpdate({id:req.params.id}, req.body, {new:true,upsert:true})); } catch(e) { res.status(500).json({error:e.message}); } });
app.delete('/api/leads/:id', async (req, res) => { try { await Lead.findOneAndDelete({id:req.params.id}); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });

app.get('/api/db', async (req, res) => { try { const leads = await Lead.find().lean(); const stores = await Store.find().lean(); const db = {leads}; stores.forEach(s => { db[s.key] = s.value; }); res.json(db); } catch(e) { res.status(500).json({error:e.message}); } });
app.post('/api/db', async (req, res) => { try { const {leads,...rest} = req.body; if(leads) for(const l of leads) await Lead.findOneAndUpdate({id:l.id}, l, {upsert:true}); for(const [k,v] of Object.entries(rest)) await Store.findOneAndUpdate({key:k},{key:k,value:v},{upsert:true}); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });

app.get('/api/health', (req, res) => res.json({status:'ok'}));

app.listen(process.env.PORT || 3000, () => console.log('🚀 שרת רץ'));
