import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// In-memory channel storage
const channels = {
  WA_SEATTLE: { isLive: false, broadcasterId: null, startTime: null },
  CA_SANTA_MONICA: { isLive: false, broadcasterId: null, startTime: null },
  NY_TIMES_SQUARE: { isLive: false, broadcasterId: null, startTime: null }
};

// Check channel status
app.get("/status", (req, res) => {
  const { channel } = req.query;

  if (!channel || !channels[channel]) {
    return res.status(400).json({ error: "Invalid channel" });
  }

  res.json(channels[channel]);
});

// Request to start broadcast
app.post("/start", (req, res) => {
  const { channel, userId } = req.body;

  if (!channel || !channels[channel]) {
    return res.status(400).json({ error: "Invalid channel" });
  }

  const channelData = channels[channel];

  if (channelData.isLive) {
    return res.json({ allowed: false });
  }

  channelData.isLive = true;
  channelData.broadcasterId = userId;
  channelData.startTime = Date.now();

  res.json({ allowed: true });
});

// End broadcast
app.post("/end", (req, res) => {
  const { channel } = req.body;

  if (!channel || !channels[channel]) {
    return res.status(400).json({ error: "Invalid channel" });
  }

  channels[channel].isLive = false;
  channels[channel].broadcasterId = null;
  channels[channel].startTime = null;

  res.json({ success: true });
});

// Auto-timeout safety (2 minutes)
setInterval(() => {
  const now = Date.now();

  for (const channel in channels) {
    const data = channels[channel];

    if (data.isLive && data.startTime) {
      const elapsed = now - data.startTime;

      if (elapsed > 120000) {
        data.isLive = false;
        data.broadcasterId = null;
        data.startTime = null;
        console.log(`Auto-ended broadcast for ${channel}`);
      }
    }
  }
}, 10000);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`LiveLook server running on port ${PORT}`);
});
