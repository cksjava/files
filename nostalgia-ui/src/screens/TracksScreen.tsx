import React, { useEffect, useMemo, useState } from "react";
import { libraryApi, type Track } from "../api/libraryApi";
import { playerApi } from "../api/playerApi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay } from "@fortawesome/free-solid-svg-icons";

function Card(props: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      {props.children}
    </div>
  );
}

function formatDur(sec?: number | null) {
  if (!sec || sec <= 0) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function TracksScreen() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const fetchTracks = async (query: string) => {
    setLoading(true);
    try {
      const data = await libraryApi.tracks(query);
      setRows(data);
      setErr(null);
    } catch (e: any) {
      setErr(e?.message || "Failed to load tracks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracks("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => fetchTracks(q.trim()), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const title = useMemo(() => {
    if (loading) return "Tracks (loading…)";
    return `Tracks (${rows.length})`;
  }, [loading, rows.length]);

  const btn =
    "px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 active:scale-[0.98] transition";

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-semibold">{title}</div>
          <div className="text-sm text-white/60 mt-1">All tracks in your library</div>
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title, artist, album…"
          className="w-[320px] max-w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-white/25"
        />
      </div>

      {err && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {err}
        </div>
      )}

      <Card>
        {rows.length === 0 && !loading ? (
          <div className="text-sm text-white/60">
            No tracks found. Run a scan from Settings.
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((t, idx) => (
              <div
                key={t.id}
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 flex items-center gap-3"
              >
                <div className="w-8 text-xs text-white/40 tabular-nums">
                  {idx + 1}
                </div>

                <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0">
                  {t.coverUrl ? (
                    <img
                      src={t.coverUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">
                      —
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">
                    {t.title || "Unknown Title"}
                  </div>
                  <div className="text-xs text-white/50 truncate">
                    {t.trackArtist || t.album?.albumArtist || "Unknown Artist"}
                  </div>
                  <div className="text-[11px] text-white/40 truncate">
                    {t.album?.title || "Unknown Album"}
                  </div>
                </div>

                <div className="text-xs text-white/50 tabular-nums w-14 text-right">
                  {formatDur(t.durationSec)}
                </div>

                <button
                  className={btn}
                  disabled={playingId === t.id}
                  onClick={async () => {
                    setPlayingId(t.id);
                    try {
                      await playerApi.play(t.id);
                    } finally {
                      setPlayingId(null);
                    }
                  }}
                  title="Play"
                >
                  <FontAwesomeIcon icon={faPlay} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
