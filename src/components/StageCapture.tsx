/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import confetti from 'canvas-confetti';
import { MissionState, Language } from '../types';
import { buildModularSpacecraft } from '../three/spacecraftBuilder';
import { buildDebrisModel } from '../three/debrisBuilder';
import { createNasaEarthMesh, createNasaSpaceEnvironment } from '../three/proceduralEarth';
import { sound } from '../utils/audio';
import { TRANSLATIONS } from '../utils/translations';
import { 
  ShieldCheck, 
  AlertTriangle, 
  ArrowRight, 
  RotateCcw, 
  Play,
  Flame, 
  CheckCircle2, 
  Lock,
  Compass,
  Camera,
  Layers,
  Sparkles,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface StageCaptureProps {
  language?: Language;
  missionState: MissionState;
  onUpdateState: (partial: Partial<MissionState>) => void;
  onProceedToDisposal: () => void;
  onIncrementCapturedCount?: () => void;
}

type CaptureStep = 1 | 2 | 3 | 4;
type CaptureCamMode = 'docking' | 'arm' | 'chase' | 'free';

export const StageCapture: React.FC<StageCaptureProps> = ({
  language = 'mn',
  missionState,
  onUpdateState,
  onProceedToDisposal,
  onIncrementCapturedCount,
}) => {
  const t = TRANSLATIONS[language];
  const canvasMountRef = useRef<HTMLDivElement>(null);

  const target = missionState.selectedMission;
  const tool = missionState.design.captureMechanism;

  // Capture phase state
  const [activeStep, setActiveStep] = useState<CaptureStep>(1);
  const [camMode, setCamMode] = useState<CaptureCamMode>('docking');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isLatching, setIsLatching] = useState<boolean>(false);
  const [currentTumbleRate, setCurrentTumbleRate] = useState<number>(target.tumbleRateDegS);
  const [alignmentPct, setAlignmentPct] = useState<number>(45);
  const [captureStatus, setCaptureStatus] = useState<'ready' | 'capturing' | 'success' | 'failed'>(
    missionState.isCaptured ? 'success' : 'ready'
  );
  const [failureReason, setFailureReason] = useState<string>('');
  const [capturedCount, setCapturedCount] = useState<number>(1);
  const [hudCollapsed, setHudCollapsed] = useState<boolean>(false);
  const [showStatusPanel, setShowStatusPanel] = useState<boolean>(true);

  const spacecraftRef = useRef<ReturnType<typeof buildModularSpacecraft> | null>(null);
  const debrisRef = useRef<ReturnType<typeof buildDebrisModel> | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const sceneCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const debrisGroupRef = useRef<THREE.Group | null>(null);

  // 3D Scene setup
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

    // Warm Sun and rim lighting
    const sunLight = new THREE.DirectionalLight(0xfff7ed, 3.2);
    sunLight.position.set(14, 16, 14);
    scene.add(sunLight);

    const earthFillLight = new THREE.DirectionalLight(0x1d4ed8, 0.45);
    earthFillLight.position.set(-10, -10, -10);
    scene.add(earthFillLight);

    const ambientLight = new THREE.AmbientLight(0x0284c7, 0.15);
    scene.add(ambientLight);

    // 1. High-Fidelity NASA Blue Marble Earth in background
    const earthRadius = 80;
    const earthBundle = createNasaEarthMesh(earthRadius, isSoftwareGl);
    earthBundle.setSunDirection(sunLight.position.clone().normalize());
    earthBundle.group.position.set(0, -earthRadius - 12, -20);
    scene.add(earthBundle.group);

    // 2. NASA Deep Space Environment (Milky Way galaxy skybox, Moon, planets, stars)
    const spaceEnv = createNasaSpaceEnvironment(isSoftwareGl);
    scene.add(spaceEnv.group);

    // Spacecraft Model (located at origin)
    const scBundle = buildModularSpacecraft(missionState.design);
    scBundle.group.position.set(0, 0, 1.8);
    scene.add(scBundle.group);
    spacecraftRef.current = scBundle;

    // Debris Model (in front of spacecraft along negative Z)
    const debBundle = buildDebrisModel(target);
    debBundle.group.position.set(0, 0.35, -1.9);
    scene.add(debBundle.group);
    debrisRef.current = debBundle;
    debrisGroupRef.current = debBundle.group;

    // Visual Docking Guidance Crosshair Line
    const guideGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.2, 0.8),
      new THREE.Vector3(0, 0.35, -1.6),
    ]);
    const guideMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 0.2,
      gapSize: 0.15,
      transparent: true,
      opacity: 0.65,
    });
    const guideLine = new THREE.Line(guideGeo, guideMat);
    guideLine.computeLineDistances();
    scene.add(guideLine);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 400);
    camera.position.set(0, 1.4, 4.8);
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

      // Debris spin animation (tumbles if not locked)
      if (debBundle) {
        debBundle.update(delta * (currentTumbleRate / 10));
      }
      if (scBundle) {
        scBundle.update(delta);
      }

      // Rotate NASA Earth and cosmic environment
      earthBundle.update(delta);
      spaceEnv.update(delta);

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
      guideGeo.dispose();
      guideMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [target]);

  // Camera switcher
  const handleChangeCamera = (mode: CaptureCamMode) => {
    sound.playClick(1050);
    setCamMode(mode);
    const camera = sceneCameraRef.current;
    if (!camera) return;

    if (controlsRef.current) {
      controlsRef.current.enabled = mode === 'free';
      if (mode === 'free') {
        controlsRef.current.target.set(0, 0.4, 0);
      }
    }

    if (mode === 'docking') {
      camera.position.set(0, 0.35, 3.2);
      camera.lookAt(0, 0.35, -1.9);
    } else if (mode === 'arm') {
      camera.position.set(-1.4, 1.2, 0.5);
      camera.lookAt(0, 0.35, -1.8);
    } else if (mode === 'chase') {
      camera.position.set(4.8, 2.8, 3.8);
      camera.lookAt(0, 0.2, -0.5);
    }
  };

  // Step 1: Attitude & Spin Matching execution
  const handleExecuteSpinMatch = () => {
    setIsSyncing(true);
    sound.playClick(850);
    sound.playThruster(1.2);

    if (spacecraftRef.current) {
      spacecraftRef.current.setThrusterFiring(true);
    }

    let progressCount = alignmentPct;
    const interval = setInterval(() => {
      progressCount = Math.min(96, progressCount + 6);
      setAlignmentPct(progressCount);
      if (progressCount >= 96) {
        clearInterval(interval);
        setIsSyncing(false);
        setActiveStep(2);
        sound.playLockChime();
        if (spacecraftRef.current) {
          spacecraftRef.current.setThrusterFiring(false);
        }
      }
    }, 100);
  };

  // Step 2: Deploy & Extend Robotic Arm
  const handleDeployArm = () => {
    sound.playClick(900);
    sound.playThruster(0.6);

    // Animate robotic arm extending smoothly towards debris
    if (spacecraftRef.current) {
      spacecraftRef.current.setArmExtension(1.0);
    }

    setActiveStep(3);
  };

  // Step 3: Robotic Arm Clamping & Retracting into Payload Bay
  const handleExecuteClampAndCapture = () => {
    setIsLatching(true);
    setCaptureStatus('capturing');
    sound.playClick(950);

    // 1. Arm reaches and firmly clamps onto debris
    setTimeout(() => {
      sound.playCaptureLatch();

      // Neutralize debris tumble to 0.0
      let damp = currentTumbleRate;
      const dampTimer = setInterval(() => {
        damp = Math.max(0, damp - 0.9);
        setCurrentTumbleRate(Math.round(damp * 10) / 10);
        if (damp <= 0.05) {
          clearInterval(dampTimer);
          setCurrentTumbleRate(0.0);

          // 2. Retract robotic arm pulling debris to berth
          if (spacecraftRef.current) {
            spacecraftRef.current.setArmExtension(0.4);
          }
          if (debrisGroupRef.current) {
            // Draw debris closer towards the spacecraft berthing bay
            debrisGroupRef.current.position.set(0, 0.25, -0.9);
          }

          // 3. Mark capture success
          setCaptureStatus('success');
          setActiveStep(4);
          setIsLatching(false);
          setCapturedCount(prev => prev + 1);
          if (onIncrementCapturedCount) {
            onIncrementCapturedCount();
          }

          sound.playLockChime();

          try {
            confetti({
              particleCount: 110,
              spread: 90,
              origin: { y: 0.6 },
              colors: ['#38bdf8', '#34d399', '#f59e0b', '#ffffff'],
            });
          } catch {}

          onUpdateState({
            isCaptured: true,
            targetTumbleRateDegS: 0.0,
            captureOutcome: {
              success: true,
              reason: language === 'mn' ? 'Робот гар амжилттай атгаж бэхэллээ' : 'Robotic Arm Rigid Lock',
              details:
                language === 'mn'
                  ? `Робот гар хогийг чанга атган, эргэлтийг 0.0°/s болгон бүрэн тогтворжуулж хөлгийн сууринд бэхэллээ.`
                  : `Robotic arm firmly gripped the target, zeroed tumble to 0.0°/s, and berthed it safely.`,
            },
          });
        }
      }, 80);
    }, 1000);
  };

  const handleRetry = () => {
    sound.playClick();
    setCaptureStatus('ready');
    setActiveStep(1);
    setAlignmentPct(45);
    setCurrentTumbleRate(target.tumbleRateDegS);
    setFailureReason('');
    if (spacecraftRef.current) {
      spacecraftRef.current.setArmExtension(0);
      spacecraftRef.current.setThrusterFiring(false);
    }
    if (debrisGroupRef.current) {
      debrisGroupRef.current.position.set(0, 0.35, -1.9);
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-48px)] mt-12 bg-slate-950 overflow-hidden select-none font-sans">
      {/* 3D WebGL Canvas */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left: Target & Mechanism Status HUD (Collapsible) */}
      {!hudCollapsed && (
        <div className="absolute top-4 left-4 z-20 pointer-events-auto max-w-[320px]">
          <div className="aerospace-panel p-3.5 rounded-xl border-sky-500/30 bg-slate-950/90 shadow-2xl">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse"></span>
                <span className="text-xs font-mono font-bold text-sky-400 tracking-wider">
                  {language === 'mn' ? 'РОБОТ ГАРААР БАРИХ АЖИЛЛАГАА' : 'ROBOTIC ARM CAPTURE'}
                </span>
              </div>
              <button
                onClick={() => setShowStatusPanel(!showStatusPanel)}
                className="text-slate-400 hover:text-white p-1"
                title="Toggle Status Panel"
              >
                {showStatusPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            <h1 className="text-sm sm:text-base font-bold text-white tracking-wide">
              {language === 'mn' ? target.nameMn : target.name}
            </h1>

            {showStatusPanel && (
              <div className="mt-2.5 p-2.5 bg-slate-950/85 rounded-lg border border-slate-800 text-xs font-mono space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">{language === 'mn' ? 'Ашиглах багаж:' : 'Tool:'}</span>
                  <span className="text-sky-300 font-bold">{tool.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{language === 'mn' ? 'Хогийн масс:' : 'Mass:'}</span>
                  <span className="text-white font-bold">{target.massKg.toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{language === 'mn' ? 'Эргэлтийн хурд:' : 'Tumble Rate:'}</span>
                  <span className={`font-bold ${currentTumbleRate > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {currentTumbleRate.toFixed(1)}°/s {currentTumbleRate === 0 && '✓'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{language === 'mn' ? 'Синхрончлол:' : 'Sync Match:'}</span>
                  <span className="text-emerald-300 font-bold">{alignmentPct}%</span>
                </div>

                {/* Alignment Progress Bar */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1">
                  <div
                    className="bg-emerald-400 h-full transition-all duration-300"
                    style={{ width: `${alignmentPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Center: Camera Selector Float Bar */}
      {!hudCollapsed && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <div className="aerospace-panel px-3 py-1.5 rounded-full border-sky-500/30 flex items-center gap-1.5 text-xs font-mono bg-slate-950/95 shadow-xl">
            <Camera className="w-4 h-4 text-sky-400 mr-1 shrink-0" />
            <button
              onClick={() => handleChangeCamera('docking')}
              className={`min-h-[36px] px-3 py-1 rounded-full transition-colors ${camMode === 'docking' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'}`}
            >
              {language === 'mn' ? 'Холболтын камер' : 'Docking Cam'}
            </button>
            <button
              onClick={() => handleChangeCamera('arm')}
              className={`min-h-[36px] px-3 py-1 rounded-full transition-colors ${camMode === 'arm' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'}`}
            >
              {language === 'mn' ? 'Робот гар' : 'Arm Cam'}
            </button>
            <button
              onClick={() => handleChangeCamera('chase')}
              className={`min-h-[36px] px-3 py-1 rounded-full transition-colors ${camMode === 'chase' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'}`}
            >
              {language === 'mn' ? 'Тойрог камер' : 'Chase View'}
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

      {/* CELEBRATION MODAL: OBJECT CAPTURED */}
      {captureStatus === 'success' && (
        <div className="absolute inset-0 z-35 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm pointer-events-auto p-4 animate-in fade-in duration-500">
          <div className="aerospace-panel p-6 sm:p-8 rounded-2xl border-emerald-400/60 bg-slate-950/95 max-w-lg w-full text-center shadow-[0_0_50px_rgba(16,185,129,0.3)]">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <span className="text-xs font-mono font-bold text-emerald-400 tracking-widest uppercase block mb-1">
              CAPTURE SEQUENCE COMPLETE
            </span>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide mb-2">
              OBJECT CAPTURED
            </h2>

            <p className="text-lg sm:text-xl font-bold text-sky-300 mb-4 font-sans">
              ОБЪЕКТИЙГ АМЖИЛТТАЙ БАРЬЛАА
            </p>

            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs font-mono space-y-2 mb-6 text-left">
              <div className="flex justify-between">
                <span className="text-slate-400">{language === 'mn' ? 'Барьсан объект:' : 'Captured Object:'}</span>
                <span className="text-white font-bold">{language === 'mn' ? target.nameMn : target.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{language === 'mn' ? 'Цуглуулсан нийт хог:' : 'Total Captured:'}</span>
                <span className="text-emerald-400 font-bold">{capturedCount} ширхэг</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{language === 'mn' ? 'Бэхэлгээний байдал:' : 'Berthing Status:'}</span>
                <span className="text-sky-300 font-bold">{language === 'mn' ? 'Робот гараар хөлөгт хатуу бэхлэгдсэн' : 'Firmly berthed to spacecraft frame'}</span>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playLockChime();
                onProceedToDisposal();
              }}
              className="w-full min-h-[50px] py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.5)] active:scale-95"
            >
              <span>{language === 'mn' ? 'АГААР МАНДАЛД ШАТААХ УСТГАЛ РУУ ОРОХ' : 'PROCEED TO RE-ENTRY DISPOSAL'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Unified Bottom Control Dock */}
      {!hudCollapsed && captureStatus !== 'success' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[96%] max-w-4xl pointer-events-auto">
          <div className="aerospace-panel rounded-2xl overflow-hidden shadow-2xl border-sky-500/40 bg-slate-950/95">
            {/* 4 Step Progress Pills */}
            <div className="p-3 bg-slate-900/95 flex items-center justify-between gap-2 border-b border-sky-500/20 text-xs font-mono overflow-x-auto scrollbar-none">
              {[
                { step: 1, labelMn: '1. Тэнхлэг Тэнцвэржүүлэх', labelEn: '1. Attitude Sync' },
                { step: 2, labelMn: '2. Гар Дэлгэх', labelEn: '2. Deploy Arm' },
                { step: 3, labelMn: '3. Хогийг Атгах', labelEn: '3. Clamp Debris' },
                { step: 4, labelMn: '4. Хөлөгт Бэхлэх', labelEn: '4. Secure Berth' },
              ].map(s => (
                <div
                  key={s.step}
                  className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 whitespace-nowrap ${
                    activeStep === s.step
                      ? 'bg-sky-500/20 text-sky-300 border-sky-400 font-bold'
                      : activeStep > s.step
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40'
                      : 'bg-slate-950/70 text-slate-500 border-slate-800'
                  }`}
                >
                  <span>{language === 'mn' ? s.labelMn : s.labelEn}</span>
                  {activeStep > s.step && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
              ))}
            </div>

            {/* Step Action Controls */}
            <div className="px-4 py-3 bg-slate-950/95 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs font-mono text-slate-300 text-center sm:text-left">
                {activeStep === 1 && (
                  <span>{language === 'mn' ? 'Хогны эргэлттэй хөлгийн чиглэлийг нийцүүлнэ үү.' : 'Synchronize spacecraft rotation with target tumble.'}</span>
                )}
                {activeStep === 2 && (
                  <span>{language === 'mn' ? 'Робот гарыг зорилтот объект руу сунгаж дэлгэнэ үү.' : 'Extend robotic arm towards target debris.'}</span>
                )}
                {activeStep === 3 && (
                  <span>{language === 'mn' ? 'Робот гарын сарвуугаар хогийг чанга атган бэхэлнэ үү.' : 'Actuate mechanical claw to firmly clamp onto debris.'}</span>
                )}
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                {activeStep === 1 && (
                  <button
                    disabled={isSyncing}
                    onClick={handleExecuteSpinMatch}
                    className="w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(56,189,248,0.35)] active:scale-95"
                  >
                    <RotateCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? (language === 'mn' ? 'СИНХРОНЧИЛЖ БАЙНА...' : 'SYNCHRONIZING...') : (language === 'mn' ? 'ТЭНХЛЭГ ТЭНЦВЭРЖҮҮЛЭХ' : 'SYNCHRONIZE ATTITUDE')}</span>
                  </button>
                )}

                {activeStep === 2 && (
                  <button
                    onClick={handleDeployArm}
                    className="w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(56,189,248,0.35)] active:scale-95"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>{language === 'mn' ? 'РОБОТ ГАР ДЭЛГЭЖ ОЙРТУУЛАХ' : 'DEPLOY ROBOTIC ARM'}</span>
                  </button>
                )}

                {activeStep === 3 && (
                  <button
                    disabled={isLatching}
                    onClick={handleExecuteClampAndCapture}
                    className="w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isLatching ? (language === 'mn' ? 'АТГАЖ БАЙНА...' : 'CLAMPING...') : (language === 'mn' ? 'САРВУУГААР ХОГИЙГ АТГАЖ БАРЬЖ АВАХ' : 'CLAMP & SECURE DEBRIS')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
