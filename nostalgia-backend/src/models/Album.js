const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Album = sequelize.define(
    "Album",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      title: { type: DataTypes.STRING, allowNull: false },
      albumArtist: { type: DataTypes.STRING, allowNull: true },
      year: { type: DataTypes.INTEGER, allowNull: true },
      genre: { type: DataTypes.STRING, allowNull: true },
      coverUrl: { type: DataTypes.STRING, allowNull: true } // e.g. /covers/xxx.jpg
    },
    {
      indexes: [
        { fields: ["title"] },
        { fields: ["albumArtist"] }
      ]
    }
  );

  return Album;
};
