const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Server is running ✅');
});

app.post('/webhook', (req, res) => {
  console.log('Incoming:', req.body);
  res.sendStatus(200);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log('Server started');
});
