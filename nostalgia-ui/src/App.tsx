import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Shell } from "./components/Shell/Shell";
import { NowPlayingScreen } from "./screens/NowPlayingScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { AlbumsScreen } from "./screens/AlbumsScreen";
import { AlbumDetailsScreen } from "./screens/AlbumDetailsScreen";
import { TracksScreen } from "./screens/TracksScreen";

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Navigate to="/now-playing" replace />} />
        <Route path="/now-playing" element={<NowPlayingScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />

        <Route path="/albums" element={<AlbumsScreen />} />
        <Route path="/albums/:id" element={<AlbumDetailsScreen />} />
        <Route path="/tracks" element={<TracksScreen />} />
      </Routes>
    </Shell>
  );
}
