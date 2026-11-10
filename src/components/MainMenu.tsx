/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createProceduralEarthScene } from '../three/proceduralEarth';
import { Language, TRANSLATIONS } from '../utils/translations';
import { sound } from '../utils/audio';
import { PlayerProfile, GameStage } from '../types';
import { 
  Rocket, 
  Orbit, 
  Wrench, 
  BookOpen, 
  Award, 
  Settings, 
  ArrowRight, 
  Volume2, 
  VolumeX, 
  Globe, 
  Layers,
  ShieldCheck,
  Play
} from 'lucide-react';

interface MainMenuProps {
  language: Language;
  onSetLanguage: (lang: Language) => void;
  onNavigateStage: (stage: GameStage) => void;
  onOpenAcademy: () => void;
  playerProfile: PlayerProfile;
  budgetM: number;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  language,
  onSetLanguage,
  onNavigateStage,
  onOpenAcademy,
  playerProfile,
  budgetM,
}) => {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const t = TRANSLATIONS[language];

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

    const sun = new THREE.DirectionalLight(0xfff8e7, 3.2);
    sun.position.set(18, 10, 16);
    scene.add(sun);

    const ambient = new THREE.AmbientLight(0x0284c7, 0.08);
    scene.add(ambient);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      500
    );
    camera.position.set(0, 3, 17);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const earthBundle = createProceduralEarthScene(isSoftwareGl);
    earthBundle.group.position.set(3.5, -1, 0);
    earthBundle.group.scale.set(1.2, 1.2, 1.2);
    earthBundle.group.rotation.y = -Math.PI / 4;
    scene.add(earthBundle.group);

    let frameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      earthBundle.update(delta);
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
      earthBundle.dispose();
      sun.dispose();
      ambient.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[calc(100vh-48px)] mt-12 bg-slate-950 overflow-hidden select-none">
      {/* 3D Earth Canvas */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full" />

      {/* Dark Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-transparent pointer-events-none" />

      {/* Main Content Area */}
      <div className="relative z-10 max-w-6xl mx-auto h-full px-6 py-6 flex flex-col justify-between">
        {/* Top Header / Branding */}
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-5 rounded border border-amber-400 overflow-hidden flex shadow-[0_0_10px_rgba(251,191,36,0.4)]">
              <div className="w-1/3 bg-[#da291c] flex items-center justify-center text-[7px] text-yellow-300 font-bold">
                ☸
              </div>
              <div className="w-1/3 bg-[#0055b8]" />
              <div className="w-1/3 bg-[#da291c]" />
            </div>
            <span className="text-xs font-mono font-bold tracking-widest text-sky-400">
              MONGOLIA SPACE AGENCY // CH-13
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide text-white">
            QUASAR
          </h1>
          <div className="text-sm sm:text-base font-bold text-sky-400 font-mono">
            {t.subtitle}
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[10px]">
            <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold flex items-center gap-1">
              <Orbit className="w-3 h-3 text-sky-400" />
              {language === 'mn' ? 'NASA ODPO СУДАЛГАА: 36,500 БҮРТГЭГДСЭН БИЕТ' : 'NASA ODPO: 36,500 TRACKED OBJECTS (>10CM)'}
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
              <Globe className="w-3 h-3 text-emerald-400" />
              {language === 'mn' ? 'БОДИТ BLUE MARBLE ДЭЛХИЙ' : 'REALISTIC BLUE MARBLE EARTH'}
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-md pt-1">
            {t.tagline}
          </p>
        </div>

        {/* Central Menu Navigation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-2xl my-auto">
          {/* 1. New Game / Mission Control */}
          <button
            onClick={() => {
              sound.playClick(1000);
              onNavigateStage('mission_control');
            }}
            className="p-3.5 rounded-xl aerospace-panel hover:aerospace-panel-highlight text-left transition-all group flex items-start justify-between"
          >
            <div>
              <div className="flex items-center gap-2 text-sky-400 font-bold text-sm mb-1">
                <Orbit className="w-4 h-4 text-sky-400 group-hover:rotate-45 transition-transform" />
                <span>{t.menu.newGame}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {language === 'mn' ? '8 төрлийн аюултай хог цэвэрлэх даалгавраас сонгох' : 'Select from 8 diverse debris removal mission profiles'}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-300 transition-colors mt-0.5" />
          </button>

          {/* 2. Rocket Assembly Lab */}
          <button
            onClick={() => {
              sound.playClick(1050);
              onNavigateStage('rocket_lab');
            }}
            className="p-3.5 rounded-xl aerospace-panel hover:aerospace-panel-highlight text-left transition-all group flex items-start justify-between"
          >
            <div>
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
                <Rocket className="w-4 h-4 text-emerald-400 group-hover:-translate-y-0.5 transition-transform" />
                <span>{t.menu.rocketLab}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {language === 'mn' ? 'Монгол төрийн далбаат зөөгч пуужингаа угсрах' : 'Assemble 3D launch vehicle with Mongolian flag decals'}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-300 transition-colors mt-0.5" />
          </button>

          {/* 3. Spacecraft Lab */}
          <button
            onClick={() => {
              sound.playClick(1100);
              onNavigateStage('design_lab');
            }}
            className="p-3.5 rounded-xl aerospace-panel hover:aerospace-panel-highlight text-left transition-all group flex items-start justify-between"
          >
            <div>
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-1">
                <Wrench className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
                <span>{t.menu.spacecraftLab}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {language === 'mn' ? 'Нарны зай, робот гар, лидар сенсороо сонгох' : 'Configure modular 3D spacecraft, robotic arm & LiDAR'}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-300 transition-colors mt-0.5" />
          </button>

          {/* 4. Engineering Academy */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenAcademy();
            }}
            className="p-3.5 rounded-xl aerospace-panel hover:aerospace-panel-highlight text-left transition-all group flex items-start justify-between"
          >
            <div>
              <div className="flex items-center gap-2 text-purple-400 font-bold text-sm mb-1">
                <BookOpen className="w-4 h-4 text-purple-400" />
                <span>{t.menu.academy}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {language === 'mn' ? 'Тойрог замын механик, Кесслерийн урвалын лавлах' : 'Orbital physics equations, Tsiolkovsky rocket manual'}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-300 transition-colors mt-0.5" />
          </button>

          {/* 5. Achievements & Ranks */}
          <button
            onClick={() => {
              sound.playLockChime();
              onNavigateStage('mission_eval');
            }}
            className="p-3.5 rounded-xl aerospace-panel hover:aerospace-panel-highlight text-left transition-all group flex items-start justify-between"
          >
            <div>
              <div className="flex items-center gap-2 text-yellow-400 font-bold text-sm mb-1">
                <Award className="w-4 h-4 text-yellow-400" />
                <span>{t.menu.achievements}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {language === 'mn' ? `Таны зэрэг: ${t.ranks[playerProfile.rank]}` : `Current Rank: ${t.ranks[playerProfile.rank]}`}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-yellow-300 transition-colors mt-0.5" />
          </button>

          {/* 6. Settings Modal Trigger */}
          <button
            onClick={() => {
              sound.playClick();
              setShowSettings(true);
            }}
            className="p-3.5 rounded-xl aerospace-panel hover:aerospace-panel-highlight text-left transition-all group flex items-start justify-between"
          >
            <div>
              <div className="flex items-center gap-2 text-sky-300 font-bold text-sm mb-1">
                <Settings className="w-4 h-4 text-sky-300 group-hover:rotate-90 transition-transform" />
                <span>{t.menu.settings}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {language === 'mn' ? 'Хэл солих (MN/EN), дууны тохиргоо' : 'Language toggle (MN/EN), audio & voice options'}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-300 transition-colors mt-0.5" />
          </button>
        </div>

        {/* Bottom Status Bar */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-white font-bold">{t.ranks[playerProfile.rank]}</span>
            </span>
            <span>•</span>
            <span>{t.common.budget}: <strong className="text-emerald-400">${budgetM}M</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playClick();
                onSetLanguage(language === 'mn' ? 'en' : 'mn');
              }}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === 'mn' ? 'Хэл: Монгол 🇲🇳' : 'Lang: English 🇬🇧'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-sky-500/40 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-sky-400" />
                <span>{t.menu.settings}</span>
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between items-center p-2.5 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-300">{t.common.language}:</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => onSetLanguage('mn')}
                    className={`px-3 py-1 rounded font-bold ${
                      language === 'mn' ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    Монгол 🇲🇳
                  </button>
                  <button
                    onClick={() => onSetLanguage('en')}
                    className={`px-3 py-1 rounded font-bold ${
                      language === 'en' ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    English 🇬🇧
                  </button>
                </div>
              </div>

              <div className="p-2.5 bg-slate-950 rounded border border-slate-800 space-y-2">
                <span className="text-slate-300 block">Аудио системийн статус:</span>
                <div className="text-emerald-400 flex items-center gap-1.5 text-[11px]">
                  <Volume2 className="w-4 h-4" />
                  <span>Web Audio Синтезатор & САНСАР-AI Хөтөч Бэлэн</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="w-full py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs"
            >
              {t.common.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
