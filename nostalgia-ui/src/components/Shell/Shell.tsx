import React from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function Shell(props: { children: React.ReactNode }) {
  return (
    <div className="h-full w-full bg-neutral-950 text-neutral-100">
      <div className="h-full w-full flex">
        <Sidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <Topbar />
          <main className="flex-1 min-h-0 overflow-auto p-4">
            {props.children}
          </main>
        </div>
      </div>
    </div>
  );
}
