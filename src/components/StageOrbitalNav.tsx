/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MissionState } from '../types';
import { 
  calculateOrbitalVelocity, 
  calculateHohmannTransfer, 
  calculateFuelRequired 
} from '../simulation/orbitalPhysics';
import { createNasaEarthMesh, createNasaSpaceEnvironment } from '../three/proceduralEarth';
import { sound } from '../utils/audio';
import { TRANSLATIONS } from '../utils/translations';
import { 
  Orbit, 
  ArrowRight, 
  Flame, 
  Compass, 
  FastForward, 
  CheckCircle2, 
  AlertTriangle,
  Play
} from 'lucide-react';

interface StageOrbitalNavProps {
  language?: import('../types').Language;
  missionState: MissionState;
  onUpdateState: (partial: Partial<MissionState>) => void;
  onProceedToDetection: () => void;
}

export const StageOrbitalNav: React.FC<StageOrbitalNavProps> = ({
  language = 'mn',
  missionState,
  onUpdateState,
  onProceedToDetection,
}) => {
  const t = TRANSLATIONS[language];
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const [maneuverStep, setManeuverStep] = useState<number>(1);
  const [isBurning, setIsBurning] = useState<boolean>(false);
  const [burnProgress, setBurnProgress] = useState<number>(0);

  const initialAltKm = 520;
  const targetAltKm = missionState.selectedMission.altitudeKm;
  const [currentAltKm, setCurrentAltKm] = useState<number>(missionState.currentAltitudeKm || initialAltKm);
  const [relativeDistKm, setRelativeDistKm] = useState<number>(
    (missionState.relativeDistanceM ? missionState.relativeDistanceM / 1000 : 750)
  );
  const [fuelKg, setFuelKg] = useState<number>(missionState.fuelRemainingKg);

  // Compute Hohmann transfer numbers
  const r1 = 6371 + initialAltKm;
  const r2 = 6371 + targetAltKm;
  const hohmann = calculateHohmannTransfer(r1, r2);

  const currentVel = calculateOrbitalVelocity(currentAltKm);

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
    scene.background = new THREE.Color(0x01030a);

    // Warm Solar Illumination
    const sun = new THREE.DirectionalLight(0xfff8e7, 2.8);
    sun.position.set(24, 18, 22);
    scene.add(sun);

    const hemi = new THREE.HemisphereLight(0x38bdf8, 0x050b14, 0.12);
    scene.add(hemi);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      600
    );
    camera.position.set(0, 14, 22);

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
    controls.maxDistance = 60;

    // 1. High-Fidelity NASA Blue Marble Earth (Continents, Clouds, Night Lights & Rayleigh Atmospheric Glow)
    const earthRadius = 6.371;
    const earthBundle = createNasaEarthMesh(earthRadius, isSoftwareGl);
    earthBundle.setSunDirection(sun.position.clone().normalize());
    scene.add(earthBundle.group);

    // 2. NASA Deep Space Environment (Milky Way galaxy skybox, Moon, Mars, Jupiter, Saturn with rings, stars)
    const spaceEnv = createNasaSpaceEnvironment(isSoftwareGl);
    scene.add(spaceEnv.group);

    // Initial Chaser Orbit Ring (Cyan)
    const chaserR = (6371 + initialAltKm) / 1000;
    const chaserPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 100; i++) {
      const th = (i / 100) * Math.PI * 2;
      chaserPts.push(new THREE.Vector3(Math.cos(th) * chaserR, 0, Math.sin(th) * chaserR));
    }
    const chaserGeo = new THREE.BufferGeometry().setFromPoints(chaserPts);
    const chaserMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 });
    const chaserRing = new THREE.Line(chaserGeo, chaserMat);
    scene.add(chaserRing);

    // Target Debris Orbit Ring (Red)
    const targetR = (6371 + targetAltKm) / 1000;
    const targetPts: THREE.Vector3[] = [];
    const incRad = (missionState.selectedMission.inclinationDeg * Math.PI) / 180;
    for (let i = 0; i <= 100; i++) {
      const th = (i / 100) * Math.PI * 2;
      const x0 = Math.cos(th) * targetR;
      const z0 = Math.sin(th) * targetR;
      targetPts.push(new THREE.Vector3(x0, z0 * Math.sin(incRad * 0.3), z0 * Math.cos(incRad * 0.3)));
    }
    const targetGeo = new THREE.BufferGeometry().setFromPoints(targetPts);
    const targetMat = new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 2 });
    const targetRing = new THREE.Line(targetGeo, targetMat);
    scene.add(targetRing);

    // Spacecraft Marker (Glowing Cyan Sphere)
    const scGeo = new THREE.SphereGeometry(0.22, 16, 16);
    const scMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const spacecraftMarker = new THREE.Mesh(scGeo, scMat);
    scene.add(spacecraftMarker);

    // Target Debris Marker (Glowing Red Sphere)
    const debGeo = new THREE.SphereGeometry(0.22, 16, 16);
    const debMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const debrisMarker = new THREE.Mesh(debGeo, debMat);
    scene.add(debrisMarker);

    let frameId: number;
    let time = 0;
    let clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      time += delta * 0.5;

      // Animate spacecraft along current orbit radius
      const currentRadius = (6371 + currentAltKm) / 1000;
      spacecraftMarker.position.set(
        Math.cos(time * 0.8) * currentRadius,
        0,
        Math.sin(time * 0.8) * currentRadius
      );

      // Animate target debris along target orbit
      debrisMarker.position.set(
        Math.cos(time * 0.65 + 1.2) * targetR,
        Math.sin(time * 0.65 + 1.2) * targetR * Math.sin(incRad * 0.3),
        Math.sin(time * 0.65 + 1.2) * targetR * Math.cos(incRad * 0.3)
      );

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
      earthBundle.dispose();
      spaceEnv.dispose();
      chaserGeo.dispose();
      chaserMat.dispose();
      targetGeo.dispose();
      targetMat.dispose();
      scGeo.dispose();
      scMat.dispose();
      debGeo.dispose();
      debMat.dispose();
      sun.dispose();
      hemi.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [currentAltKm, targetAltKm]);

  // Execute burn maneuver
  const handleExecuteBurn = (deltaV: number, stepNum: number) => {
    setIsBurning(true);
    sound.playThruster(1.2);

    const currentTotalMass = missionState.specs.dryMassKg + fuelKg;
    const fuelUsed = calculateFuelRequired(currentTotalMass, deltaV, missionState.design.propulsion.ispSeconds);
    const newFuel = Math.max(0, fuelKg - fuelUsed);

    setTimeout(() => {
      setFuelKg(Math.round(newFuel));
      if (stepNum === 1) {
        // Injection Burn: Orbit altitude raises halfway
        const midAlt = Math.round((initialAltKm + targetAltKm) / 2);
        setCurrentAltKm(midAlt);
        setRelativeDistKm(280);
        setManeuverStep(2);
      } else if (stepNum === 2) {
        // Circularization Burn: Altitude matches target
        setCurrentAltKm(targetAltKm);
        setRelativeDistKm(45);
        setManeuverStep(3);
      } else if (stepNum === 3) {
        // Phase angle fine-tuning: Closes to 12 km
        setRelativeDistKm(12);
        setManeuverStep(4);
        sound.playLockChime();

        onUpdateState({
          currentAltitudeKm: targetAltKm,
          orbitalVelocityKms: currentVel.kms,
          relativeDistanceM: 12000,
          relativeVelocityMs: 1.8,
          fuelRemainingKg: newFuel,
        });
      }
      setIsBurning(false);
    }, 1500);
  };

  return (
    <div className="relative w-full h-[calc(100vh-48px)] mt-12 bg-slate-950 overflow-hidden select-none">
      {/* 3D WebGL Canvas */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left: Orbital Telemetry HUD */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none max-w-sm">
        <div className="aerospace-panel p-3.5 rounded-lg border-sky-500/30">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
            <span className="text-[11px] font-mono font-bold text-sky-400 tracking-wider">
              {language === 'mn' ? 'ҮЕ ШАТ 5 // ТОЙРОГ ЗАМЫН МАНЕВР БА ШИЛЖИЛТ' : 'STAGE 5 // ORBITAL NAVIGATION & RENDEZVOUS'}
            </span>
          </div>
          <h1 className="text-base font-bold text-white tracking-wide">
            {language === 'mn' ? 'Гоманы Шилжилтийн Траектор' : 'Hohmann Transfer Trajectory'}
          </h1>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 bg-slate-950/80 rounded border border-slate-800">
              <span className="text-slate-400 text-[10px] block">
                {language === 'mn' ? 'ХӨЛГИЙН ӨНДӨР' : 'CHASER ALTITUDE'}
              </span>
              <span className="text-sky-300 font-bold text-sm">{currentAltKm} km</span>
              <span className="text-slate-500 text-[10px] block">
                {language === 'mn' ? `Зорилт: ${targetAltKm} км` : `Target: ${targetAltKm} km`}
              </span>
            </div>

            <div className="p-2 bg-slate-950/80 rounded border border-slate-800">
              <span className="text-slate-400 text-[10px] block">
                {language === 'mn' ? 'ТОЙРОГ ЗАМЫН ХУРД' : 'ORBITAL VELOCITY'}
              </span>
              <span className="text-emerald-400 font-bold text-sm">
                {currentVel.kms.toFixed(2)} km/s
              </span>
              <span className="text-slate-500 text-[10px] block">v = √(μ/r)</span>
            </div>

            <div className="p-2 bg-slate-950/80 rounded border border-slate-800">
              <span className="text-slate-400 text-[10px] block">
                {language === 'mn' ? 'ХОГ ХҮРТЭЛХ ЗАЙ' : 'DISTANCE TO TARGET'}
              </span>
              <span className="text-amber-400 font-bold text-sm">{relativeDistKm} km</span>
              <span className="text-slate-500 text-[10px] block">
                {language === 'mn' ? 'Радар хүрээ: 85 км' : 'Sensor Range: 85 km'}
              </span>
            </div>

            <div className="p-2 bg-slate-950/80 rounded border border-slate-800">
              <span className="text-slate-400 text-[10px] block">
                {language === 'mn' ? 'ҮЛДСЭН ТҮЛШ' : 'FUEL REMAINING'}
              </span>
              <span className="text-white font-bold text-sm">{fuelKg} kg</span>
              <span className="text-slate-500 text-[10px] block">
                {language === 'mn' ? `Сав: ${missionState.design.fuelMassKg} кг` : `Tank: ${missionState.design.fuelMassKg} kg`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Unified Bottom Maneuver Deck */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[96%] max-w-5xl">
        <div className="aerospace-panel rounded-xl overflow-hidden shadow-2xl border-sky-500/40">
          {/* Maneuver Stepper */}
          <div className="p-4 bg-slate-900/95 grid grid-cols-1 md:grid-cols-3 gap-3 border-b border-sky-500/20">
            {/* Step 1 */}
            <div
              className={`p-3 rounded-lg border text-left ${
                maneuverStep === 1
                  ? 'bg-sky-500/15 border-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.25)]'
                  : maneuverStep > 1
                  ? 'bg-slate-950/60 border-emerald-500/40 text-slate-400'
                  : 'bg-slate-950/40 border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="font-bold text-white">
                  {language === 'mn' ? '1. Шилжилтийн эхний түлхэлт (Δv₁)' : '1. Transfer Injection (Δv₁)'}
                </span>
                {maneuverStep > 1 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
              <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                {language === 'mn'
                  ? `Перигей дээр үндсэн хөдөлгүүрийг ажиллуулж апогейг зорилтот өндөр (${targetAltKm} км) рүү өсгөнө.`
                  : `Fire main engine at periapsis to raise apoapsis to target altitude (${targetAltKm} km).`}
              </p>
              <div className="flex justify-between items-center text-[11px] font-mono">
                <span className="text-sky-300 font-bold">Δv: {Math.round(hohmann.deltaV1Ms)} m/s</span>
                {maneuverStep === 1 && (
                  <button
                    disabled={isBurning}
                    onClick={() => handleExecuteBurn(hohmann.deltaV1Ms, 1)}
                    className="px-3 py-1 rounded bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1"
                  >
                    <Flame className="w-3 h-3" />
                    <span>{isBurning ? (language === 'mn' ? 'Ажиллаж байна...' : 'Firing...') : (language === 'mn' ? 'Түлхэлт хийх' : 'Execute Burn')}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Step 2 */}
            <div
              className={`p-3 rounded-lg border text-left ${
                maneuverStep === 2
                  ? 'bg-sky-500/15 border-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.25)]'
                  : maneuverStep > 2
                  ? 'bg-slate-950/60 border-emerald-500/40 text-slate-400'
                  : 'bg-slate-950/40 border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="font-bold text-white">
                  {language === 'mn' ? '2. Тойрог замд оруулах түлхэлт (Δv₂)' : '2. Circularization Burn (Δv₂)'}
                </span>
                {maneuverStep > 2 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
              <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                {language === 'mn'
                  ? 'Апогей дээр хөдөлгөөний чиглэлд түлхэж тойрог замын хурдыг хогны хурдтай тэнцүүлнэ.'
                  : 'Fire prograde at apoapsis to circularize orbit and match target orbital speed.'}
              </p>
              <div className="flex justify-between items-center text-[11px] font-mono">
                <span className="text-sky-300 font-bold">Δv: {Math.round(hohmann.deltaV2Ms)} m/s</span>
                {maneuverStep === 2 && (
                  <button
                    disabled={isBurning}
                    onClick={() => handleExecuteBurn(hohmann.deltaV2Ms, 2)}
                    className="px-3 py-1 rounded bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1"
                  >
                    <Flame className="w-3 h-3" />
                    <span>{isBurning ? (language === 'mn' ? 'Ажиллаж байна...' : 'Firing...') : (language === 'mn' ? 'Түлхэлт хийх' : 'Execute Burn')}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Step 3 */}
            <div
              className={`p-3 rounded-lg border text-left ${
                maneuverStep === 3
                  ? 'bg-sky-500/15 border-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.25)]'
                  : maneuverStep > 3
                  ? 'bg-slate-950/60 border-emerald-500/40 text-slate-400'
                  : 'bg-slate-950/40 border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="font-bold text-white">
                  {language === 'mn' ? '3. Фаз синхрончлох (RCS)' : '3. Phase Synchronization'}
                </span>
                {maneuverStep > 3 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
              <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                {language === 'mn'
                  ? 'RCS цоргуудаар тойрог замын өнцгийг тааруулж хоорондын зайг 15 км-ээс дотогш оруулна.'
                  : 'RCS phasing burns to close orbital lag angle and reduce separation to <15 km.'}
              </p>
              <div className="flex justify-between items-center text-[11px] font-mono">
                <span className="text-sky-300 font-bold">RCS Phasing</span>
                {maneuverStep === 3 && (
                  <button
                    disabled={isBurning}
                    onClick={() => handleExecuteBurn(45, 3)}
                    className="px-3 py-1 rounded bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1"
                  >
                    <Flame className="w-3 h-3" />
                    <span>{isBurning ? (language === 'mn' ? 'Ажиллаж байна...' : 'Firing...') : (language === 'mn' ? 'Түлхэлт хийх' : 'Execute Burn')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="px-4 py-3 bg-slate-950/95 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs font-mono text-slate-400">
              {maneuverStep < 4 ? (
                <span>
                  {language === 'mn'
                    ? 'Зорилтод ойртохын тулд Гоманы шилжилтийн 3 үе шатыг дараалан гүйцэтгэнэ үү.'
                    : 'Complete the 3-step orbital transfer sequence to approach target.'}
                </span>
              ) : (
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {language === 'mn'
                    ? `ОЙРТОЛТ АМЖИЛТТАЙ БОЛЛОО (${relativeDistKm} км) // МЭДРЭГЧЭЭР ИЛРҮҮЛЭХЭД БЭЛЭН`
                    : `PROXIMITY ACHIEVED (${relativeDistKm} km) // READY FOR TARGET DETECTION`}
                </span>
              )}
            </div>

            {maneuverStep >= 4 && (
              <button
                onClick={() => {
                  sound.playLockChime();
                  onProceedToDetection();
                }}
                className="w-full sm:w-auto px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-[0_0_15px_rgba(56,189,248,0.35)]"
              >
                <span>{language === 'mn' ? 'ХОГ ИЛРҮҮЛЭХ МЭДРЭГЧИЙГ ИДЭВХЖҮҮЛЭХ' : 'ENGAGE TARGET DETECTION SENSORS'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
