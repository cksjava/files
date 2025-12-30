import React, { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faStop, faRotateRight, faSignal } from "@fortawesome/free-solid-svg-icons";
import { libraryApi } from "../api/libraryApi";

type ScanJob = any; // backend returns { job: {...} } - keep flexible for now

function Card(props: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-start gap-3">
        <div className="min-w-0">
          <div className="text-base font-semibold">{props.title}</div>
          {props.subtitle && <div className="text-sm text-white/60 mt-1">{props.subtitle}</div>}
        </div>
      </div>
      <div className="mt-4">{props.children}</div>
    </div>
  );
}

function Stat(props: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3">
      <div className="text-xs text-white/50">{props.label}</div>
      <div className="text-base font-semibold mt-0.5">{props.value}</div>
    </div>
  );
}

export function SettingsScreen() {
  const [job, setJob] = useState<ScanJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [sseOn, setSseOn] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const esRef = useRef<EventSource | null>(null);

  const statusText = useMemo(() => {
    const s = job?.status;
    if (!s) return "No scan job yet";
    return `${s}${job?.cancelRequested ? " (cancelling)" : ""}`;
  }, [job]);

  const refreshStatus = async () => {
    try {
      const r: any = await libraryApi.scanStatus();
      setJob(r?.job || null);
      setErr(null);
    } catch (e: any) {
      setErr(e?.message || "Failed to fetch scan status");
    }
  };

  const startScan = async () => {
    setLoading(true);
    try {
      await libraryApi.scanStart();
      await refreshStatus();
      setErr(null);
    } catch (e: any) {
      setErr(e?.message || "Failed to start scan");
    } finally {
      setLoading(false);
    }
  };

  const stopScan = async () => {
    setLoading(true);
    try {
      await fetch("/api/library/scan/stop", { method: "POST" });
      await refreshStatus();
    } catch (e: any) {
      setErr(e?.message || "Failed to stop scan");
    } finally {
      setLoading(false);
    }
  };

  const connectSse = () => {
    try {
      // Close old connection first
      esRef.current?.close();
      esRef.current = new EventSource("/api/library/scan/events");
      setSseOn(true);

      esRef.current.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg?.job) setJob(msg.job);
        } catch {
          // ignore bad messages
        }
      };

      esRef.current.onerror = () => {
        // backend closes when scan ends; mark as off
        setSseOn(false);
        esRef.current?.close();
        esRef.current = null;
      };
    } catch {
      setSseOn(false);
    }
  };

  const disconnectSse = () => {
    esRef.current?.close();
    esRef.current = null;
    setSseOn(false);
  };

  useEffect(() => {
    refreshStatus();
    return () => disconnectSse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const running = job?.status === "running";
  const discovered: any[] = job?.recentDiscovered || [];

  const btn =
    "px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-semibold">Settings</div>
          <div className="text-sm text-white/60 mt-1">Library scan controls</div>
        </div>
        <button className={btn} onClick={refreshStatus} disabled={loading}>
          <FontAwesomeIcon icon={faRotateRight} className="mr-2" />
          Refresh
        </button>
      </div>

      {err && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {err}
        </div>
      )}

      <Card title="Music Library Scan" subtitle="Scans /mnt/music for FLAC and updates the database with covers.">
        <div className="flex flex-wrap gap-3">
          <button className={btn} onClick={startScan} disabled={loading || running}>
            <FontAwesomeIcon icon={faPlay} className="mr-2" />
            Start Scan
          </button>

          <button className={btn} onClick={stopScan} disabled={loading || !running}>
            <FontAwesomeIcon icon={faStop} className="mr-2" />
            Stop Scan
          </button>

          <button
            className={btn}
            onClick={() => (sseOn ? disconnectSse() : connectSse())}
            disabled={!running && !sseOn}
            title={!running && !sseOn ? "Start a scan first" : ""}
          >
            <FontAwesomeIcon icon={faSignal} className="mr-2" />
            {sseOn ? "Live: ON" : "Live: OFF"}
          </button>

          <div className="ml-auto text-sm text-white/60 flex items-center">
            <span className="mr-2">Status:</span>
            <span className="px-3 py-1 rounded-xl bg-black/30 border border-white/10 text-white/80">
              {statusText}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Scanned files" value={job?.scannedFiles ?? 0} />
          <Stat label="FLAC found" value={job?.flacFound ?? 0} />
          <Stat label="Tracks upserted" value={job?.tracksCreatedOrUpdated ?? 0} />
          <Stat label="Errors" value={job?.errors ?? 0} />
        </div>

        <div className="mt-4 text-xs text-white/50">
          Job: {job?.id ? job.id : "—"} · Root: {job?.rootDir ?? "—"}
        </div>
      </Card>

      <Card title="Recently Discovered" subtitle="Latest tracks detected during the scan (max 50).">
        {discovered.length === 0 ? (
          <div className="text-sm text-white/60">Nothing yet.</div>
        ) : (
          <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
            {discovered.map((d, idx) => (
              <div
                key={`${d.trackId ?? idx}-${idx}`}
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
              >
                <div className="text-sm font-semibold truncate">{d.title || "Unknown Title"}</div>
                <div className="text-xs text-white/60 truncate">
                  {d.albumTitle || "Unknown Album"}
                </div>
                <div className="text-[11px] text-white/40 truncate mt-1">{d.filePath}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
