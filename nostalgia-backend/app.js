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
 * Static: covers
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

/**
 * Health
 */
app.get("/health", (req, res) => res.json({ ok: true }));

/**
 * API
 */
app.use("/api", apiRouter);

/**
 * Static: UI (Vite build copied to nostalgia-backend/static/ui)
 *
 * IMPORTANT:
 * - Use __dirname so it works no matter where you start node from
 * - Serve assets via express.static
 * - SPA fallback returns index.html for non-file routes
 */
const uiDir = process.env.UI_DIR
  ? path.resolve(process.env.UI_DIR)
  : path.join(__dirname, "static", "ui");

const indexHtml = path.join(uiDir, "index.html");

if (fs.existsSync(indexHtml)) {
  // Serve UI assets (JS/CSS/images)
  app.use(
    express.static(uiDir, {
      etag: true,
      maxAge: "1h",
    })
  );

  // SPA fallback:
  // - don’t interfere with /api or /covers
  // - if request looks like a file (has a dot), let it 404 normally
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/covers")) return next();
    if (req.path.includes(".")) return next(); // asset/file request

    res.sendFile(indexHtml);
  });
} else {
  console.log(`[ui] index.html not found, UI not served. Expected: ${indexHtml}`);
}

/**
 * 404 + error middleware
 */
app.use((req, res) => res.status(404).json({ error: "Not found" }));

app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ error: "Server error", message: err?.message || String(err) });
});

module.exports = app;
