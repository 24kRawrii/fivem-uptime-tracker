const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔴 CHANGE THIS
const SERVER_ID = "lv3q87";

const DATA_FILE = "./uptime.json";

let data = {
  totalChecks: 0,
  onlineChecks: 0,
  lastStatus: "unknown"
};

// Load existing data
if (fs.existsSync(DATA_FILE)) {
  data = JSON.parse(fs.readFileSync(DATA_FILE));
}

// Check server every 30s
async function checkServer() {
  try {
    const res = await fetch(`https://servers-frontend.fivem.net/api/servers/single/${SERVER_ID}`);
    const json = await res.json();

    if (json.Data) {
      data.onlineChecks++;
      data.lastStatus = "online";
    } else {
      data.lastStatus = "offline";
    }
  } catch {
    data.lastStatus = "offline";
  }

  data.totalChecks++;
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

setInterval(checkServer, 30000);
checkServer();

// API route
app.get("/uptime", (req, res) => {
  const uptime = data.totalChecks === 0
    ? 0
    : ((data.onlineChecks / data.totalChecks) * 100).toFixed(2);

  res.json({
    uptime,
    status: data.lastStatus
  });
});

app.listen(PORT, () => console.log("Server running"));