/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { MissionState, MissionTarget } from '../types';
import { sound } from '../utils/audio';
import { 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  ArrowRight, 
  ShieldCheck, 
  Orbit, 
  DollarSign, 
  Flame, 
  Zap, 
  Download,
  Share2
} from 'lucide-react';

interface StageEvaluationProps {
  language?: import('../types').Language;
  missionState: MissionState;
  onSelectNewMission: () => void;
  onRedesignSpacecraft: () => void;
}

export const StageEvaluation: React.FC<StageEvaluationProps> = ({
  language = 'mn',
  missionState,
  onSelectNewMission,
  onRedesignSpacecraft,
}) => {
  const target = missionState.selectedMission;
  const design = missionState.design;
  const specs = missionState.specs;

  useEffect(() => {
    sound.playLockChime();
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#38bdf8', '#34d399', '#f59e0b', '#a855f7'],
      });
    } catch {
      // Ignore
    }
  }, []);

  // Compute detailed engineering score
  const fuelConsumedKg = design.fuelMassKg - missionState.fuelRemainingKg;
  const fuelEfficiency = Math.max(0, 100 - (fuelConsumedKg / design.fuelMassKg) * 80);
  const powerEfficiency = specs.netPowerMarginW >= 0 ? 100 : 50;
  const safetyScore = 95; // successful capture executed without collision
  const costScore = specs.estimatedTotalCostM <= target.rewardBudgetM ? 100 : 70;

  const overallScore = Math.round(
    (fuelEfficiency * 0.25) +
    (powerEfficiency * 0.20) +
    (safetyScore * 0.35) +
    (costScore * 0.20)
  );

  let rankTitle = language === 'mn' ? 'ЕРӨНХИЙ ИНЖЕНЕР' : 'CHIEF AEROSPACE ENGINEER';
  let rankBadgeColor = 'text-amber-400 border-amber-400 bg-amber-400/10';
  if (overallScore < 75) {
    rankTitle = language === 'mn' ? 'САНСРЫН КАДЕТ' : 'SPACE CADET';
    rankBadgeColor = 'text-slate-300 border-slate-400 bg-slate-800/40';
  } else if (overallScore < 85) {
    rankTitle = language === 'mn' ? 'ТУСЛАХ ИНЖЕНЕР' : 'JUNIOR FLIGHT ENGINEER';
    rankBadgeColor = 'text-sky-400 border-sky-400 bg-sky-400/10';
  } else if (overallScore < 95) {
    rankTitle = language === 'mn' ? 'САНСРЫН ИНЖЕНЕР' : 'SPACE SYSTEMS ENGINEER';
    rankBadgeColor = 'text-emerald-400 border-emerald-400 bg-emerald-400/10';
  }

  const isMn = language === 'mn';

  return (
    <div className="relative w-full min-h-[calc(100vh-48px)] mt-12 bg-slate-950 py-8 px-4 overflow-y-auto select-none">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Certificate / Mission Report Header */}
        <div className="aerospace-panel p-6 rounded-xl border-sky-500/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-6 -translate-y-6 w-36 h-36 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-sky-500/20 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-mono font-bold text-sky-400 tracking-widest">
                  {isMn
                    ? 'НИСЛЭГИЙН ҮНЭЛГЭЭНИЙ АЛБАН ЁСНЫ ТАЙЛАН // NASA ODPO СТАНДАРТ'
                    : 'OFFICIAL FLIGHT EVALUATION REPORT // NASA ODPO STANDARDS'}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-wide">
                {isMn
                  ? `Даалгавар амжилттай: ${target.nameMn || target.name} тойрог замаас цэвэрлэгдлээ`
                  : `Mission Success: ${target.name} Cleared`}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                {isMn
                  ? `Сансрын хог хаягдлыг устгах ажиллагааг "${design.name}" бие даасан сансрын хөлгөөр амжилттай гүйцэтгэлээ.`
                  : `Debris removal mission executed by autonomous spacecraft "${design.name}".`}
              </p>
            </div>

            {/* Score & Rank Badge */}
            <div className="flex items-center gap-4">
              <div className="text-right font-mono">
                <span className="text-[10px] text-slate-400 block">
                  {isMn ? 'ИНЖЕНЕРЧЛЭЛИЙН ОНОО' : 'ENGINEERING SCORE'}
                </span>
                <span className="text-3xl font-bold text-emerald-400">{overallScore}/100</span>
              </div>
              <div className={`px-3 py-2 rounded-lg border text-center font-mono ${rankBadgeColor}`}>
                <Award className="w-5 h-5 mx-auto mb-0.5" />
                <span className="text-[10px] font-bold block">{rankTitle}</span>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 font-mono text-xs">
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] block">
                {isMn ? 'УСТГАСАН ХОГ' : 'DEBRIS REMOVED'}
              </span>
              <span className="text-white font-bold text-base">{target.massKg.toLocaleString()} kg</span>
              <span className="text-emerald-400 text-[10px] block">
                {isMn ? '100% Аюулгүй болгосон' : '100% Neutralized'}
              </span>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] block">
                {isMn ? 'ЗАРЦУУЛСАН ТҮЛШ' : 'PROPELLANT USED'}
              </span>
              <span className="text-amber-400 font-bold text-base">{Math.round(fuelConsumedKg)} kg</span>
              <span className="text-slate-500 text-[10px] block">
                {isMn ? `Үлдсэн: ${Math.round(missionState.fuelRemainingKg)} кг` : `Remaining: ${Math.round(missionState.fuelRemainingKg)} kg`}
              </span>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] block">
                {isMn ? 'ЦАХИЛГААНЫ НӨӨЦ' : 'POWER MARGIN'}
              </span>
              <span className="text-emerald-400 font-bold text-base">+{specs.netPowerMarginW} W</span>
              <span className="text-slate-500 text-[10px] block">
                {isMn ? 'Хүчдэл тасраагүй' : 'Zero Brownouts'}
              </span>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] block">
                {isMn ? 'ДААЛГАВРЫН ӨРТӨГ' : 'MISSION COST'}
              </span>
              <span className="text-sky-300 font-bold text-base">${specs.estimatedTotalCostM}M</span>
              <span className="text-slate-500 text-[10px] block">
                {isMn ? `Шагнал: $${target.rewardBudgetM}M` : `Reward: $${target.rewardBudgetM}M`}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Engineering Debrief Analysis */}
        <div className="aerospace-panel p-6 rounded-xl border-sky-500/30 space-y-4">
          <h2 className="text-sm font-bold text-white tracking-wider font-mono flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            {isMn ? 'НИСЛЭГИЙН УДИРДЛАГЫН ТЕХНИКИЙН ДҮГНЭЛТ' : 'FLIGHT CONTROLLER TECHNICAL DEBRIEF'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Positives */}
            <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-lg space-y-2">
              <div className="font-bold text-emerald-400 font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{isMn ? 'Инженерийн оновчтой шийдвэрүүд:' : 'Commendable Engineering Decisions:'}</span>
              </div>
              <ul className="list-disc pl-4 space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
                {isMn ? (
                  <>
                    <li>
                      <strong>Оновчтой барих механизм:</strong> Сонгосон {design.captureMechanism.nameMn || design.captureMechanism.name} нь хогны эргэлтийн моментийг бүрэн сааруулж, устгалын чиглүүлэгч түлхэлтийн үед бүтцийн бөх батыг ханган ажиллав.
                    </li>
                    <li>
                      <strong>Ойртолтын жигд замнал:</strong> Харьцангуй хурдны зөрүү маш бага (&lt;0.25 м/с) байсан тул хөдөлгүүрийн хийн хүчтэй тийрэлтээр биет савлахаас бүрэн сэргийлэв.
                    </li>
                    <li>
                      <strong>Аюулгүй устгалын сонголт:</strong> {missionState.disposalStrategy === 'reentry' ? 'Номхон далайн Немо цэг рүү чиглүүлсэн агаар мандлын уналт' : 'Оршуулгын тойрог замд гаргах'} нь LEO бүс дэх мөргөлдөөний аюулыг бүрмөсөн арилгав.
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <strong>Effective Capture Sizing:</strong> Chosen {design.captureMechanism.name} safely absorbed target spin and maintained structural rigidity during deorbit towing.
                    </li>
                    <li>
                      <strong>Smooth Relative Approach:</strong> Matched velocities with low closure rate (&lt;0.25 m/s), avoiding costly thruster plume impingement or micro-fragmentation.
                    </li>
                    <li>
                      <strong>Sustainable Disposal Trajectory:</strong> Selected {missionState.disposalStrategy?.toUpperCase()} permanently removes collision hazard from LEO without threatening orbital crews.
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Recommendations for Improvement */}
            <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-lg space-y-2">
              <div className="font-bold text-amber-400 font-mono flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>{isMn ? 'Дараагийн даалгавруудад өгөх зөвлөмж:' : 'Recommendations for Future Missions:'}</span>
              </div>
              <ul className="list-disc pl-4 space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
                {isMn ? (
                  <>
                    <li>
                      <strong>Түлшний нөөц (Delta-V Margin):</strong> Эллипс тойрог зам дахь хяналтгүй эргэлттэй биетүүдийг барихад дор хаяж 15% дельта-v нөөц тооцох нь найдвартай байдлыг нэмэгдүүлнэ.
                    </li>
                    <li>
                      <strong>Мэдрэгчийн хослол (Sensor Fusion):</strong> Оптик камер болон 3D Flash LiDAR-ийг зэрэг ашигласнаар Дэлхийн сүүдэрт (харанхуйд) биетийн цэгэн үүлийг миллиметрийн нарийвчлалтай гаргана.
                    </li>
                    <li>
                      <strong>Массын хэмнэлт:</strong> Цахилгаан ионы хөдөлгүүр (Hall Effect) сонгосноор түлшний массыг ихээхэн хэмнэж, хөөргөх өртгийг бууруулж болно.
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <strong>Propellant Reserve Margin:</strong> Ensure at least 15% delta-v contingency margin when intercepting uncooperative tumbling targets in eccentric orbits.
                    </li>
                    <li>
                      <strong>Sensor Redundancy:</strong> Pairing optical cameras with Flash LiDAR provides superior 3D point cloud accuracy in eclipse shadow.
                    </li>
                    <li>
                      <strong>Mass Fraction Optimization:</strong> Consider high-Isp electric ion thrusters for orbital raising phases to shave launch mass.
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* Environmental Impact Index */}
          <div className="p-4 bg-slate-900/90 rounded-lg border border-slate-800 text-xs font-mono space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">
                {isMn ? 'КЕССЛЕРИЙН СИНДРОМЫН ЭРСДЛИЙГ БУУРУУЛСАН БАЙДАЛ:' : 'GLOBAL KESSLER HAZARD MITIGATION:'}
              </span>
              <span className="text-emerald-400 font-bold">
                {isMn ? 'ӨНДӨР (Тооцооллоор 8,400 хоёрдогч хэлтэрхий үүсэхээс сэргийлэв)' : 'HIGH (Estimated 8,400 secondary fragments prevented)'}
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className="bg-emerald-400 h-full w-[92%]" />
            </div>
            <p className="text-[10px] text-slate-400">
              {isMn
                ? `NASA-ийн Тойрог Замын Хог Хаягдлын Хөтөлбөрийн Оффис (ODPO)-ийн статистик загвараар энэхүү ${target.nameMn || target.name} биетийг устгаснаар ойрын 30 жилийн доторх гинжин мөргөлдөөний эрсдэлийг 25%-иар бууруулж чадлаа.`
                : `According to NASA Orbital Debris Program Office statistical models, removing this ${target.name} object mitigates a 25% 30-year catastrophic cascade risk.`}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            onClick={() => {
              sound.playClick();
              onRedesignSpacecraft();
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isMn ? 'Зохион бүтээх лаборатори руу буцах' : 'Modify Spacecraft in Design Lab'}</span>
          </button>

          <button
            onClick={() => {
              sound.playLockChime();
              onSelectNewMission();
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-[0_0_15px_rgba(56,189,248,0.35)]"
          >
            <span>{isMn ? 'ДАРААГИЙН АЮУЛТАЙ ХОГИЙГ СОНГОХ' : 'SELECT NEXT HAZARDOUS TARGET'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

