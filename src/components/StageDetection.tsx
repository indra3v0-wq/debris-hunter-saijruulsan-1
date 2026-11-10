/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MissionState, MissionTarget, Language } from '../types';
import { MISSIONS, DEBRIS_CATALOG } from '../simulation/data';
import { createNasaEarthMesh, createNasaSpaceEnvironment } from '../three/proceduralEarth';
import { sound } from '../utils/audio';
import { TRANSLATIONS } from '../utils/translations';
import { 
  Radar, 
  Crosshair, 
  ArrowRight, 
  RotateCw, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Compass, 
  Eye, 
  EyeOff, 
  ChevronUp, 
  ChevronDown,
  Sparkles,
  Maximize2
} from 'lucide-react';

interface StageDetectionProps {
  language?: Language;
  missionState: MissionState;
  onSelectTarget?: (target: MissionTarget) => void;
  onProceedToApproach: () => void;
}

export type DebrisCategory = 'defunct_sat' | 'rocket_body' | 'solar_fragment' | 'metal_fragment';

export interface RadarTargetItem {
  id: string;
  nameMn: string;
  nameEn: string;
  category: DebrisCategory;
  altitudeKm: number;
  inclinationDeg: number;
  distanceKm: number;
  relativeVelMs: number;
  tumbleRateDegS: number;
  massKg: number;
  hazardScore: number;
  missionTarget: MissionTarget;
}

