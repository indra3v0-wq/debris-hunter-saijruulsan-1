/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  GameStage, 
  Language, 
  MissionState, 
  MissionTarget, 
  SpacecraftDesign, 
  RocketConfig, 
  PlayerProfile 
} from './types';
import { 
  MISSIONS, 
  DEFAULT_DESIGN, 
  DEFAULT_ROCKET_CONFIG 
} from './simulation/data';
import { 
  evaluateSpacecraftDesign, 
  evaluateRocketConfig 
} from './simulation/orbitalPhysics';
import { OpeningCinematic } from './components/OpeningCinematic';
import { MainMenu } from './components/MainMenu';
import { Header } from './components/Header';
import { EncyclopediaModal } from './components/EncyclopediaModal';
import { StageMissionControl } from './components/StageMissionControl';
import { StageRocketLab } from './components/StageRocketLab';
import { StageDesignLab } from './components/StageDesignLab';
import { StageLaunch } from './components/StageLaunch';
import { StageOrbitalNav } from './components/StageOrbitalNav';
import { StageDetection } from './components/StageDetection';
import { StageApproach } from './components/StageApproach';
import { StageCapture } from './components/StageCapture';
import { StageDisposal } from './components/StageDisposal';
import { StageEvaluation } from './components/StageEvaluation';
import { AiAssistantWidget } from './components/AiAssistantWidget';
import { sound } from './utils/audio';

