// @ts-nocheck
import React from "react";

export const TPVWarMap: React.FC<any> = ({ onSectorClick }) => (
  <div className="h-full w-full bg-zinc-950 flex flex-col items-center justify-center p-8 text-center">
    <div className="text-6xl mb-4">🗺️</div>
    <h2 className="text-2xl font-bold text-white mb-2">Operational War Map</h2>
    <p className="text-zinc-500 max-w-md mb-8">
      Real-time visual control of your restaurant. Monitor kitchen pressure,
      table status, and delivery heat.
    </p>

    <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
      <button
        onClick={() => onSectorClick?.("mesas")}
        className="p-6 bg-zinc-900 border border-white/5 rounded-xl hover:bg-zinc-800 transition-colors"
      >
        <div className="text-3xl mb-2">🪑</div>
        <div className="text-white font-bold">Tables</div>
        <div className="text-xs text-zinc-500">Manage seating</div>
      </button>
      <button
        onClick={() => onSectorClick?.("cozinha")}
        className="p-6 bg-zinc-900 border border-white/5 rounded-xl hover:bg-zinc-800 transition-colors"
      >
        <div className="text-3xl mb-2">🍳</div>
        <div className="text-white font-bold">Kitchen</div>
        <div className="text-xs text-zinc-500">Monitor tasks</div>
      </button>
    </div>
  </div>
);
