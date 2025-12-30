import { api } from "./http";

export type Track = {
  id: number;
  title: string | null;
  trackArtist: string | null;
  trackNo: number | null;
  discNo: number | null;
  durationSec: number | null;
  filePath: string;
  coverUrl: string | null;
  album?: {
    id: number;
    title: string;
    albumArtist: string | null;
    coverUrl: string | null;
  };
};

export type Album = {
  id: number;
  title: string;
  albumArtist: string | null;
  year: number | null;
  genre: string | null;
  coverUrl: string | null;
};

export const libraryApi = {
  scanStart: () => api("/api/library/scan/start", { method: "POST", body: "{}" }),
  scanStatus: () => api("/api/library/scan/status"),

  tracks: (search = "") =>
    api<Track[]>(`/api/tracks${search ? `?search=${encodeURIComponent(search)}` : ""}`),

  albums: (search = "") =>
    api<Album[]>(`/api/albums${search ? `?search=${encodeURIComponent(search)}` : ""}`),

  albumDetails: (id: number) => api(`/api/albums/${id}`),

  scanStop: () => api("/api/library/scan/stop", { method: "POST", body: "{}" }),
  
  trackByPath: (path: string) =>
    api<Track>(`/api/tracks/by-path?path=${encodeURIComponent(path)}`),

};
