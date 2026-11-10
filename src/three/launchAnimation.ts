/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { 
  createRocketDecalTexture, 
  createRocketHullDetailTexture,
  createCarbonInterstageTexture,
  createEngineNozzleTexture,
  createSolarPanelTexture, 
  createGoldMliTexture,
  createEarthSurfaceTexture,
  createEarthNightTexture,
  createEarthCloudTexture,
  createEarthSpecularTexture,
  createEarthBumpTexture,
  createMoonTexture,
  createMilkyWaySkyboxTexture,
  createMarsTexture,
  createJupiterTexture,
  createSaturnRingTexture
} from './proceduralTextures';

import { RocketConfig, SpacecraftDesign } from '../types';
import { buildModularSpacecraft } from './spacecraftBuilder';

export type LaunchCameraMode = 'chase' | 'pad' | 'tracking' | 'booster' | 'cockpit' | 'spacecraft' | 'free';

export interface LaunchTelemetryData {
  phaseKey: string;
  altitudeKm: number;
  velocityKms: number;
  downrangeKm: number;
  mach: number;
  dynamicPressureKpa: number;
  gForce: number;
  throttlePct: number;
  isFairingSeparated: boolean;
  isBoosterSeparated: boolean;
  isPayloadDeployed: boolean;
  pitchDeg: number;
  rollDeg: number;
  headingDeg: number;
}

export interface LaunchSceneBundle {
  group: THREE.Group;
  camera: THREE.PerspectiveCamera;
  updateSequence: (progress: number, delta: number) => LaunchTelemetryData;
  setCameraMode: (mode: LaunchCameraMode) => void;
  dispose: () => void;
}

