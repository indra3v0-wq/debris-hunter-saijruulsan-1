/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RocketConfig, CalculatedRocketSpecs, Language, CalculatedSpecs } from '../types';
import { ROCKET_ENGINES, ROCKET_TANKS, ROCKET_FAIRINGS } from '../simulation/data';
import { buildModularRocket, RocketPartInfo } from '../three/rocketBuilder';
import { sound } from '../utils/audio';
import { TRANSLATIONS } from '../utils/translations';
import { 
  Rocket, 
  Flame, 
  Layers, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Camera,
  RotateCw,
  Info,
  X,
  Maximize2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface StageRocketLabProps {
  language: Language;
  rocketConfig: RocketConfig;
  rocketSpecs: CalculatedRocketSpecs;
  spacecraftSpecs: CalculatedSpecs;
  budgetM: number;
  onUpdateRocketConfig: (newConfig: RocketConfig) => void;
  onProceedToSpacecraft: () => void;
  onProceedToLaunch?: () => void;
}

type RocketTab = 'engine' | 'tank' | 'fairing' | 'boosters' | 'fuel';
type CameraPreset = 'overview' | 'fairing' | 'interstage' | 'fuselage' | 'engine' | 'exploded';

export const StageRocketLab: React.FC<StageRocketLabProps> = ({
  language,
  rocketConfig,
  rocketSpecs,
  spacecraftSpecs,
  budgetM,
  onUpdateRocketConfig,
  onProceedToSpacecraft,
  onProceedToLaunch,
}) => {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<RocketTab>('engine');
  const [explodedView, setExplodedView] = useState<number>(0);
  const [activeCamPreset, setActiveCamPreset] = useState<CameraPreset>('overview');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [selectedPart, setSelectedPart] = useState<RocketPartInfo | null>(null);
  const [isTelemetryCollapsed, setIsTelemetryCollapsed] = useState<boolean>(false);

  const modelRef = useRef<ReturnType<typeof buildModularRocket> | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const targetCamPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 6, 16));
  const targetLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 4.5, 0));

  const t = TRANSLATIONS[language];

  // Camera presets coordinates
  const CAM_PRESETS: Record<CameraPreset, { pos: [number, number, number]; target: [number, number, number] }> = {
    overview: { pos: [0, 6, 17], target: [0, 4.8, 0] },
    fairing: { pos: [0, 11.2, 7.5], target: [0, 11.0, 0] },
    interstage: { pos: [0, 8.4, 6.5], target: [0, 8.0, 0] },
    fuselage: { pos: [4.2, 5.0, 7.0], target: [0, 4.8, 0] },
    engine: { pos: [0, -1.8, 4.5], target: [0, 0.4, 0] },
    exploded: { pos: [0, 7.5, 23], target: [0, 5.5, 0] },
  };

  const applyCameraPreset = (preset: CameraPreset) => {
    setActiveCamPreset(preset);
    const p = CAM_PRESETS[preset];
    targetCamPosRef.current.set(...p.pos);
    targetLookAtRef.current.set(...p.target);
    sound.playClick(900);
  };

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

    // Clean Aerospace Grid Floor
    const grid = new THREE.GridHelper(26, 26, 0x0284c7, 0x1e293b);
    grid.position.y = -0.1;
    scene.add(grid);

    // Studio Directional & Rim Illumination
    const keyLight = new THREE.DirectionalLight(0xfff8e7, 3.0);
    keyLight.position.set(12, 18, 14);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 1.2);
    fillLight.position.set(-12, 8, 10);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 2.0);
    rimLight.position.set(-8, 5, -12);
    scene.add(rimLight);

    const underLight = new THREE.DirectionalLight(0xf59e0b, 1.0);
    underLight.position.set(0, -6, 2);
    scene.add(underLight);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      140
    );
    camera.position.set(0, 6, 17);
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
    controls.target.set(0, 4.8, 0);
    controls.minDistance = 4;
    controls.maxDistance = 40;
    controlsRef.current = controls;

    const rocketModel = buildModularRocket(rocketConfig);
    scene.add(rocketModel.group);
    modelRef.current = rocketModel;

    // Raycaster for tapping/clicking 3D rocket components
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerUp = (e: MouseEvent | TouchEvent) => {
      if (!container || !modelRef.current) return;
      const rect = container.getBoundingClientRect();
      const clientX = 'clientX' in e ? e.clientX : e.changedTouches[0].clientX;
      const clientY = 'clientY' in e ? e.clientY : e.changedTouches[0].clientY;

      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const inspectables = modelRef.current.getInspectableObjects();
      const intersects = raycaster.intersectObjects(inspectables, true);

      if (intersects.length > 0) {
        let cur: THREE.Object3D | null = intersects[0].object;
        while (cur) {
          if (cur.userData && cur.userData.partInfo) {
            setSelectedPart(cur.userData.partInfo);
            sound.playClick(1100);
            break;
          }
          cur = cur.parent;
        }
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('click', handlePointerUp);

    let frameId: number;
    let lastTime = performance.now();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Smooth camera transition towards preset targets
      if (controls && camera) {
        camera.position.lerp(targetCamPosRef.current, 0.06);
        controls.target.lerp(targetLookAtRef.current, 0.06);
      }

      if (autoRotate && rocketModel) {
        rocketModel.group.rotation.y += 0.003;
      }

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
      domElement.removeEventListener('click', handlePointerUp);
      controls.dispose();
      rocketModel.dispose();
      grid.dispose();
      keyLight.dispose();
      fillLight.dispose();
      rimLight.dispose();
      underLight.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update 3D model when config changes
  useEffect(() => {
    if (!modelRef.current) return;
    const scene = modelRef.current.group.parent as THREE.Scene;
    if (!scene) return;

    scene.remove(modelRef.current.group);
    modelRef.current.dispose();

    const newModel = buildModularRocket(rocketConfig);
    newModel.setExplodedProgress(explodedView / 100);
    scene.add(newModel.group);
    modelRef.current = newModel;
  }, [
    rocketConfig.engine.id,
    rocketConfig.tank.id,
    rocketConfig.fairing.id,
    rocketConfig.boosterCount,
    rocketConfig.hasInterstageGridFins,
  ]);

  const handleExploded = (val: number) => {
    setExplodedView(val);
    if (modelRef.current) {
      modelRef.current.setExplodedProgress(val / 100);
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-48px)] mt-12 bg-slate-950 overflow-hidden select-none">
      {/* 3D WebGL Canvas */}
      <div 
        ref={canvasMountRef} 
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-none" 
      />

      {/* Top Left: Rocket Telemetry HUD (Collapsible for mobile phones) */}
      <div className="absolute top-3 left-3 z-20 max-w-sm pointer-events-auto">
        <div className="aerospace-panel p-3 rounded-xl border-sky-500/30 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] font-mono font-bold text-sky-400 tracking-wider">
                {language === 'mn' ? 'ҮЕ ШАТ 2 // ПУУЖИН УГСРАЛТ' : 'STAGE 2 // LAUNCH VEHICLE INTEGRATION'}
              </span>
            </div>
            <button
              onClick={() => setIsTelemetryCollapsed(!isTelemetryCollapsed)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800/60"
              title={isTelemetryCollapsed ? 'Expand' : 'Collapse'}
            >
              {isTelemetryCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>

          <h1 className="text-base font-bold text-white tracking-wide truncate">
            {rocketConfig.name}
          </h1>

          {!isTelemetryCollapsed && (
            <>
              <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-xs font-mono">
                <div className="p-2 bg-slate-950/85 rounded border border-slate-800">
                  <span className="text-slate-400 text-[9px] block">
                    {language === 'mn' ? 'ЗҮТГҮҮР/ЖИН (TWR)' : 'LIFTOFF TWR'}
                  </span>
                  <span className={`font-bold text-sm ${rocketSpecs.twrSeaLevel < 1.15 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {rocketSpecs.twrSeaLevel} : 1.0
                  </span>
                  <span className="text-slate-500 text-[9px] block">{language === 'mn' ? 'Шаардлага: > 1.15' : 'Req: > 1.15'}</span>
                </div>

                <div className="p-2 bg-slate-950/85 rounded border border-slate-800">
                  <span className="text-slate-400 text-[9px] block">
                    {language === 'mn' ? 'ДААЦ (LEO)' : 'LEO CAPACITY'}
                  </span>
                  <span className={`font-bold text-sm ${spacecraftSpecs.wetMassKg > rocketSpecs.maxPayloadToLeoKg ? 'text-rose-400' : 'text-sky-300'}`}>
                    {rocketSpecs.maxPayloadToLeoKg.toLocaleString()} kg
                  </span>
                  <span className="text-slate-500 text-[9px] block">{language === 'mn' ? 'Хөлөг:' : 'Payload:'} {spacecraftSpecs.wetMassKg} kg</span>
                </div>

                <div className="p-2 bg-slate-950/85 rounded border border-slate-800">
                  <span className="text-slate-400 text-[9px] block">
                    {language === 'mn' ? 'НИЙТ ЗҮТГЭХ ХҮЧ' : 'TOTAL THRUST'}
                  </span>
                  <span className="text-amber-400 font-bold text-sm">
                    {rocketSpecs.totalThrustKn.toLocaleString()} kN
                  </span>
                  <span className="text-slate-500 text-[9px] block">Isp: {rocketConfig.engine.ispSeconds}s</span>
                </div>

                <div className="p-2 bg-slate-950/85 rounded border border-slate-800">
                  <span className="text-slate-400 text-[9px] block">
                    {language === 'mn' ? 'ХӨӨРГӨХ ӨРТӨГ' : 'LAUNCH COST'}
                  </span>
                  <span className="text-white font-bold text-sm">
                    ${rocketSpecs.estimatedLaunchCostM}M
                  </span>
                  <span className="text-slate-500 text-[9px] block">{language === 'mn' ? 'Төсөв:' : 'Budget:'} ${budgetM}M</span>
                </div>
              </div>

              {/* Feasibility Alert */}
              <div
                className={`mt-2 p-2 rounded text-[11px] font-mono flex items-start gap-2 border ${
                  rocketSpecs.isFeasible
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/80 border-rose-500/70 text-rose-300 animate-pulse'
                }`}
              >
                {rocketSpecs.isFeasible ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                )}
                <div>
                  <span className="font-bold block">
                    {rocketSpecs.isFeasible
                      ? (language === 'mn' ? 'ХӨӨРӨХӨД БЭЛЭН (LAUNCH READY)' : 'LAUNCH READY')
                      : (language === 'mn' ? 'ИНЖЕНЕРИЙН АНХААРУУЛГА' : 'ENGINEERING WARNING')}
                  </span>
                  <span className="text-[10px] text-slate-300 leading-tight block">
                    {language === 'mn' ? rocketSpecs.feasibilityReasonMn : rocketSpecs.feasibilityReasonEn}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Top Center: 6 Cinematic Camera Modes */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-auto hidden sm:flex items-center gap-1.5 p-1 bg-slate-950/90 rounded-xl border border-sky-500/30 backdrop-blur-md shadow-2xl">
        {[
          { id: 'overview', labelMn: 'Тойм', labelEn: 'Full' },
          { id: 'fairing', labelMn: 'Хавтас', labelEn: 'Fairing' },
          { id: 'interstage', labelMn: 'Салгагч', labelEn: 'Interstage' },
          { id: 'fuselage', labelMn: 'Их бие', labelEn: 'Core' },
          { id: 'engine', labelMn: 'Хөдөлгүүр', labelEn: 'Engines' },
          { id: 'exploded', labelMn: 'Дэлгэсэн', labelEn: 'Exploded' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => applyCameraPreset(item.id as CameraPreset)}
            className={`px-2.5 py-1 rounded text-[11px] font-mono transition-all border ${
              activeCamPreset === item.id
                ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold shadow-[0_0_8px_rgba(56,189,248,0.4)]'
                : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {language === 'mn' ? item.labelMn : item.labelEn}
          </button>
        ))}

        <div className="w-[1px] h-4 bg-slate-800 mx-0.5"></div>

        <button
          onClick={() => {
            sound.playClick();
            setAutoRotate(!autoRotate);
          }}
          className={`p-1.5 rounded transition-colors ${autoRotate ? 'text-sky-400 bg-sky-500/20' : 'text-slate-500 hover:text-slate-300'}`}
          title={autoRotate ? 'Pause 360° Rotate' : 'Enable 360° Rotate'}
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Top Right: Exploded Assembly Slider & Staging Column */}
      <div className="absolute top-3 right-3 z-20 pointer-events-auto flex flex-col items-end gap-2">
        <div className="aerospace-panel px-3 py-1.5 rounded-lg border-sky-500/30 flex items-center gap-2.5 text-xs font-mono bg-slate-950/90 shadow-xl">
          <Sliders className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="text-slate-300 text-[11px] whitespace-nowrap">
            {language === 'mn' ? 'ДЭЛГЭХ:' : 'EXPLODE:'}
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={explodedView}
            onChange={(e) => handleExploded(Number(e.target.value))}
            className="w-20 sm:w-24 accent-sky-400 cursor-pointer"
          />
          <span className="text-sky-300 w-8 text-[11px] font-bold text-right">{explodedView}%</span>
        </div>

        {/* Visual Staging Preview Column (Clickable to inspect components) */}
        <div className="aerospace-panel p-2.5 rounded-xl border-sky-500/30 bg-slate-950/90 font-mono text-[10px] w-48 hidden md:block shadow-xl">
          <div className="flex items-center justify-between border-b border-sky-500/20 pb-1 mb-1.5">
            <span className="text-sky-400 font-bold flex items-center gap-1">
              <Layers className="w-3 h-3 text-sky-400" />
              {language === 'mn' ? 'ШАТЛАЛЫН ДАРААЛАЛ' : 'STAGING ORDER'}
            </span>
          </div>

          <div className="space-y-1">
            <div 
              onClick={() => {
                applyCameraPreset('fairing');
                sound.playClick();
              }}
              className="p-1 rounded bg-slate-900 border border-slate-800 hover:border-sky-400 flex items-center justify-between cursor-pointer transition-colors"
            >
              <span className="font-bold text-sky-300">05 {language === 'mn' ? 'Хөлөг' : 'Spacecraft'}</span>
              <span className="text-slate-400 text-[9px]">{spacecraftSpecs.wetMassKg} kg</span>
            </div>

            <div 
              onClick={() => {
                applyCameraPreset('fairing');
                sound.playClick();
              }}
              className="p-1 rounded bg-slate-900 border border-slate-800 hover:border-sky-400 flex items-center justify-between cursor-pointer transition-colors"
            >
              <span className="font-bold text-amber-300">04 {language === 'mn' ? 'Хавтас' : 'Fairing'}</span>
              <span className="text-slate-400 text-[9px]">{rocketConfig.fairing.diameterM}m</span>
            </div>

            <div 
              onClick={() => {
                applyCameraPreset('interstage');
                sound.playClick();
              }}
              className="p-1 rounded bg-slate-900 border border-slate-800 hover:border-sky-400 flex items-center justify-between cursor-pointer transition-colors"
            >
              <span className="font-bold text-sky-300">03 2-р Шат</span>
              <span className="text-slate-400 text-[9px]">MVac 981kN</span>
            </div>

            <div 
              onClick={() => {
                applyCameraPreset('interstage');
                sound.playClick();
              }}
              className="p-1 rounded bg-slate-900 border border-slate-800 hover:border-sky-400 flex items-center justify-between cursor-pointer transition-colors"
            >
              <span className="font-bold text-purple-300">02 Салгагч</span>
              <span className="text-slate-400 text-[9px]">Carbon Interstage</span>
            </div>

            <div 
              onClick={() => {
                applyCameraPreset('engine');
                sound.playClick();
              }}
              className="p-1 rounded bg-slate-900 border border-emerald-500/40 hover:border-emerald-400 flex items-center justify-between bg-emerald-950/30 cursor-pointer transition-colors"
            >
              <span className="font-bold text-emerald-300">01 {language === 'mn' ? 'Үндсэн' : 'Main'}</span>
              <span className="text-emerald-400 font-bold text-[9px]">{rocketSpecs.totalThrustKn} kN</span>
            </div>
          </div>

          <div className="mt-2 text-[9px] text-slate-500 text-center flex items-center justify-center gap-1">
            <Info className="w-2.5 h-2.5" />
            <span>{language === 'mn' ? 'Шатлал сонгож томруулах' : 'Click stage to zoom'}</span>
          </div>
        </div>
      </div>

      {/* Interactive 3D Component Inspection Card (Appears on click) */}
      {selectedPart && (
        <div className="absolute right-3 bottom-64 sm:bottom-60 z-30 max-w-sm w-[92%] sm:w-84 animate-in fade-in slide-in-from-right duration-200 pointer-events-auto">
          <div className="aerospace-panel p-3.5 rounded-xl border-sky-400/60 bg-slate-950/95 shadow-2xl backdrop-blur-md">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <span className="text-[10px] font-mono text-sky-400 uppercase tracking-wider block font-bold">
                  {language === 'mn' ? selectedPart.categoryMn : selectedPart.categoryEn}
                </span>
                <h3 className="text-sm font-bold text-white leading-tight">
                  {language === 'mn' ? selectedPart.nameMn : selectedPart.nameEn}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPart(null)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
              {language === 'mn' ? selectedPart.descriptionMn : selectedPart.descriptionEn}
            </p>

            <div className="space-y-1.5 border-t border-slate-800 pt-2 font-mono text-[10px]">
              {selectedPart.specs.map((sp, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-900/60 px-2 py-1 rounded">
                  <span className="text-slate-400">{language === 'mn' ? sp.labelMn : sp.labelEn}:</span>
                  <span className="text-sky-300 font-bold">{sp.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Unified Bottom Rocket Assembly Dock (Optimized for mobile touch targets) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-[96%] max-w-5xl pointer-events-auto">
        <div className="aerospace-panel rounded-xl overflow-hidden shadow-2xl border-sky-500/40 backdrop-blur-md">
          {/* Component Tabs with min 44px touch height */}
          <div className="flex items-center justify-between px-2 sm:px-3 py-1.5 bg-slate-950/95 border-b border-sky-500/20 text-xs font-mono">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 w-full">
              {[
                { id: 'engine', label: language === 'mn' ? '1. Хөдөлгүүрүүд' : '1. Engines' },
                { id: 'tank', label: language === 'mn' ? '2. Түлшний Сав' : '2. Tanks' },
                { id: 'fairing', label: language === 'mn' ? '3. Хамгаалалтын Хавтас' : '3. Fairings' },
                { id: 'boosters', label: language === 'mn' ? '4. Нэмэлт Түлхэгч & Далавч' : '4. Boosters & Fins' },
                { id: 'fuel', label: language === 'mn' ? '5. Түлшний Цэнэглэлт' : '5. Fuel Loading' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    sound.playClick();
                    setActiveTab(tab.id as RocketTab);
                  }}
                  className={`min-h-[44px] px-3.5 py-2 rounded-lg text-[11px] whitespace-nowrap transition-colors border flex items-center justify-center font-bold ${
                    activeTab === tab.id
                      ? 'bg-sky-500/20 text-sky-300 border-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.25)]'
                      : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Component Selection Grid */}
          <div className="p-2.5 sm:p-3 bg-slate-900/95 max-h-52 sm:max-h-56 overflow-y-auto">
            {/* ENGINES */}
            {activeTab === 'engine' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {ROCKET_ENGINES.map(eng => (
                  <div
                    key={eng.id}
                    onClick={() => {
                      sound.playClick(1000);
                      onUpdateRocketConfig({ ...rocketConfig, engine: eng });
                    }}
                    className={`min-h-[50px] p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      rocketConfig.engine.id === eng.id
                        ? 'bg-sky-500/15 border-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.25)]'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-xs text-white">
                        {language === 'mn' ? eng.nameMn : eng.name}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400">${eng.costM}M</span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
                      {language === 'mn' ? eng.descriptionMn : eng.descriptionEn}
                    </p>
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span className="text-amber-400 font-bold">{eng.thrustKn} kN</span>
                      <span>Isp: {eng.ispSeconds}s</span>
                      <span>{eng.massKg} kg</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TANKS */}
            {activeTab === 'tank' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {ROCKET_TANKS.map(tank => (
                  <div
                    key={tank.id}
                    onClick={() => {
                      sound.playClick(1050);
                      onUpdateRocketConfig({
                        ...rocketConfig,
                        tank,
                        fuelLoadKg: Math.min(rocketConfig.fuelLoadKg, tank.fuelCapacityKg),
                      });
                    }}
                    className={`min-h-[50px] p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      rocketConfig.tank.id === tank.id
                        ? 'bg-sky-500/15 border-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.25)]'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-xs text-white">
                        {language === 'mn' ? tank.nameMn : tank.name}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400">${tank.costM}M</span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
                      {language === 'mn' ? tank.descriptionMn : tank.descriptionEn}
                    </p>
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span className="text-sky-300 font-bold">{language === 'mn' ? 'Багтаамж:' : 'Capacity:'} {tank.fuelCapacityKg.toLocaleString()} kg</span>
                      <span>{language === 'mn' ? 'Диаметр:' : 'Diameter:'} {tank.diameterM}m</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* FAIRINGS */}
            {activeTab === 'fairing' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {ROCKET_FAIRINGS.map(fairing => (
                  <div
                    key={fairing.id}
                    onClick={() => {
                      sound.playClick(1100);
                      onUpdateRocketConfig({ ...rocketConfig, fairing });
                    }}
                    className={`min-h-[50px] p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      rocketConfig.fairing.id === fairing.id
                        ? 'bg-sky-500/15 border-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.25)]'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-xs text-white">
                        {language === 'mn' ? fairing.nameMn : fairing.name}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400">${fairing.costM}M</span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
                      {language === 'mn' ? fairing.descriptionMn : fairing.descriptionEn}
                    </p>
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span className="text-white font-bold">{fairing.diameterM}m × {fairing.heightM}m</span>
                      <span>{language === 'mn' ? 'Масс:' : 'Mass:'} {fairing.massKg} kg</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* BOOSTERS & FINS */}
            {activeTab === 'boosters' && (
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white">
                    {language === 'mn' ? 'Хажуугийн нэмэлт хурдасгагч пуужингууд (Strap-On Boosters):' : 'Strap-On Side Boosters:'}
                  </span>
                  <div className="flex gap-2 font-mono text-xs">
                    {[0, 2, 4].map(count => (
                      <button
                        key={count}
                        onClick={() => {
                          sound.playClick();
                          onUpdateRocketConfig({ ...rocketConfig, boosterCount: count });
                        }}
                        className={`min-h-[44px] px-3.5 py-1.5 rounded-lg font-bold transition-colors ${
                          rocketConfig.boosterCount === count
                            ? 'bg-sky-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {count === 0 ? (language === 'mn' ? 'Үгүй (0)' : 'None (0)') : `+${count} ${language === 'mn' ? 'Түлхэгч' : 'Boosters'}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-800 pt-3">
                  <span className="text-xs font-bold text-white">
                    {language === 'mn' ? 'Аэродинамик торлог далавч (Grid Fins):' : 'Aerodynamic Grid Fins:'}
                  </span>
                  <button
                    onClick={() => {
                      sound.playClick();
                      onUpdateRocketConfig({
                        ...rocketConfig,
                        hasInterstageGridFins: !rocketConfig.hasInterstageGridFins,
                      });
                    }}
                    className={`min-h-[44px] px-4 py-2 rounded-lg font-mono text-xs font-bold transition-colors ${
                      rocketConfig.hasInterstageGridFins
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {rocketConfig.hasInterstageGridFins
                      ? (language === 'mn' ? 'СУУРИЛУУЛСАН' : 'EQUIPPED')
                      : (language === 'mn' ? 'БАЙХГҮЙ' : 'NONE')}
                  </button>
                </div>
              </div>
            )}

            {/* FUEL LOADING */}
            {activeTab === 'fuel' && (
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-3 font-mono">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white font-bold">
                    {language === 'mn' ? 'Түлшний түвшин (Криоген шингэн хүчилтөрөгч / керосин):' : 'Propellant Loading (Cryogenic LOX / Hydrocarbon):'}
                  </span>
                  <span className="text-sky-300 font-bold">
                    {rocketConfig.fuelLoadKg.toLocaleString()} / {rocketConfig.tank.fuelCapacityKg.toLocaleString()} kg
                  </span>
                </div>
                <input
                  type="range"
                  min={rocketConfig.tank.fuelCapacityKg * 0.3}
                  max={rocketConfig.tank.fuelCapacityKg}
                  step={1000}
                  value={rocketConfig.fuelLoadKg}
                  onChange={(e) => {
                    onUpdateRocketConfig({
                      ...rocketConfig,
                      fuelLoadKg: Number(e.target.value),
                    });
                  }}
                  className="w-full accent-sky-400 cursor-pointer h-6"
                />
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>30% {language === 'mn' ? '(Хөнгөн даац)' : '(Light load)'}</span>
                  <span>100% {language === 'mn' ? '(Дүүрэн цэнэглэлт)' : '(Full capacity)'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Bar with minimum 44px touch button */}
          <div className="px-4 py-2.5 bg-slate-950/95 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-sky-500/20">
            <div className="text-xs font-mono text-center sm:text-left">
              <span className="text-slate-400">
                {language === 'mn' ? 'Хөөргөх нийт масс:' : 'Total Lift Mass:'} <strong className="text-white">{rocketSpecs.totalWetMassKg.toLocaleString()} kg</strong> |{' '}
                {language === 'mn' ? 'Хуурай масс:' : 'Dry Mass:'} <strong className="text-slate-300">{rocketSpecs.totalDryMassKg.toLocaleString()} kg</strong>
              </span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {onProceedToLaunch && (
                <button
                  disabled={!rocketSpecs.isFeasible}
                  onClick={() => {
                    sound.playClick();
                    onProceedToLaunch();
                  }}
                  className={`w-full sm:w-auto min-h-[46px] px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    !rocketSpecs.isFeasible
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.35)] active:scale-95'
                  }`}
                >
                  <Rocket className="w-4 h-4" />
                  <span>{language === 'mn' ? 'ХӨӨРӨХ ТАЛБАЙ РУУ ОЧИХ (ХӨӨРӨХ)' : 'GO TO LAUNCH PAD'}</span>
                </button>
              )}

              <button
                disabled={!rocketSpecs.isFeasible}
                onClick={() => {
                  sound.playClick();
                  onProceedToSpacecraft();
                }}
                className={`w-full sm:w-auto min-h-[46px] px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  !rocketSpecs.isFeasible
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-[0_0_15px_rgba(56,189,248,0.35)] active:scale-95'
                }`}
              >
                <span>{language === 'mn' ? 'ХӨЛӨГ ТОНОГЛОХ' : 'EQUIP SPACECRAFT'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
