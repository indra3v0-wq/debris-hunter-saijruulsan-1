/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { Compass, Flame, Shield, RotateCw, Gauge, Zap } from 'lucide-react';
import { Language } from '../types';

interface NavBallHUDProps {
  language: Language;
  pitchDeg: number;       // -90 to +90
  rollDeg: number;        // -180 to +180
  headingDeg: number;     // 0 to 360
  surfaceVelMs: number;
  altitudeM: number;
  mach: number;
  gForce: number;
  throttlePct: number;
  onThrottleChange?: (val: number) => void;
  sasActive: boolean;
  onToggleSas?: () => void;
  rcsActive: boolean;
  onToggleRcs?: () => void;
  compact?: boolean;
}

export const NavBallHUD: React.FC<NavBallHUDProps> = ({
  language,
  pitchDeg,
  rollDeg,
  headingDeg,
  surfaceVelMs,
  altitudeM,
  mach,
  gForce,
  throttlePct,
  onThrottleChange,
  sasActive,
  onToggleSas,
  rcsActive,
  onToggleRcs,
  compact = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Determine current atmospheric layer
  const altKm = altitudeM / 1000;
  let layerName = 'Тропосфер (0-12 км)';
  let layerNameEn = 'Troposphere (0-12 km)';
  let layerColor = 'text-sky-400';
  let layerProgress = (altKm / 12) * 20;

  if (altKm > 12 && altKm <= 50) {
    layerName = 'Стратосфер (12-50 км)';
    layerNameEn = 'Stratosphere (12-50 km)';
    layerColor = 'text-blue-400';
    layerProgress = 20 + ((altKm - 12) / 38) * 20;
  } else if (altKm > 50 && altKm <= 85) {
    layerName = 'Мезосфер (50-85 км)';
    layerNameEn = 'Mesosphere (50-85 km)';
    layerColor = 'text-indigo-400';
    layerProgress = 40 + ((altKm - 50) / 35) * 20;
  } else if (altKm > 85 && altKm <= 600) {
    layerName = 'Термосфер (85-600 км)';
    layerNameEn = 'Thermosphere (85-600 km)';
    layerColor = 'text-purple-400';
    layerProgress = 60 + ((altKm - 85) / 515) * 20;
  } else if (altKm > 600) {
    layerName = 'Экзосфер (600+ км)';
    layerNameEn = 'Exosphere (600+ km)';
    layerColor = 'text-emerald-400';
    layerProgress = 100;
  }

  // Draw procedural KSP-style 2D artificial horizon NavBall
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const r = size / 2;
    const cx = r;
    const cy = r;

    ctx.clearRect(0, 0, size, size);

    // Outer circular clip mask
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r - 3, 0, Math.PI * 2);
    ctx.clip();

    // Rotate context by roll angle
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((rollDeg * Math.PI) / 180);

    // Vertical pitch displacement (-90 to +90 maps to -r to +r)
    const pitchOffset = (pitchDeg / 90) * (r * 0.95);

    // Sky half (Top - Blue cyan)
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-r * 1.5, -r * 1.5 - pitchOffset, r * 3, r * 1.5);

    // Ground half (Bottom - Brown ochre)
    ctx.fillStyle = '#854d0e';
    ctx.fillRect(-r * 1.5, -pitchOffset, r * 3, r * 1.5);

    // Horizon line (White equator line)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-r * 1.5, -pitchOffset);
    ctx.lineTo(r * 1.5, -pitchOffset);
    ctx.stroke();

    // Pitch ladder lines (+15, +30, +45, +60, -15, -30, etc.)
    ctx.lineWidth = 1.2;
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let deg = -75; deg <= 75; deg += 15) {
      if (deg === 0) continue;
      const py = -pitchOffset - (deg / 90) * (r * 0.95);
      const lineWidth = deg % 30 === 0 ? 28 : 16;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';

      ctx.beginPath();
      ctx.moveTo(-lineWidth, py);
      ctx.lineTo(lineWidth, py);
      ctx.stroke();

      if (deg % 30 === 0) {
        ctx.fillText(`${Math.abs(deg)}°`, lineWidth + 9, py);
        ctx.fillText(`${Math.abs(deg)}°`, -lineWidth - 9, py);
      }
    }

    // Heading tick marks along the horizon
    const headOffset = (headingDeg % 360) * 0.8;
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#fef08a';
    ctx.fillText('N', 0, -pitchOffset - 7);
    ctx.fillText('S', 0, -pitchOffset + 9);

    ctx.restore(); // restore roll rotation

    // 3D sphere glass bevel shading / spherical vignette
    const grad = ctx.createRadialGradient(cx, cy, r * 0.65, cx, cy, r);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.25)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Metallic Outer Bezel
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 1.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore(); // restore clip

    // Fixed Aircraft Reticle / Level Indicator in Center (Yellow wings & cross)
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.5;

    // Center dot
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();

    // Left wing
    ctx.beginPath();
    ctx.moveTo(cx - 24, cy);
    ctx.lineTo(cx - 9, cy);
    ctx.lineTo(cx - 9, cy + 5);
    ctx.stroke();

    // Right wing
    ctx.beginPath();
    ctx.moveTo(cx + 24, cy);
    ctx.lineTo(cx + 9, cy);
    ctx.lineTo(cx + 9, cy + 5);
    ctx.stroke();

    // Top vertical needle
    ctx.beginPath();
    ctx.moveTo(cx, cy - 14);
    ctx.lineTo(cx, cy - 6);
    ctx.stroke();

    // Prograde flight vector marker (Green circle with 3 ticks)
    const proX = cx;
    const proY = cy - (pitchDeg / 90) * 35;
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(proX, proY, 6, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(proX, proY - 6);
    ctx.lineTo(proX, proY - 10);
    ctx.moveTo(proX - 6, proY);
    ctx.lineTo(proX - 10, proY);
    ctx.moveTo(proX + 6, proY);
    ctx.lineTo(proX + 10, proY);
    ctx.stroke();
  }, [pitchDeg, rollDeg, headingDeg]);

  return (
    <div className="select-none pointer-events-auto">
      {/* Mobile/Desktop Glassmorphic NavBall Frame */}
      <div className="aerospace-panel p-2.5 sm:p-3 rounded-2xl border-sky-500/40 bg-slate-950/95 backdrop-blur-md shadow-2xl flex items-center gap-3">
        {/* Throttle Slider on Left */}
        {onThrottleChange && (
          <div className="flex flex-col items-center justify-between h-28 sm:h-32 py-1 pr-1 border-r border-slate-800">
            <span className="text-[9px] font-mono text-amber-400 font-bold">THR</span>
            <input
              type="range"
              min="0"
              max="100"
              value={throttlePct}
              onChange={(e) => onThrottleChange(Number(e.target.value))}
              className="h-20 sm:w-24 w-3.5 accent-amber-400 cursor-pointer [writing-mode:vertical-lr] [-webkit-appearance:slider-vertical]"
              title="Rocket Throttle"
            />
            <span className="text-[9px] font-mono text-white font-bold">{throttlePct}%</span>
          </div>
        )}

        {/* Center: NavBall Canvas */}
        <div className="relative flex flex-col items-center">
          {/* Surface Velocity Tag */}
          <div className="absolute -top-3 px-2 py-0.5 rounded-full bg-slate-900 border border-sky-400/50 text-[9px] font-mono font-bold text-sky-300 z-10 shadow">
            {surfaceVelMs > 1000 ? `${(surfaceVelMs / 1000).toFixed(2)} km/s` : `${Math.round(surfaceVelMs)} m/s`}
          </div>

          <canvas
            ref={canvasRef}
            width={compact ? 110 : 124}
            height={compact ? 110 : 124}
            className="rounded-full shadow-[0_0_15px_rgba(2,132,199,0.35)]"
          />

          {/* Heading and Pitch Readout */}
          <div className="flex items-center gap-2 mt-1.5 text-[9px] font-mono text-slate-300">
            <span>HDG: <strong className="text-amber-400">{Math.round(headingDeg)}°</strong></span>
            <span>•</span>
            <span>PIT: <strong className="text-sky-300">{Math.round(pitchDeg)}°</strong></span>
          </div>
        </div>

        {/* Flight Data Gauges & SAS/RCS Buttons on Right */}
        <div className="flex flex-col justify-between h-28 sm:h-32 text-xs font-mono space-y-1">
          {/* Altitude readout */}
          <div className="p-1.5 bg-slate-900/90 rounded border border-slate-800">
            <span className="text-slate-400 text-[8px] block leading-none">ALTITUDE</span>
            <span className="text-white font-bold text-xs sm:text-sm">
              {altKm > 10 ? `${altKm.toFixed(1)} km` : `${Math.round(altitudeM)} m`}
            </span>
          </div>

          {/* Mach & G-force */}
          <div className="grid grid-cols-2 gap-1 text-[9px]">
            <div className="p-1 bg-slate-900/90 rounded border border-slate-800 text-center">
              <span className="text-slate-400 text-[8px] block">MACH</span>
              <span className="text-amber-300 font-bold">{mach.toFixed(1)}</span>
            </div>
            <div className="p-1 bg-slate-900/90 rounded border border-slate-800 text-center">
              <span className="text-slate-400 text-[8px] block">G-FORCE</span>
              <span className="text-purple-300 font-bold">{gForce.toFixed(1)}G</span>
            </div>
          </div>

          {/* SAS & RCS Mobile Touch Buttons */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <button
              onClick={onToggleSas}
              className={`flex-1 py-1 px-1.5 rounded text-[9px] font-bold border transition-colors flex items-center justify-center gap-1 ${
                sasActive
                  ? 'bg-sky-500/25 border-sky-400 text-sky-300 shadow-[0_0_8px_rgba(56,189,248,0.4)]'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
              title="Stability Augmentation System"
            >
              <Compass className="w-3 h-3" />
              <span>SAS</span>
            </button>

            <button
              onClick={onToggleRcs}
              className={`flex-1 py-1 px-1.5 rounded text-[9px] font-bold border transition-colors flex items-center justify-center gap-1 ${
                rcsActive
                  ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.4)]'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
              title="Reaction Control System"
            >
              <RotateCw className="w-3 h-3" />
              <span>RCS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Atmospheric Layer Indicator Bar */}
      <div className="mt-1.5 px-3 py-1 rounded-xl bg-slate-950/90 border border-sky-500/30 text-[10px] font-mono flex items-center justify-between gap-2 shadow">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping"></span>
          <span className="text-slate-400">{language === 'mn' ? 'Агаар мандал:' : 'Atmosphere:'}</span>
          <span className={`font-bold ${layerColor}`}>
            {language === 'mn' ? layerName : layerNameEn}
          </span>
        </div>
        <div className="w-20 sm:w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-sky-400 via-indigo-400 to-emerald-400 h-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(5, layerProgress))}%` }}
          />
        </div>
      </div>
    </div>
  );
};
