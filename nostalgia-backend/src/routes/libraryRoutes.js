const express = require("express");
const {
  startScan,
  getStatus,
  stopScan,
  attachSse,
  detachSse
} = require("../services/scanManager");

const router = express.Router();

/**
 * POST /api/library/scan/start
 * Body optional: { rootDir?: string }
 */
router.post("/scan/start", async (req, res, next) => {
  try {
    const rootDir = req.body?.rootDir || process.env.MUSIC_ROOT || "/mnt/music";
    const out = await startScan({ rootDir });
    res.json(out);
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/library/scan/status
 */
router.get("/scan/status", (req, res) => {
  res.json({ job: getStatus() });
});

/**
 * POST /api/library/scan/stop
 */
router.post("/scan/stop", (req, res) => {
  res.json(stopScan());
});

/**
 * GET /api/library/scan/events  (Server-Sent Events)
 * Frontend can subscribe for live progress updates.
 */
router.get("/scan/events", (req, res) => {
  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  // flush headers
  res.flushHeaders?.();

  const ok = attachSse(res);
  if (!ok.ok) {
    res.write(`data: ${JSON.stringify({ type: "error", message: ok.message })}\n\n`);
    res.end();
    return;
  }

  // keep alive ping
  const ping = setInterval(() => {
    try {
      res.write(`data: ${JSON.stringify({ type: "ping", t: Date.now() })}\n\n`);
    } catch {}
  }, 15000);

  req.on("close", () => {
    clearInterval(ping);
    detachSse(res);
  });
});

module.exports = router;
