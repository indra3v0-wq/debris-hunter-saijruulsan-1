/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SpacecraftDesign, CalculatedSpecs } from '../types';

// Standard Physical Constants
export const CONSTANTS = {
  // Earth standard gravitational parameter mu = GM (km^3/s^2)
  EARTH_MU: 398600.4418,
  // Earth volumetric mean radius (km)
  EARTH_RADIUS_KM: 6371.0,
  // Standard gravity at sea level (m/s^2)
  G0: 9.80665,
  // Speed of light (m/s)
  C: 299792458,
  // Geostationary altitude (km)
  GEO_ALTITUDE_KM: 35786.0,
  // Low Earth Orbit nominal ceiling (km)
  LEO_CEILING_KM: 2000.0,
};

/**
 * Calculates circular orbital velocity at given altitude.
 * Formula: v = sqrt(mu / r)
 * @param altitudeKm Altitude above Earth's mean surface in km
 * @returns Velocity in km/s and m/s
 */
export function calculateOrbitalVelocity(altitudeKm: number): { kms: number; ms: number } {
  const r = CONSTANTS.EARTH_RADIUS_KM + altitudeKm;
  const vKms = Math.sqrt(CONSTANTS.EARTH_MU / r);
  return {
    kms: vKms,
    ms: vKms * 1000,
  };
}

/**
 * Calculates circular orbital period at given altitude.
 * Formula: T = 2 * pi * sqrt(r^3 / mu)
 * @param altitudeKm Altitude in km
 * @returns Period in seconds and minutes
 */
export function calculateOrbitalPeriod(altitudeKm: number): { seconds: number; minutes: number } {
  const r = CONSTANTS.EARTH_RADIUS_KM + altitudeKm;
  const tSeconds = 2 * Math.PI * Math.sqrt(Math.pow(r, 3) / CONSTANTS.EARTH_MU);
  return {
    seconds: tSeconds,
    minutes: tSeconds / 60,
  };
}

/**
 * Calculates total Delta-V using Tsiolkovsky's Rocket Equation:
 * Delta_v = Isp * g0 * ln(m0 / mf)
 * @param dryMassKg Spacecraft dry mass (mf)
 * @param fuelMassKg Propellant mass
 * @param ispSeconds Specific impulse in seconds
 * @returns Delta-V in m/s
 */
export function calculateDeltaV(dryMassKg: number, fuelMassKg: number, ispSeconds: number): number {
  if (fuelMassKg <= 0 || dryMassKg <= 0) return 0;
  const m0 = dryMassKg + fuelMassKg;
  const mf = dryMassKg;
  return ispSeconds * CONSTANTS.G0 * Math.log(m0 / mf);
}

/**
 * Calculates fuel consumed for a desired Delta-V maneuver:
 * mf = m0 / exp(Delta_v / (Isp * g0))
 * delta_m = m0 - mf
 */
export function calculateFuelRequired(currentTotalMassKg: number, deltaVMs: number, ispSeconds: number): number {
  const c = ispSeconds * CONSTANTS.G0;
  const mf = currentTotalMassKg / Math.exp(deltaVMs / c);
  return Math.max(0, currentTotalMassKg - mf);
}

/**
 * Computes a standard Hohmann Transfer between two circular coplanar orbits.
 * @param r1Km Initial orbit radius (from Earth center)
 * @param r2Km Target orbit radius (from Earth center)
 */
export function calculateHohmannTransfer(r1Km: number, r2Km: number): {
  deltaV1Ms: number;
  deltaV2Ms: number;
  totalDeltaVMs: number;
  transferTimeMinutes: number;
  semiMajorAxisKm: number;
} {
  const a = (r1Km + r2Km) / 2;
  const mu = CONSTANTS.EARTH_MU;

  // Initial circular velocity
  const v1 = Math.sqrt(mu / r1Km);
  // Velocity at periapsis of transfer orbit
  const vt1 = Math.sqrt(mu * (2 / r1Km - 1 / a));
  const deltaV1 = Math.abs(vt1 - v1) * 1000; // m/s

  // Final circular velocity
  const v2 = Math.sqrt(mu / r2Km);
  // Velocity at apoapsis of transfer orbit
  const vt2 = Math.sqrt(mu * (2 / r2Km - 1 / a));
  const deltaV2 = Math.abs(v2 - vt2) * 1000; // m/s

  // Half period of transfer ellipse
  const tTransferSec = Math.PI * Math.sqrt(Math.pow(a, 3) / mu);

  return {
    deltaV1Ms: deltaV1,
    deltaV2Ms: deltaV2,
    totalDeltaVMs: deltaV1 + deltaV2,
    transferTimeMinutes: tTransferSec / 60,
    semiMajorAxisKm: a,
  };
}

/**
 * Calculates Delta-V required for atmospheric disposal (lowering perigee to 45km)
 * from current orbit altitude.
 */