export function buildRealisticLaunchScene(
  containerWidth: number, 
  containerHeight: number,
  rocketConfig?: RocketConfig,
  spacecraftDesign?: SpacecraftDesign
): LaunchSceneBundle {
  const root = new THREE.Group();
  const geometriesToDispose: THREE.BufferGeometry[] = [];
  const materialsToDispose: THREE.Material[] = [];
  const texturesToDispose: THREE.Texture[] = [];

  // ================= 1. MATERIALS =================
  const rocketHullTex = createRocketHullDetailTexture();
  const carbonTex = createCarbonInterstageTexture();
  const engineNozzleTex = createEngineNozzleTexture();
  texturesToDispose.push(rocketHullTex, carbonTex, engineNozzleTex);

  const whiteHullMat = new THREE.MeshStandardMaterial({
    map: rocketHullTex,
    color: 0xffffff,
    roughness: 0.28,
    metalness: 0.65,
  });
  materialsToDispose.push(whiteHullMat);

  const blackCarbonMat = new THREE.MeshStandardMaterial({
    map: carbonTex,
    roughness: 0.42,
    metalness: 0.75,
  });
  materialsToDispose.push(blackCarbonMat);

  const engineNozzleMat = new THREE.MeshStandardMaterial({
    map: engineNozzleTex,
    roughness: 0.32,
    metalness: 0.92,
  });
  materialsToDispose.push(engineNozzleMat);

  const towerSteelMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.6,
    metalness: 0.8,
  });
  materialsToDispose.push(towerSteelMat);

  const concretePadMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.9,
    metalness: 0.1,
  });
  materialsToDispose.push(concretePadMat);

  const goldMliTex = createGoldMliTexture();
  texturesToDispose.push(goldMliTex);
  const goldMliMat = new THREE.MeshStandardMaterial({
    map: goldMliTex,
    color: 0xffd700,
    metalness: 0.9,
    roughness: 0.25,
  });
  materialsToDispose.push(goldMliMat);

  const solarTex = createSolarPanelTexture();
  texturesToDispose.push(solarTex);
  const solarMat = new THREE.MeshStandardMaterial({
    map: solarTex,
    metalness: 0.6,
    roughness: 0.2,
  });
  materialsToDispose.push(solarMat);

  const propellant = (rocketConfig?.engine as any)?.type || (rocketConfig?.engine as any)?.propellant || 'kerolox';
  let coreColor = 0xffffff;
  let outerColor = 0xff5500;
  if (propellant === 'methalox') {
    coreColor = 0x67e8f9;
    outerColor = 0x2563eb;
  } else if (propellant === 'hydrolox') {
    coreColor = 0xa5f3fc;
    outerColor = 0x38bdf8;
  }

  const flameCoreMat = new THREE.MeshBasicMaterial({
    color: coreColor,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.95,
  });
  materialsToDispose.push(flameCoreMat);

  const flameOuterMat = new THREE.MeshBasicMaterial({
    color: outerColor,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.85,
  });
  materialsToDispose.push(flameOuterMat);

  const vaporConeMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  materialsToDispose.push(vaporConeMat);

  // ================= 2. LAUNCH PAD & ENVIRONMENT =================
  const padGroup = new THREE.Group();
  root.add(padGroup);

  // Concrete Launch Foundation
  const padBaseGeo = new THREE.BoxGeometry(40, 1.2, 40);
  geometriesToDispose.push(padBaseGeo);
  const padBase = new THREE.Mesh(padBaseGeo, concretePadMat);
  padBase.position.y = -0.6;
  padGroup.add(padBase);

  // Flame trench opening
  const trenchGeo = new THREE.BoxGeometry(10, 3, 20);
  geometriesToDispose.push(trenchGeo);
  const trenchMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.95 });
  materialsToDispose.push(trenchMat);
  const trench = new THREE.Mesh(trenchGeo, trenchMat);
  trench.position.set(0, -2.0, 0);
  padGroup.add(trench);

  // Launch Umbilical Tower (Truss Structure)
  const towerGroup = new THREE.Group();
  towerGroup.position.set(-3.2, 0, 0);
  padGroup.add(towerGroup);

  const towerColGeo = new THREE.BoxGeometry(0.3, 22, 0.3);
  geometriesToDispose.push(towerColGeo);
  for (let cx of [-1.2, 1.2]) {
    for (let cz of [-1.2, 1.2]) {
      const col = new THREE.Mesh(towerColGeo, towerSteelMat);
      col.position.set(cx, 11, cz);
      towerGroup.add(col);
    }
  }

  // Crossbeams & platforms
  for (let y = 2; y <= 20; y += 3) {
    const platGeo = new THREE.BoxGeometry(2.7, 0.2, 2.7);
    geometriesToDispose.push(platGeo);
    const plat = new THREE.Mesh(platGeo, towerSteelMat);
    plat.position.y = y;
    towerGroup.add(plat);
  }

  // Retractable Umbilical Swing Arms
  const swingArm1 = new THREE.Group();
  swingArm1.position.set(1.2, 8.5, 0);
  towerGroup.add(swingArm1);
  const arm1Geo = new THREE.BoxGeometry(2.2, 0.35, 0.35);
  geometriesToDispose.push(arm1Geo);
  const arm1Mesh = new THREE.Mesh(arm1Geo, blackCarbonMat);
  arm1Mesh.position.x = 1.1;
  swingArm1.add(arm1Mesh);

  const swingArm2 = new THREE.Group();
  swingArm2.position.set(1.2, 14.5, 0);
  towerGroup.add(swingArm2);
  const arm2Geo = new THREE.BoxGeometry(2.2, 0.3, 0.3);
  geometriesToDispose.push(arm2Geo);
  const arm2Mesh = new THREE.Mesh(arm2Geo, blackCarbonMat);
  arm2Mesh.position.x = 1.1;
  swingArm2.add(arm2Mesh);

  // Pad Floodlights
  const padSpot1 = new THREE.SpotLight(0xfff5ea, 5, 45, Math.PI / 4, 0.3);
  padSpot1.position.set(-6, 2, 8);
  padSpot1.target.position.set(0, 8, 0);
  padGroup.add(padSpot1);
  padGroup.add(padSpot1.target);

  const padSpot2 = new THREE.SpotLight(0x38bdf8, 4, 45, Math.PI / 4, 0.3);
  padSpot2.position.set(8, 2, -6);
  padSpot2.target.position.set(0, 8, 0);
  padGroup.add(padSpot2);
  padGroup.add(padSpot2.target);

  // Pad Deluge Steam Particles
  const steamCount = 180;
  const steamGeo = new THREE.BufferGeometry();
  const steamPos = new Float32Array(steamCount * 3);
  const steamVel: { x: number; y: number; z: number }[] = [];
  for (let i = 0; i < steamCount; i++) {
    steamPos[i * 3] = (Math.random() - 0.5) * 3;
    steamPos[i * 3 + 1] = -1.5;
    steamPos[i * 3 + 2] = (Math.random() - 0.5) * 3;
    steamVel.push({
      x: (Math.random() - 0.5) * 0.15,
      y: Math.random() * 0.2 + 0.05,
      z: (Math.random() - 0.5) * 0.15,
    });
  }
  steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPos, 3));
  geometriesToDispose.push(steamGeo);
  const steamMat = new THREE.PointsMaterial({
    color: 0xe2e8f0,
    size: 1.8,
    transparent: true,
    opacity: 0,
    blending: THREE.NormalBlending,
  });
  materialsToDispose.push(steamMat);
  const steamParticles = new THREE.Points(steamGeo, steamMat);
  padGroup.add(steamParticles);

  // ================= 3. REALISTIC PROCEDURAL 3D EARTH =================
  // High-fidelity Earth sphere with continents, night city lights, and clouds
  const earthRadius = 75;
  const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 64);
  geometriesToDispose.push(earthGeo);

  const earthSurfTex = createEarthSurfaceTexture();
  const earthNightTex = createEarthNightTexture();
  const earthCloudTex = createEarthCloudTexture();
  const earthSpecTex = createEarthSpecularTexture();
  const earthBumpTex = createEarthBumpTexture();
  texturesToDispose.push(earthSurfTex, earthNightTex, earthCloudTex, earthSpecTex, earthBumpTex);

  const texLoader = new THREE.TextureLoader();
  const nasaPhotoTex = texLoader.load('/assets/aistudio/nasa_earth_photorealistic.png', (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    earthMat.map = tex;
    earthMat.needsUpdate = true;
  });
  nasaPhotoTex.colorSpace = THREE.SRGBColorSpace;
  texturesToDispose.push(nasaPhotoTex);

  const earthMat = new THREE.MeshStandardMaterial({
    map: nasaPhotoTex || earthSurfTex,
    roughnessMap: earthSpecTex,
    bumpMap: earthBumpTex,
    bumpScale: 0.04,
    emissiveMap: earthNightTex,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.85,
    roughness: 0.55,
    metalness: 0.02,
  });
  materialsToDispose.push(earthMat);

  const earthMesh = new THREE.Mesh(earthGeo, earthMat);
  earthMesh.position.set(0, -earthRadius - 1.2, 0);
  earthMesh.rotation.y = -Math.PI / 4;
  root.add(earthMesh);

  // Cloud Layer with rotation (translucent so authentic NASA surface is visible)
  const cloudGeo = new THREE.SphereGeometry(earthRadius * 1.010, 48, 48);
  geometriesToDispose.push(cloudGeo);
  const cloudMat = new THREE.MeshStandardMaterial({
    map: earthCloudTex,
    transparent: true,
    opacity: 0.38,
    blending: THREE.NormalBlending,
    depthWrite: false,
    roughness: 0.9,
  });
  materialsToDispose.push(cloudMat);
  const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
  cloudMesh.position.copy(earthMesh.position);
  root.add(cloudMesh);

  // Atmosphere Glow (Rayleigh scattering rim)
  const atmoGeo = new THREE.SphereGeometry(earthRadius * 1.025, 48, 48);
  geometriesToDispose.push(atmoGeo);
  const atmoMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
  });
  materialsToDispose.push(atmoMat);
  const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
  atmoMesh.position.copy(earthMesh.position);
  root.add(atmoMesh);

  // ================= 4. NASA MILKY WAY SKYBOX & SOLAR SYSTEM PLANETS =================
  // Milky Way Skybox Dome
  const skyRadius = 450;
  const skyGeo = new THREE.SphereGeometry(skyRadius, 32, 32);
  geometriesToDispose.push(skyGeo);
  const skyTex = createMilkyWaySkyboxTexture();
  texturesToDispose.push(skyTex);
  const skyMat = new THREE.MeshBasicMaterial({
    map: skyTex,
    side: THREE.BackSide,
    depthWrite: false,
  });
  materialsToDispose.push(skyMat);
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  root.add(skyDome);

  // 3D Moon in upper sky (Matches user screenshot image_b8b73fad.png)
  const moonRadius = 6.5;
  const moonGeo = new THREE.SphereGeometry(moonRadius, 32, 32);
  geometriesToDispose.push(moonGeo);
  const moonTex = createMoonTexture();
  texturesToDispose.push(moonTex);
  const moonMat = new THREE.MeshStandardMaterial({
    map: moonTex,
    roughness: 0.9,
    metalness: 0.05,
  });
  materialsToDispose.push(moonMat);
  const moonMesh = new THREE.Mesh(moonGeo, moonMat);
  moonMesh.position.set(-65, 120, -110);
  root.add(moonMesh);

  // MARS (Red Planet) in sky
  const marsGeo = new THREE.SphereGeometry(1.6, 20, 20);
  geometriesToDispose.push(marsGeo);
  const marsTex = createMarsTexture();
  texturesToDispose.push(marsTex);
  const marsMat = new THREE.MeshStandardMaterial({ map: marsTex, roughness: 0.85 });
  materialsToDispose.push(marsMat);
  const marsMesh = new THREE.Mesh(marsGeo, marsMat);
  marsMesh.position.set(130, 95, -160);
  root.add(marsMesh);

  // JUPITER (Gas Giant with Banded Atmosphere & Great Red Spot)
  const jupiterGeo = new THREE.SphereGeometry(5.0, 24, 24);
  geometriesToDispose.push(jupiterGeo);
  const jupiterTex = createJupiterTexture();
  texturesToDispose.push(jupiterTex);
  const jupiterMat = new THREE.MeshStandardMaterial({ map: jupiterTex, roughness: 0.7 });
  materialsToDispose.push(jupiterMat);
  const jupiterMesh = new THREE.Mesh(jupiterGeo, jupiterMat);
  jupiterMesh.position.set(-170, 60, -220);
  root.add(jupiterMesh);

  // SATURN (With Rings)
  const saturnGroup = new THREE.Group();
  saturnGroup.position.set(190, 80, -240);
  root.add(saturnGroup);
  const saturnGeo = new THREE.SphereGeometry(3.6, 24, 24);
  geometriesToDispose.push(saturnGeo);
  const saturnMat = new THREE.MeshStandardMaterial({ color: 0xecd59f, roughness: 0.65 });
  materialsToDispose.push(saturnMat);
  const saturnBody = new THREE.Mesh(saturnGeo, saturnMat);
  saturnGroup.add(saturnBody);

  const ringGeo = new THREE.RingGeometry(4.8, 8.8, 48);
  geometriesToDispose.push(ringGeo);
  const ringTex = createSaturnRingTexture();
  texturesToDispose.push(ringTex);
  const ringMat = new THREE.MeshBasicMaterial({
    map: ringTex,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
  });
  materialsToDispose.push(ringMat);
  const saturnRings = new THREE.Mesh(ringGeo, ringMat);
  saturnRings.rotation.x = Math.PI / 2.3;
  saturnGroup.add(saturnRings);

  // Deep Space Starfield (Multi-spectral star temperatures)
  const starCount = 800;
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const v = new THREE.Vector3(
      (Math.random() - 0.5) * 500,
      Math.random() * 250 + 20,
      (Math.random() - 0.5) * 500
    );
    starPos[i * 3] = v.x;
    starPos[i * 3 + 1] = v.y;
    starPos[i * 3 + 2] = v.z;

    // Stellar color temperature (O/B blue, A/F white, G/K yellow, M red)
    const tempRand = Math.random();
    if (tempRand < 0.25) {
      starColors[i * 3] = 0.7; starColors[i * 3 + 1] = 0.85; starColors[i * 3 + 2] = 1.0; // Blue
    } else if (tempRand < 0.75) {
      starColors[i * 3] = 1.0; starColors[i * 3 + 1] = 1.0; starColors[i * 3 + 2] = 1.0;  // White
    } else {
      starColors[i * 3] = 1.0; starColors[i * 3 + 1] = 0.85; starColors[i * 3 + 2] = 0.6; // Amber
    }
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
  geometriesToDispose.push(starGeo);

  const starMat = new THREE.PointsMaterial({
    vertexColors: true,
    size: 1.2,
    transparent: true,
    opacity: 0.85,
  });
  materialsToDispose.push(starMat);
  const starField = new THREE.Points(starGeo, starMat);
  root.add(starField);

  // ================= 5. ASCENT SMOKE TRAIL PARTICLE SYSTEM =================
  // Matches user screenshot image_b8b73fad.png showing expanding white smoke trail
  const smokeCount = 140;
  const smokeParticles: {
    mesh: THREE.Mesh;
    worldPos: THREE.Vector3;
    scale: number;
    opacity: number;
    active: boolean;
    lifetime: number;
  }[] = [];

  const smokeGroup = new THREE.Group();
  root.add(smokeGroup);

  const smokeSphereGeo = new THREE.SphereGeometry(0.8, 8, 8);
  geometriesToDispose.push(smokeSphereGeo);

  for (let i = 0; i < smokeCount; i++) {
    const sMat = new THREE.MeshBasicMaterial({
      color: 0xf1f5f9,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    materialsToDispose.push(sMat);
    const sm = new THREE.Mesh(smokeSphereGeo, sMat);
    sm.visible = false;
    smokeGroup.add(sm);
    smokeParticles.push({
      mesh: sm,
      worldPos: new THREE.Vector3(),
      scale: 1,
      opacity: 0,
      active: false,
      lifetime: 0,
    });
  }
  let nextSmokeIdx = 0;

  // ================= 6. ROCKET VEHICLE (MODULAR MULTI-STAGE) =================
  const rocketRoot = new THREE.Group();
  root.add(rocketRoot);

  // ----- STAGE 1 (MAIN BOOSTER) -----
  const stage1 = new THREE.Group();
  rocketRoot.add(stage1);

  // Booster Body Cylinder
  const boosterHeight = 11.0;
  const boosterRadius = 0.85;
  const boosterGeo = new THREE.CylinderGeometry(boosterRadius, boosterRadius, boosterHeight, 32);
  geometriesToDispose.push(boosterGeo);
  const boosterMesh = new THREE.Mesh(boosterGeo, whiteHullMat);
  boosterMesh.position.y = boosterHeight / 2 + 0.4;
  stage1.add(boosterMesh);

  // Mongolian Soyombo Decal & Aerospace Insignia
  const decalTex = createRocketDecalTexture();
  texturesToDispose.push(decalTex);
  const decalMat = new THREE.MeshBasicMaterial({
    map: decalTex,
    transparent: true,
  });
  materialsToDispose.push(decalMat);
  const decalGeo = new THREE.PlaneGeometry(1.4, 3.2);
  geometriesToDispose.push(decalGeo);
  const decalMesh = new THREE.Mesh(decalGeo, decalMat);
  decalMesh.position.set(0, 6.5, boosterRadius + 0.015);
  stage1.add(decalMesh);

  // Titanium Grid Fins (4 units at top of Stage 1)
  const gridFins: THREE.Group[] = [];
  for (let i = 0; i < 4; i++) {
    const finGroup = new THREE.Group();
    const angle = (i / 4) * Math.PI * 2;
    finGroup.position.set(Math.cos(angle) * boosterRadius, 11.2, Math.sin(angle) * boosterRadius);
    finGroup.rotation.y = angle + Math.PI / 2;

    const finGeo = new THREE.BoxGeometry(0.7, 0.45, 0.06);
    geometriesToDispose.push(finGeo);
    const finMesh = new THREE.Mesh(finGeo, blackCarbonMat);
    finMesh.position.x = 0.35;
    finGroup.add(finMesh);

    finGroup.rotation.z = 0;
    stage1.add(finGroup);
    gridFins.push(finGroup);
  }

  // Engine Base & Dynamic Engine Cluster
  const engineBaseGeo = new THREE.CylinderGeometry(boosterRadius, boosterRadius * 0.95, 0.6, 24);
  geometriesToDispose.push(engineBaseGeo);
  const engineBase = new THREE.Mesh(engineBaseGeo, blackCarbonMat);
  engineBase.position.y = 0.3;
  stage1.add(engineBase);

  const engineCount = rocketConfig?.engine ? (rocketConfig.engine.thrustKn > 3000 ? 5 : 9) : 9;
  const engineNozzles: THREE.Mesh[] = [];
  for (let i = 0; i < engineCount; i++) {
    const nozGeo = new THREE.ConeGeometry(0.2, 0.65, 16, 1, true);
    geometriesToDispose.push(nozGeo);
    const noz = new THREE.Mesh(nozGeo, engineNozzleMat);
    noz.rotation.x = Math.PI;
    if (i === 0) {
      noz.position.set(0, -0.1, 0);
    } else {
      const ang = ((i - 1) / (engineCount - 1)) * Math.PI * 2;
      noz.position.set(Math.cos(ang) * 0.52, -0.1, Math.sin(ang) * 0.52);
    }
    stage1.add(noz);
    engineNozzles.push(noz);
  }

  // Exhaust Supersonic Flame Core & Outer Bell
  const flameGroup = new THREE.Group();
  flameGroup.position.y = -0.15;
  stage1.add(flameGroup);

  const coreFlameGeo = new THREE.ConeGeometry(0.7, 5.5, 16);
  geometriesToDispose.push(coreFlameGeo);
  const coreFlame = new THREE.Mesh(coreFlameGeo, flameCoreMat);
  coreFlame.rotation.x = Math.PI;
  coreFlame.position.y = -2.8;
  flameGroup.add(coreFlame);

  const outerFlameGeo = new THREE.ConeGeometry(1.6, 7.5, 20);
  geometriesToDispose.push(outerFlameGeo);
  const outerFlame = new THREE.Mesh(outerFlameGeo, flameOuterMat);
  outerFlame.rotation.x = Math.PI;
  outerFlame.position.y = -3.8;
  flameGroup.add(outerFlame);

  // Mach diamonds inside the exhaust jet
  const machDiamonds: THREE.Mesh[] = [];
  for (let d = 0; d < 4; d++) {
    const diamondGeo = new THREE.OctahedronGeometry(0.25 - d * 0.04, 0);
    geometriesToDispose.push(diamondGeo);
    const diamond = new THREE.Mesh(diamondGeo, flameCoreMat);
    diamond.position.y = -1.2 - d * 1.3;
    flameGroup.add(diamond);
    machDiamonds.push(diamond);
  }

  // Side Strap-on Boosters (0, 2, or 4 boosters based on player's RocketConfig)
  const boosterCount = rocketConfig?.boosterCount ?? 0;
  const sideBoostersList: {
    group: THREE.Group;
    angle: number;
    initialPos: THREE.Vector3;
    flame: THREE.Group;
  }[] = [];

  if (boosterCount > 0) {
    for (let b = 0; b < boosterCount; b++) {
      const bGroup = new THREE.Group();
      const angle = (b / boosterCount) * Math.PI * 2 + (boosterCount === 2 ? Math.PI / 2 : 0);
      const bDist = boosterRadius + 0.58;
      bGroup.position.set(Math.cos(angle) * bDist, 0, Math.sin(angle) * bDist);

      // Booster cylinder body
      const bCylGeo = new THREE.CylinderGeometry(0.38, 0.38, 8.2, 24);
      geometriesToDispose.push(bCylGeo);
      const bCylMesh = new THREE.Mesh(bCylGeo, whiteHullMat);
      bCylMesh.position.y = 8.2 / 2 + 0.3;
      bGroup.add(bCylMesh);

      // Slanted Aerodynamic Nosecone
      const bConeGeo = new THREE.ConeGeometry(0.38, 1.4, 24);
      geometriesToDispose.push(bConeGeo);
      const bConeMesh = new THREE.Mesh(bConeGeo, blackCarbonMat);
      bConeMesh.position.y = 8.2 + 0.3 + 0.7;
      bGroup.add(bConeMesh);

      // Attachment Struts
      const strutGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8);
      geometriesToDispose.push(strutGeo);
      const strutUpper = new THREE.Mesh(strutGeo, blackCarbonMat);
      strutUpper.position.set(0, 6.5, 0);
      bGroup.add(strutUpper);

      // Booster exhaust nozzle
      const bNozGeo = new THREE.ConeGeometry(0.26, 0.7, 16, 1, true);
      geometriesToDispose.push(bNozGeo);
      const bNoz = new THREE.Mesh(bNozGeo, engineNozzleMat);
      bNoz.rotation.x = Math.PI;
      bNoz.position.y = 0.05;
      bGroup.add(bNoz);

      // Booster exhaust flame
      const bFlame = new THREE.Group();
      bFlame.position.y = -0.1;
      const bCoreFlameGeo = new THREE.ConeGeometry(0.32, 3.8, 14);
      geometriesToDispose.push(bCoreFlameGeo);
      const bCoreFlame = new THREE.Mesh(bCoreFlameGeo, flameCoreMat);
      bCoreFlame.rotation.x = Math.PI;
      bCoreFlame.position.y = -1.9;
      bFlame.add(bCoreFlame);

      const bOuterFlameGeo = new THREE.ConeGeometry(0.75, 4.8, 16);
      geometriesToDispose.push(bOuterFlameGeo);
      const bOuterFlame = new THREE.Mesh(bOuterFlameGeo, flameOuterMat);
      bOuterFlame.rotation.x = Math.PI;
      bOuterFlame.position.y = -2.4;
      bFlame.add(bOuterFlame);

      bGroup.add(bFlame);
      stage1.add(bGroup);

      sideBoostersList.push({
        group: bGroup,
        angle,
        initialPos: bGroup.position.clone(),
        flame: bFlame,
      });
    }
  }

  // Transonic Vapor Cone (Condensation collar at Max-Q)
  const vaporConeGeo = new THREE.ConeGeometry(1.8, 1.2, 24, 1, true);
  geometriesToDispose.push(vaporConeGeo);
  const vaporCone = new THREE.Mesh(vaporConeGeo, vaporConeMat);
  vaporCone.position.set(0, 11.5, 0);
  stage1.add(vaporCone);

  // ----- STAGE 2 (UPPER STAGE) -----
  const stage2 = new THREE.Group();
  stage2.position.y = 11.4;
  rocketRoot.add(stage2);

  // Interstage collar ring
  const interstageGeo = new THREE.CylinderGeometry(boosterRadius + 0.02, boosterRadius + 0.02, 1.2, 32);
  geometriesToDispose.push(interstageGeo);
  const interstage = new THREE.Mesh(interstageGeo, blackCarbonMat);
  interstage.position.y = 0.6;
  stage2.add(interstage);

  // Upper Stage Fuel Tank
  const s2Height = 3.8;
  const s2Geo = new THREE.CylinderGeometry(boosterRadius, boosterRadius, s2Height, 32);
  geometriesToDispose.push(s2Geo);
  const s2Mesh = new THREE.Mesh(s2Geo, whiteHullMat);
  s2Mesh.position.y = s2Height / 2 + 1.2;
  stage2.add(s2Mesh);

  // Vacuum Engine Nozzle (MVac)
  const vacNozGeo = new THREE.ConeGeometry(0.48, 1.2, 24, 1, true);
  geometriesToDispose.push(vacNozGeo);
  const vacNozMat = new THREE.MeshStandardMaterial({
    color: 0x991b1b,
    roughness: 0.3,
    metalness: 0.9,
    emissive: 0xff4400,
    emissiveIntensity: 0,
  });
  materialsToDispose.push(vacNozMat);
  const vacNoz = new THREE.Mesh(vacNozGeo, vacNozMat);
  vacNoz.rotation.x = Math.PI;
  vacNoz.position.y = 0.6;
  stage2.add(vacNoz);

  // Vacuum Flame (Blue/Violet/Orange expansion)
  const vacFlameGeo = new THREE.ConeGeometry(1.8, 4.5, 16);
  geometriesToDispose.push(vacFlameGeo);
  const vacFlameMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
  });
  materialsToDispose.push(vacFlameMat);
  const vacFlame = new THREE.Mesh(vacFlameGeo, vacFlameMat);
  vacFlame.rotation.x = Math.PI;
  vacFlame.position.y = -1.8;
  stage2.add(vacFlame);

  // ----- PAYLOAD: USER'S CUSTOM SPACECRAFT & AERODYNAMIC FAIRING -----
  const payloadGroup = new THREE.Group();
  payloadGroup.position.y = 5.2;
  stage2.add(payloadGroup);

  // Embed User's customized Spacecraft from Design Lab
  let customSpacecraftBundle: ReturnType<typeof buildModularSpacecraft> | null = null;
  let craftMeshFallback: THREE.Mesh | null = null;
  let solarLeftFallback: THREE.Group | null = null;
  let solarRightFallback: THREE.Group | null = null;

  if (spacecraftDesign) {
    customSpacecraftBundle = buildModularSpacecraft(spacecraftDesign);
    customSpacecraftBundle.group.scale.set(0.40, 0.40, 0.40);
    customSpacecraftBundle.group.position.set(0, 0.85, 0);
    payloadGroup.add(customSpacecraftBundle.group);
  } else {
    // Fallback satellite bus
    const craftGeo = new THREE.BoxGeometry(0.9, 1.4, 0.9);
    geometriesToDispose.push(craftGeo);
    craftMeshFallback = new THREE.Mesh(craftGeo, goldMliMat);
    craftMeshFallback.position.y = 1.0;
    payloadGroup.add(craftMeshFallback);

    solarLeftFallback = new THREE.Group();
    solarLeftFallback.position.set(-0.5, 1.0, 0);
    payloadGroup.add(solarLeftFallback);
    const panelGeo = new THREE.BoxGeometry(0.08, 1.1, 0.65);
    geometriesToDispose.push(panelGeo);
    const panelLeftMesh = new THREE.Mesh(panelGeo, solarMat);
    panelLeftMesh.position.x = -0.35;
    solarLeftFallback.add(panelLeftMesh);

    solarRightFallback = new THREE.Group();
    solarRightFallback.position.set(0.5, 1.0, 0);
    payloadGroup.add(solarRightFallback);
    const panelRightMesh = new THREE.Mesh(panelGeo, solarMat);
    panelRightMesh.position.x = 0.35;
    solarRightFallback.add(panelRightMesh);
  }

  // Fairing Shell (Dimensions scaled to custom fairing)
  const fairingRadius = boosterRadius + (rocketConfig?.fairing ? Math.min(0.35, rocketConfig.fairing.diameterM * 0.05) : 0.12);
  const fairingGeo = new THREE.ConeGeometry(fairingRadius, 3.8, 32, 1, false, 0, Math.PI);
  geometriesToDispose.push(fairingGeo);
  const fairingLeft = new THREE.Mesh(fairingGeo, whiteHullMat);
  fairingLeft.position.set(0, 1.9, 0);
  payloadGroup.add(fairingLeft);

  // Fairing Shell Right Half
  const fairingRight = new THREE.Mesh(fairingGeo, whiteHullMat);
  fairingRight.position.set(0, 1.9, 0);
  fairingRight.rotation.y = Math.PI;
  payloadGroup.add(fairingRight);

  // ================= 7. CINEMATIC CAMERA SYSTEM =================
  const camera = new THREE.PerspectiveCamera(48, containerWidth / containerHeight, 0.1, 800);
  camera.position.set(0, 10, 26);

  let currentCamMode: LaunchCameraMode = 'chase';
  const cameraTarget = new THREE.Vector3(0, 8, 0);
  const currentCamPos = new THREE.Vector3(0, 10, 26);

  const setCameraMode = (mode: LaunchCameraMode) => {
    currentCamMode = mode;
  };

  // ================= 8. FLIGHT TIMELINE & SIMULATION TICK =================
  const updateSequence = (progress: number, delta: number): LaunchTelemetryData => {
    // Atmospheric rotation of clouds
    cloudMesh.rotation.y += delta * 0.02;

    let phaseKey = 'padHold';
    let altitudeKm = 0;
    let velocityKms = 0;
    let downrangeKm = 0;
    let mach = 0;
    let dynamicPressureKpa = 0;
    let gForce = 1.0;
    let throttlePct = 0;
    let isFairingSeparated = false;
    let isBoosterSeparated = false;
    let isPayloadDeployed = false;
    let pitchDeg = 90;
    let rollDeg = 0;
    let headingDeg = 90;

    // Steam particles update
    const posAttr = steamGeo.attributes.position as THREE.BufferAttribute;
    const posArr = posAttr.array as Float32Array;

    if (progress <= 0.05) {
      // Countdown & Ignition
      phaseKey = progress > 0.02 ? 'ignition' : 'countdown';
      throttlePct = progress > 0.02 ? 100 : 0;
      gForce = progress > 0.02 ? 1.2 : 1.0;

      steamMat.opacity = progress > 0.02 ? Math.min(0.85, (progress - 0.02) * 30) : 0;
      for (let i = 0; i < steamCount; i++) {
        posArr[i * 3] += steamVel[i].x;
        posArr[i * 3 + 1] += steamVel[i].y;
        posArr[i * 3 + 2] += steamVel[i].z;
        if (posArr[i * 3 + 1] > 6) {
          posArr[i * 3 + 1] = -1.5;
          posArr[i * 3] = (Math.random() - 0.5) * 3;
          posArr[i * 3 + 2] = (Math.random() - 0.5) * 3;
        }
      }
      posAttr.needsUpdate = true;

      if (progress > 0.03) {
        swingArm1.rotation.y = -Math.min(0.8, (progress - 0.03) * 30);
        swingArm2.rotation.y = -Math.min(0.8, (progress - 0.03) * 30);
      }

      flameGroup.visible = progress > 0.02;
      coreFlame.scale.set(1, 0.4 + Math.random() * 0.2, 1);
      outerFlame.scale.set(1, 0.4 + Math.random() * 0.2, 1);
    } else if (progress <= 0.15) {
      // Liftoff & Tower Clear
      phaseKey = progress < 0.09 ? 'liftoff' : 'towerClear';
      const p = (progress - 0.05) / 0.10;
      altitudeKm = p * 12.0;
      velocityKms = p * 0.72;
      downrangeKm = p * 1.5;
      mach = velocityKms / 0.34;
      gForce = 1.3 + p * 0.5;
      throttlePct = 100;
      pitchDeg = 90 - p * 5;
      rollDeg = p * 12; // Roll program to flight azimuth 90°
      headingDeg = 90;

      rocketRoot.position.y = p * 18.0;
      rocketRoot.rotation.z = -p * 0.05;

      swingArm1.rotation.y = -1.2;
      swingArm2.rotation.y = -1.2;
      steamMat.opacity = Math.max(0, 0.85 - p * 1.5);

      flameGroup.visible = true;
      const flicker = 1 + Math.sin(Date.now() * 0.05) * 0.12;
      coreFlame.scale.set(1, flicker * 1.2, 1);
      outerFlame.scale.set(1, flicker * 1.3, 1);
    } else if (progress <= 0.35) {
      // Gravity Turn & Max-Q (Troposphere to Stratosphere)
      const p = (progress - 0.15) / 0.20;
      phaseKey = p > 0.4 ? 'maxQ' : 'gravityTurn';
      altitudeKm = 12.0 + p * 38.0;
      velocityKms = 0.72 + p * 1.6;
      downrangeKm = 1.5 + p * 32.0;
      mach = velocityKms / 0.31;
      dynamicPressureKpa = Math.sin(p * Math.PI) * 38.5;
      gForce = 1.8 + p * 1.1;
      throttlePct = dynamicPressureKpa > 30 ? 75 : 100;
      pitchDeg = 85 - p * 35; // 85° down to 50°
      rollDeg = 12;
      headingDeg = 90;

      rocketRoot.position.y = 18.0 + p * 35.0;
      rocketRoot.position.x = p * 18.0;
      rocketRoot.rotation.z = -0.05 - p * 0.35;

      // Vapor Cone condensation at Max-Q
      const coneP = Math.max(0, Math.sin(p * Math.PI));
      vaporConeMat.opacity = coneP * 0.65;
      vaporCone.scale.set(1 + coneP * 0.25, 1, 1 + coneP * 0.25);

      flameGroup.visible = true;
      const flicker = 1 + Math.sin(Date.now() * 0.08) * 0.15;
      outerFlame.scale.set(1 + p * 0.5, flicker * 1.5, 1 + p * 0.5);
    } else if (progress <= 0.50) {
      // MECO & Booster Separation (Mesosphere)
      const p = (progress - 0.35) / 0.15;
      phaseKey = p < 0.4 ? 'meco' : 'boosterSep';
      altitudeKm = 50.0 + p * 32.0;
      velocityKms = 2.32 + p * 0.95;
      downrangeKm = 33.5 + p * 48.0;
      mach = 7.5 + p * 3.0;
      dynamicPressureKpa = Math.max(0, 15 - p * 15);
      gForce = p < 0.2 ? 0.2 : 1.1;
      throttlePct = p < 0.3 ? 0 : 100;
      pitchDeg = 50 - p * 20; // 50° down to 30°
      rollDeg = 12;
      headingDeg = 90;
      vaporConeMat.opacity = 0;

      rocketRoot.position.y = 53.0 + p * 28.0;
      rocketRoot.position.x = 18.0 + p * 25.0;
      rocketRoot.rotation.z = -0.40 - p * 0.18;

      if (p >= 0.3) {
        isBoosterSeparated = true;
        flameGroup.visible = false;

        const sepP = (p - 0.3) / 0.7;
        stage1.position.y = -sepP * 14.0;
        stage1.position.x = -sepP * 6.0;
        stage1.rotation.z += 0.006;

        gridFins.forEach(f => {
          f.rotation.z = THREE.MathUtils.damp(f.rotation.z, Math.PI / 2, 8, delta);
        });

        vacNozMat.emissiveIntensity = 1.0;
        vacFlameMat.opacity = 0.85;
      }
    } else if (progress <= 0.70) {
      // Stage 2 Vacuum Burn & Fairing Jettison (Thermosphere)
      const p = (progress - 0.50) / 0.20;
      phaseKey = p > 0.3 ? 'fairingSep' : 's2Ignition';
      altitudeKm = 82.0 + p * 115.0;
      velocityKms = 3.27 + p * 2.65;
      downrangeKm = 81.5 + p * 145.0;
      mach = 10.5 + p * 8.5;
      dynamicPressureKpa = 0;
      gForce = 2.2 + p * 0.8;
      throttlePct = 100;
      pitchDeg = 30 - p * 20; // 30° down to 10°
      rollDeg = 12;
      headingDeg = 90;
      isBoosterSeparated = true;

      rocketRoot.position.y = 81.0 + p * 30.0;
      rocketRoot.position.x = 43.0 + p * 40.0;
      rocketRoot.rotation.z = -0.58 - p * 0.22;

      // Fairing separation
      if (p >= 0.3) {
        isFairingSeparated = true;
        const fairingP = (p - 0.3) / 0.7;
        fairingLeft.position.x = -fairingP * 7.0;
        fairingLeft.position.y = 1.8 - fairingP * 5.0;
        fairingLeft.rotation.z = -fairingP * 0.9;

        fairingRight.position.x = fairingP * 7.0;
        fairingRight.position.y = 1.8 - fairingP * 5.0;
        fairingRight.rotation.z = fairingP * 0.9;
      }

      vacNozMat.emissiveIntensity = 1.0;
      vacFlameMat.opacity = 0.9 + Math.sin(Date.now() * 0.05) * 0.1;
      vacFlame.scale.set(1.4 + p * 0.6, 1 + Math.sin(Date.now() * 0.08) * 0.2, 1.4 + p * 0.6);
    } else if (progress <= 0.88) {
      // Orbital Insertion (SECO)
      const p = (progress - 0.70) / 0.18;
      phaseKey = p > 0.85 ? 'seco' : 'orbitAchieved';
      altitudeKm = 197.0 + p * 323.0;
      velocityKms = 5.92 + p * 1.82;
      downrangeKm = 226.5 + p * 380.0;
      mach = 19.0 + p * 5.5;
      dynamicPressureKpa = 0;
      gForce = p > 0.85 ? 0.0 : 3.2;
      throttlePct = p > 0.85 ? 0 : 100;
      pitchDeg = 10 - p * 10; // 10° down to 0° (horizontal to Earth surface)
      rollDeg = 0;
      headingDeg = 90;
      isBoosterSeparated = true;
      isFairingSeparated = true;

      rocketRoot.position.y = 111.0 + p * 20.0;
      rocketRoot.position.x = 83.0 + p * 60.0;
      rocketRoot.rotation.z = -0.80 - p * 0.15;

      if (p > 0.85) {
        vacFlameMat.opacity = 0;
        vacNozMat.emissiveIntensity = 0.2;
      }
    } else {
      // Spacecraft Deployment & Solar Arrays
      const p = (progress - 0.88) / 0.12;
      phaseKey = 'deploySuccess';
      altitudeKm = 520.0;
      velocityKms = 7.74;
      downrangeKm = 606.5 + p * 150.0;
      mach = 24.5;
      gForce = 0.0;
      throttlePct = 0;
      pitchDeg = 0;
      rollDeg = 0;
      headingDeg = 90;
      isBoosterSeparated = true;
      isFairingSeparated = true;
      isPayloadDeployed = true;

      vacFlameMat.opacity = 0;
      vacNozMat.emissiveIntensity = 0.05;

      payloadGroup.position.y = 5.2 + p * 5.0;
      if (customSpacecraftBundle) {
        customSpacecraftBundle.group.rotation.y += delta * 0.35;
      } else if (craftMeshFallback) {
        craftMeshFallback.rotation.y += delta * 0.35;
        if (solarLeftFallback) {
          solarLeftFallback.rotation.y = THREE.MathUtils.damp(solarLeftFallback.rotation.y, -Math.PI / 2, 6, delta);
        }
        if (solarRightFallback) {
          solarRightFallback.rotation.y = THREE.MathUtils.damp(solarRightFallback.rotation.y, Math.PI / 2, 6, delta);
        }
      }
    }

    // ================= DYNAMIC SMOKE TRAIL EMISSION =================
    // Emits smoke puffs behind rocket during lower/mid atmospheric ascent (progress 0.05 to 0.45)
    if (progress > 0.05 && progress < 0.45 && flameGroup.visible) {
      const rocketWorldPos = new THREE.Vector3();
      flameGroup.getWorldPosition(rocketWorldPos);

      // Spawn puff
      const p = smokeParticles[nextSmokeIdx];
      p.mesh.position.copy(rocketWorldPos);
      p.mesh.position.x += (Math.random() - 0.5) * 0.4;
      p.mesh.position.z += (Math.random() - 0.5) * 0.4;
      p.scale = 0.9;
      p.opacity = 0.85;
      p.active = true;
      p.lifetime = 0;
      p.mesh.visible = true;
      nextSmokeIdx = (nextSmokeIdx + 1) % smokeCount;
    }

    // Update active smoke puffs
    for (let i = 0; i < smokeCount; i++) {
      const p = smokeParticles[i];
      if (p.active) {
        p.lifetime += delta;
        p.scale += delta * 3.5; // Expands outward
        p.opacity = Math.max(0, 0.85 - p.lifetime * 0.45); // Fades away
        p.mesh.scale.set(p.scale, p.scale, p.scale);
        (p.mesh.material as THREE.MeshBasicMaterial).opacity = p.opacity;

        if (p.opacity <= 0.02 || p.lifetime > 2.5) {
          p.active = false;
          p.mesh.visible = false;
        }
      }
    }

    // ================= DYNAMIC CAMERA MODES & SHAKE =================
    // Max-Q and liftoff vibration
    const shakeIntensity = (progress > 0.03 && progress < 0.12) ? 0.08 : (progress > 0.22 && progress < 0.30) ? 0.12 : 0;
    const shakeX = (Math.random() - 0.5) * shakeIntensity;
    const shakeY = (Math.random() - 0.5) * shakeIntensity;

    const rocketMat = rocketRoot.matrixWorld;
    const rocketPos = new THREE.Vector3();
    rocketRoot.getWorldPosition(rocketPos);

    if (currentCamMode === 'chase') {
      // KSP / NASA Chase Cam: positioned behind and below the rocket, looking up towards the Moon/sky
      const chaseOffset = new THREE.Vector3(-10, -6, 24).applyMatrix4(rocketMat);
      currentCamPos.x = THREE.MathUtils.damp(currentCamPos.x, chaseOffset.x + shakeX, 5, delta);
      currentCamPos.y = THREE.MathUtils.damp(currentCamPos.y, chaseOffset.y + shakeY, 5, delta);
      currentCamPos.z = THREE.MathUtils.damp(currentCamPos.z, chaseOffset.z, 5, delta);
      camera.position.copy(currentCamPos);

      const targetPos = rocketPos.clone().add(new THREE.Vector3(0, 5, 0));
      cameraTarget.x = THREE.MathUtils.damp(cameraTarget.x, targetPos.x, 7, delta);
      cameraTarget.y = THREE.MathUtils.damp(cameraTarget.y, targetPos.y, 7, delta);
      cameraTarget.z = THREE.MathUtils.damp(cameraTarget.z, targetPos.z, 7, delta);
      camera.lookAt(cameraTarget);
    } else if (currentCamMode === 'pad') {
      camera.position.set(-6 + shakeX, 3 + shakeY, 14);
      cameraTarget.copy(rocketPos).add(new THREE.Vector3(0, 4, 0));
      camera.lookAt(cameraTarget);
    } else if (currentCamMode === 'tracking') {
      camera.position.set(-22, 16, 45);
      cameraTarget.copy(rocketPos).add(new THREE.Vector3(0, 3, 0));
      camera.lookAt(cameraTarget);
    } else if (currentCamMode === 'booster') {
      const camOffset = new THREE.Vector3(1.2, 10.5, 0).applyMatrix4(rocketMat);
      camera.position.copy(camOffset);
      const lookOffset = new THREE.Vector3(1.5, -6.0, 0).applyMatrix4(rocketMat);
      camera.lookAt(lookOffset);
    } else if (currentCamMode === 'cockpit') {
      // Nose cone FPV looking forward/up
      const noseOffset = new THREE.Vector3(0, 16.5, 0).applyMatrix4(rocketMat);
      camera.position.copy(noseOffset);
      const fwdOffset = new THREE.Vector3(0, 28.0, 0).applyMatrix4(rocketMat);
      camera.lookAt(fwdOffset);
    } else if (currentCamMode === 'spacecraft') {
      const payloadWorld = new THREE.Vector3();
      payloadGroup.getWorldPosition(payloadWorld);
      camera.position.set(payloadWorld.x + 4.5, payloadWorld.y + 1.2, payloadWorld.z + 5.5);
      camera.lookAt(payloadWorld);
    }

    return {
      phaseKey,
      altitudeKm: Math.round(altitudeKm * 10) / 10,
      velocityKms: Math.round(velocityKms * 100) / 100,
      downrangeKm: Math.round(downrangeKm),
      mach: Math.round(mach * 10) / 10,
      dynamicPressureKpa: Math.round(dynamicPressureKpa * 10) / 10,
      gForce: Math.round(gForce * 10) / 10,
      throttlePct,
      isFairingSeparated,
      isBoosterSeparated,
      isPayloadDeployed,
      pitchDeg: Math.round(pitchDeg),
      rollDeg: Math.round(rollDeg),
      headingDeg: Math.round(headingDeg),
    };
  };

  const dispose = () => {
    geometriesToDispose.forEach(g => g.dispose());
    materialsToDispose.forEach(m => m.dispose());
    texturesToDispose.forEach(t => t.dispose());
    padSpot1.dispose();
    padSpot2.dispose();
  };

  return {
    group: root,
    camera,
    updateSequence,
    setCameraMode,
    dispose,
  };
}

