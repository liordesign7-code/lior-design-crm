require('dotenv').config()

const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const twilioRoutes = require('./routes/twilio')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Twilio webhook
app.use('/', twilioRoutes)

app.get('/', (req, res) => {
  res.json({ ok: true, message: 'Lior Design CRM API עובד' })
})

app.get('/health', (req, res) => {
  res.json({ ok: true, server: 'Lior Design CRM', status: 'running' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
