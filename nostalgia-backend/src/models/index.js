const sequelize = require("../config/db");
const defineAlbum = require("./Album");
const defineTrack = require("./Track");

const Album = defineAlbum(sequelize);
const Track = defineTrack(sequelize);

Album.hasMany(Track, { foreignKey: "albumId", as: "tracks" });
Track.belongsTo(Album, { foreignKey: "albumId", as: "album" });

module.exports = {
  sequelize,
  Album,
  Track
};
