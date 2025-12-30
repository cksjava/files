import React, { useEffect, useMemo, useState } from "react";
import { libraryApi, type Album } from "../api/libraryApi";
import { useNavigate } from "react-router-dom";

function Card(props: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      {props.children}
    </div>
  );
}

function AlbumTile(props: { album: Album; onClick: () => void }) {
  const a = props.album;
  const cover = a.coverUrl ? a.coverUrl : null;

  return (
    <button
      onClick={props.onClick}
      className="group text-left rounded-3xl border border-white/10 bg-black/30 hover:bg-white/10 transition overflow-hidden"
    >
      <div className="aspect-square w-full bg-black/40 relative">
        {cover ? (
          <img
            src={cover}
            alt={a.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30 text-sm">
            No cover
          </div>
        )}
        <div className="absolute inset-0 ring-1 ring-white/5 group-hover:ring-white/15 rounded-none" />
      </div>

      <div className="p-4">
        <div className="font-semibold truncate">{a.title}</div>
        <div className="text-sm text-white/60 truncate">
          {a.albumArtist || "Unknown Artist"}
        </div>
        <div className="text-xs text-white/40 mt-1">
          {a.year ? a.year : ""}
        </div>
      </div>
    </button>
  );
}

export function AlbumsScreen() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const fetchAlbums = async (query: string) => {
    setLoading(true);
    try {
      const data = await libraryApi.albums(query);
      setRows(data);
      setErr(null);
    } catch (e: any) {
      setErr(e?.message || "Failed to load albums");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbums("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => fetchAlbums(q.trim()), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const title = useMemo(() => {
    if (loading) return "Albums (loading…)";
    return `Albums (${rows.length})`;
  }, [loading, rows.length]);

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-semibold">{title}</div>
          <div className="text-sm text-white/60 mt-1">Browse your library</div>
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search albums or artist…"
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
            No albums found. Run a scan from Settings first.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {rows.map((a) => (
              <AlbumTile
                key={a.id}
                album={a}
                onClick={() => nav(`/albums/${a.id}`)}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
