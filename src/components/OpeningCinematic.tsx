/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createProceduralEarthScene } from '../three/proceduralEarth';
import { buildLaunchRocketScene } from '../three/launchAnimation';
import { sound } from '../utils/audio';
import { Language, TRANSLATIONS, speakText } from '../utils/translations';
import { Rocket, Orbit, Sparkles, Volume2, ArrowRight } from 'lucide-react';

interface OpeningCinematicProps {
  language: Language;
  onEnterGame: () => void;
}

export const OpeningCinematic: React.FC<OpeningCinematicProps> = ({
  language,
  onEnterGame,
}) => {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'earth_pan' | 'ignition' | 'ascent' | 'title_reveal'>('earth_pan');
  const [countdown, setCountdown] = useState<number>(3);
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

    // Directional Sun Key Light for dramatic day/night terminator
    const sun = new THREE.DirectionalLight(0xfff8e7, 3.4);
    sun.position.set(20, 12, 18);
    scene.add(sun);

    // Subtle cosmic ambient light (avoids washing out night city lights)
    const ambient = new THREE.AmbientLight(0x0284c7, 0.08);
    scene.add(ambient);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 4, 18);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // 1. Photorealistic NASA 3D Earth
    const earthBundle = createProceduralEarthScene(isSoftwareGl);
    earthBundle.group.position.set(0, -6.5, -6);
    earthBundle.group.scale.set(1.4, 1.4, 1.4);
    earthBundle.group.rotation.y = -Math.PI / 4;
    scene.add(earthBundle.group);

    // 2. Realistic Mongolian Flagship Rocket
    const rocketBundle = buildLaunchRocketScene();
    rocketBundle.group.position.set(0, -1.5, 3.5);
    rocketBundle.group.scale.set(0.65, 0.65, 0.65);
    scene.add(rocketBundle.group);

    // 3. Stars field
    const starCount = 600;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 300;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 300;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 300;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7, transparent: true, opacity: 0.8 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    let frameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      earthBundle.update(delta);

      // Camera sweeps smoothly around Earth and rocket
      camera.position.x = Math.sin(elapsed * 0.2) * 4;
      camera.position.y = 3.5 + Math.cos(elapsed * 0.15) * 1.5;
      camera.lookAt(0, 1.5, 0);

      // Rocket ascent animation
      if (elapsed > 4) {
        rocketBundle.rocketGroup.position.y += delta * 4.5;
        rocketBundle.firePlume.scale.set(1, 1 + Math.sin(elapsed * 20) * 0.2, 1);
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

    // Sequence timeline
    const t1 = setTimeout(() => {
      setPhase('ignition');
      sound.playRocketRumble(6);
    }, 2500);

    const t2 = setTimeout(() => {
      setPhase('ascent');
      if (language === 'mn') {
        speakText('Монгол улсын сансрын хөлөг хөөрөлтөд бэлэн боллоо. Хөдөлгүүр аслаа.', 'mn');
      } else {
        speakText('Mongolian flagship rocket ignition. Liftoff underway.', 'en');
      }
    }, 4500);

    const t3 = setTimeout(() => {
      setPhase('title_reveal');
    }, 7000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      earthBundle.dispose();
      rocketBundle.dispose();
      starGeo.dispose();
      starMat.dispose();
      sun.dispose();
      ambient.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [language]);

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden select-none">
      {/* 3D WebGL Canvas */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full" />

      {/* Cinematic Vignette */}
      <div className="absolute inset-0 bg-radial from-transparent via-slate-950/40 to-slate-950/90 pointer-events-none" />

      {/* Skip Button Top Right */}
      <div className="absolute top-6 right-6 z-30">
        <button
          onClick={() => {
            sound.playClick();
            onEnterGame();
          }}
          className="px-4 py-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-sky-400 border border-sky-500/30 text-xs font-mono flex items-center gap-2 transition-all backdrop-blur-sm"
        >
          <span>{t.menu.skipIntro}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Central Title Reveal */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
        <div className="max-w-3xl space-y-4">
          {/* Mongolian Soyombo & Flag Emblem */}
          <div className="flex items-center justify-center gap-3 mb-2 animate-fade-in">
            <div className="w-10 h-6 rounded border border-amber-400/60 overflow-hidden flex shadow-[0_0_15px_rgba(251,191,36,0.4)]">
              <div className="w-1/3 bg-[#da291c] flex items-center justify-center text-[7px] text-yellow-300 font-bold">
                ☸
              </div>
              <div className="w-1/3 bg-[#0055b8]" />
              <div className="w-1/3 bg-[#da291c]" />
            </div>
            <span className="text-xs font-mono font-bold tracking-widest text-sky-400">
              MONGOLIA IN SPACE // CH-13 ORBITAL GUARDIAN
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white drop-shadow-[0_0_30px_rgba(56,189,248,0.5)]">
            QUASAR
          </h1>
          <div className="text-lg sm:text-2xl font-bold text-sky-400 tracking-wider font-mono">
            {language === 'mn' ? 'МОНГОЛЫН САНСРЫН ХАМГААЛАГЧ' : 'MONGOLIAN SPACE GUARDIAN'}
          </div>

          <p className="text-xs sm:text-sm font-mono text-slate-300 max-w-xl mx-auto leading-relaxed pt-2">
            {t.tagline}
          </p>

          {/* Enter Button */}
          <div className="pt-6 pointer-events-auto">
            <button
              onClick={() => {
                sound.playLockChime();
                onEnterGame();
              }}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-400 hover:from-sky-400 hover:to-emerald-300 text-slate-950 font-bold text-sm sm:text-base flex items-center gap-3 mx-auto shadow-[0_0_25px_rgba(56,189,248,0.5)] transition-all transform hover:scale-105 active:scale-95"
            >
              <Rocket className="w-5 h-5 text-slate-950" />
              <span>{language === 'mn' ? 'САНСРЫН ТӨВ РҮҮ НЭВТРЭХ' : 'ENTER MISSION CONTROL'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
