import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { libraryApi, type Track } from "../api/libraryApi";
import { playerApi } from "../api/playerApi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faPlay } from "@fortawesome/free-solid-svg-icons";

type AlbumDetailsResp = {
  album: {
    id: number;
    title: string;
    albumArtist: string | null;
    year: number | null;
    genre: string | null;
    coverUrl: string | null;
  };
  tracks: Track[];
};

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

export function AlbumDetailsScreen() {
  const nav = useNavigate();
  const { id } = useParams();
  const albumId = Number(id);

  const [data, setData] = useState<AlbumDetailsResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    if (!Number.isFinite(albumId)) return;
    setLoading(true);
    try {
      const r = (await libraryApi.albumDetails(albumId)) as any;
      setData(r as AlbumDetailsResp);
      setErr(null);
    } catch (e: any) {
      setErr(e?.message || "Failed to load album");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [albumId]);

  const header = useMemo(() => {
    const a = data?.album;
    if (!a) return null;
    return {
      title: a.title,
      subtitle: [a.albumArtist || "Unknown Artist", a.year ? String(a.year) : null]
        .filter(Boolean)
        .join(" • "),
      cover: a.coverUrl || null,
    };
  }, [data]);

  const btn =
    "px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button className={btn} onClick={() => nav("/albums")}>
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Back
        </button>
        <div className="text-sm text-white/60">
          {loading ? "Loading…" : "Album"}
        </div>
      </div>

      {err && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {err}
        </div>
      )}

      {header && (
        <Card>
          <div className="flex gap-5">
            <div className="w-32 h-32 rounded-2xl overflow-hidden bg-black/30 border border-white/10 shrink-0">
              {header.cover ? (
                <img
                  src={header.cover}
                  alt={header.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/30 text-sm">
                  No cover
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="text-xl font-semibold truncate">{header.title}</div>
              <div className="text-sm text-white/60 mt-1 truncate">
                {header.subtitle || "—"}
              </div>
              {data?.album?.genre && (
                <div className="text-xs text-white/40 mt-1">{data.album.genre}</div>
              )}
              <div className="text-xs text-white/40 mt-3">
                {data?.tracks?.length ?? 0} tracks
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card>
        {!data?.tracks?.length ? (
          <div className="text-sm text-white/60">No tracks found.</div>
        ) : (
          <div className="space-y-2">
            {data.tracks.map((t) => (
              <div
                key={t.id}
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 flex items-center gap-3"
              >
                <div className="w-10 text-sm text-white/50 tabular-nums">
                  {t.trackNo ?? "—"}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">{t.title || "Unknown Title"}</div>
                  <div className="text-xs text-white/50 truncate">{t.trackArtist || data.album.albumArtist || "—"}</div>
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
