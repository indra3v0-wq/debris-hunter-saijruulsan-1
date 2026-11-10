/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Language, TRANSLATIONS, speakText, stopSpeech } from '../utils/translations';
import { sound } from '../utils/audio';
import { GameStage, MissionState } from '../types';
import { 
  Bot, 
  Volume2, 
  VolumeX, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  Send,
  Loader2,
  RefreshCw,
  Cpu,
  MessageSquare
} from 'lucide-react';

interface AiAssistantWidgetProps {
  language: Language;
  currentStage: GameStage;
  missionState: MissionState;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export const AiAssistantWidget: React.FC<AiAssistantWidgetProps> = ({
  language,
  currentStage,
  missionState,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[language];

  // Default introductory prompt based on stage
  const getDefaultStagePrompt = (stage: GameStage): string => {
    switch (stage) {
      case 'rocket_lab':
        return language === 'mn'
          ? '🚀 Пуужингийн лаборатори: Шат бүрийн хөдөлгүүрийн TWR-г 1.4-өөс дээш байлгаж, тойрог замд гарах дельта-v нөөцийг хангаарай.'
          : '🚀 Rocket Assembly: Maintain Stage 1 TWR above 1.4 and ensure adequate Delta-V margin for LEO insertion.';
      case 'design_lab':
        return language === 'mn'
          ? '🛰️ Сансрын хөлгийн инженерчлэл: Зорилтот хог хаягдлын хэлбэр, эргэлтэд тохирсон баригч механизм (Робот гар/Тор) сонгоно уу.'
          : '🛰️ Spacecraft Design: Choose optimal capture mechanisms (Robotic Arm, Net) based on target tumbling rate.';
      case 'launch_config':
        return language === 'mn'
          ? '🔥 Хөөрөлтийн удирдлага: 9 хөдөлгүүртэй үе шатыг асааж, Max-Q динамик даралтыг амжилттай давж тойрог замд байршина.'
          : '🔥 Launch Control: Ignite multi-stage vehicle, navigate Max-Q atmospheric pressure, and achieve orbital insertion.';
      case 'orbital_nav':
        return language === 'mn'
          ? '🌐 Орбитын навигаци: Hohmann шилжилтийн түлхэлтээр апогейг зорилтот биетийн өндөртэй тэнцүүлнэ.'
          : '🌐 Orbital Navigation: Execute Hohmann burns to raise apoapsis and sync altitude with target debris.';
      case 'target_detection':
        return language === 'mn'
          ? '📡 Радар ба LiDAR илрүүлэлт: Олон зурвасын мэдрэгчээр 36,500 сансрын хог хаягдлаас аюултай байг илрүүлэн цоожилно уу.'
          : '📡 Radar & LiDAR: Scan the 36,500 orbital catalog items, isolate hazardous debris, and lock tracking telemetry.';
      case 'approach_sync':
        return language === 'mn'
          ? '🎯 Ойртох ажиллагаа: RCS түлхэгчүүдээр харьцангуй хурдыг 0.2 м/с болгон бууруулж аюулгүй коридорт байршина.'
          : '🎯 Proximity Rendezvous: Use RCS thrusters to null relative velocity below 0.2 m/s in safe docking corridor.';
      case 'debris_capture':
        return language === 'mn'
          ? '🧲 Хог хаягдлыг барих: Эргэлтийн тэнхлэгийг тогтоож, робот гар эсвэл кевляр тороор найдвартай барьж түгжинэ.'
          : '🧲 Debris Capture: Align with target spin axis and deploy robotic grapple or net to secure debris.';
      case 'deorbit_disposal':
        return language === 'mn'
          ? '🌊 Устгал ба Орбитоос гаргалт: Retrograde тоормослолтоор перигейг 50 км хүртэл бууруулж Номхон далайн Point Nemo руу чиглүүлнэ.'
          : '🌊 Deorbit Disposal: Execute retrograde deorbit burn targeting South Pacific uninhabited Point Nemo.';
      case 'mission_eval':
        return language === 'mn'
          ? '🏆 Даалгаврын тайлан: Баяр хүргэе! Сансрын хог хаягдлыг аюулгүй устгаж Дэлхийн тойрог замыг цэвэрлэв.'
          : '🏆 Mission Complete: Congratulations! Hazardous debris successfully removed, protecting Earth orbit.';
      default:
        return language === 'mn'
          ? 'QUASAR Нислэгийн Удирдлагын Хиймэл Оюун танд туслахад бэлэн.'
          : 'QUASAR Flight Director AI online and ready to assist.';
    }
  };

  // Stage quick question chips
  const getQuickQuestions = (stage: GameStage): { label: string; query: string }[] => {
    if (language === 'mn') {
      switch (stage) {
        case 'rocket_lab':
          return [
            { label: '⚡ Түлхэлт (TWR) тооцоо', query: 'Энэ пуужингийн TWR болон дельта-v хангалттай юу? Сайжруулах зөвлөгөө өгнө үү.' },
            { label: '🔥 Түлшний сонголт', query: 'Kerolox, Methalox, Hydrolox түлшнүүдийн давуу ба сул тал юу вэ?' },
          ];
        case 'design_lab':
          return [
            { label: '🧲 Баригч сонголт', query: 'Энэ даалгаврын хог хаягдалд Робот гар эсвэл Торны аль нь илүү тохиромжтой вэ?' },
            { label: '🔋 Цахилгаан ба масс', query: 'Сансрын хөлгийн зай болон жинг яаж оновчлох вэ?' },
          ];
        case 'launch_config':
          return [
            { label: '🚀 Хөөрөлтийн горим', query: 'Агаар мандлын Max-Q болон шат салгах үед юу анхаарах вэ?' },
            { label: '📐 Тойрог замын өнцөг', query: 'Хөөрөлтийн дараа 550 км-ийн тойрог замд яаж зөв орох вэ?' },
          ];
        case 'target_detection':
          return [
            { label: '📡 Радарын түгжээ', query: '36,500 биет дундаас зорилтот хогийг яаж хурдан ялгаж цоожлох вэ?' },
            { label: '⚡ Кеплерийн тойрог зам', query: 'Зорилтот хогийн эксцентриситет ба налалт юуг илтгэж байна вэ?' },
          ];
        case 'approach_sync':
          return [
            { label: '🕹️ Ойртолтын RCS', query: 'Харьцангуй хурдыг мөргөлдөхгүйгээр яаж 0.1 м/с хүртэл бууруулах вэ?' },
          ];
        case 'debris_capture':
          return [
            { label: '🎯 Барих тактик', query: 'Эргэлдэж байгаа хиймэл дагуулыг гэмтээхгүйгээр хэрхэн найдвартай барих вэ?' },
          ];
        case 'deorbit_disposal':
          return [
            { label: '🌊 Point Nemo чиглэл', query: 'Номхон далайн Point Nemo бүсэд яг зөв унагах retrograde түлхэлт ямар байх вэ?' },
          ];
        default:
          return [
            { label: '🌌 Даалгаврын заавар', query: 'Одоогийн үе шатанд ямар ажиллагаа хийх ёстой вэ?' },
          ];
      }
    } else {
      switch (stage) {
        case 'rocket_lab':
          return [
            { label: '⚡ TWR & Delta-V check', query: 'Is the current vehicle TWR and Delta-V sufficient for LEO? Any advice?' },
            { label: '🔥 Propellant trade-off', query: 'What are the trade-offs between Kerolox, Methalox, and Hydrolox?' },
          ];
        case 'design_lab':
          return [
            { label: '🧲 Mechanism advice', query: 'Should I use a Robotic Arm or Deployable Net for this target?' },
          ];
        case 'launch_config':
          return [
            { label: '🚀 Ascent Profile', query: 'What is the optimal pitch program through Max-Q and staging?' },
          ];
        case 'target_detection':
          return [
            { label: '📡 Radar Locking', query: 'How do I isolate and lock tracking telemetry on the target among 36,500 objects?' },
          ];
        default:
          return [
            { label: '🌌 Mission Briefing', query: 'What is the primary objective in this phase?' },
          ];
      }
    }
  };

  // Reset or add stage intro message when stage changes
  useEffect(() => {
    stopSpeech();
    setIsSpeaking(false);
    const initialText = getDefaultStagePrompt(currentStage);
    setMessages([
      {
        id: `init-${currentStage}-${Date.now()}`,
        sender: 'ai',
        text: initialText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [currentStage, language]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send request to Gemini API endpoint
  const sendToGemini = async (questionText: string) => {
    if (!questionText.trim() || isLoading) return;

    sound.playClick(880);
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: questionText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuestion('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: questionText,
          language: language,
          stage: currentStage,
          context: {
            rocketName: missionState.rocketConfig.name,
            rocketSpecs: {
              twr: missionState.rocketSpecs.twrSeaLevel,
              deltaV: missionState.rocketSpecs.deltaVMs,
              maxPayloadKg: missionState.rocketSpecs.maxPayloadToLeoKg,
            },
            spacecraftDesign: {
              bus: missionState.design.bus?.name || '',
              captureMechanism: missionState.design.captureMechanism?.name || '',
              propellant: missionState.design.propulsion?.name || '',
              sensors: missionState.design.sensors?.map(s => s.name).join(', ') || '',
            },
            selectedTarget: missionState.selectedMission.name,
            targetOrbit: {
              altitudeKm: missionState.selectedMission.altitudeKm,
              inclinationDeg: missionState.selectedMission.inclinationDeg,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const aiReply = data.reply || (language === 'mn' ? 'Холболтын хариу амжилттай.' : 'Telemetry received.');

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, aiMsg]);
      sound.playLockChime();

      // Read aloud if speaking mode is enabled
      if (isSpeaking) {
        speakText(aiReply, language);
      }
    } catch (err) {
      console.error('Failed to communicate with Gemini API:', err);
      const fallbackMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: language === 'mn'
          ? `[QUASAR Автомат горим]: ${getDefaultStagePrompt(currentStage)}`
          : `[QUASAR Autopilot]: ${getDefaultStagePrompt(currentStage)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleVoice = () => {
    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
    } else {
      const lastAiMessage = [...messages].reverse().find(m => m.sender === 'ai');
      if (lastAiMessage) {
        speakText(lastAiMessage.text, language);
      }
      setIsSpeaking(true);
      sound.playClick();
    }
  };

  const quickQuestions = getQuickQuestions(currentStage);

  return (
    <div className="fixed bottom-20 right-3 z-40 w-80 sm:w-96 pointer-events-auto max-w-[calc(100vw-24px)]">
      <div className="aerospace-panel rounded-xl overflow-hidden shadow-2xl border-sky-500/40 bg-slate-950/95 backdrop-blur-md flex flex-col max-h-[75vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-sky-500/20 text-xs font-mono select-none">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-sky-500/20 border border-sky-400 flex items-center justify-center text-sky-400">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white tracking-wide text-[11px]">
                  QUASAR AI
                </span>
                <span className="text-[9px] bg-sky-500/20 text-sky-300 border border-sky-500/40 px-1 rounded flex items-center gap-1">
                  <Cpu className="w-2.5 h-2.5" />
                  Gemini 3.8
                </span>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleToggleVoice}
              className={`p-1.5 rounded transition-colors ${
                isSpeaking ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title={isSpeaking ? (language === 'mn' ? 'Дуу зогсоох' : 'Stop Voice') : (language === 'mn' ? 'Дуугаар уншуулах' : 'Read Aloud')}
            >
              {isSpeaking ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setIsExpanded(!isExpanded);
              }}
              className="p-1.5 rounded text-slate-400 hover:text-white"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Messages Feed */}
            <div className="p-3 overflow-y-auto space-y-2.5 max-h-64 min-h-[120px] text-[11px] font-mono scrollbar-thin">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'ai' && (
                    <div className="w-5 h-5 rounded bg-sky-500/20 border border-sky-400/50 flex items-center justify-center shrink-0 mt-0.5 text-sky-400">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                    </div>
                  )}
                  <div
                    className={`p-2.5 rounded-lg max-w-[85%] leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-sky-600/30 border border-sky-500/40 text-sky-100 rounded-br-none'
                        : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-none shadow-md'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <span className="block text-[8px] text-slate-500 text-right mt-1">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2 items-center text-slate-400 py-1">
                  <div className="w-5 h-5 rounded bg-sky-500/20 border border-sky-400/50 flex items-center justify-center shrink-0 text-sky-400 animate-spin">
                    <Loader2 className="w-3 h-3 text-sky-400" />
                  </div>
                  <span className="text-[10px] text-sky-300 italic">
                    {language === 'mn' ? 'Gemini 3.8 Flash тооцоолж байна...' : 'Gemini 3.8 Flash computing...'}
                  </span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Prompt Chips */}
            <div className="px-3 py-1.5 bg-slate-900/60 border-t border-slate-800 flex gap-1.5 overflow-x-auto scrollbar-none">
              {quickQuestions.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => sendToGemini(chip.query)}
                  disabled={isLoading}
                  className="px-2 py-1 rounded bg-slate-800/80 hover:bg-sky-900/50 hover:border-sky-500/40 border border-slate-700 text-[10px] text-sky-300 hover:text-white whitespace-nowrap transition-colors flex items-center gap-1 shrink-0"
                >
                  <MessageSquare className="w-2.5 h-2.5 text-sky-400" />
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={e => {
                e.preventDefault();
                sendToGemini(inputQuestion);
              }}
              className="p-2 bg-slate-900 border-t border-sky-500/20 flex items-center gap-1.5"
            >
              <input
                type="text"
                value={inputQuestion}
                onChange={e => setInputQuestion(e.target.value)}
                placeholder={
                  language === 'mn'
                    ? 'Gemini-ээс пуужин, нислэгийн асуулт асуух...'
                    : 'Ask Gemini flight director a question...'
                }
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputQuestion.trim()}
                className="p-1.5 rounded bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold transition-all shrink-0"
                title="Send to Gemini"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
