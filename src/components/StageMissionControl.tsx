/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MissionTarget, MissionState, Language, DebrisCatalogItem } from '../types';
import { MISSIONS, DEBRIS_CATALOG } from '../simulation/data';
import { createProceduralEarthScene, updateOrbitRings, OrbitalLayerFilter } from '../three/proceduralEarth';
import { sound } from '../utils/audio';
import { TRANSLATIONS } from '../utils/translations';
import { 
  AlertTriangle, 
  Orbit, 
  Layers, 
  ArrowRight,
  Eye,
  Sliders,
  Sparkles,
  Info,
  CheckCircle2,
  Video,
  Clock,
  Sun,
  Moon,
  Globe,
  Radio,
  Filter,
  RefreshCw,
  X,
  Compass,
  Maximize2,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface StageMissionControlProps {
  language: Language;
  missionState: MissionState;
  onSelectMission: (mission: MissionTarget) => void;
  onProceedToRocketLab: () => void;
}

type ViewMode = 'radar' | 'sat_cam';
type SatCamAngle = 'nadir' | 'horizon' | 'forward';

export const StageMissionControl: React.FC<StageMissionControlProps> = ({
  language,
  missionState,
  onSelectMission,
  onProceedToRocketLab,
}) => {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const [hudCollapsed, setHudCollapsed] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [activeTab, setActiveTab] = useState<'missions' | 'catalog'>('missions');
  const [viewMode, setViewMode] = useState<ViewMode>('radar');
  const [satCamAngle, setSatCamAngle] = useState<SatCamAngle>('nadir');
  const [selectedDebris, setSelectedDebris] = useState<DebrisCatalogItem>(DEBRIS_CATALOG[0]);
  const [liveCamSat, setLiveCamSat] = useState<DebrisCatalogItem>(DEBRIS_CATALOG[0]); // Defaults to ISS

  // Real-Time Clock State
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isLiveClock, setIsLiveClock] = useState<boolean>(true);
  const [manualScrubHour, setManualScrubHour] = useState<number>(12); // 0 - 24 hours

  // Orbital Layer Filters
  const [layerFilter, setLayerFilter] = useState<OrbitalLayerFilter>({
    active: true,
    defunct: true,
    rocketBodies: true,
    fragments: true,
    altShell: 'all',
  });

  // Live Sat Telemetry Display
  const [liveTelemetry, setLiveTelemetry] = useState<{
    latDeg: number;
    lonDeg: number;
    altKm: number;
    velKms: number;
    isDaylight: boolean;
  }>({
    latDeg: 51.6,
    lonDeg: 106.9,
    altKm: 420,
    velKms: 7.66,
    isDaylight: true,
  });

  const earthSceneRef = useRef<ReturnType<typeof createProceduralEarthScene> | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);

  const t = TRANSLATIONS[language];
  const selected = missionState.selectedMission;

  // Real-time ticking clock (HH:MM:SS)
  useEffect(() => {
    const timer = setInterval(() => {
      if (isLiveClock) {
        setCurrentTime(new Date());
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isLiveClock]);

  // Photorealistic cinematic Sun & Earth sync (does not force UTC darkness)
  useEffect(() => {
    if (!earthSceneRef.current || !sunLightRef.current) return;
    const sunPos = new THREE.Vector3(22, 10, 18);
    sunLightRef.current.position.copy(sunPos);
    earthSceneRef.current.setSunDirection(sunPos.clone().normalize());
  }, []);

  // Sync Layer Filters
  useEffect(() => {
    if (!earthSceneRef.current) return;
    earthSceneRef.current.setLayerFilter(layerFilter);
  }, [layerFilter]);

  // Initialize Three.js Scene
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

    // Warm Sun Directional Light (Photorealistic Space Key Light)
    const sunLight = new THREE.DirectionalLight(0xfff8e7, 3.4);
    sunLight.position.set(22, 10, 18);
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // Subtle cosmic fill (preserves deep black space and sparkling city lights)
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.1);
    scene.add(hemiLight);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 18);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 7.5;
    controls.maxDistance = 55;
    controlsRef.current = controls;

    const earthScene = createProceduralEarthScene(isSoftwareGl);
    earthScene.earthMesh.rotation.y = -Math.PI / 4;
    earthScene.setSunDirection(sunLight.position.clone().normalize());
    scene.add(earthScene.group);
    earthSceneRef.current = earthScene;

    // 3D Raycasting for Clicking Satellites / Debris
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (e: MouseEvent) => {
      if (!container || !earthSceneRef.current) return;
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const inspectables = earthSceneRef.current.getInspectableObjects();
      const intersects = raycaster.intersectObjects(inspectables, true);

      if (intersects.length > 0) {
        let cur: THREE.Object3D | null = intersects[0].object;
        while (cur) {
          if (cur.userData && cur.userData.catalogItem) {
            const item = cur.userData.catalogItem as DebrisCatalogItem;
            setSelectedDebris(item);
            setLiveCamSat(item);
            sound.playClick(1050);
            break;
          }
          cur = cur.parent;
        }
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('click', handleCanvasClick);

    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();
      earthScene.update(delta);

      // SATELLITE LIVE CAM MODE LOGIC
      if (viewMode === 'sat_cam' && liveCamSat) {
        const telem = earthScene.getSatelliteTelemetry(liveCamSat.id, elapsed);
        setLiveTelemetry({
          latDeg: telem.latDeg,
          lonDeg: telem.lonDeg,
          altKm: telem.altKm,
          velKms: telem.orbitalVelocityKms,
          isDaylight: telem.isDaylight,
        });

        // Position camera right at satellite altitude
        if (satCamAngle === 'nadir') {
          // Look straight down at Earth
          camera.position.copy(telem.pos).multiplyScalar(1.01);
          controls.target.set(0, 0, 0);
        } else if (satCamAngle === 'horizon') {
          // Look along the Earth's curvature / horizon
          camera.position.copy(telem.pos);
          const horizonTarget = telem.pos.clone().add(telem.forward.clone().multiplyScalar(4)).normalize().multiplyScalar(6.371);
          controls.target.copy(horizonTarget);
        } else {
          // Look forward along velocity vector
          camera.position.copy(telem.pos);
          controls.target.copy(telem.pos.clone().add(telem.forward.clone().multiplyScalar(10)));
        }
      } else {
        controls.update();
      }

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
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      domElement.removeEventListener('click', handleCanvasClick);
      controls.dispose();
      earthScene.dispose();
      sunLight.dispose();
      hemiLight.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [viewMode, satCamAngle, liveCamSat]);

  // Format UTC and UBT (UTC+8) Clock strings
  const formatTimeStr = (d: Date, offsetHours = 0) => {
    const utcMs = d.getTime() + d.getTimezoneOffset() * 60000;
    const targetDate = new Date(utcMs + offsetHours * 3600000);
    const hh = String(targetDate.getHours()).padStart(2, '0');
    const mm = String(targetDate.getMinutes()).padStart(2, '0');
    const ss = String(targetDate.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  };

  const ubtTimeStr = formatTimeStr(currentTime, 8); // Ulaanbaatar is UTC+8
  const utcTimeStr = formatTimeStr(currentTime, 0);

  return (
    <div className="relative w-full h-[calc(100vh-48px)] mt-12 bg-slate-950 overflow-hidden select-none">
      {/* 3D WebGL Canvas Viewport */}
      <div 
        ref={canvasMountRef} 
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-none" 
      />

      {/* Top Left: Main Stage HUD & Real-Time Day/Night Sun Terminator Clock */}
      <div className="absolute top-3 left-3 z-20 pointer-events-auto max-w-sm flex flex-col gap-2">
        <button
          onClick={() => {
            sound.playClick();
            setHudCollapsed(!hudCollapsed);
          }}
          className="min-h-[44px] px-3.5 py-2 rounded-xl aerospace-panel border-sky-500/30 bg-slate-950/90 text-xs font-mono text-sky-300 hover:text-white flex items-center gap-2 shadow-lg w-fit"
          title="Toggle HUD / Zen Mode"
        >
          <Eye className="w-4 h-4 text-sky-400" />
          <span>{hudCollapsed ? (language === 'mn' ? 'ИНТЕРФЭЙС НЭЭХ' : 'SHOW HUD') : (language === 'mn' ? 'ЗЕН ГОРИМ' : 'ZEN MODE')}</span>
        </button>

        {!hudCollapsed && (
          <div className="aerospace-panel p-3.5 rounded-xl border-sky-500/30 shadow-2xl backdrop-blur-md bg-slate-950/90 animate-in fade-in duration-200">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] font-mono font-bold text-sky-400 tracking-wider">
                {language === 'mn' ? 'ҮЕ ШАТ 1 // ТОЙРОГ ЗАМ & ШУУД ХЯНАЛТ' : 'STAGE 1 // ORBITAL MONITORING & SAT CAM'}
              </span>
            </div>
            {isLiveClock ? (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
                LIVE
              </span>
            ) : (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                SIMULATED
              </span>
            )}
          </div>

          {/* Running Clock Displays (Ulaanbaatar UTC+8 and Global UTC) */}
          <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 space-y-1.5 font-mono text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-[10px] flex items-center gap-1">
                <Clock className="w-3 h-3 text-sky-400" />
                {language === 'mn' ? 'УЛААНБААТАР (UTC+8):' : 'ULAANBAATAR (UTC+8):'}
              </span>
              <strong className="text-white text-sm tracking-wider font-bold">{ubtTimeStr}</strong>
            </div>

            <div className="flex justify-between items-center text-[10px]">
              <span className="text-slate-500">UNIVERSAL (UTC):</span>
              <span className="text-sky-300 font-bold tracking-wider">{utcTimeStr}</span>
            </div>

            {/* Day / Night Terminator Status */}
            <div className="flex justify-between items-center pt-1.5 border-t border-slate-800 text-[10px]">
              <span className="text-slate-400 flex items-center gap-1">
                {liveTelemetry.isDaylight ? (
                  <Sun className="w-3 h-3 text-amber-400" />
                ) : (
                  <Moon className="w-3 h-3 text-sky-300" />
                )}
                {language === 'mn' ? 'НАРНЫ ГЭРЭЛТҮҮЛЭГ:' : 'SOLAR TERMINATOR:'}
              </span>
              <span className={`font-bold ${liveTelemetry.isDaylight ? 'text-amber-400' : 'text-sky-300'}`}>
                {liveTelemetry.isDaylight 
                  ? (language === 'mn' ? '☀️ ӨДӨР (Нарны Гялбаа)' : '☀️ DAY (Sun-Glint)')
                  : (language === 'mn' ? '🌙 ШӨНӨ (Хотын Гэрлүүд)' : '🌙 NIGHT (City Lights)')}
              </span>
            </div>
          </div>

          {/* Time Scrubber (Allowing users to scrub 24 hours to see day/night sweep) */}
          <div className="mt-2.5 pt-2 border-t border-slate-800 space-y-1 text-[10px] font-mono">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">
                {language === 'mn' ? '24 Цагийн Нарны Шилжилт:' : '24h Terminator Scrub:'}
              </span>
              <button
                onClick={() => {
                  sound.playClick();
                  setIsLiveClock(!isLiveClock);
                }}
                className={`px-2 py-0.5 rounded text-[9px] font-bold transition-colors ${
                  isLiveClock
                    ? 'bg-sky-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isLiveClock ? (language === 'mn' ? 'ШУУД ЦАГТ БАЙНА' : 'LOCKED TO LIVE') : (language === 'mn' ? 'ГАРЫН ТОХИРГОО' : 'MANUAL SCRUB')}
              </button>
            </div>

            <input
              type="range"
              min="0"
              max="24"
              step="0.1"
              value={isLiveClock ? (currentTime.getUTCHours() + currentTime.getUTCMinutes() / 60) : manualScrubHour}
              disabled={isLiveClock}
              onChange={(e) => {
                setManualScrubHour(Number(e.target.value));
              }}
              className="w-full accent-sky-400 cursor-pointer h-5 disabled:opacity-40"
            />
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>00:00 UTC</span>
              <span>12:00 (Үд дунд)</span>
              <span>24:00 UTC</span>
            </div>
          </div>
        </div>
      )}
    </div>

      {/* Top Center: View Mode Toggle (Radar vs Live Satellite Cam) */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-2 p-1.5 bg-slate-950/90 rounded-xl border border-sky-500/30 backdrop-blur-md shadow-2xl">
        <button
          onClick={() => {
            sound.playClick();
            setViewMode('radar');
            if (controlsRef.current && cameraRef.current) {
              cameraRef.current.position.set(0, 5, 18);
              controlsRef.current.target.set(0, 0, 0);
            }
          }}
          className={`min-h-[44px] px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all border ${
            viewMode === 'radar'
              ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.35)]'
              : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>{language === 'mn' ? '1. ТОЙРОГ ЗАМЫН РАДАР' : '1. ORBITAL RADAR'}</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setViewMode('sat_cam');
          }}
          className={`min-h-[44px] px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all border ${
            viewMode === 'sat_cam'
              ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
              : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>{language === 'mn' ? '2. ХИЙМЭЛ ДАГУУЛЫН ШУУД КАМЕР' : '2. SATELLITE LIVE CAM'}</span>
        </button>

      </div>

      {/* Top Right: Categorized Orbital Layers Filter Bar & NASA ODPO 36,500 Census */}
      {!hudCollapsed && (
        <div className="absolute top-3 right-3 z-20 pointer-events-auto flex flex-col items-end gap-2 max-w-sm">
          <button
            onClick={() => {
              sound.playClick();
              setShowFilterPanel(!showFilterPanel);
            }}
            className="min-h-[44px] px-3.5 py-2 rounded-xl aerospace-panel border-sky-500/30 bg-slate-950/90 text-xs font-mono text-sky-300 hover:text-white flex items-center gap-2 shadow-lg"
            title="Toggle Orbital Layer Filters"
          >
            <Filter className="w-4 h-4 text-sky-400" />
            <span>{language === 'mn' ? 'ХОГНЫ ДАВХАРГА (36,500)' : 'ORBITAL LAYERS (36.5k)'}</span>
            {showFilterPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* Layer Filter Accordion */}
          {showFilterPanel && (
            <div className="aerospace-panel p-2.5 rounded-xl border-sky-500/30 bg-slate-950/95 font-mono text-[11px] shadow-2xl backdrop-blur-md w-80 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-sky-500/20 pb-1.5 mb-2">
                <span className="text-sky-400 font-bold flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" />
                  {language === 'mn' ? 'NASA СУДАЛГАА: 36,500 БИЕТ' : 'NASA ODPO: 36,500 OBJECTS'}
                </span>
                <span className="text-emerald-400 font-bold text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40">
                  {language === 'mn' ? '100% БҮРЭН' : 'TRACKED'}
                </span>
              </div>

              <div className="mb-2 text-[10px] text-slate-400 leading-tight">
                {language === 'mn'
                  ? 'NASA & ESA судалгаагаар 10см-ээс дээш 36,500 биет бүртгэгдсэн бөгөөд дэлхийн тойрог замыг бүрэн бүрхэж байна:'
                  : 'NASA ODPO & ESA track 36,500 objects (>10 cm) in Earth orbit, forming high-density collision shells:'}
              </div>

              {/* Category Filter Toggles with Exact Counts from NASA ODPO */}
              <div className="space-y-1.5">
                {/* 1. Active Satellites (10,000) */}
                <button
                  onClick={() => {
                    sound.playClick();
                    setLayerFilter({ ...layerFilter, active: !layerFilter.active });
                  }}
                  className={`w-full min-h-[36px] px-2.5 py-1.5 rounded flex items-center justify-between text-left transition-colors border ${
                    layerFilter.active
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-500 opacity-60'
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0"></span>
                    <span className="truncate">{language === 'mn' ? 'Идэвхтэй Дагуулууд' : 'Active Satellites'}</span>
                  </span>
                  <span className="text-[10px] font-mono shrink-0 ml-1">
                    <strong>10,000</strong> ({layerFilter.active ? 'ON' : 'OFF'})
                  </span>
                </button>

                {/* 2. Defunct Satellites (3,500) */}
                <button
                  onClick={() => {
                    sound.playClick();
                    setLayerFilter({ ...layerFilter, defunct: !layerFilter.defunct });
                  }}
                  className={`w-full min-h-[36px] px-2.5 py-1.5 rounded flex items-center justify-between text-left transition-colors border ${
                    layerFilter.defunct
                      ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-500 opacity-60'
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></span>
                    <span className="truncate">{language === 'mn' ? 'Ашиглалтгүй Дагуулууд' : 'Defunct Satellites'}</span>
                  </span>
                  <span className="text-[10px] font-mono shrink-0 ml-1">
                    <strong>3,500</strong> ({layerFilter.defunct ? 'ON' : 'OFF'})
                  </span>
                </button>

                {/* 3. Spent Rocket Bodies (2,200) */}
                <button
                  onClick={() => {
                    sound.playClick();
                    setLayerFilter({ ...layerFilter, rocketBodies: !layerFilter.rocketBodies });
                  }}
                  className={`w-full min-h-[36px] px-2.5 py-1.5 rounded flex items-center justify-between text-left transition-colors border ${
                    layerFilter.rocketBodies
                      ? 'bg-purple-950/40 border-purple-500/50 text-purple-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-500 opacity-60'
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shrink-0"></span>
                    <span className="truncate">{language === 'mn' ? 'Пуужингийн Шатлалууд' : 'Spent Rocket Bodies'}</span>
                  </span>
                  <span className="text-[10px] font-mono shrink-0 ml-1">
                    <strong>2,200</strong> ({layerFilter.rocketBodies ? 'ON' : 'OFF'})
                  </span>
                </button>

                {/* 4. Lethal Collision Fragments (20,800) */}
                <button
                  onClick={() => {
                    sound.playClick();
                    setLayerFilter({ ...layerFilter, fragments: !layerFilter.fragments });
                  }}
                  className={`w-full min-h-[36px] px-2.5 py-1.5 rounded flex items-center justify-between text-left transition-colors border ${
                    layerFilter.fragments
                      ? 'bg-rose-950/40 border-rose-500/50 text-rose-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-500 opacity-60'
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0"></span>
                    <span className="truncate">{language === 'mn' ? 'Мөргөлдөөний Хэлтэрхий' : 'Debris Fragments'}</span>
                  </span>
                  <span className="text-[10px] font-mono shrink-0 ml-1">
                    <strong>20,800</strong> ({layerFilter.fragments ? 'ON' : 'OFF'})
                  </span>
                </button>
              </div>

              {/* Additional NASA ODPO Statistics Footer */}
              <div className="mt-2 pt-1.5 border-t border-slate-800 text-[9px] text-slate-400 space-y-0.5">
                <div className="flex justify-between text-slate-300 font-bold">
                  <span>НИЙТ БҮРТГЭГДСЭН:</span>
                  <span className="text-sky-400">36,500 (&gt;10 см)</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[8.5px]">
                  <span>Илрээгүй 1-10 см:</span>
                  <span>~1,000,000 биет</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[8.5px]">
                  <span>Бичил хэлтэрхий &lt;1 см:</span>
                  <span>130+ сая ширхэг</span>
                </div>
              </div>

              {/* Altitude Shell Filter */}
              <div className="mt-2 pt-1.5 border-t border-slate-800">
                <span className="text-slate-400 text-[10px] block mb-1">
                  {language === 'mn' ? 'Өндрийн Бүсээр Шүүх:' : 'Altitude Orbit Shell:'}
                </span>
                <div className="grid grid-cols-4 gap-1 text-[9px] text-center">
                  {[
                    { id: 'all', label: 'ALL (36.5k)' },
                    { id: 'leo', label: 'LEO (32.6k)' },
                    { id: 'meo', label: 'MEO (1.9k)' },
                    { id: 'geo', label: 'GEO (1.9k)' },
                  ].map(shell => (
                    <button
                      key={shell.id}
                      onClick={() => {
                        sound.playClick();
                        setLayerFilter({ ...layerFilter, altShell: shell.id as any });
                      }}
                      className={`py-1 rounded font-bold transition-colors ${
                        layerFilter.altShell === shell.id
                          ? 'bg-sky-500 text-slate-950 shadow-[0_0_8px_rgba(56,189,248,0.4)]'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {shell.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        {/* Satellite Live Cam View Angles (Visible only in sat_cam mode) */}
        {viewMode === 'sat_cam' && (
          <div className="aerospace-panel p-2.5 rounded-xl border-emerald-500/40 bg-slate-950/95 font-mono text-[11px] shadow-2xl backdrop-blur-md w-72 animate-in fade-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between mb-1.5 border-b border-emerald-500/20 pb-1">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Compass className="w-3.5 h-3.5" />
                {language === 'mn' ? 'КАМЕРЫН ӨНЦӨГ' : 'SAT CAM ANGLE'}
              </span>
              <span className="text-[10px] text-white font-bold">{liveCamSat.nameMn.split(' ')[0]}</span>
            </div>

            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'nadir', labelMn: 'Эгц Доош', labelEn: 'Nadir' },
                { id: 'horizon', labelMn: 'Хаяа', labelEn: 'Horizon' },
                { id: 'forward', labelMn: 'Урагш', labelEn: 'Forward' },
              ].map(ang => (
                <button
                  key={ang.id}
                  onClick={() => {
                    sound.playClick();
                    setSatCamAngle(ang.id as SatCamAngle);
                  }}
                  className={`min-h-[36px] py-1 px-1 rounded text-[10px] font-bold transition-all border ${
                    satCamAngle === ang.id
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.35)]'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {language === 'mn' ? ang.labelMn : ang.labelEn}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )}

      {/* SATELLITE LIVE CAM HUD OVERLAY (When in sat_cam mode) */}
      {viewMode === 'sat_cam' && (
        <div className="absolute inset-0 pointer-events-none z-10">
          {/* Live Stream Red Recording Badge */}
          <div className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 bg-rose-950/80 border border-rose-500/50 rounded-full font-mono text-xs text-rose-300 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span className="font-bold">● LIVE SATELLITE EARTH VIEW // {liveCamSat.name}</span>
          </div>

          {/* NASA HD Crosshairs in center */}
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <div className="w-36 h-36 border border-sky-400/40 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-sky-400 rounded-full"></div>
            </div>
          </div>

          {/* Live Flight Telemetry Box (Bottom Left) */}
          <div className="absolute bottom-24 left-4 font-mono text-xs text-sky-300 bg-slate-950/80 p-2.5 rounded-lg border border-sky-500/30 backdrop-blur-md space-y-1">
            <div>LAT: <strong>{liveTelemetry.latDeg}° {liveTelemetry.latDeg >= 0 ? 'N' : 'S'}</strong> | LON: <strong>{liveTelemetry.lonDeg}° {liveTelemetry.lonDeg >= 0 ? 'E' : 'W'}</strong></div>
            <div>ALTITUDE: <strong className="text-white">{liveTelemetry.altKm} km</strong> | VELOCITY: <strong className="text-emerald-400">{liveTelemetry.velKms} km/s</strong></div>
            <div>SOLAR ZONE: <strong className={liveTelemetry.isDaylight ? 'text-amber-300' : 'text-sky-300'}>{liveTelemetry.isDaylight ? 'DAYLIGHT (SUN-LIT CONTINENTS)' : 'NIGHT (METROPOLITAN CITY LIGHTS)'}</strong></div>
          </div>
        </div>
      )}

      {/* Unified Bottom Control Dock */}
      <div
        className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-[96%] max-w-5xl transition-transform duration-300 ${
          hudCollapsed ? 'translate-y-[calc(100%-2.25rem)]' : 'translate-y-0'
        }`}
      >
        <div className="aerospace-panel rounded-xl overflow-hidden shadow-2xl border-sky-500/40 backdrop-blur-md">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 bg-slate-950/90 border-b border-sky-500/20 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <div className="flex gap-1.5">
                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('missions');
                  }}
                  className={`min-h-[36px] px-3 py-1 rounded text-[11px] font-bold transition-colors ${
                    activeTab === 'missions'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-400/50'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {language === 'mn' ? '1. Даалгаврын Сан (8 Төрөл)' : '1. Mission Library (8)'}
                </button>
                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('catalog');
                  }}
                  className={`min-h-[36px] px-3 py-1 rounded text-[11px] font-bold transition-colors ${
                    activeTab === 'catalog'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {language === 'mn' ? '2. Каталог & Хиймэл Дагуулууд' : '2. Satellites & Debris Catalog'}
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                setHudCollapsed(!hudCollapsed);
              }}
              className="hover:text-white px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-700 text-[11px] transition-colors"
            >
              {hudCollapsed ? '▴ Expand Panel' : '▾ Collapse Viewport'}
            </button>
          </div>

          {/* MISSIONS VIEW */}
          {activeTab === 'missions' && (
            <div className="p-2.5 sm:p-3 grid grid-cols-1 md:grid-cols-4 gap-2 bg-slate-900/95 max-h-56 overflow-y-auto">
              {MISSIONS.map(m => {
                const isSelected = m.id === selected.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      sound.playClick(1100);
                      onSelectMission(m);
                    }}
                    className={`min-h-[50px] p-2.5 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-sky-500/15 border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-800 text-sky-300 font-bold">
                          {m.code}
                        </span>
                        <span
                          className={`text-[9px] font-mono font-bold ${
                            m.hazardScore >= 85 ? 'text-rose-400' : 'text-amber-400'
                          }`}
                        >
                          {m.difficulty}
                        </span>
                      </div>

                      <h3 className="text-xs font-bold text-white line-clamp-1 mb-1">
                        {language === 'mn' ? m.nameMn : m.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                        {language === 'mn' ? m.storyMn : m.storyEn}
                      </p>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-emerald-400 font-bold">${m.rewardBudgetM}M</span>
                      <span className="text-slate-400">{m.altitudeKm} km // {m.massKg} kg</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* SATELLITES & DEBRIS CATALOG VIEW */}
          {activeTab === 'catalog' && (
            <div className="p-2.5 sm:p-3 grid grid-cols-1 md:grid-cols-3 gap-2.5 bg-slate-900/95 max-h-56 overflow-y-auto">
              {DEBRIS_CATALOG.map(item => {
                const isSelected = item.id === selectedDebris.id;
                const catColor = item.category === 'active_sat' 
                  ? 'border-emerald-500/50 text-emerald-300' 
                  : item.category === 'defunct_sat'
                  ? 'border-amber-500/50 text-amber-300'
                  : item.category === 'rocket_body'
                  ? 'border-purple-500/50 text-purple-300'
                  : 'border-rose-500/50 text-rose-300';

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      sound.playClick();
                      setSelectedDebris(item);
                      setLiveCamSat(item);
                    }}
                    className={`min-h-[50px] p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-sky-500/20 border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 border ${catColor}`}>
                        {item.category === 'active_sat' ? '🟢 ACTIVE SAT' : item.category === 'defunct_sat' ? '🟡 DEFUNCT' : item.category === 'rocket_body' ? '🟣 ROCKET BODY' : '🔴 FRAGMENT'}
                      </span>
                      <span className="text-[10px] font-mono text-white font-bold">{item.altitudeKm} km</span>
                    </div>
                    <div className="font-bold text-xs text-white mb-0.5 truncate">
                      {language === 'mn' ? item.nameMn : item.name}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mb-1">
                      {item.catalogNumber} • {item.orbitalVelocityKms} km/s
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2">
                      {language === 'mn' ? item.descriptionMn : item.descriptionEn}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Active Target Action Bar with min 44px buttons */}
          <div className="px-3 sm:px-4 py-2.5 bg-slate-950/95 border-t border-sky-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs">
              <span className="text-slate-400 font-mono">
                {language === 'mn' ? 'СОНГОГДСОН БИЕТ:' : 'SELECTED OBJECT:'}{' '}
              </span>
              <strong className="text-white">
                {language === 'mn' ? selectedDebris.nameMn : selectedDebris.name}
              </strong>
              <span className="text-sky-400 font-mono ml-2 text-[11px]">
                ({selectedDebris.massKg.toLocaleString()} kg • {selectedDebris.altitudeKm} km)
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  sound.playClick();
                  setLiveCamSat(selectedDebris);
                  setViewMode('sat_cam');
                }}
                className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-[0_0_12px_rgba(16,185,129,0.35)]"
              >
                <Video className="w-4 h-4" />
                <span>{language === 'mn' ? 'ЭНЭ ДАГУУЛЫН КАМЕРТ ОРОХ' : 'VIEW FROM THIS SATELLITE'}</span>
              </button>

              <button
                onClick={() => {
                  sound.playLockChime();
                  onProceedToRocketLab();
                }}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-[0_0_15px_rgba(56,189,248,0.35)]"
              >
                <span>{language === 'mn' ? 'ПУУЖИН УГСРАЛТ РУУ ОРОХ' : 'PROCEED TO ROCKET LAB'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
