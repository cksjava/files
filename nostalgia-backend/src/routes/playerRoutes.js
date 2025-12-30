const express = require("express");
const { playTrack } = require("../services/playerService");
const mpv = require("../services/mpvService");
const { vol10To100, vol100To10 } = require("../utils/volume10");

const router = express.Router();

/**
 * POST /api/player/play
 * Body: { trackId }
 */
router.post("/play", async (req, res, next) => {
  try {
    const trackId = Number(req.body?.trackId);
    if (!trackId) return res.status(400).json({ error: "trackId is required" });

    const out = await playTrack(trackId);
    res.json(out);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/player/pause
 */
router.post("/pause", async (req, res, next) => {
  try {
    await mpv.pause();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/player/resume
 */
router.post("/resume", async (req, res, next) => {
  try {
    await mpv.resume();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/player/toggle
 */
router.post("/toggle", async (req, res, next) => {
  try {
    await mpv.togglePause();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/player/stop
 */
router.post("/stop", async (req, res, next) => {
  try {
    await mpv.stop();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/player/volume/up
 * Body optional: { step?: number }
 */
router.post("/volume/up", async (req, res, next) => {
  try {
    const step = req.body?.step != null ? Number(req.body.step) : undefined;
    await mpv.volumeUp(step);
    const volume = await mpv.getVolume();
    res.json({ ok: true, volume });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/player/volume/down
 * Body optional: { step?: number }
 */
router.post("/volume/down", async (req, res, next) => {
  try {
    const step = req.body?.step != null ? Number(req.body.step) : undefined;
    await mpv.volumeDown(step);
    const volume = await mpv.getVolume();
    res.json({ ok: true, volume });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/player/volume/set
 * Body: { volume: number }  // 0-100
 */
router.post("/volume/set", async (req, res, next) => {
  try {
    const volume = Number(req.body?.volume);
    if (!Number.isFinite(volume)) {
      return res.status(400).json({ error: "volume must be a number (0-100)" });
    }
    await mpv.setVolume(volume);
    const v = await mpv.getVolume();
    res.json({ ok: true, volume: v });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/player/status
 */
router.get("/status", async (req, res, next) => {
  try {
    const status = await mpv.getStatus();
    const vol = Number(status.volume ?? 0);

    res.json({
      ok: true,
      status: {
        ...status,
        volume10: vol100To10(vol)
      }
    });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/player/volume10/set
 * Body: { level: number }  // 1..10
 */
router.post("/volume10/set", async (req, res, next) => {
  try {
    const level = Number(req.body?.level);
    if (!Number.isFinite(level)) {
      return res.status(400).json({ error: "level must be a number (1-10)" });
    }

    const vol100 = vol10To100(level);
    await mpv.setVolume(vol100);

    const actualVol = await mpv.getVolume(); // mpv may clamp differently
    res.json({
      ok: true,
      level: vol100To10(actualVol ?? vol100),
      volume: actualVol
    });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/player/volume10/up
 * Body optional: { step?: number } // default 1 (one notch)
 */
router.post("/volume10/up", async (req, res, next) => {
  try {
    const step = req.body?.step != null ? Number(req.body.step) : 1;
    const s = Number.isFinite(step) ? step : 1;

    const status = await mpv.getStatus();
    const currentVol = Number(status.volume ?? 0);
    const currentLevel = vol100To10(currentVol);

    const nextLevel = Math.min(10, currentLevel + s);
    await mpv.setVolume(vol10To100(nextLevel));

    const actualVol = await mpv.getVolume();
    res.json({
      ok: true,
      level: vol100To10(actualVol ?? vol10To100(nextLevel)),
      volume: actualVol
    });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/player/volume10/down
 * Body optional: { step?: number } // default 1
 */
router.post("/volume10/down", async (req, res, next) => {
  try {
    const step = req.body?.step != null ? Number(req.body.step) : 1;
    const s = Number.isFinite(step) ? step : 1;

    const status = await mpv.getStatus();
    const currentVol = Number(status.volume ?? 0);
    const currentLevel = vol100To10(currentVol);

    const nextLevel = Math.max(1, currentLevel - s);
    await mpv.setVolume(vol10To100(nextLevel));

    const actualVol = await mpv.getVolume();
    res.json({
      ok: true,
      level: vol100To10(actualVol ?? vol10To100(nextLevel)),
      volume: actualVol
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
