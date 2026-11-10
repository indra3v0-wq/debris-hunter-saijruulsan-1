/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Flame, RotateCw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface VirtualTouchControlsProps {
  onForward: () => void;
  onBrake: () => void;
  onSync: () => void;
}

export const VirtualTouchControls: React.FC<VirtualTouchControlsProps> = ({
  onForward,
  onBrake,
  onSync,
}) => {
  return (
    <div className="md:hidden fixed bottom-24 left-4 z-30 pointer-events-auto">
      <div className="bg-slate-950/80 p-2 rounded-2xl border border-sky-500/30 backdrop-blur-md shadow-2xl flex flex-col items-center gap-1.5 select-none">
        <span className="text-[9px] font-mono text-sky-400 font-bold">RCS TOUCH</span>

        {/* Forward Thrust */}
        <button
          onTouchStart={(e) => { e.preventDefault(); onForward(); }}
          onClick={onForward}
          className="w-12 h-12 rounded-xl bg-sky-500/20 active:bg-sky-500/50 border border-sky-400 text-sky-300 flex flex-col items-center justify-center transition-colors shadow-[0_0_10px_rgba(56,189,248,0.3)]"
          title="Forward Thrust"
        >
          <ArrowUp className="w-4 h-4 text-emerald-400" />
          <span className="text-[8px] font-mono">+X</span>
        </button>

        {/* Middle row: Sync and Brake */}
        <div className="flex gap-2">
          <button
            onTouchStart={(e) => { e.preventDefault(); onSync(); }}
            onClick={onSync}
            className="w-11 h-11 rounded-xl bg-purple-500/20 active:bg-purple-500/50 border border-purple-400 text-purple-300 flex flex-col items-center justify-center transition-colors shadow-[0_0_10px_rgba(168,85,247,0.3)]"
            title="Synchronize Spin"
          >
            <RotateCw className="w-3.5 h-3.5 text-purple-300" />
            <span className="text-[8px] font-mono">SYNC</span>
          </button>

          <button
            onTouchStart={(e) => { e.preventDefault(); onBrake(); }}
            onClick={onBrake}
            className="w-11 h-11 rounded-xl bg-rose-500/20 active:bg-rose-500/50 border border-rose-400 text-rose-300 flex flex-col items-center justify-center transition-colors shadow-[0_0_10px_rgba(244,63,94,0.3)]"
            title="Retrograde Brake"
          >
            <ArrowDown className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-[8px] font-mono">BRAKE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
