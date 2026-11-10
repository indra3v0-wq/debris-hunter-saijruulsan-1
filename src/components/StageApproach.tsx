/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MissionState } from '../types';
import { buildModularSpacecraft } from '../three/spacecraftBuilder';
import { buildDebrisModel } from '../three/debrisBuilder';
import { createNasaEarthMesh, createNasaSpaceEnvironment } from '../three/proceduralEarth';
import { calculateCollisionRisk } from '../simulation/orbitalPhysics';
import { sound } from '../utils/audio';
import { TRANSLATIONS } from '../utils/translations';
import { 
  Crosshair, 
  AlertTriangle, 
  ArrowRight, 
  Flame, 
  RotateCw, 
  Compass, 
  ShieldAlert, 
  CheckCircle2, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import { VirtualTouchControls } from './VirtualTouchControls';

interface StageApproachProps {
  language?: import('../types').Language;
  missionState: MissionState;
  onUpdateState: (partial: Partial<MissionState>) => void;
  onProceedToCapture: () => void;
}

export const StageApproach: React.FC<StageApproachProps> = ({
  language = 'mn',
  missionState,
  onUpdateState,
  onProceedToCapture,
}) => {
  const t = TRANSLATIONS[language];
  const canvasMountRef = useRef<HTMLDivElement>(null);

  // Flight simulation state
  const [distanceM, setDistanceM] = useState<number>(45.0); // starts at 45 meters
  const [relativeVelMs, setRelativeVelMs] = useState<number>(0.65); // m/s closing speed
  const [alignmentPct, setAlignmentPct] = useState<number>(45); // attitude match percentage
  const [fuelKg, setFuelKg] = useState<number>(missionState.fuelRemainingKg);
  const [isFiringRcs, setIsFiringRcs] = useState<boolean>(false);
  const [hudCollapsed, setHudCollapsed] = useState<boolean>(false);

  const target = missionState.selectedMission;
  const captureTool = missionState.design.captureMechanism;

  // Collision risk formula from orbital physics
  const risk = calculateCollisionRisk(
    distanceM,
    relativeVelMs,
    target.tumbleRateDegS * (1 - alignmentPct / 100),
    2 // lidar accuracy
  );

  const isInsideCaptureEnvelope =
    distanceM <= captureTool.maxDistanceM &&
    relativeVelMs <= 0.25 &&
    alignmentPct >= 75;

  const [flightCamMode, setFlightCamMode] = useState<'chase' | 'docking' | 'cockpit'>('chase');

  const spacecraftRef = useRef<ReturnType<typeof buildModularSpacecraft> | null>(null);
  const debrisRef = useRef<ReturnType<typeof buildDebrisModel> | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    // Sun directional light
    const sunLight = new THREE.DirectionalLight(0xfff8e7, 3.2);
    sunLight.position.set(16, 12, 10);
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.25);
    fillLight.position.set(-10, -5, -8);
    scene.add(fillLight);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 1.8, 8.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 25;
    controls.minDistance = 0.3;
    controlsRef.current = controls;

    // 1. NASA Blue Marble Earth Horizon Below
    const earthRadius = 70;
    const earthBundle = createNasaEarthMesh(earthRadius, isSoftwareGl);
    earthBundle.setSunDirection(sunLight.position.clone().normalize());
    earthBundle.group.position.set(0, -earthRadius - 10, -15);
    scene.add(earthBundle.group);

    // 2. NASA Deep Space Environment (Milky Way galaxy skybox, Moon, Mars, Jupiter, Saturn, stars)
    const spaceEnv = createNasaSpaceEnvironment(isSoftwareGl);
    scene.add(spaceEnv.group);

    // Add Spacecraft Model in foreground
    const scBundle = buildModularSpacecraft(missionState.design);
    scBundle.group.position.set(0, -0.6, 2.5);
    scBundle.group.rotation.y = Math.PI; // facing forward toward target
    scene.add(scBundle.group);
    spacecraftRef.current = scBundle;

    // Add Debris Model in distance
    const debBundle = buildDebrisModel(target);
    debBundle.group.position.set(0, 0.8, -4.5);
    scene.add(debBundle.group);
    debrisRef.current = debBundle;

    // Flight Approach Corridor Guide Cone
    const coneGeo = new THREE.ConeGeometry(2.5, 9, 16, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const corridorCone = new THREE.Mesh(coneGeo, coneMat);
    corridorCone.rotation.x = -Math.PI / 2;
    corridorCone.position.set(0, 0.1, -1.0);
    scene.add(corridorCone);

    let frameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      debBundle.update(delta * (1 - alignmentPct / 150));
      scBundle.update(delta);
      earthBundle.update(delta);
      spaceEnv.update(delta);

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      scBundle.dispose();
      debBundle.dispose();
      earthBundle.dispose();
      spaceEnv.dispose();
      coneGeo.dispose();
      coneMat.dispose();
      sunLight.dispose();
      fillLight.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [target]);

  // RCS Thruster Actions
  const handleRcsPulse = (type: 'forward' | 'brake' | 'sync') => {
    sound.playThruster(0.35);
    setIsFiringRcs(true);
    if (spacecraftRef.current) {
      spacecraftRef.current.setThrusterFiring(true);
    }

    setFuelKg(prev => Math.max(0, prev - 1.5));

    if (type === 'forward') {
      setDistanceM(d => Math.max(2.8, d - 4.5));
      setRelativeVelMs(v => Math.min(1.2, v + 0.12));
    } else if (type === 'brake') {
      setRelativeVelMs(v => Math.max(0.08, v - 0.18));
      setDistanceM(d => Math.max(2.8, d - 1.2));
    } else if (type === 'sync') {
      setAlignmentPct(p => Math.min(100, p + 15));
      setRelativeVelMs(v => Math.max(0.1, v - 0.05));
    }

    setTimeout(() => {
      setIsFiringRcs(false);
      if (spacecraftRef.current) {
        spacecraftRef.current.setThrusterFiring(false);
      }
    }, 400);
  };

  // Autonomous Guidance Autopilot
  const handleAutopilot = () => {
    sound.playLockChime();
    sound.playThruster(0.8);
    setIsFiringRcs(true);
    if (spacecraftRef.current) spacecraftRef.current.setThrusterFiring(true);

    setTimeout(() => {
      setDistanceM(3.8); // perfect distance for robotic arm / clamp
      setRelativeVelMs(0.12); // smooth 12 cm/s
      setAlignmentPct(92); // 92% spin synchronized
      setFuelKg(f => Math.max(0, f - 8.5));
      setIsFiringRcs(false);
      if (spacecraftRef.current) spacecraftRef.current.setThrusterFiring(false);
      sound.playLockChime();

      onUpdateState({
        relativeDistanceM: 3.8,
        relativeVelocityMs: 0.12,
        captureAlignmentPct: 92,
        fuelRemainingKg: fuelKg - 8.5,
      });
    }, 1200);
  };

  // Flight Camera Switching
  const handleFlightCamMode = (mode: 'chase' | 'docking' | 'cockpit') => {
    setFlightCamMode(mode);
    sound.playClick(950);
    if (!cameraRef.current || !controlsRef.current) return;

    if (mode === 'docking') {
      // Front Docking Port looking straight forward towards the target debris
      cameraRef.current.position.set(0, 0.45, 1.2);
      controlsRef.current.target.set(0, 0.8, -4.5);
    } else if (mode === 'cockpit') {
      // Inside Cockpit looking past the glowing MFD screens out the pilot windshield
      cameraRef.current.position.set(0, -0.05, 2.3);
      controlsRef.current.target.set(0, 0.8, -4.5);
    } else {
      // Standard Chase Orbit View
      cameraRef.current.position.set(0, 1.8, 8.5);
      controlsRef.current.target.set(0, 0.4, 0);
    }
    controlsRef.current.update();
  };

  return (
    <div className="relative w-full h-[calc(100vh-48px)] mt-12 bg-slate-950 overflow-hidden select-none">
      {/* 3D WebGL Canvas */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Right: Zen Mode / Camera Switcher */}
      <div className="absolute top-4 right-4 z-20 pointer-events-auto flex items-center gap-2">
        <button
          onClick={() => {
            sound.playClick();
            setHudCollapsed(!hudCollapsed);
          }}
          className="min-h-[44px] px-3.5 py-2 rounded-xl aerospace-panel border-sky-500/30 bg-slate-950/90 text-xs font-mono text-sky-300 hover:text-white flex items-center gap-2 shadow-lg"
          title={hudCollapsed ? 'Дэлгэцийг дэлгэх' : 'Дэлгэцийг хураах (Zen Mode)'}
        >
          {hudCollapsed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          <span className="hidden sm:inline">{hudCollapsed ? (language === 'mn' ? 'Дэлгэх' : 'Show UI') : (language === 'mn' ? 'Хураах' : 'Hide UI')}</span>
        </button>
      </div>

      {/* Top Center: Flight Camera Switcher */}
      {!hudCollapsed && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <div className="aerospace-panel px-3 py-1.5 rounded-full border-sky-500/30 text-xs font-mono bg-slate-950/95 flex items-center gap-1 shadow-xl">
            <Compass className="w-4 h-4 text-sky-400 mr-1 shrink-0" />
            <button
              onClick={() => handleFlightCamMode('chase')}
              className={`min-h-[36px] px-3 py-1 rounded-full text-center transition-colors ${
                flightCamMode === 'chase'
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {language === 'mn' ? 'Гадаад' : 'Chase'}
            </button>
            <button
              onClick={() => handleFlightCamMode('docking')}
              className={`min-h-[36px] px-3 py-1 rounded-full text-center transition-colors ${
                flightCamMode === 'docking'
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {language === 'mn' ? 'Залгалт' : 'Docking'}
            </button>
            <button
              onClick={() => handleFlightCamMode('cockpit')}
              className={`min-h-[36px] px-3 py-1 rounded-full text-center transition-colors ${
                flightCamMode === 'cockpit'
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {language === 'mn' ? 'Бүхээг' : 'Cockpit'}
            </button>
          </div>
        </div>
      )}

      {/* Top Left: Proximity Telemetry HUD */}
      {!hudCollapsed && (
        <div className="absolute top-4 left-4 z-20 pointer-events-none max-w-sm">
          <div className="aerospace-panel p-3.5 rounded-xl border-sky-500/30 bg-slate-950/90 shadow-2xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-[11px] font-mono font-bold text-sky-400 tracking-wider">
                {language === 'mn' ? 'ҮЕ ШАТ 7 // ОЙРЫН ЗАЙН ХАРЬЦАНГУЙ НАВИГАЦИ' : 'STAGE 7 // CLOSE-RANGE RELATIVE NAVIGATION'}
              </span>
            </div>
            <h1 className="text-base font-bold text-white tracking-wide">
              {language === 'mn' ? 'Байрлал ба Хурд Синхрончлох Маневр' : 'Attitude & Velocity Matching'}
            </h1>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 bg-slate-950/80 rounded border border-slate-800">
              <span className="text-slate-400 text-[10px] block">
                {language === 'mn' ? 'ХАРЬЦАНГУЙ ЗАЙ' : 'RELATIVE RANGE'}
              </span>
              <span className="text-sky-300 font-bold text-sm">{distanceM.toFixed(1)} m</span>
              <span className="text-slate-500 text-[10px] block">
                {language === 'mn' ? `Хүрэх зай: ${captureTool.maxDistanceM}м` : `Max Reach: ${captureTool.maxDistanceM}m`}
              </span>
            </div>

            <div className="p-2 bg-slate-950/80 rounded border border-slate-800">
              <span className="text-slate-400 text-[10px] block">
                {language === 'mn' ? 'ОЙРТОХ ХУРД' : 'CLOSURE VELOCITY'}
              </span>
              <span className={`font-bold text-sm ${relativeVelMs > 0.35 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {relativeVelMs.toFixed(2)} m/s
              </span>
              <span className="text-slate-500 text-[10px] block">
                {language === 'mn' ? 'Хязгаар: < 0.25 м/с' : 'Limit: < 0.25 m/s'}
              </span>
            </div>

            <div className="p-2 bg-slate-950/80 rounded border border-slate-800">
              <span className="text-slate-400 text-[10px] block">
                {language === 'mn' ? 'ЭРГЭЛТИЙН СИНХРОН' : 'SPIN MATCH SYNC'}
              </span>
              <span className="text-emerald-400 font-bold text-sm">{alignmentPct}%</span>
              <span className="text-slate-500 text-[10px] block">
                {language === 'mn' ? `Хогны эргэлт: ${target.tumbleRateDegS}°/с` : `Target: ${target.tumbleRateDegS}°/s`}
              </span>
            </div>

            <div className="p-2 bg-slate-950/80 rounded border border-slate-800">
              <span className="text-slate-400 text-[10px] block">
                {language === 'mn' ? 'RCS ТҮЛШ' : 'RCS PROPELLANT'}
              </span>
              <span className="text-white font-bold text-sm">{Math.round(fuelKg)} kg</span>
              <span className="text-slate-500 text-[10px] block">Isp: {missionState.design.rcs.ispSeconds}s</span>
            </div>
          </div>

          {/* Collision Hazard Warning Box */}
          <div
            className={`mt-2.5 p-2 rounded text-[11px] font-mono flex items-center gap-2 border ${
              risk.hazardLevel === 'CRITICAL'
                ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                : risk.hazardLevel === 'CAUTION'
                ? 'bg-amber-950/70 border-amber-500/60 text-amber-300'
                : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
            }`}
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <div className="leading-tight">
              <span className="font-bold">
                {language === 'mn' ? `МӨРГӨЛДӨХ ЭРСДЭЛ: ${risk.riskScore}% (${risk.hazardLevel})` : `COLLISION RISK: ${risk.riskScore}% (${risk.hazardLevel})`}
              </span>
              <span className="block text-[10px] text-slate-300">{risk.recommendation}</span>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Unified Bottom Flight Deck */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[96%] max-w-5xl">
        <div className="aerospace-panel rounded-xl overflow-hidden shadow-2xl border-sky-500/40">
          {/* Manual RCS Thruster Control Console */}
          <div className="p-3 bg-slate-900/95 flex flex-wrap items-center justify-between gap-3 border-b border-sky-500/20 text-xs font-mono">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRcsPulse('forward')}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === 'mn' ? '+X Урагш түлхэх (+0.12 м/с)' : '+X Forward RCS (+0.12 m/s)'}</span>
              </button>

              <button
                onClick={() => handleRcsPulse('brake')}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span>{language === 'mn' ? '-X Тоормослох (-0.18 м/с)' : '-X Retrograde Brake (-0.18 m/s)'}</span>
              </button>

              <button
                onClick={() => handleRcsPulse('sync')}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === 'mn' ? 'Эргэлт синхрончлох (+15%)' : 'Synchronize Spin (+15% Match)'}</span>
              </button>
            </div>

            {/* Autonomous Autopilot Option */}
            <button
              onClick={handleAutopilot}
              className="px-4 py-1.5 rounded bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/50 flex items-center gap-1.5 transition-colors shadow-[0_0_10px_rgba(168,85,247,0.25)]"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span>{language === 'mn' ? 'Автомат Ойртолтын Автопилот Залгах' : 'Engage Autonomous Proximity Autopilot'}</span>
            </button>
          </div>

          {/* Action Bar */}
          <div className="px-4 py-3 bg-slate-950/95 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs font-mono">
              {isInsideCaptureEnvelope ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {language === 'mn'
                    ? `БАРИХ ХОНГИЛ ТҮГЖИГДЛЭЭ // ЗАЙ: ${distanceM.toFixed(1)}м • ХУРД: ${relativeVelMs.toFixed(2)}м/с`
                    : `CAPTURE CORRIDOR LOCKED // DISTANCE: ${distanceM.toFixed(1)}m • VELOCITY: ${relativeVelMs.toFixed(2)}m/s`}
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  {language === 'mn'
                    ? `Барих боломж: хурдыг < 0.25 м/с, зайг < ${captureTool.maxDistanceM}м болгож бууруулна уу.`
                    : `Reduce speed < 0.25 m/s and range < ${captureTool.maxDistanceM}m to enable capture.`}
                </span>
              )}
            </div>

            <button
              disabled={!isInsideCaptureEnvelope}
              onClick={() => {
                sound.playLockChime();
                onUpdateState({
                  relativeDistanceM: distanceM,
                  relativeVelocityMs: relativeVelMs,
                  captureAlignmentPct: alignmentPct,
                  fuelRemainingKg: fuelKg,
                });
                onProceedToCapture();
              }}
              className={`w-full sm:w-auto px-5 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-colors ${
                isInsideCaptureEnvelope
                  ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-[0_0_15px_rgba(56,189,248,0.35)]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <span>{language === 'mn' ? 'ХОГ БАРИХ МЕХАНИЗМЫГ ИДЭВХЖҮҮЛЭХ' : 'INITIATE DEBRIS CAPTURE MECHANISM'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* On-Screen Mobile Virtual Touch Controls */}
      <VirtualTouchControls
        onForward={() => handleRcsPulse('forward')}
        onBrake={() => handleRcsPulse('brake')}
        onSync={() => handleRcsPulse('sync')}
      />
    </div>
  );
};
