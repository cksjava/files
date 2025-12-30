const express = require("express");
const { Op } = require("sequelize");
const { Album, Track } = require("../models");

const router = express.Router();

/**
 * GET /api/albums
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
            { albumArtist: { [Op.like]: `%${search}%` } }
          ]
        }
      : undefined;

    const rows = await Album.findAll({
      where,
      order: [["updatedAt", "DESC"]],
      limit,
      offset
    });

    res.json(rows);
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/albums/:id
 * Returns album + tracks
 */
router.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const album = await Album.findByPk(id, {
      include: [{ model: Track, as: "tracks" }],
      order: [[{ model: Track, as: "tracks" }, "trackNo", "ASC"]]
    });

    if (!album) return res.status(404).json({ error: "Album not found" });

    // sort tracks locally (sqlite ordering with include can be quirky)
    const tracks = [...(album.tracks || [])].sort((a, b) => {
      const da = a.discNo ?? 0;
      const db = b.discNo ?? 0;
      if (da !== db) return da - db;
      const ta = a.trackNo ?? 0;
      const tb = b.trackNo ?? 0;
      return ta - tb;
    });

    res.json({
      album: {
        id: album.id,
        title: album.title,
        albumArtist: album.albumArtist,
        year: album.year,
        genre: album.genre,
        coverUrl: album.coverUrl
      },
      tracks
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
