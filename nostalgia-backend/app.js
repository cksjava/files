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

/**
 * Covers
 */
const coversDir = process.env.COVERS_DIR
  ? path.resolve(process.env.COVERS_DIR)
  : path.join(__dirname, "storage", "covers");

fs.mkdirSync(coversDir, { recursive: true });

app.use(
  "/covers",
  express.static(coversDir, {
    etag: true,
    maxAge: "30d",
    immutable: true,
  })
);

app.get("/health", (req, res) => res.json({ ok: true }));

/**
 * API
 */
app.use("/api", apiRouter);

/**
 * UI
 */
const uiDir = process.env.UI_DIR
  ? path.resolve(process.env.UI_DIR)
  : path.join(__dirname, "static", "ui");

const indexHtml = path.join(uiDir, "index.html");

if (fs.existsSync(indexHtml)) {
  // Serve built assets (Vite puts them under /assets)
  app.use(
    "/assets",
    express.static(path.join(uiDir, "assets"), {
      etag: true,
      maxAge: "30d",
      immutable: true,
      fallthrough: false,
    })
  );

  // Serve other static files at root (favicon, manifest, etc.)
  app.use(
    express.static(uiDir, {
      etag: true,
      maxAge: "1h",
      fallthrough: true,
    })
  );

  // IMPORTANT: serve index.html with NO CACHE so you don’t get stuck with stale HTML
  app.get("/", (req, res) => {
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.sendFile(indexHtml);
  });

  // SPA fallback
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/covers") || req.path.startsWith("/assets"))
      return next();

    // if it looks like a file request, let it 404 rather than serving index.html
    if (req.path.includes(".")) return next();

    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.sendFile(indexHtml);
  });
} else {
  console.log(`[ui] index.html not found. Expected: ${indexHtml}`);
}

/**
 * 404 + error
 */
app.use((req, res) => res.status(404).json({ error: "Not found" }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: "Server error",
    message: err?.message || String(err),
  });
});

module.exports = app;
