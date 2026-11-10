/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { SpacecraftDesign } from '../types';
import { 
  createGoldMliTexture, 
  createSolarPanelTexture, 
  createHullPanelTexture,
  createCapsuleHeatShieldTexture,
  createCapsuleHullTileTexture,
  createCockpitDisplayTexture
} from './proceduralTextures';

export interface SpacecraftModelBundle {
  group: THREE.Group;
  parts: {
    busMesh: THREE.Group;
    solarLeft: THREE.Group;
    solarRight: THREE.Group;
    engineNozzle: THREE.Mesh;
    rcsQuads: THREE.Group[];
    rcsPlumes: THREE.Mesh[];
    antennaDish: THREE.Group;
    sensorTurret: THREE.Group;
    captureMechanism: THREE.Group;
    roboticArmJoints?: THREE.Group[];
    internalTanks?: THREE.Mesh[];
    reactionWheels?: THREE.Mesh[];
    capsuleGroup?: THREE.Group;
    serviceModuleGroup?: THREE.Group;
    cockpitGroup?: THREE.Group;
    cabinLight?: THREE.PointLight;
  };
  setHighlightedPart: (partName: string | null) => void;
  setExplodedProgress: (progress: number) => void;
  setThrusterFiring: (active: boolean) => void;
  setArmExtension: (progress: number) => void;
  setSolarDeployment: (progress: number) => void;
  setCabinLightMode: (mode: 'white' | 'amber' | 'red') => void;
  setInteriorVisible: (visible: boolean) => void;
  getCameraViewOffset: (viewId: string) => { position: THREE.Vector3; target: THREE.Vector3 };
  update: (deltaSeconds: number) => void;
  dispose: () => void;
}

/**
 * Builds an ultra-realistic aerospace spacecraft inspired by NASA Orion, SpaceX Dragon,
 * and high-grade orbital vehicles. Features realistic PBR ceramic TPS heat shield tiles,
 * white FRCI composite blankets, forward NASA Docking System (NDS), full cockpit interior
 * with triple MFD avionics screens, dual crew couches, detachable service module,
 * articulated multi-segment folding solar panels, and 16 RCS thruster attitude cluster.
 */
