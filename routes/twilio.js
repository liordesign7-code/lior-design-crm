const express = require("express")
const router = express.Router()
const { saveLead } = require("../database")

router.post("/twilio", (req, res) => {

  const phone = req.body.From
  const message = req.body.Body

  const lead = {
    phone: phone,
    message: message,
    date: new Date().toISOString()
  }

  saveLead(lead)

  console.log("New WhatsApp Lead:", lead)

  res.send("<Response></Response>")
})

module.exports = router