export function calculateDeorbitDeltaV(currentAltitudeKm: number, targetPerigeeKm: number = 45): number {
  const r1 = CONSTANTS.EARTH_RADIUS_KM + currentAltitudeKm;
  const rPerigee = CONSTANTS.EARTH_RADIUS_KM + targetPerigeeKm;
  const a = (r1 + rPerigee) / 2;
  const mu = CONSTANTS.EARTH_MU;

  const vCirc = Math.sqrt(mu / r1);
  const vAtApoapsis = Math.sqrt(mu * (2 / r1 - 1 / a));
  return Math.abs(vCirc - vAtApoapsis) * 1000; // in m/s
}

/**
 * Calculates collision hazard probability score during proximity operations.
 * Considers relative distance, relative velocity, tumble rate, and sensor accuracy.
 */
export function calculateCollisionRisk(
  distanceMeters: number,
  relativeVelocityMs: number,
  tumbleRateDegS: number,
  sensorAccuracyCm: number
): {
  riskScore: number; // 0 - 100
  hazardLevel: 'NOMINAL' | 'CAUTION' | 'CRITICAL';
  recommendation: string;
} {
  // If far away, risk is minimal
  if (distanceMeters > 500) {
    return {
      riskScore: 3,
      hazardLevel: 'NOMINAL',
      recommendation: 'Target on long-range tracking. Safe approach corridor active.',
    };
  }

  // Safe relative speed at given distance: v_safe ~ distance / 40
  const safeVelocity = Math.max(0.1, distanceMeters * 0.02);
  const velocityPenalty = Math.max(0, (relativeVelocityMs - safeVelocity) * 35);
  const tumblePenalty = (tumbleRateDegS / 8) * 25;
  const sensorPenalty = (sensorAccuracyCm / 20) * 15;
  const distancePenalty = Math.max(0, (1 - distanceMeters / 100) * 25);

  const rawScore = velocityPenalty + tumblePenalty + sensorPenalty + distancePenalty;
  const riskScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  let hazardLevel: 'NOMINAL' | 'CAUTION' | 'CRITICAL' = 'NOMINAL';
  let recommendation = 'Relative trajectory nominal. Ready for close proximity sync.';

  if (riskScore >= 70) {
    hazardLevel = 'CRITICAL';
    recommendation = 'DANGER: Excessive closure rate or tumble mismatch! Execute retrograde RCS braking immediately.';
  } else if (riskScore >= 35) {
    hazardLevel = 'CAUTION';
    recommendation = 'Warning: Reduce relative velocity before entering final 10m capture cone.';
  }

  return { riskScore, hazardLevel, recommendation };
}

/**
 * Evaluates the full mass, power balance, delta-V and cost specs for a given spacecraft design.
 */
export function evaluateSpacecraftDesign(design: SpacecraftDesign): CalculatedSpecs {
  // Base fixed subsystems mass (avionics, thermal, wiring, structure margin)
  const baseAvionicsMassKg = 85;
  const baseAvionicsPowerW = 95;
  const baseCostM = 12.0;

  // Dry mass
  let sensorMassKg = 0;
  let sensorPowerW = 0;
  let sensorCostM = 0;
  let sensorCount = design.sensors.length;
  design.sensors.forEach(s => {
    sensorMassKg += s.massKg;
    sensorPowerW += s.powerDrawW;
    sensorCostM += s.costM;
  });

  const dryMassKg = 
    design.bus.massKg +
    design.solar.massKg +
    design.propulsion.engineDryMassKg +
    design.rcs.massKg +
    sensorMassKg +
    design.captureMechanism.massKg +
    baseAvionicsMassKg;

  const wetMassKg = dryMassKg + design.fuelMassKg;

  // Power balance
  const powerGenerationW = design.solar.powerGenW;
  const powerConsumptionW = 
    design.bus.powerDrawW +
    design.propulsion.powerDrawW +
    design.rcs.powerDrawW +
    sensorPowerW +
    design.captureMechanism.powerDrawW +
    baseAvionicsPowerW;

  const netPowerMarginW = powerGenerationW - powerConsumptionW;

  // Delta-V from rocket equation
  const deltaVMs = calculateDeltaV(dryMassKg, design.fuelMassKg, design.propulsion.ispSeconds);

  // Total estimated development & flight hardware cost
  const estimatedTotalCostM = 
    design.bus.baseCostM +
    design.solar.costM +
    design.propulsion.costM +
    design.rcs.costM +
    sensorCostM +
    design.captureMechanism.costM +
    baseCostM +
    (design.fuelMassKg * 0.005); // Propellant loading & ground handling

  // Center of mass balance heuristic (closer to 0 is better balanced)
  const asymmetry = Math.abs(design.solar.massKg * 0.5 - design.captureMechanism.massKg * 0.4) / dryMassKg;
  const centerOfMassOffsetCm = Math.round(asymmetry * 25 * 10) / 10;

  // Overall system reliability estimate
  let reliability = design.captureMechanism.captureReliability;
  if (netPowerMarginW < 0) reliability *= 0.5; // brownout risk
  if (sensorCount < 2) reliability *= 0.85; // sensor redundancy
  if (deltaVMs < 1200) reliability *= 0.9; // low maneuver budget

  return {
    dryMassKg: Math.round(dryMassKg),
    wetMassKg: Math.round(wetMassKg),
    powerGenerationW: Math.round(powerGenerationW),
    powerConsumptionW: Math.round(powerConsumptionW),
    netPowerMarginW: Math.round(netPowerMarginW),
    deltaVMs: Math.round(deltaVMs),
    estimatedTotalCostM: Math.round(estimatedTotalCostM * 10) / 10,
    centerOfMassOffsetCm,
    overallReliability: Math.round(reliability * 100),
  };
}

