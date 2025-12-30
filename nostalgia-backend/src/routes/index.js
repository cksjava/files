const express = require("express");
const libraryRoutes = require("./libraryRoutes");
const trackRoutes = require("./trackRoutes");
const albumRoutes = require("./albumRoutes");
const playerRoutes = require("./playerRoutes");

const apiRouter = express.Router();

apiRouter.use("/library", libraryRoutes);
apiRouter.use("/tracks", trackRoutes);
apiRouter.use("/albums", albumRoutes);
apiRouter.use("/player", playerRoutes);

module.exports = { apiRouter };