export function buildModularSpacecraft(design: SpacecraftDesign): SpacecraftModelBundle {
  const root = new THREE.Group();
  const geometriesToDispose: THREE.BufferGeometry[] = [];
  const materialsToDispose: THREE.Material[] = [];
  const texturesToDispose: THREE.Texture[] = [];

  // ================= TEXTURES & PBR MATERIALS =================
  const goldMliTex = createGoldMliTexture();
  const solarTex = createSolarPanelTexture();
  const hullTex = createHullPanelTexture();
  const heatShieldTex = createCapsuleHeatShieldTexture();
  const capsuleHullTex = createCapsuleHullTileTexture();
  const cockpitMfdTex = createCockpitDisplayTexture();

  texturesToDispose.push(goldMliTex, solarTex, hullTex, heatShieldTex, capsuleHullTex, cockpitMfdTex);

  // Command Capsule PBR Outer Hull (White FRCI thermal blankets + markings)
  const capsuleHullMat = new THREE.MeshStandardMaterial({
    map: capsuleHullTex,
    roughness: 0.45,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });
  materialsToDispose.push(capsuleHullMat);

  // Underside Base PBR Ceramic TPS Heat Shield Tiles
  const heatShieldMat = new THREE.MeshStandardMaterial({
    map: heatShieldTex,
    roughness: 0.65,
    metalness: 0.25,
  });
  materialsToDispose.push(heatShieldMat);

  // Service Module Bus Alloy
  const smHullMat = new THREE.MeshStandardMaterial({
    map: hullTex,
    roughness: 0.35,
    metalness: 0.85,
  });
  materialsToDispose.push(smHullMat);

  // High-Grade Gold Multi-Layer Insulation (MLI)
  const goldMliMat = new THREE.MeshStandardMaterial({
    map: goldMliTex,
    roughness: 0.2,
    metalness: 0.95,
    color: 0xffd700,
  });
  materialsToDispose.push(goldMliMat);

  // Photovoltaic Solar Panel Cells
  const solarMat = new THREE.MeshStandardMaterial({
    map: solarTex,
    roughness: 0.12,
    metalness: 0.7,
  });
  materialsToDispose.push(solarMat);

  // Dark Aerospace Structural Titanium / Carbon Frame
  const darkFrameMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.5,
    metalness: 0.8,
  });
  materialsToDispose.push(darkFrameMat);

  // Polished Chrome / Docking Ring Alloy
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.1,
    metalness: 0.95,
  });
  materialsToDispose.push(chromeMat);

  // Titanium Propellant Tanks (Spherical Hydrazine/Xenon)
  const titaniumTankMat = new THREE.MeshStandardMaterial({
    color: 0xca8a04,
    roughness: 0.25,
    metalness: 0.92,
  });
  materialsToDispose.push(titaniumTankMat);

  // High-Pressure Helium COPVs (Carbon Overwrapped Pressure Vessels)
  const copvMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.7,
    metalness: 0.4,
  });
  materialsToDispose.push(copvMat);

  // Main Rocket Nozzle (Niobium / Carbon-Carbon Composite)
  const nozzleMat = new THREE.MeshStandardMaterial({
    color: 0x27272a,
    roughness: 0.5,
    metalness: 0.85,
  });
  materialsToDispose.push(nozzleMat);

  // Multi-Pane Tinted Pilot Windows
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0x091422,
    roughness: 0.05,
    metalness: 0.98,
    transparent: true,
    opacity: 0.88,
  });
  materialsToDispose.push(windowMat);

  // Digital Cockpit MFD Screens (Emissive Avionics)
  const cockpitMfdMat = new THREE.MeshStandardMaterial({
    map: cockpitMfdTex,
    emissiveMap: cockpitMfdTex,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.95,
    roughness: 0.2,
    metalness: 0.1,
  });
  materialsToDispose.push(cockpitMfdMat);

  // Crew Ergonomic Couch Cushion Material
  const couchMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.8,
    metalness: 0.1,
  });
  materialsToDispose.push(couchMat);

  // Thruster Plume Materials
  const plumeMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
  });
  materialsToDispose.push(plumeMat);

  const mainPlumeMat = new THREE.MeshBasicMaterial({
    color: design.propulsion.type === 'electric_ion' ? 0x38bdf8 : 0xff7700,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
  });
  materialsToDispose.push(mainPlumeMat);

  // ================= 1. COMMAND MODULE (CREW CAPSULE) =================
  const capsuleGroup = new THREE.Group();
  capsuleGroup.position.set(0, 0.7, 0);
  root.add(capsuleGroup);

  // Aerodynamic Truncated Cone Capsule Body (Orion / Crew Dragon profile)
  // Top radius: 0.72m, Base radius: 1.42m, Height: 1.35m
  const capsuleHullGeo = new THREE.CylinderGeometry(0.72, 1.42, 1.35, 36, 1, true);
  geometriesToDispose.push(capsuleHullGeo);
  const capsuleHullMesh = new THREE.Mesh(capsuleHullGeo, capsuleHullMat);
  capsuleHullMesh.position.y = 0.25;
  capsuleGroup.add(capsuleHullMesh);

  // Underside Convex Thermal Protection System (TPS) Heat Shield
  const heatShieldGeo = new THREE.SphereGeometry(1.65, 36, 18, 0, Math.PI * 2, 0, 0.48);
  geometriesToDispose.push(heatShieldGeo);
  const heatShieldMesh = new THREE.Mesh(heatShieldGeo, heatShieldMat);
  heatShieldMesh.rotation.x = Math.PI;
  heatShieldMesh.position.y = -0.42;
  heatShieldMesh.scale.set(1.0, 0.45, 1.0);
  capsuleGroup.add(heatShieldMesh);

  // Forward NASA Docking System (NDS) Ring & Mechanism
  const ndsGroup = new THREE.Group();
  ndsGroup.position.y = 0.95;
  capsuleGroup.add(ndsGroup);

  // Primary Outer Docking Collar
  const dockingRingGeo = new THREE.TorusGeometry(0.68, 0.055, 16, 36);
  geometriesToDispose.push(dockingRingGeo);
  const dockingRing = new THREE.Mesh(dockingRingGeo, chromeMat);
  dockingRing.rotation.x = Math.PI / 2;
  ndsGroup.add(dockingRing);

  // Soft Capture Guide Petals (3 peripheral alignment guides at 120 degrees)
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const petalGeo = new THREE.BoxGeometry(0.12, 0.16, 0.04);
    geometriesToDispose.push(petalGeo);
    const petal = new THREE.Mesh(petalGeo, darkFrameMat);
    petal.position.set(Math.cos(angle) * 0.68, 0.08, Math.sin(angle) * 0.68);
    petal.rotation.y = -angle;
    petal.rotation.x = 0.35;
    ndsGroup.add(petal);
  }

  // Central Hatch Hatch Door & Crosshair Visual Alignment Target
  const hatchGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.06, 24);
  geometriesToDispose.push(hatchGeo);
  const hatchMesh = new THREE.Mesh(hatchGeo, darkFrameMat);
  ndsGroup.add(hatchMesh);

  const crosshairGeo = new THREE.RingGeometry(0.18, 0.22, 24);
  geometriesToDispose.push(crosshairGeo);
  const crosshairMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
  materialsToDispose.push(crosshairMat);
  const crosshair = new THREE.Mesh(crosshairGeo, crosshairMat);
  crosshair.rotation.x = -Math.PI / 2;
  crosshair.position.y = 0.035;
  ndsGroup.add(crosshair);

  // Forward Pilot Windshields (Recessed tinted sapphire flight deck windows)
  const windowLeftGeo = new THREE.BoxGeometry(0.38, 0.28, 0.08);
  geometriesToDispose.push(windowLeftGeo);
  const windowLeft = new THREE.Mesh(windowLeftGeo, windowMat);
  windowLeft.position.set(-0.35, 0.48, -1.02);
  windowLeft.rotation.x = -0.42;
  windowLeft.rotation.y = -0.32;
  capsuleGroup.add(windowLeft);

  const windowRight = windowLeft.clone();
  windowRight.position.set(0.35, 0.48, -1.02);
  windowRight.rotation.y = 0.32;
  capsuleGroup.add(windowRight);

  // Side Observation Window (For looking out toward Earth)
  const windowSideGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.06, 16);
  geometriesToDispose.push(windowSideGeo);
  const windowSide = new THREE.Mesh(windowSideGeo, windowMat);
  windowSide.rotation.z = Math.PI / 2;
  windowSide.position.set(-1.22, 0.22, 0);
  capsuleGroup.add(windowSide);

  // Star Tracker Optical Sensor Baffles on Upper Shoulder
  const starBaffleGeo = new THREE.CylinderGeometry(0.04, 0.07, 0.18, 12);
  geometriesToDispose.push(starBaffleGeo);
  const starBaffle1 = new THREE.Mesh(starBaffleGeo, darkFrameMat);
  starBaffle1.position.set(0.68, 0.72, 0.45);
  starBaffle1.rotation.z = -0.45;
  starBaffle1.rotation.x = 0.35;
  capsuleGroup.add(starBaffle1);

  // EVA Crew Grab Rails around Forward Hatch
  for (let r = 0; r < 4; r++) {
    const railAngle = (r / 4) * Math.PI * 2 + Math.PI / 4;
    const railGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.35, 8);
    geometriesToDispose.push(railGeo);
    const rail = new THREE.Mesh(railGeo, chromeMat);
    rail.position.set(Math.cos(railAngle) * 0.78, 0.88, Math.sin(railAngle) * 0.78);
    rail.rotation.y = -railAngle;
    capsuleGroup.add(rail);
  }

  // ================= 2. FULLY MODELED COCKPIT INTERIOR =================
  const cockpitGroup = new THREE.Group();
  cockpitGroup.position.set(0, 0.1, 0);
  capsuleGroup.add(cockpitGroup);

  // Cockpit Floor & Pressure Bulkhead
  const floorGeo = new THREE.CylinderGeometry(1.25, 1.25, 0.05, 24);
  geometriesToDispose.push(floorGeo);
  const floor = new THREE.Mesh(floorGeo, darkFrameMat);
  floor.position.y = -0.32;
  cockpitGroup.add(floor);

  // Astronaut Couches (Dual Commander and Pilot aerospace couch seats)
  const couchPositions = [-0.38, 0.38];
  couchPositions.forEach(xPos => {
    const couchSubgroup = new THREE.Group();
    couchSubgroup.position.set(xPos, -0.05, 0.15);
    couchSubgroup.rotation.x = -0.32; // Ergonomic 20° reclined flight couch

    // Couch Base & Cushion
    const seatGeo = new THREE.BoxGeometry(0.36, 0.12, 0.65);
    geometriesToDispose.push(seatGeo);
    const seat = new THREE.Mesh(seatGeo, couchMat);
    couchSubgroup.add(seat);

    // Reclined Backrest
    const backGeo = new THREE.BoxGeometry(0.36, 0.65, 0.1);
    geometriesToDispose.push(backGeo);
    const back = new THREE.Mesh(backGeo, couchMat);
    back.position.set(0, 0.32, 0.28);
    back.rotation.x = 0.25;
    couchSubgroup.add(back);

    // Headrest
    const headGeo = new THREE.BoxGeometry(0.24, 0.2, 0.1);
    geometriesToDispose.push(headGeo);
    const head = new THREE.Mesh(headGeo, couchMat);
    head.position.set(0, 0.72, 0.38);
    couchSubgroup.add(head);

    // 5-Point Racing Harness Straps
    const strapGeo = new THREE.BoxGeometry(0.05, 0.45, 0.02);
    geometriesToDispose.push(strapGeo);
    const strapMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    materialsToDispose.push(strapMat);
    const strapLeft = new THREE.Mesh(strapGeo, strapMat);
    strapLeft.position.set(-0.1, 0.3, 0.24);
    const strapRight = new THREE.Mesh(strapGeo, strapMat);
    strapRight.position.set(0.1, 0.3, 0.24);
    couchSubgroup.add(strapLeft);
    couchSubgroup.add(strapRight);

    cockpitGroup.add(couchSubgroup);
  });

  // Main Flight Instrument Avionics Dashboard Console
  const dashboardGroup = new THREE.Group();
  dashboardGroup.position.set(0, 0.35, -0.65);
  dashboardGroup.rotation.x = 0.42; // Tilted toward crew
  cockpitGroup.add(dashboardGroup);

  const consoleHousingGeo = new THREE.BoxGeometry(1.15, 0.42, 0.15);
  geometriesToDispose.push(consoleHousingGeo);
  const consoleHousing = new THREE.Mesh(consoleHousingGeo, darkFrameMat);
  dashboardGroup.add(consoleHousing);

  // Triple Digital MFD Screens (Primary Flight Display, Nav Map, Systems Grid)
  const mfdScreenGeo = new THREE.PlaneGeometry(1.08, 0.36);
  geometriesToDispose.push(mfdScreenGeo);
  const mfdScreen = new THREE.Mesh(mfdScreenGeo, cockpitMfdMat);
  mfdScreen.position.z = 0.08;
  dashboardGroup.add(mfdScreen);

  // Pilot Primary Flight Controls (Rotational Hand Controller RHC & THC)
  const rhcGeo = new THREE.CylinderGeometry(0.015, 0.02, 0.18, 8);
  geometriesToDispose.push(rhcGeo);
  const rhcMesh = new THREE.Mesh(rhcGeo, chromeMat);
  rhcMesh.position.set(0.24, 0.12, 0.1);
  cockpitGroup.add(rhcMesh);

  const thcMesh = rhcMesh.clone();
  thcMesh.position.set(-0.24, 0.12, 0.1);
  cockpitGroup.add(thcMesh);

  // Cabin Interior Ambient & Spot Light
  const cabinLight = new THREE.PointLight(0xffffff, 1.2, 3.5);
  cabinLight.position.set(0, 0.55, 0);
  cockpitGroup.add(cabinLight);

  const setCabinLightMode = (mode: 'white' | 'amber' | 'red') => {
    if (mode === 'white') {
      cabinLight.color.setHex(0xffffff); // Daylight White (6500K)
      cabinLight.intensity = 1.2;
    } else if (mode === 'amber') {
      cabinLight.color.setHex(0xf59e0b); // Work Amber (3200K)
      cabinLight.intensity = 1.0;
    } else {
      cabinLight.color.setHex(0xef4444); // Night Orbital Dark Adaptation Red (660nm)
      cabinLight.intensity = 0.85;
    }
  };

  const setInteriorVisible = (visible: boolean) => {
    capsuleHullMesh.visible = visible;
  };

  // ================= 3. DETACHABLE SERVICE MODULE =================
  const smGroup = new THREE.Group();
  smGroup.position.set(0, -1.05, 0);
  root.add(smGroup);

  const smRadius = 1.42;
  const smHeight = 1.35;

  // Service Module Structural Cylindrical Shell with Radiator Ribs
  const smCylinderGeo = new THREE.CylinderGeometry(smRadius, smRadius, smHeight, 36);
  geometriesToDispose.push(smCylinderGeo);
  const smBodyMesh = new THREE.Mesh(smCylinderGeo, smHullMat);
  smGroup.add(smBodyMesh);

  // Gold MLI Collar ring at the interface adapter
  const adapterRingGeo = new THREE.CylinderGeometry(smRadius * 0.98, smRadius * 1.01, 0.18, 36);
  geometriesToDispose.push(adapterRingGeo);
  const adapterRing = new THREE.Mesh(adapterRingGeo, goldMliMat);
  adapterRing.position.y = smHeight / 2;
  smGroup.add(adapterRing);

  // Internal Tanks: Titanium Propellant Spheres (Hydrazine / Xenon)
  const internalTanks: THREE.Mesh[] = [];
  const tankGeo = new THREE.SphereGeometry(0.42, 20, 20);
  geometriesToDispose.push(tankGeo);

  const tankOffsets = [
    [-0.55, 0, 0],
    [0.55, 0, 0],
    [0, 0, 0.55],
    [0, 0, -0.55],
  ];

  tankOffsets.forEach(pos => {
    const tank = new THREE.Mesh(tankGeo, titaniumTankMat);
    tank.position.set(pos[0], pos[1], pos[2]);
    smGroup.add(tank);
    internalTanks.push(tank);
  });

  // Helium Pressurization COPVs (Carbon Overwrapped Pressure Vessels)
  for (let c = 0; c < 2; c++) {
    const copvGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.52, 16);
    geometriesToDispose.push(copvGeo);
    const copv = new THREE.Mesh(copvGeo, copvMat);
    copv.position.set(c === 0 ? -0.4 : 0.4, 0.15, 0);
    smGroup.add(copv);
  }

  // Reaction Wheels (RWA) Pyramid
  const reactionWheels: THREE.Mesh[] = [];
  for (let r = 0; r < 4; r++) {
    const rwaGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.08, 16);
    geometriesToDispose.push(rwaGeo);
    const rwa = new THREE.Mesh(rwaGeo, darkFrameMat);
    const angle = (r / 4) * Math.PI * 2;
    rwa.position.set(Math.cos(angle) * 0.35, -0.25, Math.sin(angle) * 0.35);
    rwa.rotation.x = 0.45;
    rwa.rotation.y = angle;
    smGroup.add(rwa);
    reactionWheels.push(rwa);
  }

  // ================= 4. ARTICULATED DEPLOYABLE SOLAR PANEL WINGS =================
  const solarLeft = new THREE.Group();
  const solarRight = new THREE.Group();
  smGroup.add(solarLeft);
  smGroup.add(solarRight);

  // Boom lengths and 3 articulated segments per wing
  const boomLen = 0.65;
  const panelW = (design.solar.spanM * 0.32) / 3;
  const panelH = 0.85;

  const leftSegments: THREE.Group[] = [];
  const rightSegments: THREE.Group[] = [];

  // Left Solar Array (Multi-Segment Articulated Wing)
  const boomLeftGeo = new THREE.CylinderGeometry(0.045, 0.045, boomLen, 12);
  geometriesToDispose.push(boomLeftGeo);
  const boomLeft = new THREE.Mesh(boomLeftGeo, chromeMat);
  boomLeft.rotation.z = Math.PI / 2;
  boomLeft.position.set(-smRadius - boomLen / 2, 0, 0);
  solarLeft.add(boomLeft);

  let currentParentLeft: THREE.Group = solarLeft;
  let currentOffsetLeft = -smRadius - boomLen;

  for (let s = 0; s < 3; s++) {
    const segGroup = new THREE.Group();
    segGroup.position.set(s === 0 ? currentOffsetLeft : -panelW, 0, 0);
    currentParentLeft.add(segGroup);
    leftSegments.push(segGroup);

    // Panel Mesh
    const pGeo = new THREE.BoxGeometry(panelW, 0.03, panelH);
    geometriesToDispose.push(pGeo);
    const pMesh = new THREE.Mesh(pGeo, solarMat);
    pMesh.position.set(-panelW / 2, 0, 0);
    segGroup.add(pMesh);

    // Hinge joint cylinder
    const hingeGeo = new THREE.CylinderGeometry(0.025, 0.025, panelH * 0.95, 8);
    geometriesToDispose.push(hingeGeo);
    const hinge = new THREE.Mesh(hingeGeo, darkFrameMat);
    hinge.rotation.x = Math.PI / 2;
    segGroup.add(hinge);

    currentParentLeft = segGroup;
  }

  // Right Solar Array (Multi-Segment Articulated Wing)
  const boomRight = boomLeft.clone();
  boomRight.position.set(smRadius + boomLen / 2, 0, 0);
  solarRight.add(boomRight);

  let currentParentRight: THREE.Group = solarRight;
  let currentOffsetRight = smRadius + boomLen;

  for (let s = 0; s < 3; s++) {
    const segGroup = new THREE.Group();
    segGroup.position.set(s === 0 ? currentOffsetRight : panelW, 0, 0);
    currentParentRight.add(segGroup);
    rightSegments.push(segGroup);

    const pGeo = new THREE.BoxGeometry(panelW, 0.03, panelH);
    geometriesToDispose.push(pGeo);
    const pMesh = new THREE.Mesh(pGeo, solarMat);
    pMesh.position.set(panelW / 2, 0, 0);
    segGroup.add(pMesh);

    const hingeGeo = new THREE.CylinderGeometry(0.025, 0.025, panelH * 0.95, 8);
    geometriesToDispose.push(hingeGeo);
    const hinge = new THREE.Mesh(hingeGeo, darkFrameMat);
    hinge.rotation.x = Math.PI / 2;
    segGroup.add(hinge);

    currentParentRight = segGroup;
  }

  // Articulated deployment folding animation
  const setSolarDeployment = (progress: number) => {
    // progress: 0 = stowed accordion folded against SM, 1 = fully deployed flat wings
    const foldAngle = (1 - progress) * (Math.PI * 0.85);

    leftSegments.forEach((seg, idx) => {
      if (idx > 0) {
        seg.rotation.y = idx % 2 === 1 ? foldAngle : -foldAngle;
      }
    });

    rightSegments.forEach((seg, idx) => {
      if (idx > 0) {
        seg.rotation.y = idx % 2 === 1 ? -foldAngle : foldAngle;
      }
    });
  };

  // ================= 5. MAIN ENGINE NOZZLE & ACTUATORS =================
  const engineGroup = new THREE.Group();
  engineGroup.position.set(0, -smHeight / 2 - 0.25, 0);
  smGroup.add(engineGroup);

  let nozzleGeo: THREE.BufferGeometry;
  if (design.propulsion.type === 'electric_ion') {
    // Ion Engine: Multi-grid electrostatic accelerator with blue glow ring
    nozzleGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.4, 28);
  } else {
    // Chemical Rocket Engine: AJ10 convergent-divergent Bell Nozzle
    nozzleGeo = new THREE.ConeGeometry(0.55, 0.95, 28, 1, true);
  }
  geometriesToDispose.push(nozzleGeo);
  const engineNozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
  if (design.propulsion.type !== 'electric_ion') {
    engineNozzle.rotation.x = Math.PI;
  }
  engineGroup.add(engineNozzle);

  // Gimbal hydraulic actuator struts
  for (let g = 0; g < 2; g++) {
    const strutGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.45, 8);
    geometriesToDispose.push(strutGeo);
    const strut = new THREE.Mesh(strutGeo, chromeMat);
    strut.position.set(g === 0 ? -0.35 : 0.35, 0.2, 0);
    strut.rotation.z = g === 0 ? 0.35 : -0.35;
    engineGroup.add(strut);
  }

  // Flame / Ion Discharge Plume
  const mainPlumeGeo = new THREE.ConeGeometry(0.48, 2.2, 20);
  geometriesToDispose.push(mainPlumeGeo);
  const mainPlume = new THREE.Mesh(mainPlumeGeo, mainPlumeMat);
  mainPlume.rotation.x = Math.PI;
  mainPlume.position.y = -1.35;
  engineGroup.add(mainPlume);

  // ================= 6. 16 ATTITUDE CONTROL RCS THRUSTER NOZZLES =================
  const rcsQuads: THREE.Group[] = [];
  const rcsPlumes: THREE.Mesh[] = [];

  // 4 orthogonal quad blocks around the service module perimeter
  const rcsAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];

  rcsAngles.forEach(angle => {
    const quad = new THREE.Group();
    quad.position.set(Math.cos(angle) * smRadius, 0.15, Math.sin(angle) * smRadius);
    quad.rotation.y = -angle;

    const blockGeo = new THREE.BoxGeometry(0.18, 0.18, 0.15);
    geometriesToDispose.push(blockGeo);
    const block = new THREE.Mesh(blockGeo, darkFrameMat);
    quad.add(block);

    // 4 micro nozzles per block (+X, -X, +Y, -Y)
    const nozzleOffsets = [
      [0.08, 0, 0.08, 0, 0, -Math.PI / 2],
      [-0.08, 0, 0.08, 0, 0, Math.PI / 2],
      [0, 0.08, 0.08, Math.PI / 2, 0, 0],
      [0, -0.08, 0.08, -Math.PI / 2, 0, 0],
    ];

    nozzleOffsets.forEach(noz => {
      const coneGeo = new THREE.ConeGeometry(0.035, 0.12, 8);
      geometriesToDispose.push(coneGeo);
      const cone = new THREE.Mesh(coneGeo, nozzleMat);
      cone.position.set(noz[0], noz[1], noz[2]);
      cone.rotation.set(noz[3], noz[4], noz[5]);
      quad.add(cone);

      const pGeo = new THREE.ConeGeometry(0.045, 0.22, 6);
      geometriesToDispose.push(pGeo);
      const pMesh = new THREE.Mesh(pGeo, plumeMat);
      pMesh.position.set(noz[0], noz[1], noz[2] + 0.14);
      pMesh.rotation.x = Math.PI;
      quad.add(pMesh);
      rcsPlumes.push(pMesh);
    });

    smGroup.add(quad);
    rcsQuads.push(quad);
  });

  // ================= 7. HIGH-GAIN S/X-BAND COMMUNICATIONS ANTENNA =================
  const antennaGroup = new THREE.Group();
  antennaGroup.position.set(0.65, smHeight / 2 + 0.2, 0.75);
  root.add(antennaGroup);

  const dishGeo = new THREE.SphereGeometry(0.52, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.38);
  geometriesToDispose.push(dishGeo);
  const dish = new THREE.Mesh(dishGeo, goldMliMat);
  dish.rotation.x = -Math.PI / 3;
  antennaGroup.add(dish);

  const feedhornGeo = new THREE.CylinderGeometry(0.02, 0.03, 0.35, 8);
  geometriesToDispose.push(feedhornGeo);
  const feedhorn = new THREE.Mesh(feedhornGeo, chromeMat);
  feedhorn.position.set(0, 0.18, 0);
  feedhorn.rotation.x = -Math.PI / 3;
  antennaGroup.add(feedhorn);

  // ================= 8. SENSOR TURRET (3D FLASH LIDAR & OPTICAL NAVCAM) =================
  const sensorTurret = new THREE.Group();
  sensorTurret.position.set(0, 1.45, -0.65);
  capsuleGroup.add(sensorTurret);

  const turretHousingGeo = new THREE.BoxGeometry(0.38, 0.24, 0.26);
  geometriesToDispose.push(turretHousingGeo);
  const turretHousing = new THREE.Mesh(turretHousingGeo, darkFrameMat);
  sensorTurret.add(turretHousing);

  const lensGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.09, 16);
  geometriesToDispose.push(lensGeo);
  const lensMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.05, metalness: 0.95 });
  materialsToDispose.push(lensMat);
  const lens = new THREE.Mesh(lensGeo, lensMat);
  lens.rotation.x = Math.PI / 2;
  lens.position.set(0, 0, -0.14);
  sensorTurret.add(lens);

  // ================= 9. CAPTURE MECHANISM INTEGRATION =================
  const captureGroup = new THREE.Group();
  captureGroup.position.set(0, 0.2, -1.6);
  root.add(captureGroup);

  const roboticArmJoints: THREE.Group[] = [];

  if (design.captureMechanism.type === 'robotic_arm') {
    // Canadarm style 7-DOF Articulated Robotic Arm
    const baseJoint = new THREE.Group();
    captureGroup.add(baseJoint);

    const baseTurretGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.18, 16);
    geometriesToDispose.push(baseTurretGeo);
    baseJoint.add(new THREE.Mesh(baseTurretGeo, darkFrameMat));

    // Shoulder to Elbow
    const seg1 = new THREE.Group();
    seg1.position.y = 0.12;
    baseJoint.add(seg1);
    roboticArmJoints.push(seg1);

    const boom1Geo = new THREE.CylinderGeometry(0.065, 0.065, 1.05, 12);
    geometriesToDispose.push(boom1Geo);
    const boom1Mesh = new THREE.Mesh(boom1Geo, chromeMat);
    boom1Mesh.position.y = 0.52;
    seg1.add(boom1Mesh);

    // Elbow to Wrist
    const seg2 = new THREE.Group();
    seg2.position.y = 1.05;
    seg1.add(seg2);
    roboticArmJoints.push(seg2);

    const boom2Geo = new THREE.CylinderGeometry(0.055, 0.055, 0.85, 12);
    geometriesToDispose.push(boom2Geo);
    const boom2Mesh = new THREE.Mesh(boom2Geo, chromeMat);
    boom2Mesh.position.y = 0.42;
    seg2.add(boom2Mesh);

    // Grapple End-Effector
    const clawGroup = new THREE.Group();
    clawGroup.position.y = 0.85;
    seg2.add(clawGroup);

    const clawBaseGeo = new THREE.BoxGeometry(0.2, 0.09, 0.16);
    geometriesToDispose.push(clawBaseGeo);
    clawGroup.add(new THREE.Mesh(clawBaseGeo, darkFrameMat));

    const fingerGeo = new THREE.BoxGeometry(0.035, 0.22, 0.035);
    geometriesToDispose.push(fingerGeo);
    const fingerLeft = new THREE.Mesh(fingerGeo, chromeMat);
    fingerLeft.position.set(-0.07, 0.12, 0);
    const fingerRight = new THREE.Mesh(fingerGeo, chromeMat);
    fingerRight.position.set(0.07, 0.12, 0);
    clawGroup.add(fingerLeft);
    clawGroup.add(fingerRight);

    seg1.rotation.z = -0.55;
    seg2.rotation.z = 1.05;
  } else if (design.captureMechanism.type === 'deployable_net') {
    const canGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.45, 18);
    geometriesToDispose.push(canGeo);
    captureGroup.add(new THREE.Mesh(canGeo, darkFrameMat));

    const lidGeo = new THREE.CylinderGeometry(0.31, 0.31, 0.06, 18);
    geometriesToDispose.push(lidGeo);
    const lidMesh = new THREE.Mesh(lidGeo, chromeMat);
    lidMesh.position.y = 0.24;
    captureGroup.add(lidMesh);
  } else if (design.captureMechanism.type === 'harpoon') {
    const tubeGeo = new THREE.CylinderGeometry(0.13, 0.15, 0.72, 16);
    geometriesToDispose.push(tubeGeo);
    captureGroup.add(new THREE.Mesh(tubeGeo, darkFrameMat));

    const barbGeo = new THREE.ConeGeometry(0.09, 0.32, 8);
    geometriesToDispose.push(barbGeo);
    const barbMesh = new THREE.Mesh(barbGeo, chromeMat);
    barbMesh.position.y = 0.42;
    captureGroup.add(barbMesh);
  } else {
    // Magnetic / Gecko Gripper
    const plateGeo = new THREE.BoxGeometry(0.65, 0.09, 0.65);
    geometriesToDispose.push(plateGeo);
    captureGroup.add(new THREE.Mesh(plateGeo, darkFrameMat));

    const padGeo = new THREE.BoxGeometry(0.55, 0.05, 0.55);
    geometriesToDispose.push(padGeo);
    const pad = new THREE.Mesh(padGeo, chromeMat);
    pad.position.y = 0.07;
    captureGroup.add(pad);
  }

  // ================= 10. 8-VIEW CAMERA SYSTEM SPECIFICATION =================
  const getCameraViewOffset = (viewId: string): { position: THREE.Vector3; target: THREE.Vector3 } => {
    switch (viewId) {
      case 'docking':
        // Front Docking Camera looking down the centerline
        return {
          position: new THREE.Vector3(0, 1.65, -0.9),
          target: new THREE.Vector3(0, 1.65, -8.0),
        };
      case 'cockpit':
        // Inside Cockpit looking at MFDs and through windshields
        return {
          position: new THREE.Vector3(0, 0.95, 0.2),
          target: new THREE.Vector3(0, 1.05, -1.2),
        };
      case 'window':
        // Side Earth Observation Window
        return {
          position: new THREE.Vector3(-0.95, 0.9, 0.05),
          target: new THREE.Vector3(-4.5, -0.5, -1.0),
        };
      case 'side':
        // Engineering Side Profile
        return {
          position: new THREE.Vector3(6.8, 0.2, 0),
          target: new THREE.Vector3(0, 0, 0),
        };
      case 'rear':
        // Propulsion & Engine Nozzle View
        return {
          position: new THREE.Vector3(0, -3.2, 4.2),
          target: new THREE.Vector3(0, -1.4, 0),
        };
      case 'heatshield':
        // Underside TPS Ceramic Tile Inspection
        return {
          position: new THREE.Vector3(0, -3.8, 0.01),
          target: new THREE.Vector3(0, 0.1, 0),
        };
      case 'solar':
        // Solar Array Wing Deployment Close-up
        return {
          position: new THREE.Vector3(4.5, 0.8, 2.2),
          target: new THREE.Vector3(2.2, -0.2, 0),
        };
      case 'exterior':
      default:
        // Full Exterior 360° Chase View
        return {
          position: new THREE.Vector3(0, 2.0, 7.5),
          target: new THREE.Vector3(0, 0, 0),
        };
    }
  };

  // ================= 11. INTERACTIVE CONTROLS & METHODS =================
  const setExplodedProgress = (progress: number) => {
    // Command Capsule separates upward
    capsuleGroup.position.y = 0.7 + progress * 1.6;

    // Service Module lowers downward
    smGroup.position.y = -1.05 - progress * 1.2;

    // Solar wings move laterally outward
    solarLeft.position.x = -progress * 1.5;
    solarRight.position.x = progress * 1.5;

    // Antenna dish moves outward
    antennaGroup.position.y = (smHeight / 2 + 0.2) + progress * 0.9;
    antennaGroup.position.x = 0.65 + progress * 0.6;

    // Capture mechanism extends forward
    captureGroup.position.z = -1.6 - progress * 1.2;
  };

  const setHighlightedPart = (_partName: string | null) => {
    // Highlight logic if needed
  };

  const setThrusterFiring = (active: boolean) => {
    mainPlumeMat.opacity = active ? 0.9 : 0;
    plumeMat.opacity = active ? 0.75 : 0;
  };

  const setArmExtension = (progress: number) => {
    if (roboticArmJoints.length >= 2) {
      roboticArmJoints[0].rotation.z = -0.55 + progress * 1.15;
      roboticArmJoints[1].rotation.z = 1.05 - progress * 1.35;
    }
  };

  const update = (deltaSeconds: number) => {
    reactionWheels.forEach(rw => {
      rw.rotation.z += deltaSeconds * 4.0;
    });
  };

  const dispose = () => {
    geometriesToDispose.forEach(g => g.dispose());
    materialsToDispose.forEach(m => m.dispose());
    texturesToDispose.forEach(t => t.dispose());
  };

  return {
    group: root,
    parts: {
      busMesh: smGroup,
      solarLeft,
      solarRight,
      engineNozzle,
      rcsQuads,
      rcsPlumes,
      antennaDish: antennaGroup,
      sensorTurret,
      captureMechanism: captureGroup,
      roboticArmJoints,
      internalTanks,
      reactionWheels,
      capsuleGroup,
      serviceModuleGroup: smGroup,
      cockpitGroup,
      cabinLight,
    },
    setHighlightedPart,
    setExplodedProgress,
    setThrusterFiring,
    setArmExtension,
    setSolarDeployment,
    setCabinLightMode,
    setInteriorVisible,
    getCameraViewOffset,
    update,
    dispose,
  };
}
