/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameStage = 
  | 'cinematic'          // Opening cinematic with Mongolian flag rocket liftoff
  | 'main_menu'          // Main menu with 3D Earth
  | 'mission_control'    // Stage 1: 3D Earth & Debris Inspector
  | 'rocket_lab'         // Stage 2: Rocket Assembly Laboratory
  | 'design_lab'         // Stage 3: Spacecraft Design Laboratory
  | 'launch_config'      // Stage 4: Launch Simulation
  | 'orbital_nav'        // Stage 5: Orbital Navigation & Rendezvous
  | 'target_detection'   // Stage 6: Multi-Spectral Target Detection
  | 'approach_sync'      // Stage 7: Proximity Approach & Synchronization
  | 'debris_capture'     // Stage 8: Robotic Arm / Net Debris Capture
  | 'deorbit_disposal'   // Stage 9: Safe Deorbit & Disposal
  | 'mission_eval';      // Stage 10: Engineering Debrief & Ranks

export type Language = 'mn' | 'en';

export interface DebrisCatalogItem {
  id: string;
  name: string;
  nameMn: string;
  category: 'defunct_sat' | 'rocket_body' | 'fragment' | 'active_sat';
  isRealTracked: boolean; // true = Real Tracked Catalog (NORAD/NASA/ESA), false = Simulated Educational
  catalogNumber?: string;
  altitudeKm: number;
  inclinationDeg: number;
  orbitalVelocityKms: number;
  massKg: number;
  dimensionsM: [number, number, number];
  tumbleRateDegS: number;
  collisionRiskScore: number; // 1 - 100
  hazardLevel: 'NOMINAL' | 'CAUTION' | 'CRITICAL';
  priorityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  descriptionMn: string;
  descriptionEn: string;
}

export interface LaunchVehicle {
  id: string;
  name: string;
  provider: string;
  maxLeoPayloadKg: number;
  fairingDiameterM: number;
  launchCostM: number;
  reliabilityPercent: number;
  compatibleOrbits: string[];
  description: string;
}

export interface MissionTarget {
  id: string;
  code: string; // e.g. "MISSION 01"
  name: string;
  nameMn: string;
  type: 'small_debris' | 'defunct_sat' | 'upper_stage' | 'rotating_debris' | 'multiple_cleanup' | 'protect_sat' | 'high_risk' | 'emergency_conjunction' | 'debris_swarm';
  classification: string;
  classificationMn: string;
  altitudeKm: number;
  inclinationDeg: number;
  massKg: number;
  dimensionsM: [number, number, number];
  tumbleRateDegS: number;
  hazardScore: number; // 1-100
  breakupRisk: string;
  breakupRiskMn: string;
  storyMn: string;
  storyEn: string;
  objectiveMn: string;
  objectiveEn: string;
  historicalContext: string;
  rewardBudgetM: number;
  difficulty: 'Хөнгөн' | 'Дунд' | 'Хүнд' | 'Маш Хүнд';
  recommendedCapture: string;
  recommendedCaptureMn: string;
}

// Rocket Assembly Components
export interface RocketEngine {
  id: string;
  name: string;
  nameMn: string;
  type: 'kerolox' | 'methalox' | 'hydrolox' | 'solid';
  thrustKn: number;
  ispSeconds: number;
  massKg: number;
  costM: number;
  descriptionMn: string;
  descriptionEn: string;
}

export interface RocketTank {
  id: string;
  name: string;
  nameMn: string;
  fuelCapacityKg: number;
  dryMassKg: number;
  diameterM: number;
  costM: number;
  descriptionMn: string;
  descriptionEn: string;
}

export interface RocketFairing {
  id: string;
  name: string;
  nameMn: string;
  diameterM: number;
  heightM: number;
  massKg: number;
  costM: number;
  descriptionMn: string;
  descriptionEn: string;
}

export interface RocketConfig {
  name: string;
  engine: RocketEngine;
  tank: RocketTank;
  fairing: RocketFairing;
  boosterCount: number; // 0, 2, or 4
  hasInterstageGridFins: boolean;
  fuelLoadKg: number;
}

