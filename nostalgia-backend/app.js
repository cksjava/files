const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");

const { apiRouter } = require("./src/routes");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(morgan("dev"));

const coversDir = process.env.COVERS_DIR || "./storage/covers";
fs.mkdirSync(coversDir, { recursive: true });

app.use(
  "/covers",
  express.static(path.resolve(coversDir), {
    etag: true,
    maxAge: "30d",
    immutable: true
  })
);

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api", apiRouter);

app.use((req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Server error", message: err?.message || String(err) });
});

module.exports = app;
