const { Track } = require("../models");
const mpv = require("./mpvService");

async function playTrack(trackId) {
  const t = await Track.findByPk(trackId);
  if (!t) {
    const err = new Error("Track not found");
    err.status = 404;
    throw err;
  }
  await mpv.playFile(t.filePath);
  return { ok: true, trackId: t.id, filePath: t.filePath };
}

module.exports = {
  playTrack
};
