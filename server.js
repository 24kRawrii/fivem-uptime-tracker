const cors = require("cors");
const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs");

const app = express();
app.use(cors());
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
let lastPlayers = 0;
let lastOnline = false;
let restartTimer = null;

async function checkServer() {
  try {
    const res = await fetch(`https://servers-frontend.fivem.net/api/servers/single/${SERVER_ID}`);
    const json = await res.json();

    if (json.Data) {
      const players = json.Data.clients;

      data.onlineChecks++;
      data.totalChecks++;

      // 🧠 Detect restart
      if (lastOnline && players === 0 && lastPlayers > 5) {
        data.lastStatus = "restarting";

        // Give it 2 minutes to recover
        restartTimer = Date.now();
      } else if (restartTimer && (Date.now() - restartTimer < 120000)) {
        data.lastStatus = "restarting";
      } else {
        data.lastStatus = "online";
        restartTimer = null;
      }

      lastPlayers = players;
      lastOnline = true;

    } else {
      data.totalChecks++;
      data.lastStatus = "offline";
      lastOnline = false;
    }

  } catch {
    data.totalChecks++;
    data.lastStatus = "offline";
    lastOnline = false;
  }

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