/**
 * Evaluates the full mass, thrust-to-weight ratio, LEO payload capacity, delta-V and cost
 * for a customizable multi-stage Mongolian rocket assembly.
 */
export function evaluateRocketConfig(
  config: import('../types').RocketConfig,
  spacecraftWetMassKg: number
): import('../types').CalculatedRocketSpecs {
  const boosterMultiplier = 1 + config.boosterCount * 0.45;
  const boosterDryMass = config.boosterCount * 2200;

  const totalDryMassKg =
    config.engine.massKg +
    config.tank.dryMassKg +
    config.fairing.massKg +
    boosterDryMass +
    1800; // Avionics, interstage adapter & separation pyros

  const totalWetMassKg = totalDryMassKg + config.fuelLoadKg + spacecraftWetMassKg;

  const totalThrustKn = Math.round(config.engine.thrustKn * boosterMultiplier);
  const totalWeightKn = (totalWetMassKg * CONSTANTS.G0) / 1000;
  const twrSeaLevel = Math.round((totalThrustKn / totalWeightKn) * 100) / 100;

  // Max payload to LEO capability (kg) based on fuel mass fraction and specific impulse
  const basePayloadLeo = (config.tank.fuelCapacityKg * 0.09) * (config.engine.ispSeconds / 300) * boosterMultiplier;
  const maxPayloadToLeoKg = Math.round(basePayloadLeo);

  // Delta-V of rocket booster stages
  const rocketDeltaVMs = Math.round(
    config.engine.ispSeconds * CONSTANTS.G0 * Math.log(totalWetMassKg / (totalDryMassKg + spacecraftWetMassKg))
  );

  const estimatedLaunchCostM = Math.round(
    (config.engine.costM +
      config.tank.costM +
      config.fairing.costM +
      config.boosterCount * 9 +
      config.fuelLoadKg * 0.00015 +
      12.0) * // Range safety, launch pad operations
      10
  ) / 10;

  let isFeasible = true;
  let feasibilityReasonMn = 'Хөөргөлт хийхэд бэлэн. Зүтгэх хүч ба даац бүрэн хангалттай.';
  let feasibilityReasonEn = 'Go for launch. Thrust-to-weight ratio and payload capacity verified.';

  if (twrSeaLevel < 1.15) {
    isFeasible = false;
    feasibilityReasonMn = `Зүтгэх хүч дутуу байна (TWR: ${twrSeaLevel} < 1.15). Пуужин тавцангаас хөөрч чадахгүй. Хөдөлгүүрийн зүтгэлтийг нэмэх эсвэл хажуугийн нэмэлт түлхэгч залгана уу.`;
    feasibilityReasonEn = `Insufficient thrust-to-weight ratio (TWR: ${twrSeaLevel} < 1.15). Add strap-on boosters or select a higher-thrust engine.`;
  } else if (spacecraftWetMassKg > maxPayloadToLeoKg) {
    isFeasible = false;
    feasibilityReasonMn = `Хэт хүнд ачаа! Хөлгийн масс (${spacecraftWetMassKg} кг) пуужингийн дээд даацаас (${maxPayloadToLeoKg} кг) давсан байна. Том түлшний сав сонгох эсвэл хөлгийн массыг хасна уу.`;
    feasibilityReasonEn = `Payload overloaded! Spacecraft wet mass (${spacecraftWetMassKg} kg) exceeds rocket capacity (${maxPayloadToLeoKg} kg). Upgrade tanks or reduce spacecraft fuel.`;
  }

  return {
    totalDryMassKg: Math.round(totalDryMassKg),
    totalWetMassKg: Math.round(totalWetMassKg),
    totalThrustKn,
    twrSeaLevel,
    maxPayloadToLeoKg,
    deltaVMs: rocketDeltaVMs,
    estimatedLaunchCostM,
    isFeasible,
    feasibilityReasonMn,
    feasibilityReasonEn,
  };
}
