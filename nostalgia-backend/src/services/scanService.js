const path = require("path");
const fs = require("fs/promises");
const mm = require("music-metadata");
const { walkFiles } = require("../utils/fsWalk");
const { sha1 } = require("../utils/hash");
const { Album, Track } = require("../models");

function isFlac(filePath) {
  return String(filePath).toLowerCase().endsWith(".flac");
}

function safeInt(n) {
  const x = Number(n);
  return Number.isFinite(x) ? Math.trunc(x) : null;
}

async function writeCoverIfAny({ filePath, picture, coversDir }) {
  if (!picture || !picture.data) return null;

  // ext best effort
  const mime = picture.format || picture.mime || "image/jpeg";
  const ext =
    mime.includes("png") ? "png" :
    mime.includes("webp") ? "webp" :
    "jpg";

  const key = sha1(filePath); // stable per file
  const filename = `${key}.${ext}`;
  const abs = path.resolve(coversDir, filename);

  try {
    await fs.access(abs);
    return `/covers/${filename}`;
  } catch {
    // continue
  }

  await fs.writeFile(abs, picture.data);
  return `/covers/${filename}`;
}

async function upsertAlbumFromMeta(meta) {
  const title = meta.common.album || "Unknown Album";
  const albumArtist = meta.common.albumartist || meta.common.artist || null;
  const year = safeInt(meta.common.year) || null;

  // find album by (title + albumArtist) to reduce duplicates
  const [album] = await Album.findOrCreate({
    where: { title, albumArtist },
    defaults: { title, albumArtist, year }
  });

  // update year if missing
  if (!album.year && year) {
    album.year = year;
    await album.save();
  }

  return album;
}

async function upsertTrackFromFile(filePath, meta, album, coverUrlMaybe) {
  const title = meta.common.title || path.basename(filePath, path.extname(filePath));
  const trackArtist = meta.common.artist || meta.common.albumartist || null;

  const trackNo = safeInt(meta.common.track?.no) || null;
  const discNo = safeInt(meta.common.disk?.no) || null;

  const durationSec = safeInt(meta.format.duration) || null;
  const sampleRate = safeInt(meta.format.sampleRate) || null;
  const bitRate = safeInt(meta.format.bitrate) || null;

  const format = meta.format.dataformat || meta.format.codec || "FLAC";

  const [track] = await Track.findOrCreate({
    where: { filePath },
    defaults: {
      title,
      trackArtist,
      trackNo,
      discNo,
      durationSec,
      filePath,
      format: String(format).toUpperCase(),
      sampleRate,
      bitRate,
      albumId: album.id,
      coverUrl: coverUrlMaybe || null
    }
  });

  // update details if already exists
  let changed = false;
  const patch = {
    title,
    trackArtist,
    trackNo,
    discNo,
    durationSec,
    format: String(format).toUpperCase(),
    sampleRate,
    bitRate,
    albumId: album.id
  };

  for (const [k, v] of Object.entries(patch)) {
    if (track[k] !== v && v !== undefined) {
      track[k] = v;
      changed = true;
    }
  }

  if (!track.coverUrl && coverUrlMaybe) {
    track.coverUrl = coverUrlMaybe;
    changed = true;
  }

  if (changed) await track.save();
  return track;
}

// ... keep your existing requires and helper functions above

async function scanLibrary({ rootDir, coversDir, onDiscovered, onProgress, shouldCancel } = {}) {
  const root = rootDir || process.env.MUSIC_ROOT || "/mnt/music";
  const covers = coversDir || process.env.COVERS_DIR || "./storage/covers";

  await fs.mkdir(path.resolve(covers), { recursive: true });

  const results = {
    root,
    scannedFiles: 0,
    flacFound: 0,
    tracksCreatedOrUpdated: 0,
    errors: 0
  };

  let lastProgressEmitAt = Date.now();
  const emitProgressMaybe = () => {
    const now = Date.now();
    if (now - lastProgressEmitAt >= 400) { // ~2-3 updates/sec max
      lastProgressEmitAt = now;
      onProgress?.({ ...results });
    }
  };

  await walkFiles(root, async (filePath) => {
    if (shouldCancel?.()) {
      // throw to break out of walk quickly
      const err = new Error("Scan cancelled");
      err.code = "SCAN_CANCELLED";
      throw err;
    }

    results.scannedFiles += 1;
    emitProgressMaybe();

    if (!isFlac(filePath)) return;

    results.flacFound += 1;
    emitProgressMaybe();

    try {
      const meta = await mm.parseFile(filePath, { duration: true });

      const album = await upsertAlbumFromMeta(meta);

      const pic = meta.common.picture?.[0] || null;
      const coverUrl = await writeCoverIfAny({ filePath, picture: pic, coversDir: covers });

      if (!album.coverUrl && coverUrl) {
        album.coverUrl = coverUrl;
        await album.save();
      }

      const track = await upsertTrackFromFile(filePath, meta, album, coverUrl);

      results.tracksCreatedOrUpdated += 1;

      onDiscovered?.({
        trackId: track.id,
        title: track.title,
        albumId: album.id,
        albumTitle: album.title,
        filePath: track.filePath
      });

      emitProgressMaybe();
    } catch (e) {
      // if cancellation bubbled up from inside walk loop
      if (e?.code === "SCAN_CANCELLED") throw e;

      results.errors += 1;
      console.warn("Scan error:", filePath, e?.message || e);
      emitProgressMaybe();
    }
  });

  // final progress push
  onProgress?.({ ...results });
  return results;
}

module.exports = { scanLibrary };
