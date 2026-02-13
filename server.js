import express from "express";
import cors from "cors";
import pkg from "agora-access-token";

const { RtcTokenBuilder, RtcRole } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

/* ---------------- ENV VARIABLES ---------------- */

const APP_ID = process.env.AGORA_APP_ID;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

if (!APP_ID || !APP_CERTIFICATE) {
  console.error("Missing AGORA_APP_ID or AGORA_APP_CERTIFICATE");
}

/* ---------------- CHANNEL STATE ---------------- */

const channels = {
  WA_SEATTLE: { isLive: false, broadcasterId: null, startTime: null },
  CA_SANTA_MONICA: { isLive: false, broadcasterId: null, startTime: null },
  NY_TIMES_SQUARE: { isLive: false, broadcasterId: null, startTime: null },

  FR_PARIS: { isLive: false, broadcasterId: null, startTime: null },
  IT_ROME: { isLive: false, broadcasterId: null, startTime: null },
  JP_TOKYO: { isLive: false, broadcasterId: null, startTime: null },
  AU_SYDNEY: { isLive: false, broadcasterId: null, startTime: null },
  AE_DUBAI: { isLive: false, broadcasterId: null, startTime: null },
  BR_RIO: { isLive: false, broadcasterId: null, startTime: null },
  CN_BEIJING: { isLive: false, broadcasterId: null, startTime: null }
};

/* ---------------- ROOT ROUTE ---------------- */

app.get("/", (req, res) => {
  res.send("LiveLook server is running 🚀");
});

/* ---------------- STATUS ---------------- */

app.get("/status", (req, res) => {
  const { channel } = req.query;

  if (!channel || !channels[channel]) {
    return res.status(400).json({ error: "Invalid channel" });
  }

  res.json(channels[channel]);
});

/* ---------------- START BROADCAST ---------------- */

app.post("/start", (req, res) => {
  const { channel, userId } = req.body;

  if (!channel || !channels[channel]) {
    return res.status(400).json({ error: "Invalid channel" });
  }

  const data = channels[channel];

  if (data.isLive) {
    return res.json({ allowed: false });
  }

  data.isLive = true;
  data.broadcasterId = userId;
  data.startTime = Date.now();

  res.json({ allowed: true });
});

/* ---------------- END BROADCAST ---------------- */

app.post("/end", (req, res) => {
  const { channel } = req.body;

  if (!channel) {
    return res.status(400).json({ error: "Invalid channel" });
  }

  if (!channels[channel]) {
    channels[channel] = { isLive: false, broadcasterId: null, startTime: null };
  }


  channels[channel] = { isLive: false, broadcasterId: null, startTime: null };

  res.json({ success: true });
});

/* ---------------- RTC TOKEN GENERATION ---------------- */

app.get("/rtc-token", (req, res) => {
  const { channel, role, userId } = req.query;

  if (!channel) {
    return res.status(400).json({ error: "Invalid channel" });
  }

  if (!channels[channel]) {
    channels[channel] = { isLive: false, broadcasterId: null, startTime: null };
  }

  const uid = userId ? parseInt(userId) : Math.floor(Math.random() * 100000);

  let agoraRole =
    role === "broadcaster"
      ? RtcRole.PUBLISHER
      : RtcRole.SUBSCRIBER;

  const expirationTimeInSeconds = 120; // 2 minutes
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expirationTimeInSeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channel,
    uid,
    agoraRole,
    privilegeExpireTime
  );

  res.json({ token, uid });
});

/* ---------------- AUTO TIMEOUT SAFETY ---------------- */

setInterval(() => {
  const now = Date.now();

  for (const channel in channels) {
    const data = channels[channel];

    if (data.isLive && data.startTime) {
      const elapsed = now - data.startTime;

      if (elapsed > 120000) {
        channels[channel] = {
          isLive: false,
          broadcasterId: null,
          startTime: null
        };
        console.log(`Auto-ended broadcast for ${channel}`);
      }
    }
  }
}, 10000);

/* ---------------- START SERVER ---------------- */

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`LiveLook server running on port ${PORT}`);
});
