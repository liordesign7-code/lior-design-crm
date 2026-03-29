const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = 'mongodb+srv://lior:WqQKTk6.Aak6MCc@cluster0.8l5rfrh.mongodb.net/lior-design-crm?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB error:', err));

// Schema
const leadSchema = new mongoose.Schema({
  name: String,
  phone: String,
  note: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Lead = mongoose.model('Lead', leadSchema);

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Get all leads
app.get('/api/leads', async (req, res) => {
  const leads = await Lead.find().sort({ createdAt: -1 });
  res.json(leads);
});

// Add lead
app.post('/api/leads', async (req, res) => {
  const newLead = new Lead(req.body);
  await newLead.save();
  res.json({ success: true });
});

// Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
