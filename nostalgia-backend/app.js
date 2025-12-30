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

// Covers (already)
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

// API
app.use("/api", apiRouter);

/**
 * Serve UI (Vite build output copied to static/ui)
 */
const uiDir = process.env.UI_DIR || path.join(process.cwd(), "static", "ui");
if (fs.existsSync(uiDir)) {
  // Serve static assets
  app.use(
    express.static(uiDir, {
      etag: true,
      maxAge: "1h"
    })
  );

  // SPA fallback: any non-API/non-covers route -> index.html
  app.get("*", (req, res, next) => {
    // allow /api and /covers to behave normally
    if (req.path.startsWith("/api") || req.path.startsWith("/covers")) return next();

    const indexHtml = path.join(uiDir, "index.html");
    if (!fs.existsSync(indexHtml)) return next();
    res.sendFile(indexHtml);
  });
} else {
  console.log(`[ui] UI_DIR not found, skipping static UI serving: ${uiDir}`);
}

// 404 + error middleware
app.use((req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Server error", message: err?.message || String(err) });
});

module.exports = app;
