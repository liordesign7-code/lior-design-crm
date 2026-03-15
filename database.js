const fs = require("fs")

const FILE = "leads.json"

function saveLead(lead) {

  let leads = []

  if (fs.existsSync(FILE)) {
    const data = fs.readFileSync(FILE)
    leads = JSON.parse(data)
  }

  leads.push(lead)

  fs.writeFileSync(FILE, JSON.stringify(leads, null, 2))
}

module.exports = {
  saveLead
}
