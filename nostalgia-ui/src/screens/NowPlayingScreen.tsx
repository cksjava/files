import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPause,
  faPlay,
  faStop,
  faVolumeHigh,
  faVolumeLow,
} from "@fortawesome/free-solid-svg-icons";
import { playerApi } from "../api/playerApi";
import { libraryApi, type Track } from "../api/libraryApi";
import { formatTime } from "../utils/time";

export function NowPlayingScreen() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Awaited<ReturnType<typeof playerApi.status>>["status"] | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const lastPathRef = useRef<string | null>(null);

  const refresh = async () => {
    try {
      const r = await playerApi.status();
      setStatus(r.status);
      setErr(null);
    } catch (e: any) {
      setErr(e?.message || "Failed to load status");
    }
  };

  // Map mpv path -> track from DB
  const refreshTrackForPath = async (path: string | null | undefined) => {
    const p = path || null;
    if (!p) {
      setTrack(null);
      lastPathRef.current = null;
      return;
    }
    if (lastPathRef.current === p) return;

    lastPathRef.current = p;
    try {
      // backend track search includes filePath LIKE
      const t = await libraryApi.trackByPath(p);
      setTrack(t);
    } catch {
      setTrack(null);
    }
  };

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    refreshTrackForPath(status?.path ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status?.path]);

  const paused = !!status?.pause;
  const vol10 =
    status?.volume10 ??
    (status?.volume != null ? Math.max(1, Math.min(10, Math.round(status.volume / 10))) : 5);

  const timePos = status?.timePos ?? 0;
  const duration = status?.duration ?? 0;
  const progress = duration > 0 ? Math.min(1, Math.max(0, timePos / duration)) : 0;

  const title = track?.title || (status?.path ? "Playing" : "Idle");
  const subtitle =
    track
      ? [track.trackArtist || track.album?.albumArtist || "Unknown Artist", track.album?.title || "Unknown Album"]
          .filter(Boolean)
          .join(" • ")
      : status?.path
      ? status.path
      : "No track loaded";

  const cover = track?.coverUrl || track?.album?.coverUrl || null;

  const btn =
    "px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {err && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {err}
        </div>
      )}

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex gap-5">
          <div className="w-36 h-36 rounded-3xl overflow-hidden bg-black/30 border border-white/10 shrink-0">
            {cover ? (
              <img src={cover} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/30 text-sm">
                No cover
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm text-white/60">Now Playing</div>
            <div className="mt-1 text-2xl font-semibold truncate">{title}</div>
            <div className="mt-2 text-sm text-white/60 truncate">{subtitle}</div>

            {/* Progress */}
            <div className="mt-5">
              <div className="h-2 rounded-full bg-black/40 border border-white/10 overflow-hidden">
                <div
                  className="h-full bg-white/30"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-white/50 tabular-nums">
                <span>{formatTime(timePos)}</span>
                <span>{duration > 0 ? formatTime(duration) : "—"}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className={btn}
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  try {
                    if (paused) await playerApi.resume();
                    else await playerApi.pause();
                    await refresh();
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <FontAwesomeIcon icon={paused ? faPlay : faPause} className="mr-2" />
                {paused ? "Resume" : "Pause"}
              </button>

              <button
                className={btn}
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  try {
                    await playerApi.stop();
                    await refresh();
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <FontAwesomeIcon icon={faStop} className="mr-2" />
                Stop
              </button>

              <button
                className={btn}
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  try {
                    await playerApi.volume10Down(1);
                    await refresh();
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <FontAwesomeIcon icon={faVolumeLow} className="mr-2" />
                Vol -
              </button>

              <button
                className={btn}
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  try {
                    await playerApi.volume10Up(1);
                    await refresh();
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <FontAwesomeIcon icon={faVolumeHigh} className="mr-2" />
                Vol +
              </button>

              <div className="ml-auto flex items-center gap-2 text-sm text-white/70">
                <span className="text-white/50">Vol</span>
                <span className="px-2 py-1 rounded-lg bg-black/30 border border-white/10">
                  {vol10}/10
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* tiny debug line (can remove later) */}
        <div className="mt-4 text-[11px] text-white/35 break-all">
          {status?.path ? `mpv: ${status.path}` : "mpv: idle"}
        </div>
      </div>
    </div>
  );
}
