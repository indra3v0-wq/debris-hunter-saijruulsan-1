/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import confetti from 'canvas-confetti';
import { RocketConfig, CalculatedRocketSpecs, CalculatedSpecs, SpacecraftDesign, Language } from '../types';
import { buildRealisticLaunchScene, LaunchCameraMode, LaunchTelemetryData } from '../three/launchAnimation';
import { NavBallHUD } from './NavBallHUD';
import { sound } from '../utils/audio';
import { TRANSLATIONS } from '../utils/translations';
import { 
  Rocket, 
  AlertTriangle, 
  ArrowRight, 
  Play, 
  Pause, 
  RotateCcw, 
  Flame, 
  CheckCircle2, 
  Camera, 
  FastForward, 
  Compass, 
  Layers, 
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';

interface StageLaunchProps {
  language?: Language;
  rocketConfig: RocketConfig;
  rocketSpecs: CalculatedRocketSpecs;
  design: SpacecraftDesign;
  specs: CalculatedSpecs;
  onLaunchComplete: () => void;
}

export const StageLaunch: React.FC<StageLaunchProps> = ({
  language = 'mn',
  rocketConfig,
  rocketSpecs,
  design,
  specs,
  onLaunchComplete,
}) => {
  const t = TRANSLATIONS[language];
  const canvasMountRef = useRef<HTMLDivElement>(null);

  const [launching, setLaunching] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [progress, setProgress] = useState(0); // 0.0 to 1.0
  const [cameraMode, setCameraMode] = useState<LaunchCameraMode>('chase');

  // Collapsible UI state
  const [hudCollapsed, setHudCollapsed] = useState<boolean>(false);
  const [showNavBall, setShowNavBall] = useState<boolean>(true);
  const [showStaging, setShowStaging] = useState<boolean>(true);
  const [showTelemetry, setShowTelemetry] = useState<boolean>(true);

  // Flight HUD controls
  const [sasActive, setSasActive] = useState(true);
  const [rcsActive, setRcsActive] = useState(false);
  const [celebrationShown, setCelebrationShown] = useState<boolean>(false);

  const [telemetry, setTelemetry] = useState<LaunchTelemetryData>({
    phaseKey: 'padHold',
    altitudeKm: 0,
    velocityKms: 0,
    downrangeKm: 0,
    mach: 0,
    dynamicPressureKpa: 0,
    gForce: 1.0,
    throttlePct: 0,
    isFairingSeparated: false,
    isBoosterSeparated: false,
    isPayloadDeployed: false,
    pitchDeg: 90,
    rollDeg: 0,
    headingDeg: 90,
  });

  const sceneBundleRef = useRef<ReturnType<typeof buildRealisticLaunchScene> | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const isPayloadOverloaded = specs.wetMassKg > rocketSpecs.maxPayloadToLeoKg;

  // Initialize Three.js WebGL scene with the player's exact assembled rocket
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
    scene.fog = new THREE.FogExp2(0x020617, 0.002);

    // Warm Sun and ambient lighting
    const sunLight = new THREE.DirectionalLight(0xffedd5, 3.0);
    sunLight.position.set(35, 60, 45);
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.85);
    scene.add(hemiLight);

    // CRITICAL: Build scene using the player's exact custom rocket config!
    const bundle = buildRealisticLaunchScene(
      container.clientWidth, 
      container.clientHeight,
      rocketConfig,
      design
    );
    scene.add(bundle.group);
    sceneBundleRef.current = bundle;
    cameraRef.current = bundle.camera;

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

    const controls = new OrbitControls(bundle.camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxDistance = 150;
    controls.minDistance = 4;
    controls.enabled = false;
    controlsRef.current = controls;

    let frameId: number;

    const animate = () => {
      frameId = requestAnimationFrame(animate);

      // Camera shake during intense ascent (progress 0.03 to 0.45)
      if (launching && progress > 0.03 && progress < 0.45 && !isPaused) {
        const shakeIntensity = 0.05 * (telemetry.throttlePct / 100);
        bundle.camera.position.x += (Math.random() - 0.5) * shakeIntensity;
        bundle.camera.position.y += (Math.random() - 0.5) * shakeIntensity;
      }

      if (controls.enabled) {
        controls.update();
      }
      renderer.render(scene, bundle.camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      bundle.camera.aspect = container.clientWidth / container.clientHeight;
      bundle.camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      bundle.dispose();
      sunLight.dispose();
      hemiLight.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [rocketConfig, design]);

  // Handle camera mode change
  const handleChangeCameraMode = (mode: LaunchCameraMode) => {
    sound.playClick(1100);
    setCameraMode(mode);
    if (sceneBundleRef.current) {
      sceneBundleRef.current.setCameraMode(mode);
    }
    if (controlsRef.current) {
      controlsRef.current.enabled = mode === 'free';
      if (mode === 'free') {
        controlsRef.current.target.set(0, 10, 0);
      }
    }
  };

  // Countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown !== null && countdown > 0) {
      sound.playCountdownBeep(false);
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      sound.playCountdownBeep(true);
      sound.playRocketRumble(9);
      setCountdown(null);
      setLaunching(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Launch animation progress progression
  useEffect(() => {
    let animTimer: NodeJS.Timeout;
    if (launching && !isPaused && progress < 1) {
      animTimer = setTimeout(() => {
        const step = 0.0055 * speedMultiplier;
        const nextProgress = Math.min(1, progress + step);
        setProgress(nextProgress);

        if (sceneBundleRef.current) {
          const telem = sceneBundleRef.current.updateSequence(nextProgress, 0.08);
          setTelemetry(telem);

          // Audio triggers at flight milestones
          if (progress < 0.40 && nextProgress >= 0.40) {
            sound.playStagingSeparation();
          }
          if (progress < 0.55 && nextProgress >= 0.55) {
            sound.playFairingSeparation();
          }
          if (progress < 0.88 && nextProgress >= 0.88) {
            sound.playLockChime();
          }
          if (nextProgress >= 0.95 && !celebrationShown) {
            setCelebrationShown(true);
            sound.playLockChime();
            try {
              confetti({
                particleCount: 120,
                spread: 90,
                origin: { y: 0.6 },
                colors: ['#38bdf8', '#34d399', '#f59e0b', '#ffffff'],
              });
            } catch {}
          }
        }
      }, 60);
    }
    return () => clearTimeout(animTimer);
  }, [launching, isPaused, progress, speedMultiplier, celebrationShown]);

  const handleStartCountdown = () => {
    if (isPayloadOverloaded) {
      sound.playWarning();
      return;
    }
    sound.playClick();
    setCountdown(5);
  };

  const handleTriggerManualStage = () => {
    sound.playClick(1200);
    if (progress < 0.40) {
      sound.playStagingSeparation();
      setProgress(0.42);
    } else if (progress < 0.55) {
      sound.playFairingSeparation();
      setProgress(0.57);
    } else if (progress < 0.88) {
      sound.playLockChime();
      setProgress(0.90);
    } else {
      handleSkipToOrbit();
    }
  };

  const handleSkipToOrbit = () => {
    sound.playLockChime();
    setProgress(1);
    setLaunching(true);
    setCelebrationShown(true);
    if (sceneBundleRef.current) {
      const telem = sceneBundleRef.current.updateSequence(1, 0.1);
      setTelemetry(telem);
    }
    try {
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#34d399', '#f59e0b'],
      });
    } catch {}
  };

  const handleResetLaunch = () => {
    sound.playClick();
    setLaunching(false);
    setIsPaused(false);
    setProgress(0);
    setCountdown(null);
    setCelebrationShown(false);
    if (sceneBundleRef.current) {
      const telem = sceneBundleRef.current.updateSequence(0, 0.1);
      setTelemetry(telem);
    }
  };

  const getPhaseDescription = (phaseKey: string) => {
    const phases = t.launch.phases as Record<string, string>;
    return phases[phaseKey] || t.launch.phases.padHold;
  };

  return (
    <div className="relative w-full h-[calc(100vh-48px)] mt-12 bg-slate-950 overflow-hidden select-none">
      {/* 3D WebGL Canvas */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left: Collapsible Vehicle & Launch Specs HUD */}
      {!hudCollapsed && (
        <div className="absolute top-4 left-4 z-20 pointer-events-auto max-w-[320px]">
          <div className="aerospace-panel p-3.5 rounded-xl border-sky-500/30 bg-slate-950/90 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span className="text-xs font-mono font-bold text-sky-400 tracking-wider">
                  {language === 'mn' ? 'УГСАРСАН ПУУЖИН' : 'ASSEMBLED ROCKET'}
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

            <div className="flex items-center justify-between">
              <h1 className="text-base font-bold text-white tracking-wide">
                {rocketConfig.name}
              </h1>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold">
                {language === 'mn' ? 'ХӨӨРӨХӨД БЭЛЭН' : 'LAUNCH READY'}
              </span>
            </div>

            {showTelemetry && (
              <div className="mt-2.5 p-2.5 bg-slate-950/85 rounded-lg border border-slate-800 text-xs font-mono space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">{language === 'mn' ? 'Хөдөлгүүр:' : 'Engine:'}</span>
                  <span className="text-white font-bold">{rocketConfig.engine.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{language === 'mn' ? 'Түлшний төрөл:' : 'Propellant:'}</span>
                  <span className="text-amber-300 font-bold uppercase">{rocketConfig.engine.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{language === 'mn' ? 'Хажуугийн түлхэгч:' : 'Boosters:'}</span>
                  <span className="text-sky-300 font-bold">
                    {rocketConfig.boosterCount === 0 ? (language === 'mn' ? 'Байхгүй' : 'None') : `${rocketConfig.boosterCount}x`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{language === 'mn' ? 'Ачааны масс:' : 'Payload Mass:'}</span>
                  <span className="text-white font-bold">{specs.wetMassKg.toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{language === 'mn' ? 'Нийт масс:' : 'Gross Mass:'}</span>
                  <span className="text-sky-300 font-bold">{rocketSpecs.totalWetMassKg.toLocaleString()} kg</span>
                </div>

                {/* Mass Bar */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1">
                  <div
                    className={`h-full ${isPayloadOverloaded ? 'bg-rose-500' : 'bg-emerald-400'}`}
                    style={{ width: `${Math.min(100, (specs.wetMassKg / rocketSpecs.maxPayloadToLeoKg) * 100)}%` }}
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
          <div className="aerospace-panel px-3 py-1.5 rounded-full border-sky-500/30 flex items-center gap-1.5 text-xs font-mono shadow-xl bg-slate-950/95 max-w-[95vw] overflow-x-auto scrollbar-none">
            <Camera className="w-4 h-4 text-sky-400 ml-1 mr-0.5 shrink-0" />
            {[
              { id: 'chase', labelMn: 'Дагах', labelEn: 'Chase' },
              { id: 'pad', labelMn: 'Талбай', labelEn: 'Pad' },
              { id: 'tracking', labelMn: 'Телескоп', labelEn: 'Track' },
              { id: 'booster', labelMn: 'Түлхэгч', labelEn: 'Booster' },
              { id: 'cockpit', labelMn: 'Нисгэгч', labelEn: 'Cockpit' },
              { id: 'spacecraft', labelMn: 'Хөлөг', labelEn: 'Craft' },
              { id: 'free', labelMn: 'Чөлөөт', labelEn: 'Free' },
            ].map(c => (
              <button
                key={c.id}
                onClick={() => handleChangeCameraMode(c.id as LaunchCameraMode)}
                className={`min-h-[36px] px-3 py-1 rounded-full transition-colors whitespace-nowrap font-medium flex items-center ${
                  cameraMode === c.id
                    ? 'bg-sky-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {language === 'mn' ? c.labelMn : c.labelEn}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Top Right: Zen Mode & Collapse Button */}
      <div className="absolute top-4 right-4 z-20 pointer-events-auto flex items-center gap-2">
        <button
          onClick={() => {
            sound.playClick();
            setHudCollapsed(!hudCollapsed);
          }}
          className="min-h-[44px] px-3 py-2 rounded-xl aerospace-panel border-sky-500/30 bg-slate-950/90 text-xs font-mono text-sky-300 hover:text-white flex items-center gap-2 shadow-lg"
          title={hudCollapsed ? 'Дэлгэцийг дэлгэх' : 'Дэлгэцийг хураах (Zen Mode)'}
        >
          {hudCollapsed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          <span className="hidden sm:inline">{hudCollapsed ? (language === 'mn' ? 'Дэлгэх' : 'Show UI') : (language === 'mn' ? 'Хураах' : 'Hide UI')}</span>
        </button>
      </div>

      {/* Countdown Visual Overlay */}
      {countdown !== null && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/65 pointer-events-none">
          <div className="text-center font-mono">
            <div className="text-8xl sm:text-9xl font-bold text-amber-400 tracking-widest drop-shadow-[0_0_40px_rgba(251,191,36,0.9)] animate-pulse">
              T - 00:0{countdown}
            </div>
            <div className="text-lg text-sky-300 tracking-widest mt-4 uppercase font-bold">
              {language === 'mn' ? 'ХӨӨРӨХ ТООЛОЛ ЯВАГДАЖ БАЙНА' : 'TERMINAL COUNTDOWN SEQUENCE ACTIVE'}
            </div>
          </div>
        </div>
      )}

      {/* SUCCESSFUL ORBIT INSERTION CELEBRATION MODAL */}
      {progress >= 0.95 && (
        <div className="absolute inset-0 z-35 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm pointer-events-auto p-4 animate-in fade-in duration-500">
          <div className="aerospace-panel p-6 sm:p-8 rounded-2xl border-emerald-400/60 bg-slate-950/95 max-w-lg w-full text-center shadow-[0_0_50px_rgba(16,185,129,0.3)]">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <span className="text-xs font-mono font-bold text-emerald-400 tracking-widest uppercase block mb-1">
              ORBITAL INSERTION COMPLETE
            </span>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide mb-2">
              LAUNCH SUCCESSFUL
            </h2>

            <p className="text-lg sm:text-xl font-bold text-sky-300 mb-4 font-sans">
              АГААР МАНДЛААС АМЖИЛТТАЙ ГАРЛАА
            </p>

            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs font-mono space-y-2 mb-6 text-left">
              <div className="flex justify-between">
                <span className="text-slate-400">{language === 'mn' ? 'Хүрсэн өндөр:' : 'Apogee Altitude:'}</span>
                <span className="text-white font-bold">520.0 km (LEO)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{language === 'mn' ? 'Тойрог замын хурд:' : 'Orbital Velocity:'}</span>
                <span className="text-emerald-400 font-bold">7.74 km/s (Mach 24.5)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{language === 'mn' ? 'Хөлгийн төлөв:' : 'Craft Status:'}</span>
                <span className="text-sky-300 font-bold">{language === 'mn' ? 'Нарны зай дэлгэгдсэн, систем хэвийн' : 'Solar arrays deployed, nominal'}</span>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playLockChime();
                onLaunchComplete();
              }}
              className="w-full min-h-[50px] py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.5)] active:scale-95"
            >
              <span>{language === 'mn' ? 'РАДАРААР ХОГ ИЛРҮҮЛЭХ ШАТ РУУ ОРОХ' : 'PROCEED TO DEBRIS RADAR'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* BOTTOM-LEFT: Authentic NavBall HUD (Collapsible) */}
      {launching && showNavBall && !hudCollapsed && progress < 0.95 && (
        <div className="absolute bottom-24 left-4 z-20 pointer-events-auto">
          <NavBallHUD
            language={language}
            pitchDeg={telemetry.pitchDeg}
            rollDeg={telemetry.rollDeg}
            headingDeg={telemetry.headingDeg}
            surfaceVelMs={telemetry.velocityKms * 1000}
            altitudeM={telemetry.altitudeKm * 1000}
            mach={telemetry.mach}
            gForce={telemetry.gForce}
            throttlePct={telemetry.throttlePct}
            sasActive={sasActive}
            onToggleSas={() => {
              sound.playClick(950);
              setSasActive(!sasActive);
            }}
            rcsActive={rcsActive}
            onToggleRcs={() => {
              sound.playClick(1150);
              setRcsActive(!rcsActive);
            }}
            compact={window.innerWidth < 640}
          />
        </div>
      )}

      {/* RIGHT SIDE: Vertical Staging Stack (Collapsible) */}
      {launching && showStaging && !hudCollapsed && progress < 0.95 && (
        <div className="absolute top-20 right-4 z-20 pointer-events-auto max-w-[220px] w-full">
          <div className="aerospace-panel p-3 rounded-xl border-sky-500/40 bg-slate-950/95 font-mono text-xs shadow-2xl space-y-2">
            <div className="flex items-center justify-between border-b border-sky-500/20 pb-1.5">
              <span className="text-sky-400 font-bold flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-sky-400" />
                {language === 'mn' ? 'ШАТЛАЛЫН ДАРААЛАЛ' : 'STAGING STACK'}
              </span>
              <button
                onClick={() => setShowStaging(false)}
                className="text-slate-400 hover:text-white"
                title="Hide Staging"
              >
                ✕
              </button>
            </div>

            {/* Stages Stack: 05 to 01 */}
            <div className="space-y-1.5">
              {/* Stage 05: Spacecraft / Payload Deploy */}
              <div className={`p-2 rounded-lg border transition-all ${
                telemetry.isPayloadDeployed
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                  : progress >= 0.70
                  ? 'bg-sky-500/20 border-sky-400 text-sky-300 animate-pulse'
                  : 'bg-slate-900/80 border-slate-800 text-slate-500'
              }`}>
                <div className="flex justify-between font-bold">
                  <span>05 {language === 'mn' ? 'ХӨЛӨГ' : 'PAYLOAD'}</span>
                  <span>{telemetry.isPayloadDeployed ? 'DEPLOYED' : 'ARMED'}</span>
                </div>
              </div>

              {/* Stage 04: Fairing Jettison */}
              <div className={`p-2 rounded-lg border transition-all ${
                telemetry.isFairingSeparated
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                  : progress >= 0.50
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 animate-pulse'
                  : 'bg-slate-900/80 border-slate-800 text-slate-500'
              }`}>
                <div className="flex justify-between font-bold">
                  <span>04 {language === 'mn' ? 'ХАВТАС' : 'FAIRING'}</span>
                  <span>{telemetry.isFairingSeparated ? 'JETTISONED' : 'ATTACHED'}</span>
                </div>
              </div>

              {/* Stage 03: Upper Stage MVac Engine */}
              <div className={`p-2 rounded-lg border transition-all ${
                progress >= 0.88
                  ? 'bg-slate-900/80 border-slate-800 text-slate-500'
                  : telemetry.isBoosterSeparated
                  ? 'bg-sky-500/25 border-sky-400 text-sky-200'
                  : 'bg-slate-900/80 border-slate-800 text-slate-500'
              }`}>
                <div className="flex justify-between font-bold">
                  <span>03 {language === 'mn' ? '2-Р ШАТ MVAC' : 'STAGE 2 VAC'}</span>
                  <span className="text-amber-400">{telemetry.isBoosterSeparated && progress < 0.88 ? 'FIRING' : 'READY'}</span>
                </div>
              </div>

              {/* Stage 02: Booster Decoupler */}
              <div className={`p-2 rounded-lg border transition-all ${
                telemetry.isBoosterSeparated
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                  : progress >= 0.35
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 animate-pulse'
                  : 'bg-slate-900/80 border-slate-800 text-slate-500'
              }`}>
                <div className="flex justify-between font-bold">
                  <span>02 {language === 'mn' ? 'САЛГАГЧ' : 'INTERSTAGE'}</span>
                  <span>{telemetry.isBoosterSeparated ? 'SEPARATED' : 'LOCKED'}</span>
                </div>
              </div>

              {/* Stage 01: Core Booster Engine */}
              <div className={`p-2 rounded-lg border transition-all ${
                telemetry.isBoosterSeparated
                  ? 'bg-slate-900/80 border-slate-800 text-slate-500'
                  : progress > 0.05
                  ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400'
              }`}>
                <div className="flex justify-between font-bold">
                  <span>01 {language === 'mn' ? 'ҮНДСЭН ТҮЛХЭГЧ' : 'MAIN BOOSTER'}</span>
                  <span className="text-amber-400">{!telemetry.isBoosterSeparated && progress > 0.05 ? 'FIRING' : 'IDLE'}</span>
                </div>
              </div>
            </div>

            {/* Manual Stage Push Button */}
            {progress < 0.95 && (
              <button
                onClick={handleTriggerManualStage}
                className="w-full min-h-[44px] py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-[0_0_12px_rgba(16,185,129,0.4)] active:scale-95"
              >
                <Flame className="w-4 h-4 fill-current" />
                <span>{language === 'mn' ? 'ШАТ САЛГАХ' : 'STAGE TRIGGER'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Unified Bottom Control Dock */}
      {!hudCollapsed && progress < 0.95 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[96%] max-w-4xl pointer-events-auto">
          <div className="aerospace-panel rounded-2xl overflow-hidden shadow-2xl border-sky-500/40 bg-slate-950/95">
            <div className="px-4 py-3 bg-slate-950/95 flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Status & Progress Bar */}
              <div className="text-xs font-mono flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                {!launching ? (
                  <span className="text-slate-300 text-xs sm:text-sm">
                    {language === 'mn' ? 'Хөөрөлтөд бэлэн:' : 'Ready for flight:'}{' '}
                    <strong className="text-white">{rocketConfig.name}</strong> +{' '}
                    <strong className="text-sky-400">{design.name}</strong>
                  </span>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-32 sm:w-44 bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-sky-400 h-full transition-all" style={{ width: `${progress * 100}%` }} />
                    </div>
                    <span className="text-sky-300 font-bold text-xs sm:text-sm">
                      {Math.round(progress * 100)}% {language === 'mn' ? 'ХӨӨРӨЛТ' : 'ASCENT'}
                    </span>
                    <span className="text-slate-400 hidden sm:inline">• {getPhaseDescription(telemetry.phaseKey)}</span>
                  </div>
                )}
              </div>

              {/* Playback & Action Controls */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                {!launching ? (
                  <button
                    disabled={isPayloadOverloaded || countdown !== null}
                    onClick={handleStartCountdown}
                    className={`w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                      isPayloadOverloaded
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95'
                    }`}
                  >
                    <Rocket className="w-5 h-5" />
                    <span>{language === 'mn' ? 'ХӨӨРӨХ ТУШААЛ ӨГӨХ' : 'GO FOR LAUNCH'}</span>
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

                    {/* Speed toggles */}
                    <div className="flex items-center rounded-xl bg-slate-800/80 border border-slate-700 p-0.5 text-xs font-mono">
                      {[1, 2, 4].map(spd => (
                        <button
                          key={spd}
                          onClick={() => {
                            sound.playClick();
                            setSpeedMultiplier(spd);
                          }}
                          className={`min-h-[40px] px-3 rounded-lg transition-colors font-bold ${speedMultiplier === spd ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>

                    {/* Skip to orbit */}
                    <button
                      onClick={handleSkipToOrbit}
                      className="min-h-[44px] px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 border border-slate-700"
                    >
                      <FastForward className="w-4 h-4 text-sky-400" />
                      <span className="hidden sm:inline">{language === 'mn' ? 'Тойрог зам руу алгасах' : 'Skip to Orbit'}</span>
                    </button>

                    {/* Reset */}
                    <button
                      onClick={handleResetLaunch}
                      className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 flex items-center justify-center"
                      title={t.common.reset}
                    >
                      <RotateCcw className="w-4 h-4" />
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
