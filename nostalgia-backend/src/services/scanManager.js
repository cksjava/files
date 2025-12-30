const { scanLibrary } = require("./scanService");

let currentJob = null;

// Very small helper for timestamps
const nowIso = () => new Date().toISOString();

function createJob({ rootDir }) {
  return {
    id: `scan_${Date.now()}`,
    rootDir,
    status: "running", // running | completed | failed | stopped
    startedAt: nowIso(),
    finishedAt: null,

    // progress counters
    scannedFiles: 0,
    flacFound: 0,
    tracksCreatedOrUpdated: 0,
    errors: 0,

    // live info
    lastError: null,
    recentDiscovered: [], // capped
    message: "Scan started",

    // cancel support
    cancelRequested: false,

    // SSE subscribers
    subscribers: new Set()
  };
}

function emit(job, payload) {
  // push to all SSE subscribers
  const msg = `data: ${JSON.stringify(payload)}\n\n`;
  for (const res of job.subscribers) {
    try {
      res.write(msg);
    } catch {
      // ignore broken connections
    }
  }
}

function snapshot(job) {
  if (!job) return null;
  return {
    id: job.id,
    rootDir: job.rootDir,
    status: job.status,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    message: job.message,
    cancelRequested: job.cancelRequested,

    scannedFiles: job.scannedFiles,
    flacFound: job.flacFound,
    tracksCreatedOrUpdated: job.tracksCreatedOrUpdated,
    errors: job.errors,

    lastError: job.lastError,
    recentDiscovered: job.recentDiscovered
  };
}

async function startScan({ rootDir }) {
  // If a scan is running, return current job
  if (currentJob && currentJob.status === "running") {
    return { job: snapshot(currentJob), alreadyRunning: true };
  }

  const job = createJob({ rootDir });
  currentJob = job;

  // Fire-and-forget async execution
  (async () => {
    try {
      emit(job, { type: "started", job: snapshot(job) });

      const summary = await scanLibrary({
        rootDir: job.rootDir,
        onDiscovered: (t) => {
          // small recent list cap
          job.recentDiscovered.unshift(t);
          if (job.recentDiscovered.length > 50) job.recentDiscovered.pop();

          // emit discover event
          emit(job, { type: "discovered", item: t, job: snapshot(job) });
        },
        onProgress: (p) => {
          // p: { scannedFiles, flacFound, tracksCreatedOrUpdated, errors }
          job.scannedFiles = p.scannedFiles;
          job.flacFound = p.flacFound;
          job.tracksCreatedOrUpdated = p.tracksCreatedOrUpdated;
          job.errors = p.errors;

          emit(job, { type: "progress", job: snapshot(job) });
        },
        shouldCancel: () => job.cancelRequested
      });

      // sync final numbers
      job.scannedFiles = summary.scannedFiles;
      job.flacFound = summary.flacFound;
      job.tracksCreatedOrUpdated = summary.tracksCreatedOrUpdated;
      job.errors = summary.errors;

      job.status = job.cancelRequested ? "stopped" : "completed";
      job.finishedAt = nowIso();
      job.message = job.cancelRequested ? "Scan stopped" : "Scan completed";

      emit(job, { type: job.status, job: snapshot(job) });

      // Close SSE clients when done
      for (const res of job.subscribers) {
        try {
          res.end();
        } catch {}
      }
      job.subscribers.clear();
    } catch (e) {
      job.status = "failed";
      job.finishedAt = nowIso();
      job.lastError = e?.message || String(e);
      job.message = "Scan failed";

      emit(job, { type: "failed", job: snapshot(job) });

      for (const res of job.subscribers) {
        try {
          res.end();
        } catch {}
      }
      job.subscribers.clear();
    }
  })();

  return { job: snapshot(job), alreadyRunning: false };
}

function getStatus() {
  return snapshot(currentJob);
}

function stopScan() {
  if (!currentJob || currentJob.status !== "running") {
    return { ok: false, message: "No running scan" };
  }
  currentJob.cancelRequested = true;
  currentJob.message = "Cancellation requested";
  emit(currentJob, { type: "cancel_requested", job: snapshot(currentJob) });
  return { ok: true, message: "Stop requested", job: snapshot(currentJob) };
}

function attachSse(res) {
  if (!currentJob) {
    return { ok: false, message: "No scan job yet" };
  }
  if (currentJob.status !== "running") {
    return { ok: false, message: `Scan not running (status=${currentJob.status})` };
  }

  currentJob.subscribers.add(res);
  // send initial snapshot
  emit(currentJob, { type: "progress", job: snapshot(currentJob) });
  return { ok: true };
}

function detachSse(res) {
  if (currentJob) currentJob.subscribers.delete(res);
}

module.exports = {
  startScan,
  getStatus,
  stopScan,
  attachSse,
  detachSse
};
