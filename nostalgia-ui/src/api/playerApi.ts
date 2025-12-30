import { api } from "./http";

export type PlayerStatus = {
  pause: boolean | null;
  volume: number | null;     // 0-100
  volume10?: number;         // 1-10 if you enabled it
  path: string | null;
  timePos: number | null;
  duration: number | null;
};

export const playerApi = {
  status: () => api<{ ok: true; status: PlayerStatus }>("/api/player/status"),

  play: (trackId: number) =>
    api<{ ok: true; trackId: number; filePath: string }>("/api/player/play", {
      method: "POST",
      body: JSON.stringify({ trackId }),
    }),

  pause: () => api<{ ok: true }>("/api/player/pause", { method: "POST" }),
  resume: () => api<{ ok: true }>("/api/player/resume", { method: "POST" }),
  toggle: () => api<{ ok: true }>("/api/player/toggle", { method: "POST" }),
  stop: () => api<{ ok: true }>("/api/player/stop", { method: "POST" }),

  volume10Up: (step = 1) =>
    api<{ ok: true; level: number; volume: number }>("/api/player/volume10/up", {
      method: "POST",
      body: JSON.stringify({ step }),
    }),

  volume10Down: (step = 1) =>
    api<{ ok: true; level: number; volume: number }>("/api/player/volume10/down", {
      method: "POST",
      body: JSON.stringify({ step }),
    }),

  volume10Set: (level: number) =>
    api<{ ok: true; level: number; volume: number }>("/api/player/volume10/set", {
      method: "POST",
      body: JSON.stringify({ level }),
    }),
};
