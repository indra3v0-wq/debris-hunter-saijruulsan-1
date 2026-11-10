/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import confetti from 'canvas-confetti';
import { MissionState, Language } from '../types';
import { calculateDeorbitDeltaV, calculateFuelRequired } from '../simulation/orbitalPhysics';
import { buildModularSpacecraft } from '../three/spacecraftBuilder';
import { buildDebrisModel } from '../three/debrisBuilder';
import { createNasaEarthMesh, createNasaSpaceEnvironment } from '../three/proceduralEarth';
import { sound } from '../utils/audio';
import { TRANSLATIONS } from '../utils/translations';
import { 
  Flame, 
  ArrowRight, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Orbit, 
  RotateCcw,
  Play,
  Pause,
  Camera,
  MapPin,
  Waves,
  Sparkles,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface StageDisposalProps {
  language?: Language;
  missionState: MissionState;
  onUpdateState: (partial: Partial<MissionState>) => void;
  onProceedToEvaluation: () => void;
}

type DisposalCamMode = 'plasma' | 'cinematic' | 'tracking' | 'free';

export const StageDisposal: React.FC<StageDisposalProps> = ({
  language = 'mn',
  missionState,
  onUpdateState,
  onProceedToEvaluation,
}) => {
  const t = TRANSLATIONS[language];
  const canvasMountRef = useRef<HTMLDivElement>(null);

  const target = missionState.selectedMission;
  const initialAlt = target.altitudeKm || 520;

  const [isBurning, setIsBurning] = useState<boolean>(false);
  const [disposalComplete, setDisposalComplete] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0); // 0.0 to 1.0
  const [camMode, setCamMode] = useState<DisposalCamMode>('plasma');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [hudCollapsed, setHudCollapsed] = useState<boolean>(false);
  const [showTelemetry, setShowTelemetry] = useState<boolean>(true);

  // Stack Mass: Spacecraft dry mass + remaining fuel + captured debris mass
  const [fuelKg, setFuelKg] = useState<number>(missionState.fuelRemainingKg);
  const combinedMassKg = missionState.specs.dryMassKg + fuelKg + target.massKg;

  // Delta-V for controlled atmospheric entry (perigee at 45km)
  const deorbitDeltaV = calculateDeorbitDeltaV(initialAlt, 45);
  const deorbitFuelReq = calculateFuelRequired(
    combinedMassKg,
    deorbitDeltaV,
    missionState.design.propulsion.ispSeconds
  );

  // Live telemetry state during reentry
  const [telemetry, setTelemetry] = useState({
    phaseText: language === 'mn' ? 'Буцах маневрын бэлтгэл' : 'Retrograde Orientation Hold',
    altitudeKm: initialAlt,
    velocityKms: 7.74,
    mach: 24.5,
    plasmaTempC: 25,
    dynamicPressureKpa: 0,
  });

  const sceneCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const stackGroupRef = useRef<THREE.Group | null>(null);
  const plasmaMeshRef = useRef<THREE.Mesh | null>(null);
  const fragmentParticlesRef = useRef<THREE.Points | null>(null);
  const debrisModelRef = useRef<ReturnType<typeof buildDebrisModel> | null>(null);
  const spacecraftModelRef = useRef<ReturnType<typeof buildModularSpacecraft> | null>(null);

  // 3D Scene Initialization
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

    // Warm Sun & Atmospheric rim light
    const sun = new THREE.DirectionalLight(0xffedd5, 3.2);
    sun.position.set(18, 15, 20);
    scene.add(sun);

    const hemi = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.15);
    scene.add(hemi);

    // 1. High-Fidelity NASA Blue Marble Earth
    const earthRadius = 32.0;
    const earthBundle = createNasaEarthMesh(earthRadius, isSoftwareGl);
    earthBundle.setSunDirection(sun.position.clone().normalize());
    earthBundle.group.position.set(0, -earthRadius - 3.5, 0);
    scene.add(earthBundle.group);

    // 2. NASA Deep Space Environment
    const spaceEnv = createNasaSpaceEnvironment(isSoftwareGl);
    scene.add(spaceEnv.group);

    // Stack Group (Spacecraft + Docked Debris)
    const stack = new THREE.Group();
    stack.position.set(0, 4.5, 0);
    scene.add(stack);
    stackGroupRef.current = stack;

    // Modular Spacecraft
    const scBundle = buildModularSpacecraft(missionState.design);
    scBundle.group.position.set(0, 0, 1.2);
    stack.add(scBundle.group);
    spacecraftModelRef.current = scBundle;

    // Docked Debris firmly attached in front of craft
    const debBundle = buildDebrisModel(target);
    debBundle.group.position.set(0, 0.35, -1.2);
    stack.add(debBundle.group);
    debrisModelRef.current = debBundle;

    // Hypersonic Incandescent Plasma Sheath Shell
    const plasmaGeo = new THREE.ConeGeometry(2.6, 7.0, 24, 1, true);
    const plasmaMat = new THREE.MeshBasicMaterial({
      color: 0xff5500,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const plasmaMesh = new THREE.Mesh(plasmaGeo, plasmaMat);
    plasmaMesh.rotation.x = Math.PI / 2;
    plasmaMesh.position.set(0, 0.25, -2.2);
    stack.add(plasmaMesh);
    plasmaMeshRef.current = plasmaMesh;

    // Thermal Fragmentation Particles (Ablation sparks and molten fragments)
    const fragCount = 240;
    const fragGeo = new THREE.BufferGeometry();
    const fragPos = new Float32Array(fragCount * 3);
    const fragColors = new Float32Array(fragCount * 3);
    const fragVel: { x: number; y: number; z: number }[] = [];

    const cWhite = new THREE.Color(0xffffff);
    const cOrange = new THREE.Color(0xff6600);
    const cYellow = new THREE.Color(0xfacc15);

    for (let i = 0; i < fragCount; i++) {
      fragPos[i * 3] = (Math.random() - 0.5) * 1.8;
      fragPos[i * 3 + 1] = (Math.random() - 0.5) * 1.8;
      fragPos[i * 3 + 2] = -Math.random() * 9;

      const pick = Math.random();
      const col = pick < 0.4 ? cWhite : pick < 0.75 ? cYellow : cOrange;
      fragColors[i * 3] = col.r;
      fragColors[i * 3 + 1] = col.g;
      fragColors[i * 3 + 2] = col.b;

      fragVel.push({
        x: (Math.random() - 0.5) * 0.12,
        y: (Math.random() - 0.5) * 0.12,
        z: Math.random() * 0.25 + 0.15,
      });
    }

    fragGeo.setAttribute('position', new THREE.BufferAttribute(fragPos, 3));
    fragGeo.setAttribute('color', new THREE.BufferAttribute(fragColors, 3));

    const fragMat = new THREE.PointsMaterial({
      vertexColors: true,
      size: 0.8,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    const fragParticles = new THREE.Points(fragGeo, fragMat);
    stack.add(fragParticles);
    fragmentParticlesRef.current = fragParticles;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 500);
    camera.position.set(0, 3.8, 9.5);
    sceneCameraRef.current = camera;

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
    controls.enabled = false;
    controlsRef.current = controls;

    let frameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Rotate NASA Earth and cosmic environment
      earthBundle.update(delta);
      spaceEnv.update(delta);

      // Animate fragmentation sparks if active
      if (fragMat.opacity > 0) {
        const pArr = (fragGeo.attributes.position as THREE.BufferAttribute).array as Float32Array;
        for (let i = 0; i < fragCount; i++) {
          pArr[i * 3] += fragVel[i].x;
          pArr[i * 3 + 1] += fragVel[i].y;
          pArr[i * 3 + 2] += fragVel[i].z;
          if (pArr[i * 3 + 2] > 7) {
            pArr[i * 3] = (Math.random() - 0.5) * 1.5;
            pArr[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
            pArr[i * 3 + 2] = -2;
          }
        }
        (fragGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      }

      if (controls.enabled) {
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
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      scBundle.dispose();
      debBundle.dispose();
      earthBundle.dispose();
      spaceEnv.dispose();
      plasmaGeo.dispose();
      plasmaMat.dispose();
      fragGeo.dispose();
      fragMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [target]);

  // Camera switcher
  const handleChangeCamera = (mode: DisposalCamMode) => {
    sound.playClick(1150);
    setCamMode(mode);
    const camera = sceneCameraRef.current;
    if (!camera) return;

    if (controlsRef.current) {
      controlsRef.current.enabled = mode === 'free';
      if (mode === 'free') {
        controlsRef.current.target.set(0, 3.5, 0);
      }
    }

    if (mode === 'plasma') {
      camera.position.set(-2.0, 1.4, -5.5);
      camera.lookAt(0, 0.4, 0);
    } else if (mode === 'cinematic') {
      // Cinematic camera looking down from space towards Earth with falling fireball
      camera.position.set(4.5, 6.5, 8.5);
      camera.lookAt(0, 0, -2.0);
    } else if (mode === 'tracking') {
      camera.position.set(7.5, 4.2, 8.0);
      camera.lookAt(0, 3.5, 0);
    }
  };

  // Reentry Flight Timeline Loop
  useEffect(() => {
    let animTimer: NodeJS.Timeout;
    if (isBurning && !isPaused && progress < 1) {
      animTimer = setTimeout(() => {
        const nextProgress = Math.min(1, progress + 0.012);
        setProgress(nextProgress);

        const plasmaMat = plasmaMeshRef.current?.material as THREE.MeshBasicMaterial | undefined;
        const fragMat = fragmentParticlesRef.current?.material as THREE.PointsMaterial | undefined;
        const stack = stackGroupRef.current;
        const camera = sceneCameraRef.current;

        let phaseText = '';
        let altKm = initialAlt;
        let velKms = 7.74;
        let mach = 24.5;
        let tempC = 25;
        let pressKpa = 0;

        if (nextProgress < 0.20) {
          // Phase 1: Retrograde orientation flip
          const p = nextProgress / 0.20;
          phaseText = language === 'mn' ? 'Буцах маневрын эргэлт (180° Flip)' : 'Retrograde Orientation Flip';
          if (stack) {
            stack.rotation.y = p * Math.PI;
          }
          altKm = initialAlt;
          velKms = 7.74;
        } else if (nextProgress < 0.45) {
          // Phase 2: Retrograde Deorbit Burn
          const p = (nextProgress - 0.20) / 0.25;
          phaseText = language === 'mn' ? 'Буцах хөдөлгүүр аслаа (Δv тоормослолт)' : 'Retrograde Deorbit Burn Active';
          if (spacecraftModelRef.current) {
            spacecraftModelRef.current.setThrusterFiring(true);
          }
          altKm = initialAlt - p * (initialAlt - 85);
          velKms = 7.74 - p * 0.35;
          velKms = Math.round(velKms * 100) / 100;
          tempC = 25 + p * 200;
        } else if (nextProgress < 0.70) {
          // Phase 3: Hypersonic entry & intense glowing plasma shockwave
          const p = (nextProgress - 0.45) / 0.25;
          phaseText = language === 'mn' ? 'Агаар мандлын үрэлт ба плазмын халалт' : 'Hypersonic Atmospheric Plasma Sheath';
          altKm = 85 - p * 35; // 85 -> 50 km
          velKms = 7.39 - p * 2.4;
          mach = Math.round((velKms / 0.32) * 10) / 10;
          tempC = Math.round(225 + p * 2500); // reaches ~2725°C!
          pressKpa = Math.round(p * 50);

          // Intense plasma glow (Orange, Yellow, White)
          if (plasmaMat) {
            plasmaMat.opacity = Math.min(0.95, p * 1.4);
            if (p > 0.65) {
              plasmaMat.color.setHex(0xffffff); // Incandescent white heat
            } else if (p > 0.35) {
              plasmaMat.color.setHex(0xfacc15); // Intense yellow
            } else {
              plasmaMat.color.setHex(0xff5500); // Fiery orange
            }
          }
          if (fragMat) {
            fragMat.opacity = p * 0.8;
          }

          // Camera shakes with hypersonic atmospheric buffeting
          if (camera && camMode !== 'free') {
            camera.position.x += (Math.random() - 0.5) * 0.1;
            camera.position.y += (Math.random() - 0.5) * 0.1;
          }

          // Cinematic camera descends towards Earth
          if (camMode === 'cinematic' && camera) {
            camera.position.y = 6.5 - p * 2.0;
            camera.position.z = 8.5 - p * 2.5;
          }
        } else if (nextProgress < 0.92) {
          // Phase 4: Aerodynamic breakup & complete thermal destruction
          const p = (nextProgress - 0.70) / 0.22;
          phaseText = language === 'mn' ? 'Хог агаар мандалд шатаж задарч байна' : 'Thermal Ablation & Fragmentation Breakup';
          altKm = 50 - p * 30; // 50 -> 20 km
          velKms = 4.99 - p * 3.8;
          mach = Math.round((velKms / 0.33) * 10) / 10;
          tempC = Math.round(2725 - p * 1200);
          pressKpa = Math.round(50 + p * 70);

          // Object shrinks, fragments, and completely vaporizes
          if (debrisModelRef.current) {
            const sc = Math.max(0.02, 1 - p * 0.98);
            debrisModelRef.current.group.scale.set(sc, sc, sc);
            debrisModelRef.current.group.rotation.x += 0.3;
            debrisModelRef.current.group.rotation.y += 0.4;
          }
          if (fragMat) {
            fragMat.opacity = 1.0;
          }
        } else {
          // Phase 5: Burnup Complete / Point Nemo Safe disposal
          phaseText = language === 'mn' ? 'Агаар мандалд бүрэн шатаж устлаа' : 'Atmospheric Incineration Complete';
          altKm = 0;
          velKms = 0.0;
          mach = 0.0;
          tempC = 30;
          pressKpa = 101.3;

          if (plasmaMat) plasmaMat.opacity = 0;
          if (fragMat) fragMat.opacity = 0;
          if (debrisModelRef.current) {
            debrisModelRef.current.group.visible = false;
          }
        }

        setTelemetry({
          phaseText,
          altitudeKm: Math.round(altKm * 10) / 10,
          velocityKms: Math.round(velKms * 100) / 100,
          mach,
          plasmaTempC: tempC,
          dynamicPressureKpa: pressKpa,
        });

        if (nextProgress >= 1) {
          setIsBurning(false);
          setDisposalComplete(true);
          sound.playLockChime();

          try {
            confetti({
              particleCount: 120,
              spread: 90,
              origin: { y: 0.6 },
              colors: ['#38bdf8', '#34d399', '#f59e0b', '#ffffff'],
            });
          } catch {}

          const remainingFuel = Math.max(0, fuelKg - deorbitFuelReq);
          setFuelKg(Math.round(remainingFuel));

          onUpdateState({
            fuelRemainingKg: remainingFuel,
            currentAltitudeKm: 0,
            disposalOutcome: {
              success: true,
              burnDeltaV: Math.round(deorbitDeltaV),
              decayYears: 0,
              impactZone: 'Point Nemo Oceanic Desert (Burnup complete)',
            },
          });
        }
      }, 70);
    }
    return () => clearTimeout(animTimer);
  }, [isBurning, isPaused, progress, initialAlt, deorbitDeltaV, deorbitFuelReq, fuelKg, camMode]);

  const handleStartDeorbit = () => {
    sound.playClick();
    sound.playRocketRumble(8);
    setIsBurning(true);
    setProgress(0);
  };

  return (
    <div className="relative w-full h-[calc(100vh-48px)] mt-12 bg-slate-950 overflow-hidden select-none font-sans">
      {/* 3D WebGL Canvas */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left: Deorbit Strategy & Reentry Telemetry HUD (Collapsible) */}
      {!hudCollapsed && (
        <div className="absolute top-4 left-4 z-20 pointer-events-auto max-w-[320px]">
          <div className="aerospace-panel p-3.5 rounded-xl border-sky-500/30 bg-slate-950/90 shadow-2xl">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse"></span>
                <span className="text-xs font-mono font-bold text-sky-400 tracking-wider">
                  {language === 'mn' ? 'АГААР МАНДАЛД ШАТААЖ УСТГАХ' : 'ATMOSPHERIC RE-ENTRY'}
                </span>
              </div>
              <button
                onClick={() => setShowTelemetry(!showTelemetry)}
                className="text-slate-400 hover:text-white p-1"
                title="Toggle Telemetry"
              >
                {showTelemetry ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            <h1 className="text-sm sm:text-base font-bold text-white tracking-wide">
              {language === 'mn' ? target.nameMn : target.name}
            </h1>

            {showTelemetry && (
              <div className="mt-2.5 p-2.5 bg-slate-950/85 rounded-lg border border-slate-800 text-xs font-mono space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">{language === 'mn' ? 'Өндөр:' : 'Altitude:'}</span>
                  <span className="text-sky-300 font-bold">{telemetry.altitudeKm} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{language === 'mn' ? 'Хурд:' : 'Velocity:'}</span>
                  <span className="text-white font-bold">{telemetry.velocityKms} km/s (M{telemetry.mach})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{language === 'mn' ? 'Плазмын халалт:' : 'Plasma Temp:'}</span>
                  <span className={`font-bold ${telemetry.plasmaTempC > 1500 ? 'text-rose-400 animate-pulse' : 'text-amber-300'}`}>
                    {telemetry.plasmaTempC}°C
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{language === 'mn' ? 'Тоормосны Δv:' : 'Deorbit Δv:'}</span>
                  <span className="text-emerald-400 font-bold">{Math.round(deorbitDeltaV)} m/s</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1">
                  <div
                    className="bg-rose-500 h-full transition-all duration-300"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Center: Camera View Selector */}
      {!hudCollapsed && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <div className="aerospace-panel px-3 py-1.5 rounded-full border-sky-500/30 flex items-center gap-1.5 text-xs font-mono bg-slate-950/95 shadow-xl">
            <Camera className="w-4 h-4 text-sky-400 mr-1 shrink-0" />
            <button
              onClick={() => handleChangeCamera('plasma')}
              className={`min-h-[36px] px-3 py-1 rounded-full transition-colors ${camMode === 'plasma' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'}`}
            >
              {language === 'mn' ? 'Плазмын харагдац' : 'Plasma View'}
            </button>
            <button
              onClick={() => handleChangeCamera('cinematic')}
              className={`min-h-[36px] px-3 py-1 rounded-full transition-colors ${camMode === 'cinematic' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'}`}
            >
              {language === 'mn' ? 'Кино мэт харагдац' : 'Cinematic Descent'}
            </button>
            <button
              onClick={() => handleChangeCamera('tracking')}
              className={`min-h-[36px] px-3 py-1 rounded-full transition-colors ${camMode === 'tracking' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'}`}
            >
              {language === 'mn' ? 'Мөшгих камер' : 'Tracking View'}
            </button>
          </div>
        </div>
      )}

      {/* Top Right: Zen Mode / UI Hide Button */}
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

      {/* SUCCESSFUL DEORBIT BURNUP CELEBRATION MODAL */}
      {disposalComplete && (
        <div className="absolute inset-0 z-35 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm pointer-events-auto p-4 animate-in fade-in duration-500">
          <div className="aerospace-panel p-6 sm:p-8 rounded-2xl border-emerald-400/60 bg-slate-950/95 max-w-lg w-full text-center shadow-[0_0_50px_rgba(16,185,129,0.3)]">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <span className="text-xs font-mono font-bold text-emerald-400 tracking-widest uppercase block mb-1">
              MISSION DEORBIT SUCCESSFUL
            </span>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide mb-2">
              DEORBIT COMPLETE
            </h2>

            <p className="text-lg sm:text-xl font-bold text-sky-300 mb-4 font-sans">
              АГААР МАНДЛААС АМЖИЛТТАЙ ШАТААЖ УСТГАЛАА
            </p>

            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs font-mono space-y-2 mb-6 text-left">
              <div className="flex justify-between">
                <span className="text-slate-400">{language === 'mn' ? 'Устгасан объект:' : 'Disposed Target:'}</span>
                <span className="text-white font-bold">{language === 'mn' ? target.nameMn : target.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{language === 'mn' ? 'Агаарын үрэлтийн температур:' : 'Peak Reentry Temp:'}</span>
                <span className="text-rose-400 font-bold">2,725°C (Complete Vaporization)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{language === 'mn' ? 'Унасан бүс:' : 'Impact Zone:'}</span>
                <span className="text-sky-300 font-bold">Point Nemo Oceanic Desert</span>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playLockChime();
                onProceedToEvaluation();
              }}
              className="w-full min-h-[50px] py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.5)] active:scale-95"
            >
              <span>{language === 'mn' ? 'ИНЖЕНЕРИЙН НЭГДСЭН ТАЙЛАН ҮЗЭХ' : 'PROCEED TO MISSION REPORT'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Unified Bottom Control Dock */}
      {!hudCollapsed && !disposalComplete && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[96%] max-w-4xl pointer-events-auto">
          <div className="aerospace-panel rounded-2xl overflow-hidden shadow-2xl border-sky-500/40 bg-slate-950/95">
            <div className="px-4 py-3 bg-slate-950/95 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs sm:text-sm font-mono flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                {!isBurning ? (
                  <span className="text-slate-300 text-xs sm:text-sm">
                    {language === 'mn'
                      ? 'Хөлөг ба хогийг агаар мандал руу оруулах тоормосны хөдөлгүүрийг ажиллуулна уу.'
                      : 'Initiate retrograde burn to safely dispose of debris in Earth atmosphere.'}
                  </span>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-32 sm:w-44 bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-rose-500 h-full transition-all" style={{ width: `${progress * 100}%` }} />
                    </div>
                    <span className="text-rose-400 font-bold text-xs sm:text-sm">
                      {Math.round(progress * 100)}% {language === 'mn' ? 'БУУЛТ' : 'ENTRY'}
                    </span>
                    <span className="text-slate-400 hidden sm:inline">• {telemetry.phaseText}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                {!isBurning ? (
                  <button
                    onClick={handleStartDeorbit}
                    className="w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.4)] active:scale-95"
                  >
                    <Flame className="w-5 h-5 fill-current" />
                    <span>{language === 'mn' ? 'БУЦАХ ТООРМОС АЖИЛЛУУЛАХ (DEORBIT BURN)' : 'START DEORBIT BURN'}</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        sound.playClick();
                        setIsPaused(!isPaused);
                      }}
                      className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center"
                      title={isPaused ? t.common.play : t.common.pause}
                    >
                      {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                    </button>

                    <button
                      onClick={() => {
                        sound.playClick();
                        setProgress(1);
                        setIsBurning(false);
                        setDisposalComplete(true);
                      }}
                      className="min-h-[44px] px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700"
                    >
                      <span>{language === 'mn' ? 'Шаталтыг дуусгах' : 'Finish Burn'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