export interface CalculatedRocketSpecs {
  totalDryMassKg: number;
  totalWetMassKg: number;
  totalThrustKn: number;
  twrSeaLevel: number;
  maxPayloadToLeoKg: number;
  deltaVMs: number;
  estimatedLaunchCostM: number;
  isFeasible: boolean;
  feasibilityReasonMn: string;
  feasibilityReasonEn: string;
}

// Spacecraft Assembly Components
export interface BusComponent {
  id: string;
  name: string;
  nameMn: string;
  massKg: number;
  baseCostM: number;
  volumeM3: number;
  powerDrawW: number;
  descriptionMn: string;
  descriptionEn: string;
}

export interface SolarComponent {
  id: string;
  name: string;
  nameMn: string;
  massKg: number;
  powerGenW: number;
  costM: number;
  spanM: number;
  descriptionMn: string;
  descriptionEn: string;
}

export interface PropulsionComponent {
  id: string;
  name: string;
  nameMn: string;
  type: 'chemical_mono' | 'chemical_bi' | 'electric_ion';
  ispSeconds: number;
  thrustN: number;
  engineDryMassKg: number;
  powerDrawW: number;
  costM: number;
  descriptionMn: string;
  descriptionEn: string;
}

export interface RcsComponent {
  id: string;
  name: string;
  nameMn: string;
  thrustN: number;
  ispSeconds: number;
  massKg: number;
  powerDrawW: number;
  costM: number;
  descriptionMn: string;
  descriptionEn: string;
}

export interface SensorComponent {
  id: string;
  name: string;
  nameMn: string;
  type: 'optical' | 'lidar' | 'radar';
  rangeKm: number;
  accuracyCm: number;
  massKg: number;
  powerDrawW: number;
  costM: number;
  descriptionMn: string;
  descriptionEn: string;
}

export interface CaptureComponent {
  id: string;
  name: string;
  nameMn: string;
  type: 'robotic_arm' | 'deployable_net' | 'harpoon' | 'berthing_clamp';
  massKg: number;
  powerDrawW: number;
  costM: number;
  maxDistanceM: number;
  maxTumbleToleranceDegS: number;
  captureReliability: number;
  descriptionMn: string;
  descriptionEn: string;
  prosMn: string;
  consMn: string;
}

export interface SpacecraftDesign {
  name: string;
  bus: BusComponent;
  solar: SolarComponent;
  propulsion: PropulsionComponent;
  rcs: RcsComponent;
  sensors: SensorComponent[];
  captureMechanism: CaptureComponent;
  fuelMassKg: number;
  batteryCapacityWh: number;
}

export interface CalculatedSpecs {
  dryMassKg: number;
  wetMassKg: number;
  powerGenerationW: number;
  powerConsumptionW: number;
  netPowerMarginW: number;
  deltaVMs: number;
  estimatedTotalCostM: number;
  centerOfMassOffsetCm: number;
  overallReliability: number;
}

export interface MissionState {
  selectedMission: MissionTarget;
  rocketConfig: RocketConfig;
  rocketSpecs: CalculatedRocketSpecs;
  design: SpacecraftDesign;
  specs: CalculatedSpecs;
  // Flight telemetry
  currentAltitudeKm: number;
  orbitalVelocityKms: number;
  relativeDistanceM: number;
  relativeVelocityMs: number;
  fuelRemainingKg: number;
  batteryPercent: number;
  targetTumbleRateDegS: number;
  captureAlignmentPct: number;
  isCaptured: boolean;
  disposalStrategy: 'reentry' | 'graveyard' | 'drag_sail' | null;
  flightTimeSeconds: number;
  totalDeltaVExpendedMs: number;
  collisionWarning: boolean;
  captureOutcome?: {
    success: boolean;
    reason: string;
    details: string;
  };
  disposalOutcome?: {
    success: boolean;
    burnDeltaV: number;
    decayYears: number;
    impactZone: string;
  };
}

export interface PlayerProfile {
  creditsM: number;
  xp: number;
  completedMissions: string[];
  rank: 'cadet' | 'juniorEngineer' | 'spaceEngineer' | 'missionCommander' | 'chiefEngineer';
  unlockedComponents: string[];
}
