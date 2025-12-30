const net = require("net");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const SOCKET_PATH = process.env.MPV_SOCKET || "/tmp/mpv-music.sock";
const DEFAULT_VOLUME = Number(process.env.MPV_DEFAULT_VOLUME || 60); // 0-100
const VOLUME_STEP = Number(process.env.MPV_VOLUME_STEP || 5); // 0-100 step
const MPV_BIN = process.env.MPV_BIN || "mpv";

let mpvProc = null;
let starting = null;

// --- helpers ---
function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function safeUnlinkSocket() {
  try {
    if (fs.existsSync(SOCKET_PATH)) fs.unlinkSync(SOCKET_PATH);
  } catch {}
}

function sendIpc(commandObj) {
  return new Promise((resolve, reject) => {
    const client = net.createConnection(SOCKET_PATH);

    let data = "";
    client.on("connect", () => {
      client.write(JSON.stringify(commandObj) + "\n");
    });

    client.on("data", (chunk) => {
      data += chunk.toString("utf8");
      // mpv replies per line; we can close after first reply
      if (data.includes("\n")) {
        client.end();
      }
    });

    client.on("end", () => {
      // parse first line only
      const line = data.split("\n").find(Boolean);
      if (!line) return resolve(null);

      try {
        const json = JSON.parse(line);
        if (json.error && json.error !== "success") {
          const err = new Error(`mpv IPC error: ${json.error}`);
          err.mpv = json;
          return reject(err);
        }
        resolve(json);
      } catch (e) {
        reject(e);
      }
    });

    client.on("error", (err) => reject(err));
  });
}

async function waitForSocket(timeoutMs = 1500) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (fs.existsSync(SOCKET_PATH)) return true;
    await delay(50);
  }
  return false;
}

// --- mpv process lifecycle ---
async function ensureMpvRunning() {
  if (mpvProc && mpvProc.exitCode == null) return;

  if (starting) return starting;

  starting = (async () => {
    safeUnlinkSocket();

    // Minimal audio-only daemon-ish mpv
    const args = [
      "--idle=yes",
      "--force-window=no",
      "--no-video",
      `--input-ipc-server=${SOCKET_PATH}`,
      "--really-quiet",
      `--volume=${DEFAULT_VOLUME}`
    ];

    mpvProc = spawn(MPV_BIN, args, {
      stdio: ["ignore", "pipe", "pipe"]
    });

    mpvProc.stdout.on("data", (d) => {
      // Keep around for debugging if needed
      // console.log("[mpv stdout]", d.toString());
    });
    mpvProc.stderr.on("data", (d) => {
      // console.log("[mpv stderr]", d.toString());
    });

    mpvProc.on("exit", (code, sig) => {
      // reset so it can be restarted
      mpvProc = null;
      starting = null;
      // console.log("[mpv exit]", { code, sig });
    });

    const ok = await waitForSocket(2000);
    if (!ok) {
      throw new Error("mpv IPC socket did not appear. Is mpv installed and runnable?");
    }
  })();

  try {
    await starting;
  } finally {
    starting = null;
  }
}

async function command(cmd, ...args) {
  await ensureMpvRunning();
  return sendIpc({ command: [cmd, ...args] });
}

// --- public API ---
async function playFile(filePath) {
  await ensureMpvRunning();
  // `loadfile <path> replace`
  return command("loadfile", filePath, "replace");
}

async function stop() {
  // stop playback but keep mpv alive
  return command("stop");
}

async function pause() {
  return command("set_property", "pause", true);
}

async function resume() {
  return command("set_property", "pause", false);
}

async function togglePause() {
  // cycle pause
  return command("cycle", "pause");
}

async function getVolume() {
  const res = await command("get_property", "volume");
  return res?.data ?? null;
}

async function setVolume(vol0to100) {
  const v = Math.max(0, Math.min(100, Number(vol0to100)));
  return command("set_property", "volume", v);
}

async function volumeUp(step = VOLUME_STEP) {
  return command("add", "volume", Number(step));
}

async function volumeDown(step = VOLUME_STEP) {
  return command("add", "volume", -Number(step));
}

async function getStatus() {
  await ensureMpvRunning();
  // Query a few properties
  const [pauseRes, volRes, pathRes, timeRes, durRes] = await Promise.allSettled([
    command("get_property", "pause"),
    command("get_property", "volume"),
    command("get_property", "path"),
    command("get_property", "time-pos"),
    command("get_property", "duration")
  ]);

  const pick = (r) => (r.status === "fulfilled" ? r.value?.data : null);

  return {
    pause: pick(pauseRes),
    volume: pick(volRes),
    path: pick(pathRes),
    timePos: pick(timeRes),
    duration: pick(durRes)
  };
}

module.exports = {
  ensureMpvRunning,
  playFile,
  stop,
  pause,
  resume,
  togglePause,
  getVolume,
  setVolume,
  volumeUp,
  volumeDown,
  getStatus
};