export default function App() {
  const [language, setLanguage] = useState<Language>('mn'); // Primary game language: Mongolian
  const [currentStage, setCurrentStage] = useState<GameStage>('cinematic'); // Starts with cinematic
  const [isEncyclopediaOpen, setIsEncyclopediaOpen] = useState<boolean>(false);
  const [budgetM, setBudgetM] = useState<number>(240);

  const [playerProfile, setPlayerProfile] = useState<PlayerProfile>({
    creditsM: 240,
    xp: 1250,
    completedMissions: [],
    rank: 'spaceEngineer',
    unlockedComponents: ['eng_merlin', 'tank_standard', 'bus_standard'],
  });

  const [missionState, setMissionState] = useState<MissionState>(() => {
    const scSpecs = evaluateSpacecraftDesign(DEFAULT_DESIGN);
    const rkSpecs = evaluateRocketConfig(DEFAULT_ROCKET_CONFIG, scSpecs.wetMassKg);
    return {
      selectedMission: MISSIONS[0],
      rocketConfig: DEFAULT_ROCKET_CONFIG,
      rocketSpecs: rkSpecs,
      design: DEFAULT_DESIGN,
      specs: scSpecs,
      currentAltitudeKm: 520,
      orbitalVelocityKms: 7.61,
      relativeDistanceM: 750000,
      relativeVelocityMs: 12.5,
      fuelRemainingKg: DEFAULT_DESIGN.fuelMassKg,
      batteryPercent: 100,
      targetTumbleRateDegS: MISSIONS[0].tumbleRateDegS,
      captureAlignmentPct: 20,
      isCaptured: false,
      disposalStrategy: null,
      flightTimeSeconds: 0,
      totalDeltaVExpendedMs: 0,
      collisionWarning: false,
    };
  });

  const handleUpdateRocketConfig = (newRocketConfig: RocketConfig) => {
    const rkSpecs = evaluateRocketConfig(newRocketConfig, missionState.specs.wetMassKg);
    setMissionState(prev => ({
      ...prev,
      rocketConfig: newRocketConfig,
      rocketSpecs: rkSpecs,
    }));
  };

  const handleUpdateDesign = (newDesign: SpacecraftDesign) => {
    const newSpecs = evaluateSpacecraftDesign(newDesign);
    const rkSpecs = evaluateRocketConfig(missionState.rocketConfig, newSpecs.wetMassKg);
    setMissionState(prev => ({
      ...prev,
      design: newDesign,
      specs: newSpecs,
      rocketSpecs: rkSpecs,
      fuelRemainingKg: newDesign.fuelMassKg,
    }));
  };

  const handleUpdateMissionState = (partial: Partial<MissionState>) => {
    setMissionState(prev => ({
      ...prev,
      ...partial,
    }));
  };

  const handleSelectMission = (mission: MissionTarget) => {
    setMissionState(prev => ({
      ...prev,
      selectedMission: mission,
      targetTumbleRateDegS: mission.tumbleRateDegS,
    }));
  };

  const handleResetMission = () => {
    const specs = evaluateSpacecraftDesign(missionState.design);
    setMissionState(prev => ({
      ...prev,
      currentAltitudeKm: 520,
      orbitalVelocityKms: 7.61,
      relativeDistanceM: 750000,
      relativeVelocityMs: 12.5,
      fuelRemainingKg: prev.design.fuelMassKg,
      batteryPercent: 100,
      isCaptured: false,
      disposalStrategy: null,
      captureOutcome: undefined,
      disposalOutcome: undefined,
    }));
    setCurrentStage('main_menu');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* Opening Cinematic (Full Screen) */}
      {currentStage === 'cinematic' && (
        <OpeningCinematic
          language={language}
          onEnterGame={() => setCurrentStage('main_menu')}
        />
      )}

      {/* Main Header (Visible outside cinematic) */}
      {currentStage !== 'cinematic' && (
        <Header
          currentStage={currentStage}
          language={language}
          onSetLanguage={setLanguage}
          onSelectStage={(stage) => setCurrentStage(stage)}
          onOpenAcademy={() => setIsEncyclopediaOpen(true)}
          onResetMission={handleResetMission}
          budgetM={budgetM}
        />
      )}

      {/* Main Content Viewport */}
      {currentStage !== 'cinematic' && (
        <main className="flex-1 relative">
          {/* Main Menu */}
          {currentStage === 'main_menu' && (
            <MainMenu
              language={language}
              onSetLanguage={setLanguage}
              onNavigateStage={(st) => setCurrentStage(st)}
              onOpenAcademy={() => setIsEncyclopediaOpen(true)}
              playerProfile={playerProfile}
              budgetM={budgetM}
            />
          )}

          {/* Stage 1: Mission Control & Debris Map */}
          {currentStage === 'mission_control' && (
            <StageMissionControl
              language={language}
              missionState={missionState}
              onSelectMission={handleSelectMission}
              onProceedToRocketLab={() => setCurrentStage('rocket_lab')}
            />
          )}

          {/* Stage 2: Rocket Assembly Lab */}
          {currentStage === 'rocket_lab' && (
            <StageRocketLab
              language={language}
              rocketConfig={missionState.rocketConfig}
              rocketSpecs={missionState.rocketSpecs}
              spacecraftSpecs={missionState.specs}
              budgetM={budgetM}
              onUpdateRocketConfig={handleUpdateRocketConfig}
              onProceedToSpacecraft={() => setCurrentStage('design_lab')}
              onProceedToLaunch={() => setCurrentStage('launch_config')}
            />
          )}

          {/* Stage 3: Spacecraft Design Lab */}
          {currentStage === 'design_lab' && (
            <StageDesignLab
              language={language}
              design={missionState.design}
              specs={missionState.specs}
              budgetM={budgetM}
              onUpdateDesign={handleUpdateDesign}
              onProceedToLaunch={() => setCurrentStage('launch_config')}
            />
          )}

          {/* Stage 4: Launch Simulation (Uses the exact player assembled rocket) */}
          {currentStage === 'launch_config' && (
            <StageLaunch
              language={language}
              rocketConfig={missionState.rocketConfig}
              rocketSpecs={missionState.rocketSpecs}
              design={missionState.design}
              specs={missionState.specs}
              onLaunchComplete={() => setCurrentStage('target_detection')}
            />
          )}

          {/* Stage 5: Orbital Navigation */}
          {currentStage === 'orbital_nav' && (
            <StageOrbitalNav
              language={language}
              missionState={missionState}
              onUpdateState={handleUpdateMissionState}
              onProceedToDetection={() => setCurrentStage('target_detection')}
            />
          )}

          {/* Stage 6: Multi-Spectral Target Detection & Orbital Radar */}
          {currentStage === 'target_detection' && (
            <StageDetection
              language={language}
              missionState={missionState}
              onSelectTarget={handleSelectMission}
              onProceedToApproach={() => setCurrentStage('approach_sync')}
            />
          )}

          {/* Stage 7: Proximity Approach & Synchronization */}
          {currentStage === 'approach_sync' && (
            <StageApproach
              language={language}
              missionState={missionState}
              onUpdateState={handleUpdateMissionState}
              onProceedToCapture={() => setCurrentStage('debris_capture')}
            />
          )}

          {/* Stage 8: Debris Capture (Robotic Arm / Net) */}
          {currentStage === 'debris_capture' && (
            <StageCapture
              language={language}
              missionState={missionState}
              onUpdateState={handleUpdateMissionState}
              onProceedToDisposal={() => setCurrentStage('deorbit_disposal')}
              onIncrementCapturedCount={() => {
                setPlayerProfile(prev => ({
                  ...prev,
                  xp: prev.xp + 500,
                  completedMissions: [...prev.completedMissions, missionState.selectedMission.id],
                }));
              }}
            />
          )}

          {/* Stage 9: Deorbit & Disposal */}
          {currentStage === 'deorbit_disposal' && (
            <StageDisposal
              language={language}
              missionState={missionState}
              onUpdateState={handleUpdateMissionState}
              onProceedToEvaluation={() => {
                setBudgetM(b => b + missionState.selectedMission.rewardBudgetM);
                setCurrentStage('mission_eval');
              }}
            />
          )}

          {/* Stage 10: Mission Evaluation & Engineering Debrief */}
          {currentStage === 'mission_eval' && (
            <StageEvaluation
              language={language}
              missionState={missionState}
              onSelectNewMission={() => {
                handleResetMission();
                setCurrentStage('mission_control');
              }}
              onRedesignSpacecraft={() => {
                setCurrentStage('design_lab');
              }}
            />
          )}

          {/* Mongolian-Speaking SANSAR-AI Assistant Widget */}
          <AiAssistantWidget
            language={language}
            currentStage={currentStage}
            missionState={missionState}
          />
        </main>
      )}

      {/* Engineering Academy / Aerospace Manual Modal */}
      <EncyclopediaModal
        isOpen={isEncyclopediaOpen}
        onClose={() => setIsEncyclopediaOpen(false)}
        language={language}
      />
    </div>
  );
}
