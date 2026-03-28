const express = require('express');
const mongoose = require('mongoose');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// חיבור ל-MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));

// מודל ללידים
const Lead = mongoose.model('Lead', {
  name: String,
  phone: String,
  note: String
});

// שמירת ליד
app.post('/add-lead', async (req, res) => {
  const lead = new Lead(req.body);
  await lead.save();
  res.send({ success: true });
});

// קבלת לידים
app.get('/leads', async (req, res) => {
  const leads = await Lead.find();
  res.send(leads);
});

// פתיחת ה-CRM
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/crm.html');
});

app.listen(3000, () => console.log("Server running"));
