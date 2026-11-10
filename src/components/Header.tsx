/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameStage, Language } from '../types';
import { sound } from '../utils/audio';
import { TRANSLATIONS } from '../utils/translations';
import { 
  Rocket, 
  Orbit, 
  Radar, 
  Crosshair, 
  Wrench, 
  Award, 
  Flame, 
  HelpCircle, 
  Volume2, 
  VolumeX, 
  RotateCcw,
  ShieldCheck,
  Globe,
  Home
} from 'lucide-react';

interface HeaderProps {
  currentStage: GameStage;
  language: Language;
  onSetLanguage: (lang: Language) => void;
  onSelectStage: (stage: GameStage) => void;
  onOpenAcademy: () => void;
  onResetMission: () => void;
  budgetM: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentStage,
  language,
  onSetLanguage,
  onSelectStage,
  onOpenAcademy,
  onResetMission,
  budgetM,
}) => {
  const [muted, setMuted] = React.useState(sound.getMuted());
  const t = TRANSLATIONS[language];

  const handleToggleSound = () => {
    const isMuted = sound.toggleMute();
    setMuted(isMuted);
    if (!isMuted) sound.playClick(900);
  };

  const STAGES: { id: GameStage; labelMn: string; labelEn: string; icon: React.ReactNode }[] = [
    { id: 'mission_control', labelMn: '1. Төв', labelEn: '1. Base', icon: <Orbit className="w-3.5 h-3.5" /> },
    { id: 'rocket_lab', labelMn: '2. Пуужин', labelEn: '2. Rocket', icon: <Rocket className="w-3.5 h-3.5" /> },
    { id: 'design_lab', labelMn: '3. Хөлөг', labelEn: '3. Craft', icon: <Wrench className="w-3.5 h-3.5" /> },
    { id: 'launch_config', labelMn: '4. Хөөрөх', labelEn: '4. Launch', icon: <Flame className="w-3.5 h-3.5" /> },
    { id: 'orbital_nav', labelMn: '5. Орбит', labelEn: '5. Orbit', icon: <Orbit className="w-3.5 h-3.5" /> },
    { id: 'target_detection', labelMn: '6. Илрүүлэлт', labelEn: '6. Scan', icon: <Radar className="w-3.5 h-3.5" /> },
    { id: 'approach_sync', labelMn: '7. Ойртолт', labelEn: '7. Approach', icon: <Crosshair className="w-3.5 h-3.5" /> },
    { id: 'debris_capture', labelMn: '8. Барих', labelEn: '8. Capture', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { id: 'deorbit_disposal', labelMn: '9. Устгах', labelEn: '9. Disposal', icon: <Flame className="w-3.5 h-3.5" /> },
    { id: 'mission_eval', labelMn: '10. Тайлан', labelEn: '10. Report', icon: <Award className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 aerospace-panel border-b border-sky-500/20 px-3 py-1.5 bg-slate-950/95">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
        {/* Brand & Mongolian Flag */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              sound.playClick();
              onSelectStage('main_menu');
            }}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            title="Return to Main Menu"
          >
            <div className="w-6 h-4 rounded border border-amber-400 overflow-hidden flex shadow-[0_0_8px_rgba(251,191,36,0.4)]">
              <div className="w-1/3 bg-[#da291c] flex items-center justify-center text-[6px] text-yellow-300 font-bold">
                ☸
              </div>
              <div className="w-1/3 bg-[#0055b8]" />
              <div className="w-1/3 bg-[#da291c]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-wider text-white text-xs sm:text-sm">QUASAR</span>
                <span className="text-[10px] text-sky-400 font-mono font-medium tracking-widest hidden sm:inline">
                  // {language === 'mn' ? 'МОНГОЛ' : 'MONGOLIA'}
                </span>
              </div>
            </div>
          </button>

          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-[10px] font-mono text-emerald-400">
            {t.common.budget}: <strong>${budgetM}M</strong>
          </span>
        </div>

        {/* Stage Breadcrumb Navigation */}
        <nav className="flex items-center gap-1 overflow-x-auto max-w-full py-0.5 text-xs font-mono scrollbar-none">
          <button
            onClick={() => {
              sound.playClick();
              onSelectStage('main_menu');
            }}
            className={`p-1.5 rounded transition-colors ${
              currentStage === 'main_menu' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
            title="Main Menu"
          >
            <Home className="w-3.5 h-3.5" />
          </button>

          {STAGES.map((st, idx) => {
            const isActive = currentStage === st.id;
            return (
              <button
                key={st.id}
                onClick={() => {
                  sound.playClick(1000 + idx * 50);
                  onSelectStage(st.id);
                }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-sky-500/20 text-sky-300 border-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.3)]'
                    : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {st.icon}
                <span>{language === 'mn' ? st.labelMn : st.labelEn}</span>
              </button>
            );
          })}
        </nav>

        {/* Language, Audio & Manual Controls */}
        <div className="flex items-center gap-1.5">
          {/* Language Toggle */}
          <button
            onClick={() => {
              sound.playClick();
              onSetLanguage(language === 'mn' ? 'en' : 'mn');
            }}
            className="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-sky-300 border border-slate-700 text-[10px] font-mono flex items-center gap-1 transition-colors"
          >
            <Globe className="w-3 h-3" />
            <span>{language === 'mn' ? 'MN 🇲🇳' : 'EN 🇬🇧'}</span>
          </button>

          {/* Academy Modal */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenAcademy();
            }}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-sky-400 border border-sky-500/30 text-[10px] font-mono transition-colors"
            title="Open Engineering Academy"
          >
            <HelpCircle className="w-3 h-3" />
            <span className="hidden sm:inline">{language === 'mn' ? 'Академи' : 'Academy'}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className="p-1.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors"
            title={muted ? t.common.soundOff : t.common.soundOn}
          >
            {muted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-sky-400" />}
          </button>

          {/* Reset */}
          <button
            onClick={() => {
              sound.playWarning();
              onResetMission();
            }}
            className="p-1.5 rounded bg-slate-800/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 text-xs transition-colors"
            title="Reset Mission"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