/**
 * Compatible cinematic rocket model for OpeningCinematic
 */
export function buildLaunchRocketScene() {
  const root = new THREE.Group();
  const rocketGroup = new THREE.Group();
  root.add(rocketGroup);

  const whiteMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.25,
    metalness: 0.8,
  });

  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.4,
    metalness: 0.6,
  });

  const fireMat = new THREE.MeshBasicMaterial({
    color: 0xff5500,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
  });

  const geometries: THREE.BufferGeometry[] = [];

  const boosterGeo = new THREE.CylinderGeometry(0.7, 0.7, 7.0, 24);
  geometries.push(boosterGeo);
  const boosterMesh = new THREE.Mesh(boosterGeo, whiteMat);
  boosterMesh.position.y = 3.5;
  rocketGroup.add(boosterMesh);

  // Decal
  const decalTex = createRocketDecalTexture();
  const decalMat = new THREE.MeshBasicMaterial({ map: decalTex, transparent: true });
  const decalGeo = new THREE.PlaneGeometry(1.2, 2.4);
  geometries.push(decalGeo);
  const decalMesh = new THREE.Mesh(decalGeo, decalMat);
  decalMesh.position.set(0, 4.2, 0.71);
  rocketGroup.add(decalMesh);

  // Nozzle
  for (let i = 0; i < 9; i++) {
    const nozzleGeo = new THREE.ConeGeometry(0.18, 0.5, 12, 1, true);
    geometries.push(nozzleGeo);
    const nozzle = new THREE.Mesh(nozzleGeo, blackMat);
    nozzle.rotation.x = Math.PI;
    if (i === 0) {
      nozzle.position.set(0, -0.2, 0);
    } else {
      const angle = (i / 8) * Math.PI * 2;
      nozzle.position.set(Math.cos(angle) * 0.45, -0.2, Math.sin(angle) * 0.45);
    }
    rocketGroup.add(nozzle);
  }

  // Upper stage & fairing
  const s2Geo = new THREE.CylinderGeometry(0.7, 0.7, 2.5, 24);
  geometries.push(s2Geo);
  const s2Mesh = new THREE.Mesh(s2Geo, whiteMat);
  s2Mesh.position.y = 8.25;
  rocketGroup.add(s2Mesh);

  const fairingGeo = new THREE.ConeGeometry(0.72, 2.2, 24);
  geometries.push(fairingGeo);
  const fairing = new THREE.Mesh(fairingGeo, whiteMat);
  fairing.position.y = 10.6;
  rocketGroup.add(fairing);

  // Fire plume
  const fireGeo = new THREE.ConeGeometry(1.2, 4.5, 16);
  geometries.push(fireGeo);
  const firePlume = new THREE.Mesh(fireGeo, fireMat);
  firePlume.position.y = -2.4;
  firePlume.rotation.x = Math.PI;
  rocketGroup.add(firePlume);

  return {
    group: root,
    rocketGroup,
    firePlume,
    updateSequence: (p: number) => ({
      phase: p > 0.5 ? 'Ascent' : 'Ignition',
      altitudeKm: p * 150,
      velocityKms: p * 6,
      downrangeKm: p * 120,
    }),
    dispose: () => {
      geometries.forEach(g => g.dispose());
      whiteMat.dispose();
      blackMat.dispose();
      fireMat.dispose();
      decalMat.dispose();
    },
  };
}