export const StageDetection: React.FC<StageDetectionProps> = ({
  language = 'mn',
  missionState,
  onSelectTarget,
  onProceedToApproach,
}) => {
  const t = TRANSLATIONS[language];
  const canvasMountRef = useRef<HTMLDivElement>(null);

  // 4 Target Categories requested by user
  const [selectedCategory, setSelectedCategory] = useState<'all' | DebrisCategory>('all');
  const [hudCollapsed, setHudCollapsed] = useState<boolean>(false);
  const [showRadarScope, setShowRadarScope] = useState<boolean>(true);
  const [showTargetDetails, setShowTargetDetails] = useState<boolean>(true);
  const [radarSweepAngle, setRadarSweepAngle] = useState<number>(0);

  // Convert missions & catalog items into 4 clear categories
  const radarTargets: RadarTargetItem[] = [
    {
      id: 'target_defunct_envisat',
      nameMn: 'Ашиглалтаас гарсан Envisat хиймэл дагуул',
      nameEn: 'Defunct Envisat Observation Satellite',
      category: 'defunct_sat',
      altitudeKm: 785,
      inclinationDeg: 98.5,
      distanceKm: 340,
      relativeVelMs: 8.5,
      tumbleRateDegS: 2.8,
      massKg: 8211,
      hazardScore: 92,
      missionTarget: MISSIONS.find(m => m.id === 'mission_envisat') || MISSIONS[1],
    },
    {
      id: 'target_rocket_sl16',
      nameMn: 'Зенит-2 пуужингийн хуучин шат (SL-16)',
      nameEn: 'Spent Zenit-2 Upper Rocket Stage',
      category: 'rocket_body',
      altitudeKm: 840,
      inclinationDeg: 71.0,
      distanceKm: 510,
      relativeVelMs: 14.2,
      tumbleRateDegS: 4.5,
      massKg: 9000,
      hazardScore: 95,
      missionTarget: MISSIONS.find(m => m.id === 'mission_sl16') || MISSIONS[2],
    },
    {
      id: 'target_solar_array',
      nameMn: 'Нарны зайн хавтангийн том хэлтэрхий',
      nameEn: 'Detached Solar Array Wing Fragment',
      category: 'solar_fragment',
      altitudeKm: 560,
      inclinationDeg: 53.0,
      distanceKm: 180,
      relativeVelMs: 4.2,
      tumbleRateDegS: 6.2,
      massKg: 145,
      hazardScore: 68,
      missionTarget: MISSIONS[0],
    },
    {
      id: 'target_metal_shrapnel',
      nameMn: 'Космос-2251 металл хэлтэрхий',
      nameEn: 'Cosmos-2251 Hypervelocity Metal Shrapnel',
      category: 'metal_fragment',
      altitudeKm: 790,
      inclinationDeg: 74.0,
      distanceKm: 275,
      relativeVelMs: 18.6,
      tumbleRateDegS: 12.0,
      massKg: 38,
      hazardScore: 88,
      missionTarget: MISSIONS.find(m => m.id === 'mission_kestrel') || MISSIONS[0],
    },
    {
      id: 'target_defunct_vanguard',
      nameMn: 'Vanguard-1 эртний хаягдсан хиймэл дагуул',
      nameEn: 'Vanguard-1 Vintage Derelict Satellite',
      category: 'defunct_sat',
      altitudeKm: 650,
      inclinationDeg: 34.2,
      distanceKm: 620,
      relativeVelMs: 9.8,
      tumbleRateDegS: 1.5,
      massKg: 1.5,
      hazardScore: 45,
      missionTarget: MISSIONS[0],
    },
    {
      id: 'target_rocket_cz4',
      nameMn: 'Long March 4 пуужингийн дээд шат',
      nameEn: 'Long March 4 Spent Upper Stage',
      category: 'rocket_body',
      altitudeKm: 865,
      inclinationDeg: 98.6,
      distanceKm: 710,
      relativeVelMs: 16.5,
      tumbleRateDegS: 5.8,
      massKg: 4000,
      hazardScore: 94,
      missionTarget: MISSIONS[2],
    },
  ];

  const [selectedTarget, setSelectedTarget] = useState<RadarTargetItem>(radarTargets[0]);

  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const targetMarkersMap = useRef<Map<string, THREE.Group>>(new Map());

  // Filtered target list
  const filteredTargets = selectedCategory === 'all'
    ? radarTargets
    : radarTargets.filter(t => t.category === selectedCategory);

  // 3D Three.js Earth Scene Initialization
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

    // Warm Sun and deep space lighting
    const sunLight = new THREE.DirectionalLight(0xfff8e7, 3.2);
    sunLight.position.set(20, 12, 18);
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.15);
    scene.add(hemiLight);

    // 1. Realistic NASA 3D Earth with Day/Night Terminator and City Lights
    const earthRadius = 6.371;
    const earthBundle = createNasaEarthMesh(earthRadius, isSoftwareGl);
    earthBundle.setSunDirection(sunLight.position.clone().normalize());
    scene.add(earthBundle.group);

    // 2. NASA Deep Space Skybox & Stars
    const spaceEnv = createNasaSpaceEnvironment(isSoftwareGl);
    scene.add(spaceEnv.group);

    // 3. Orbit Rings & Target Markers Group
    const orbitGroup = new THREE.Group();
    scene.add(orbitGroup);

    const markersMap = new Map<string, THREE.Group>();

    radarTargets.forEach((item, idx) => {
      const r = (6371 + item.altitudeKm) / 1000;
      const incRad = (item.inclinationDeg * Math.PI) / 180;
      const anomRad = (idx * 60 * Math.PI) / 180;

      // Orbit ring line
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= 90; i++) {
        const theta = (i / 90) * Math.PI * 2;
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta) * Math.sin(incRad);
        const z = r * Math.sin(theta) * Math.cos(incRad);
        points.push(new THREE.Vector3(x, y, z));
      }
      const ringGeo = new THREE.BufferGeometry().setFromPoints(points);
      const ringMat = new THREE.LineBasicMaterial({
        color: item.category === 'defunct_sat' ? 0xf59e0b : item.category === 'rocket_body' ? 0xa855f7 : item.category === 'solar_fragment' ? 0x06b6d4 : 0xef4444,
        transparent: true,
        opacity: 0.35,
      });
      const ringLine = new THREE.Line(ringGeo, ringMat);
      orbitGroup.add(ringLine);

      // Debris 3D Marker
      const markerGroup = new THREE.Group();
      const x = r * Math.cos(anomRad);
      const y = r * Math.sin(anomRad) * Math.sin(incRad);
      const z = r * Math.sin(anomRad) * Math.cos(incRad);
      markerGroup.position.set(x, y, z);

      // Core icon sphere
      const mGeo = new THREE.SphereGeometry(0.12, 12, 12);
      const mMat = new THREE.MeshBasicMaterial({
        color: item.category === 'defunct_sat' ? 0xf59e0b : item.category === 'rocket_body' ? 0xa855f7 : item.category === 'solar_fragment' ? 0x06b6d4 : 0xef4444,
      });
      markerGroup.add(new THREE.Mesh(mGeo, mMat));

      // Radar pulsating ring
      const pRingGeo = new THREE.RingGeometry(0.18, 0.24, 16);
      const pRingMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
      });
      const pRing = new THREE.Mesh(pRingGeo, pRingMat);
      markerGroup.add(pRing);

      orbitGroup.add(markerGroup);
      markersMap.set(item.id, markerGroup);
    });

    targetMarkersMap.current = markersMap;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      500
    );
    camera.position.set(0, 4.5, 17);
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
    controls.minDistance = 8;
    controls.maxDistance = 35;
    controlsRef.current = controls;

    let frameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      earthBundle.update(delta);
      spaceEnv.update(delta);
      orbitGroup.rotation.y += delta * 0.015;

      // Update radar sweep rotation
      setRadarSweepAngle(prev => (prev + delta * 90) % 360);

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
      earthBundle.dispose();
      spaceEnv.dispose();
      orbitGroup.clear();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  // When player selects a target, smoothly glide camera towards it
  const handleSelectRadarTarget = (item: RadarTargetItem) => {
    setSelectedTarget(item);
    sound.playClick(1050);
    if (onSelectTarget) {
      onSelectTarget(item.missionTarget);
    }

    const marker = targetMarkersMap.current.get(item.id);
    if (marker && cameraRef.current && controlsRef.current) {
      const targetPos = marker.position.clone();
      controlsRef.current.target.copy(targetPos);
      const camTargetPos = targetPos.clone().add(new THREE.Vector3(1.2, 1.2, 3.5));
      cameraRef.current.position.copy(camTargetPos);
    }
  };

  const getCategoryColor = (cat: DebrisCategory) => {
    switch (cat) {
      case 'defunct_sat': return 'text-amber-400 border-amber-400/40 bg-amber-500/15';
      case 'rocket_body': return 'text-purple-400 border-purple-400/40 bg-purple-500/15';
      case 'solar_fragment': return 'text-cyan-400 border-cyan-400/40 bg-cyan-500/15';
      case 'metal_fragment': return 'text-rose-400 border-rose-400/40 bg-rose-500/15';
    }
  };

  const getCategoryBadgeLabel = (cat: DebrisCategory) => {
    switch (cat) {
      case 'defunct_sat': return language === 'mn' ? 'Хиймэл дагуул' : 'Defunct Sat';
      case 'rocket_body': return language === 'mn' ? 'Пуужингийн шат' : 'Rocket Body';
      case 'solar_fragment': return language === 'mn' ? 'Нарны хавтан' : 'Solar Fragment';
      case 'metal_fragment': return language === 'mn' ? 'Металл хэлтэрхий' : 'Metal Debris';
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-48px)] mt-12 bg-slate-950 overflow-hidden select-none font-sans">
      {/* 3D WebGL Canvas */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left: Radar Station Badge & Mission Header */}
      {!hudCollapsed && (
        <div className="absolute top-4 left-4 z-20 pointer-events-auto max-w-[340px]">
          <div className="aerospace-panel p-3.5 rounded-xl border-sky-500/30 bg-slate-950/90 shadow-2xl">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse"></span>
              <span className="text-xs font-mono font-bold text-sky-400 tracking-wider">
                {language === 'mn' ? 'САНСРЫН ХОГ ИЛРҮҮЛЭХ РАДАР' : 'ORBITAL DEBRIS RADAR'}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-wide">
              {language === 'mn' ? 'Дэлхийн Тойрог Замын Хяналт' : 'Orbital Tracking & Target Acquisition'}
            </h1>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {language === 'mn'
                ? 'Радараар илэрсэн хогнуудаас устгах объектоо сонгож, ойртолт эхлүүлнэ үү.'
                : 'Select an orbital debris target from radar tracking to initiate rendezvous.'}
            </p>
          </div>
        </div>
      )}

      {/* Top Right: Zen Mode / UI Visibility Toggle */}
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

      {/* Center-Left: 2D Sweeping Radar Scope (Authentic Circular Radar Visualizer) */}
      {!hudCollapsed && showRadarScope && (
        <div className="absolute top-28 left-4 z-20 pointer-events-auto hidden md:block">
          <div className="aerospace-panel p-3 rounded-2xl border-emerald-500/40 bg-slate-950/90 shadow-2xl w-56">
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-emerald-500/20 text-xs font-mono">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <Radar className="w-4 h-4 text-emerald-400 animate-spin" />
                <span>{language === 'mn' ? 'РАДАР СҮЛЖЭЭ' : 'RADAR SWEEP'}</span>
              </span>
              <span className="text-[10px] text-slate-400">1000 km</span>
            </div>

            {/* Circular Radar Scope */}
            <div className="relative w-48 h-48 mx-auto rounded-full border-2 border-emerald-500/30 bg-emerald-950/30 overflow-hidden flex items-center justify-center">
              {/* Concentric distance circles */}
              <div className="absolute w-36 h-36 rounded-full border border-emerald-500/20"></div>
              <div className="absolute w-24 h-24 rounded-full border border-emerald-500/20"></div>
              <div className="absolute w-12 h-12 rounded-full border border-emerald-500/20"></div>
              {/* Crosshairs */}
              <div className="absolute w-full h-[1px] bg-emerald-500/20"></div>
              <div className="absolute h-full w-[1px] bg-emerald-500/20"></div>

              {/* Sweeping Beam */}
              <div
                className="absolute inset-0 origin-center pointer-events-none"
                style={{
                  transform: `rotate(${radarSweepAngle}deg)`,
                  background: 'conic-gradient(from 0deg, rgba(16, 185, 129, 0.4) 0deg, rgba(16, 185, 129, 0.0) 45deg, transparent 45deg)',
                }}
              />

              {/* Radar Blips */}
              {radarTargets.map((item, i) => {
                const angleRad = (i * 60 * Math.PI) / 180;
                const distRatio = Math.min(0.85, item.distanceKm / 800);
                const bx = Math.cos(angleRad) * (96 * distRatio);
                const by = Math.sin(angleRad) * (96 * distRatio);
                const isSelected = item.id === selectedTarget.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectRadarTarget(item)}
                    className={`absolute w-3 h-3 rounded-full cursor-pointer transition-transform ${
                      isSelected
                        ? 'bg-white ring-4 ring-emerald-400 scale-125 z-10'
                        : item.category === 'defunct_sat'
                        ? 'bg-amber-400'
                        : item.category === 'rocket_body'
                        ? 'bg-purple-400'
                        : item.category === 'solar_fragment'
                        ? 'bg-cyan-400'
                        : 'bg-rose-400'
                    }`}
                    style={{
                      transform: `translate(${bx}px, ${by}px)`,
                    }}
                    title={language === 'mn' ? item.nameMn : item.nameEn}
                  />
                );
              })}

              {/* Spacecraft Center Blip */}
              <div className="w-2.5 h-2.5 rounded-full bg-sky-400 ring-2 ring-sky-300 z-10" />
            </div>

            <div className="text-[10px] font-mono text-center text-slate-400 mt-2">
              {language === 'mn' ? 'Илэрсэн объект:' : 'Detected Objects:'} <strong className="text-emerald-400">{radarTargets.length}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Top Center: 4 Category Filter Pills */}
      {!hudCollapsed && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto max-w-[95vw] overflow-x-auto scrollbar-none">
          <div className="aerospace-panel p-1.5 rounded-2xl border-sky-500/30 bg-slate-950/95 flex items-center gap-1 text-xs font-mono shadow-xl">
            <button
              onClick={() => {
                sound.playClick();
                setSelectedCategory('all');
              }}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-sky-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {language === 'mn' ? 'Бүх Хог' : 'All Debris'}
            </button>

            {[
              { id: 'defunct_sat', labelMn: 'Хиймэл Дагуул', labelEn: 'Defunct Sat' },
              { id: 'rocket_body', labelMn: 'Пуужингийн Шат', labelEn: 'Rocket Body' },
              { id: 'solar_fragment', labelMn: 'Нарны Хавтан', labelEn: 'Solar Fragment' },
              { id: 'metal_fragment', labelMn: 'Металл Хэлтэрхий', labelEn: 'Metal Shrapnel' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  sound.playClick();
                  setSelectedCategory(cat.id as DebrisCategory);
                }}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-sky-500 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {language === 'mn' ? cat.labelMn : cat.labelEn}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Unified Bottom Target Selector & Action Dock */}
      {!hudCollapsed && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[96%] max-w-5xl pointer-events-auto">
          <div className="aerospace-panel rounded-2xl overflow-hidden shadow-2xl border-sky-500/40 bg-slate-950/95">
            {/* Target Cards Horizontal Carousel */}
            <div className="p-3 bg-slate-900/95 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 border-b border-sky-500/20 max-h-56 overflow-y-auto">
              {filteredTargets.map(item => {
                const isSelected = item.id === selectedTarget.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectRadarTarget(item)}
                    className={`min-h-[56px] p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-sky-500/20 border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.3)] ring-1 ring-sky-400'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${getCategoryColor(item.category)}`}>
                        {getCategoryBadgeLabel(item.category)}
                      </span>
                      <span className="text-xs font-mono text-sky-300 font-bold">
                        {item.distanceKm} km
                      </span>
                    </div>

                    <h3 className="font-bold text-xs sm:text-sm text-white line-clamp-1 mb-1">
                      {language === 'mn' ? item.nameMn : item.nameEn}
                    </h3>

                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>{language === 'mn' ? 'Өндөр:' : 'Alt:'} <strong className="text-slate-200">{item.altitudeKm} km</strong></span>
                      <span>{language === 'mn' ? 'Эргэлт:' : 'Spin:'} <strong className="text-amber-300">{item.tumbleRateDegS}°/s</strong></span>
                      <span>{language === 'mn' ? 'Масс:' : 'Mass:'} <strong className="text-slate-200">{item.massKg} kg</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Target Action Bar */}
            <div className="px-4 py-3 bg-slate-950/95 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs sm:text-sm font-mono text-center sm:text-left">
                <span className="text-slate-400">{language === 'mn' ? 'Сонгосон объект:' : 'Selected Target:'} </span>
                <strong className="text-white font-bold">{language === 'mn' ? selectedTarget.nameMn : selectedTarget.nameEn}</strong>
                <span className="text-slate-400 hidden md:inline"> (Зай: <strong className="text-sky-300">{selectedTarget.distanceKm} km</strong> | Хурд: <strong className="text-emerald-400">{selectedTarget.relativeVelMs} m/s</strong>)</span>
              </div>

              <button
                onClick={() => {
                  sound.playLockChime();
                  if (onSelectTarget) {
                    onSelectTarget(selectedTarget.missionTarget);
                  }
                  onProceedToApproach();
                }}
                className="w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(56,189,248,0.4)] active:scale-95"
              >
                <span>{language === 'mn' ? 'ЗОРИЛТОТ ОБЪЕКТ РУУ ОЙРТОХ' : 'PROCEED TO PROXIMITY APPROACH'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
