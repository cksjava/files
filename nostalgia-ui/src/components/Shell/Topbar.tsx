import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCompactDisc } from "@fortawesome/free-solid-svg-icons";

export function Topbar() {
  return (
    <header className="h-14 flex items-center gap-3 px-4 border-b border-white/10 bg-neutral-950/80 backdrop-blur">
      <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
        <FontAwesomeIcon icon={faCompactDisc} />
      </div>
      <div className="leading-tight">
        <div className="text-sm text-white/70">Nostalgia</div>
        <div className="text-base font-semibold">Music Player</div>
      </div>
      <div className="flex-1" />
      <div className="text-xs text-white/50">LAN kiosk</div>
    </header>
  );
}
