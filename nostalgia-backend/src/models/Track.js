const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Track = sequelize.define(
    "Track",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      title: { type: DataTypes.STRING, allowNull: true },
      trackArtist: { type: DataTypes.STRING, allowNull: true },

      trackNo: { type: DataTypes.INTEGER, allowNull: true },
      discNo: { type: DataTypes.INTEGER, allowNull: true },

      durationSec: { type: DataTypes.INTEGER, allowNull: true },

      filePath: { type: DataTypes.STRING, allowNull: false, unique: true },

      format: { type: DataTypes.STRING, allowNull: true },     // e.g. "FLAC"
      sampleRate: { type: DataTypes.INTEGER, allowNull: true },
      bitRate: { type: DataTypes.INTEGER, allowNull: true },

      coverUrl: { type: DataTypes.STRING, allowNull: true }    // optional per track
    },
    {
      indexes: [
        { fields: ["title"] },
        { fields: ["trackArtist"] },
        { fields: ["filePath"] }
      ]
    }
  );

  return Track;
};
