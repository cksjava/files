import { useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWaveSquare, faGear, faLayerGroup, faMusic } from "@fortawesome/free-solid-svg-icons";

function Item(props: { icon: any; label: string; to: string }) {
  const nav = useNavigate();
  const loc = useLocation();
  const active = loc.pathname === props.to;

  return (
    <button
      onClick={() => nav(props.to)}
      className={[
        "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition",
        active ? "bg-white/10" : "hover:bg-white/5",
      ].join(" ")}
    >
      <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
        <FontAwesomeIcon icon={props.icon} />
      </span>
      <span className="text-sm">{props.label}</span>
    </button>
  );
}

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-white/10 p-3 hidden md:block">
      <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
        <div className="text-sm font-semibold">Now Playing</div>
        <div className="text-xs text-white/60 mt-1 truncate">Open the UI from any device</div>
      </div>

      <div className="mt-3 space-y-2">
        <Item icon={faMusic} label="Tracks" to="/tracks" />
        <Item icon={faLayerGroup} label="Albums" to="/albums" />
        <Item icon={faWaveSquare} label="Now Playing" to="/now-playing" />
        <Item icon={faGear} label="Settings" to="/settings" />

      </div>
    </aside>
  );
}
