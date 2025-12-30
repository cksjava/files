const path = require("path");
const { Sequelize } = require("sequelize");

const dbPath = process.env.DB_PATH || "./data/music.sqlite";

module.exports = new Sequelize({
  dialect: "sqlite",
  storage: path.resolve(dbPath),
  logging: false
});
