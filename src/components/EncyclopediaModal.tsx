/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { sound } from '../utils/audio';
import { 
  X, 
  BookOpen, 
  Atom, 
  Cpu, 
  Orbit, 
  Layers, 
  ShieldAlert, 
  Compass, 
  Zap,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface EncyclopediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: import('../types').Language;
}

type TopicId = 'orbital_mechanics' | 'rocket_equation' | 'capture_methods' | 'sensors_navigation' | 'power_balance' | 'kessler_syndrome';

export const EncyclopediaModal: React.FC<EncyclopediaModalProps> = ({ isOpen, onClose, language = 'mn' }) => {
  const [selectedTopic, setSelectedTopic] = useState<TopicId>('orbital_mechanics');
  const isMn = language === 'mn';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[88vh] bg-slate-900 border border-sky-500/30 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sky-500/20 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-sky-400" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide font-mono">
              {isMn
                ? 'САНСРЫН ИНЖЕНЕРЧЛЭЛ БОЛОН ТОЙРОГ ЗАМЫН МЕХАНИКИЙН ГАР АВЛАГА'
                : 'AEROSPACE ENGINEERING & ORBITAL DYNAMICS MANUAL'}
            </h2>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Topics Sidebar */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/50 p-3 space-y-1 overflow-y-auto">
            <button
              onClick={() => { sound.playClick(); setSelectedTopic('orbital_mechanics'); }}
              className={`w-full text-left px-3 py-2.5 rounded text-xs font-mono flex items-center gap-2.5 transition-colors ${
                selectedTopic === 'orbital_mechanics'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Orbit className="w-4 h-4 text-sky-400 shrink-0" />
              <span>{isMn ? '1. Тойрог замын динамик' : '1. Orbital Mechanics & Transfers'}</span>
            </button>

            <button
              onClick={() => { sound.playClick(); setSelectedTopic('rocket_equation'); }}
              className={`w-full text-left px-3 py-2.5 rounded text-xs font-mono flex items-center gap-2.5 transition-colors ${
                selectedTopic === 'rocket_equation'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Atom className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{isMn ? '2. Циолковскийн тэгшитгэл' : '2. Tsiolkovsky Rocket Equation'}</span>
            </button>

            <button
              onClick={() => { sound.playClick(); setSelectedTopic('capture_methods'); }}
              className={`w-full text-left px-3 py-2.5 rounded text-xs font-mono flex items-center gap-2.5 transition-colors ${
                selectedTopic === 'capture_methods'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Layers className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{isMn ? '3. Барих механизмууд' : '3. Capture Mechanisms'}</span>
            </button>

            <button
              onClick={() => { sound.playClick(); setSelectedTopic('sensors_navigation'); }}
              className={`w-full text-left px-3 py-2.5 rounded text-xs font-mono flex items-center gap-2.5 transition-colors ${
                selectedTopic === 'sensors_navigation'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Compass className="w-4 h-4 text-purple-400 shrink-0" />
              <span>{isMn ? '4. Лидар & Навигаци' : '4. LiDAR & Relative Navigation'}</span>
            </button>

            <button
              onClick={() => { sound.playClick(); setSelectedTopic('power_balance'); }}
              className={`w-full text-left px-3 py-2.5 rounded text-xs font-mono flex items-center gap-2.5 transition-colors ${
                selectedTopic === 'power_balance'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Zap className="w-4 h-4 text-yellow-400 shrink-0" />
              <span>{isMn ? '5. Цахилгаан чадал' : '5. Electrical Power Balance'}</span>
            </button>

            <button
              onClick={() => { sound.playClick(); setSelectedTopic('kessler_syndrome'); }}
              className={`w-full text-left px-3 py-2.5 rounded text-xs font-mono flex items-center gap-2.5 transition-colors ${
                selectedTopic === 'kessler_syndrome'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{isMn ? '6. Кесслерийн хам шинж' : '6. Kessler Syndrome Threat'}</span>
            </button>
          </div>

          {/* Topic Detail View */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
            {selectedTopic === 'orbital_mechanics' && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono">
                    <Orbit className="w-5 h-5 text-sky-400" />
                    {isMn ? 'Тойрог замын механик & Ойртолтын динамик' : 'Orbital Mechanics & Rendezvous Dynamics'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {isMn
                      ? 'Дэлхийг тойрох биетүүдийн хөдөлгөөний хууль, Кеплерийн зарчим, Гоманы шилжилтийн тооцоо.'
                      : 'Fundamental equations governing spacecraft motion around Earth (Keplerian orbits and Hohmann transfers).'}
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-lg border border-sky-500/20 font-mono text-xs space-y-2">
                  <div className="text-sky-300 font-bold">{isMn ? '1. Тойрог замын шугаман хурд' : '1. Circular Orbital Velocity'}</div>
                  <div className="text-emerald-400 text-sm font-bold">v = √(GM / r)</div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {isMn
                      ? 'Энд G = 6.674×10⁻¹¹ м³/(кг·с²), Дэлхийн масс M = 5.972×10²⁴ кг, геоцентрик гравитацийн тогтмол μ = GM ≈ 398,600 км³/с², радиус r = R_дэлхий + өндөр. Дэлхийн гадаргаас 700 км өндөрт тойрог замын хурд ~7.50 км/с (27,000 км/ц) байдаг.'
                      : 'Where G = 6.674×10⁻¹¹ m³/(kg·s²), M_Earth = 5.972×10²⁴ kg, μ = GM ≈ 398,600 km³/s², and r = R_Earth + altitude. At 700 km LEO, orbital speed is approximately 7.50 km/s (27,000 km/h).'}
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-lg border border-sky-500/20 font-mono text-xs space-y-2">
                  <div className="text-sky-300 font-bold">{isMn ? '2. Тойрох хугацаа (Кеплерийн 3-р хууль)' : "2. Orbital Period (Kepler's Third Law)"}</div>
                  <div className="text-emerald-400 text-sm font-bold">T = 2π √(r³ / GM)</div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {isMn
                      ? 'Доод тойрог замд байгаа хөлөг өндөрт буй биетээс хурдан тойрдог (~90-100 минут). Иймээс урд талын хогийг гүйцэхийн тулд хөлгөө эхлээд эсрэг чиглэлд түлхэж тойрог замаа намсган, илүү өндөр хурдаар тойрон гүйцдэг!'
                      : 'Satellites at lower orbits travel faster and complete revolutions in shorter time (~90-100 minutes in LEO). To catch up to a target ahead in orbit, counterintuitively, you must fire retrograde to lower your altitude and orbit faster!'}
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-lg border border-sky-500/20 font-mono text-xs space-y-2">
                  <div className="text-sky-300 font-bold">{isMn ? '3. Гоманы шилжилтийн түлхэлт (Hohmann Transfer)' : '3. Hohmann Transfer Injection'}</div>
                  <div className="text-emerald-400 text-sm font-bold">Δv₁ = √(μ/r₁) · (√(2r₂ / (r₁ + r₂)) - 1)</div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {isMn
                      ? 'Хоёр өөр өндөртэй тойрог замын хооронд шилжих хамгийн бага түлш зарцуулдаг 2 үе шаттай маневр. Шилжилтийн эллипсийн их хагас тэнхлэг a_tx = (r₁ + r₂)/2 болно.'
                      : 'Two impulsive burns to transfer between coplanar circular orbits. The semi-major axis is a_tx = (r₁ + r₂)/2.'}
                  </p>
                </div>
              </div>
            )}

            {selectedTopic === 'rocket_equation' && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono">
                    <Atom className="w-5 h-5 text-emerald-400" />
                    {isMn ? 'Циолковскийн тэгшитгэл & Пуужингийн тооцоо' : 'Tsiolkovsky Rocket Equation & Propellant Sizing'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {isMn
                      ? 'Хөдөлгүүрийн хувийн импульс (Isp) болон массын харьцаа нь нийт Дельта-V (хурдны өөрчлөлт)-ийг хэрхэн тодорхойлдог вэ.'
                      : 'How engine specific impulse (Isp) and mass fraction determine total maneuvering Delta-V.'}
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-lg border border-emerald-500/20 font-mono text-xs space-y-2">
                  <div className="text-emerald-300 font-bold">{isMn ? 'Пуужингийн үндсэн тэгшитгэл' : 'The Fundamental Rocket Equation'}</div>
                  <div className="text-emerald-400 text-sm font-bold">Δv = I_sp · g₀ · ln(m₀ / m_f)</div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {isMn ? (
                      <>
                        Тэмдэглэгээ:
                        <br />• m₀ = Нийт хөөргөх масс (Хуурай масс + Түлшний масс)
                        <br />• m_f = Түлш дууссаны дараах хуурай масс
                        <br />• I_sp = Хөдөлгүүрийн хувийн импульс секундээр (хийн гарах хурд / g₀)
                        <br />• g₀ = 9.80665 м/с² (Дэлхийн далайн түвшний чөлөөт уналтын хурдатгал)
                      </>
                    ) : (
                      <>
                        Where:
                        <br />• m₀ = Total initial wet mass (Dry mass + Fuel mass)
                        <br />• m_f = Final dry mass after propellant depletion
                        <br />• I_sp = Specific impulse in seconds (effective exhaust velocity divided by g₀)
                        <br />• g₀ = 9.80665 m/s² (standard Earth sea-level acceleration)
                      </>
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-950 rounded border border-slate-800">
                    <div className="font-bold text-amber-400 mb-1">
                      {isMn ? 'Химийн хоёр бүрэлдэхүүнт (MMH/NTO)' : 'Chemical Bi-Propellant (MMH/NTO)'}
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      {isMn
                        ? 'Isp ~ 310–325 сек. Маш их түлхэх хүчтэй (450 Ньютон). Тойрог замыг хэдхэн минутад огцом өөрчлөх боломжтой боловч их хэмжээний түлшний масс шаардана.'
                        : 'Isp ~ 310–325 s. High thrust (450 N). Allows rapid orbit transfers in minutes, but consumes more fuel mass.'}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded border border-slate-800">
                    <div className="font-bold text-cyan-400 mb-1">
                      {isMn ? 'Цахилгаан ионы хөдөлгүүр (Hall Effect Xenon)' : 'Electric Xenon Ion (Hall Effect)'}
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      {isMn
                        ? 'Isp ~ 1,850–2,200 сек. Хэт өндөр түлшний үр ашигтай (500+ кг масс хэмнэнэ), гэвч маш сул түлхэх хүчтэй (0.28 Ньютон) тул өдрүүдийн турш тасралтгүй ажилладаг.'
                        : 'Isp ~ 1,850–2,200 s. Ultra-high fuel efficiency (mass savings 500+ kg), but tiny thrust (0.28 N) requiring days of continuous burns.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selectedTopic === 'capture_methods' && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono">
                    <Layers className="w-5 h-5 text-amber-400" />
                    {isMn ? 'Бие даасан хог барих механизмууд' : 'Autonomous Debris Capture Mechanisms'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {isMn
                      ? 'Хатуу болон уян барих системийн аэрокосмийн харьцуулсан үзүүлэлтүүд (NASA & ESA стандартууд).'
                      : 'Comparative aerospace trade-offs between rigid and non-rigid capture architectures.'}
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-950 rounded border border-slate-800">
                    <div className="font-bold text-sky-400 mb-1 flex items-center justify-between">
                      <span>{isMn ? '7-Үет Робот Гар (Articulated Robotic Arm)' : '7-DOF Articulated Robotic Arm'}</span>
                      <span className="text-[10px] text-emerald-400">TRL 8 (Сансарт туршигдсан)</span>
                    </div>
                    <p className="text-slate-300 mb-2 text-[11px] leading-relaxed">
                      {isMn
                        ? 'Хиймэл дагуулын бэхэлгээний хүрээ эсвэл хөдөлгүүрийн хошууг хавчин барьж түгждэг өндөр нарийвчлалтай гар (Astroscale, ClearSpace).'
                        : 'Precision multi-jointed arm that locks onto satellite grapple fixtures or apogee engine rings (e.g. Astroscale, ClearSpace).'}
                    </p>
                    <div className="flex gap-4 text-[11px]">
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {isMn ? 'Устгалын үед хатуу бат бэх удирдлагатай' : 'Rigid deorbit control'}
                      </span>
                      <span className="text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {isMn ? 'Эргэлтийн хурд > 4.5°/с бол барьж чадахгүй' : 'Fails if tumble > 4.5°/s'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded border border-slate-800">
                    <div className="font-bold text-amber-400 mb-1 flex items-center justify-between">
                      <span>{isMn ? 'Дэлгэгддэг Кевлар Тор (Kevlar / Dyneema Net)' : 'Deployable Kevlar / Dyneema Net'}</span>
                      <span className="text-[10px] text-emerald-400">TRL 7 (RemoveDEBRIS)</span>
                    </div>
                    <p className="text-slate-300 mb-2 text-[11px] leading-relaxed">
                      {isMn
                        ? 'Булангууддаа хүндрүүлэгчтэй торыг буудаж, огцом эргэлттэй, жигд бус хэлбэртэй хогийг бүхэлд нь ороож барьдаг.'
                        : 'Canister fires weighted corners that expand in space to envelop erratic spinning fragments.'}
                    </p>
                    <div className="flex gap-4 text-[11px]">
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {isMn ? '12°/с хүртэлх хурдтай эргэлтийг тэсвэрлэнэ' : 'Tolerates up to 12°/s tumble'}
                      </span>
                      <span className="text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {isMn ? 'Түлхэлтийн үед татлага савлах эрсдэлтэй' : 'Tether oscillations during burns'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded border border-slate-800">
                    <div className="font-bold text-rose-400 mb-1 flex items-center justify-between">
                      <span>{isMn ? 'Кинетик Сэрээ (Kinetic Harpoon Penetrator)' : 'Kinetic Harpoon Penetrator'}</span>
                      <span className="text-[10px] text-emerald-400">TRL 6</span>
                    </div>
                    <p className="text-slate-300 mb-2 text-[11px] leading-relaxed">
                      {isMn
                        ? '25 метрийн зайнаас титан хошуутай сэрээг хийн даралтаар харваж хогны металл ханыг нэвтлэн бэхэлгээ үүсгэдэг.'
                        : 'Fires a hardened titanium barb into structural panels from up to 25m standoff distance.'}
                    </p>
                    <div className="flex gap-4 text-[11px]">
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {isMn ? 'Хамгийн алсын зайнаас ажиллах боломж' : 'Longest standoff range'}
                      </span>
                      <span className="text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {isMn ? 'Нэвтлэх үед жижиг хэлтэрхий үүсгэх эрсдэлтэй' : 'Risk of secondary fragment generation'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedTopic === 'sensors_navigation' && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono">
                    <Compass className="w-5 h-5 text-purple-400" />
                    {isMn ? 'Харьцангуй навигаци & 3D Flash LiDAR' : 'Relative Navigation & 3D Flash LiDAR'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {isMn
                      ? 'Дэлхийн сүүдэр болон нарны шууд тусгалд хяналтгүй эргэлдэх биетийг таних мэдрэгчүүдийн нийлэгжилт.'
                      : 'Close proximity sensors for non-cooperative target tracking in orbital darkness and sunlight.'}
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-lg border border-purple-500/20 text-xs space-y-2">
                  <div className="text-purple-300 font-bold">{isMn ? 'Энгийн GPS яагаад хангалтгүй вэ?' : 'Why Standard GPS is Not Enough'}</div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {isMn
                      ? 'Сансрын ашиглалтаас гарсан хог хаягдлууд нь байршлын дохио дамжуулагчгүй (хамтран ажиллах чадваргүй биетүүд) байдаг. Иймээс баригч хөлөг өөрийн мэдрэгчүүдийн хослолд тулгуурлана:'
                      : 'Derelict space objects do not transmit transponder telemetry (they are non-cooperative). The chaser spacecraft must rely on onboard sensor fusion:'}
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px] leading-relaxed">
                    {isMn ? (
                      <>
                        <li><strong>Холын зай (&gt; 15 км):</strong> Доплер хурдыг хэмжих X-диапазоны фазчилсан антентай радар.</li>
                        <li><strong>Дунд зай (1 км - 100 м):</strong> Нарны гэрэл дэх өнцгийн байрлалыг тодорхойлох оптик камер ба одны мэдрэгч.</li>
                        <li><strong>Ойрын зай (&lt; 50 м):</strong> Flash Time-of-Flight LiDAR нь миллиметрийн нарийвчлалтай 3D цэгэн үүл (point cloud) үүсгэж, Дэлхийн сүүдэрт ч биетийн масс төв, эргэлтийн тэнхлэгийг бодит цагт тооцоолно.</li>
                      </>
                    ) : (
                      <>
                        <li><strong>Long Range (&gt; 15 km):</strong> X-band Phased Array Radar for Doppler relative velocity.</li>
                        <li><strong>Medium Range (1 km - 100 m):</strong> Optical cameras for line-of-sight bearing and star identification.</li>
                        <li><strong>Close Proximity (&lt; 50 m):</strong> Flash Time-of-Flight LiDAR generates millimeter-accurate 3D point clouds to estimate the target's center of mass and rotation axis even during orbital eclipse (Earth's shadow).</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            )}

            {selectedTopic === 'power_balance' && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    {isMn ? 'Цахилгаан эрчим хүчний баланс' : 'Electrical Power Balance & Solar Incidence'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {isMn
                      ? 'Нарны хавтангийн үйлдвэрлэл ба бортын дэд системүүдийн хэрэглээ хоорондын эерэг балансыг хадгалах.'
                      : 'Maintaining positive power margin between photovoltaic generation and avionics consumption.'}
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-lg border border-yellow-500/20 font-mono text-xs space-y-2">
                  <div className="text-yellow-300 font-bold">{isMn ? 'Чадал тэнцвэрийн тэгшитгэл' : 'Power Balance Equation'}</div>
                  <div className="text-emerald-400 text-sm font-bold">P_net = P_generated - Σ(P_subsystems)</div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {isMn
                      ? 'Хэрэв P_net < 0 Ватт бол хөлөг бортын лити-ион зайн нөөцийг шавхаж, удирдлагагүй унтрах аюулд орно. Цахилгаан ионы хөдөлгүүртэй хөлөгт наад зах нь 2,000+ Ватт хүчин чадалтай эргэдэг нарны далавч шаардлагатай.'
                      : 'If P_net < 0 W, the spacecraft will drain its onboard lithium-ion batteries and suffer an unrecoverable electrical brownout. Electric propulsion requires high-yield articulated solar wings (> 2,000 W) to power ion beam accelerators.'}
                  </p>
                </div>
              </div>
            )}

            {selectedTopic === 'kessler_syndrome' && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono">
                    <ShieldAlert className="w-5 h-5 text-rose-400" />
                    {isMn ? 'Кесслерийн хам шинж ба Сансрын тогтвортой байдал' : 'The Kessler Syndrome & Orbital Sustainability'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {isMn
                      ? 'Яагаад тойрог замын хогийг зайлуулах нь сансар судлалын ирээдүйд нэн чухал болох нь.'
                      : 'Why active debris removal is critical for the future of space exploration.'}
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-lg border border-rose-500/20 text-xs space-y-3">
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {isMn
                      ? '1978 онд NASA-ийн астрофизикч Доналд Ж. Кесслерийн дэвшүүлсэн Кесслерийн хам шинж нь Дэлхийн нам тойрог зам дахь биетүүдийн нягтрал хэт ихэссэнээр мөргөлдөөн бүр шинэ хэлтэрхийнүүдийг үүсгэж, улмаар гинжин урвал явагдах үзэгдлийг тайлбарладаг.'
                      : 'Proposed in 1978 by NASA astrophysicist Donald J. Kessler, the Kessler Syndrome describes a scenario where the density of objects in Low Earth Orbit (LEO) becomes high enough that collisions produce cascades of high-velocity fragments.'}
                  </p>

                  {/* NASA ODPO 36,500 Official Census Box */}
                  <div className="p-3 bg-slate-900/90 rounded border border-sky-500/30 text-[11px] space-y-1.5 font-mono">
                    <div className="text-sky-400 font-bold flex items-center justify-between">
                      <span>{isMn ? 'NASA ODPO & ESA ТОЙРОГ ЗАМЫН БҮРТГЭЛ:' : 'NASA ODPO & ESA TRACKED CENSUS:'}</span>
                      <span className="text-emerald-400">36,500 {isMn ? 'Биет (>10см)' : 'Objects (>10cm)'}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-300 pt-1">
                      <div className="p-1.5 bg-slate-950 rounded border border-emerald-500/30">
                        <span className="text-emerald-400 font-bold block">10,000</span>
                        <span className="text-[9px] text-slate-400">{isMn ? 'Идэвхтэй дагуул' : 'Active Sats'}</span>
                      </div>
                      <div className="p-1.5 bg-slate-950 rounded border border-amber-500/30">
                        <span className="text-amber-400 font-bold block">3,500</span>
                        <span className="text-[9px] text-slate-400">{isMn ? 'Ашиглалтгүй дагуул' : 'Defunct Sats'}</span>
                      </div>
                      <div className="p-1.5 bg-slate-950 rounded border border-purple-500/30">
                        <span className="text-purple-400 font-bold block">2,200</span>
                        <span className="text-[9px] text-slate-400">{isMn ? 'Пуужингийн шат' : 'Rocket Bodies'}</span>
                      </div>
                      <div className="p-1.5 bg-slate-950 rounded border border-rose-500/30">
                        <span className="text-rose-400 font-bold block">20,800</span>
                        <span className="text-[9px] text-slate-400">{isMn ? 'Мөргөлдөөний хог' : 'Fragments'}</span>
                      </div>
                    </div>
                    <div className="text-[9.5px] text-slate-400 pt-1">
                      {isMn
                        ? 'Нэмэлт судалгаагаар 1-10 см хэмжээтэй 1,000,000+ илрээгүй аюултай биет, 130 сая гаруй бичил ширхэг 7-8 км/с хурдтай эргэлдэж байна.'
                        : 'Additionally, models estimate ~1,000,000 untracked objects (1-10 cm) and over 130 million micro-debris particles (<1 cm) hurtling at 7-8 km/s.'}
                    </div>
                  </div>

                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {isMn
                      ? 'Мөргөлдөөн бүр ~10 км/с харьцангуй хурдтай бууны сум шиг олон мянган хэлтэрхий цацдаг. Эдгээр хэлтэрхий бусад хиймэл дагуулыг онож сүйтгэснээр Дэлхийн нам тойрог зам олон үеийн турш ашиглах боломжгүй болох эрсдэлтэй.'
                      : 'Each collision generates thousands of bullet-like shards (traveling at ~10 km/s relative speed). These fragments then collide with other satellites, triggering an exponential runaway reaction that could render essential orbital altitudes unusable for generations.'}
                  </p>
                  <div className="p-3 bg-slate-900 rounded border border-slate-800 text-[11px] leading-relaxed">
                    <span className="text-emerald-400 font-bold">
                      {isMn ? 'NASA болон IADC-ийн зөвлөмж:' : 'NASA & IADC Recommendation:'}
                    </span>{' '}
                    {isMn
                      ? 'Жил бүр Envisat ангиллын эвдэрсэн том дагуул болон пуужингийн дээд шатуудаас 5-10 биетийг тойрог замаас татан буулгаж устгаснаар гинжин мөргөлдөөнийг бүрэн зогсоож чадна.'
                      : 'Removing just 5 to 10 massive derelict objects (such as dead Envisat-class satellites and abandoned rocket upper stages) each year stabilizes the orbital debris environment and prevents runaway cascade.'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/90 flex justify-between items-center text-xs font-mono text-slate-400">
          <span>{isMn ? 'NASA Сансрын Апп Асуудал 2026 // CH-13 Лавлах' : 'NASA Space Apps Challenge 2026 // CH-13 Reference Guide'}</span>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold transition-colors"
          >
            {isMn ? 'Гарын авлагыг хаах' : 'Close Manual'}
          </button>
        </div>
      </div>
    </div>
  );
};

