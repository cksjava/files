const express = require("express");
const { Op } = require("sequelize");
const { Track, Album } = require("../models");

const router = express.Router();

/**
 * GET /api/tracks
 * Optional query: search, limit, offset
 */
router.get("/", async (req, res, next) => {
  try {
    const search = String(req.query.search || "").trim();
    const limit = req.query.limit ? Number(req.query.limit) : 200;
    const offset = req.query.offset ? Number(req.query.offset) : 0;

    const where = search
      ? {
          [Op.or]: [
            { title: { [Op.like]: `%${search}%` } },
            { trackArtist: { [Op.like]: `%${search}%` } },
            { filePath: { [Op.like]: `%${search}%` } }
          ]
        }
      : undefined;

    const rows = await Track.findAll({
      where,
      include: [{ model: Album, as: "album" }],
      order: [
        ["updatedAt", "DESC"]
      ],
      limit,
      offset
    });

    res.json(rows);
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/tracks/by-path?path=/full/file/path.flac
 * Exact lookup by filePath
 */
router.get("/by-path", async (req, res, next) => {
  try {
    const filePath = String(req.query.path || "").trim();
    if (!filePath) return res.status(400).json({ error: "path query param is required" });

    const row = await Track.findOne({
      where: { filePath },
      include: [{ model: Album, as: "album" }],
    });

    if (!row) return res.status(404).json({ error: "Track not found for given path" });

    res.json(row);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
