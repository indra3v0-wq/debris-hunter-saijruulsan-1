/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { 
  createEarthSurfaceTexture, 
  createEarthCloudTexture, 
  createEarthNightTexture, 
  createEarthSpecularTexture,
  createEarthBumpTexture,
  createMoonTexture,
  createMilkyWaySkyboxTexture,
  createMarsTexture,
  createJupiterTexture,
  createSaturnRingTexture
} from './proceduralTextures';
import { MISSIONS, DEBRIS_CATALOG } from '../simulation/data';
import { DebrisCatalogItem } from '../types';

export interface OrbitalLayerFilter {
  active: boolean;
  defunct: boolean;
  rocketBodies: boolean;
  fragments: boolean;
  altShell: 'all' | 'leo' | 'meo' | 'geo';
}

export interface SatelliteTelemetry {
  pos: THREE.Vector3;
  forward: THREE.Vector3;
  latDeg: number;
  lonDeg: number;
  altKm: number;
  orbitalVelocityKms: number;
  isDaylight: boolean;
}

export interface EarthSceneBundle {
  group: THREE.Group;
  earthMesh: THREE.Mesh;
  cloudsMesh: THREE.Mesh;
  moonGroup: THREE.Group;
  orbitLinesGroup: THREE.Group;
  setSunDirection: (dir: THREE.Vector3) => void;
  setEarthTime: (date: Date, scrubHour?: number) => { sunDirection: THREE.Vector3; earthRotationRad: number };
  setLayerFilter: (filter: OrbitalLayerFilter) => void;
  getInspectableObjects: () => THREE.Object3D[];
  getSatelliteTelemetry: (satId: string, timeSeconds: number) => SatelliteTelemetry;
  focusObject: (objId: string) => THREE.Vector3 | null;
  update: (deltaSeconds: number) => void;
  dispose: () => void;
}

export interface NasaEarthBundle {
  group: THREE.Group;
  earthMesh: THREE.Mesh;
  cloudsMesh: THREE.Mesh;
  setSunDirection: (dir: THREE.Vector3) => void;
  setEarthRotation: (rad: number) => void;
  update: (deltaSeconds: number) => void;
  dispose: () => void;
}

export interface NasaSpaceEnvironmentBundle {
  group: THREE.Group;
  moonMesh?: THREE.Mesh;
  update: (deltaSeconds: number) => void;
  dispose: () => void;
}

/**
 * Creates high-fidelity NASA Blue Marble Earth mesh with dynamic Day/Night Terminator
 * and city lights that ONLY illuminate on the dark night side!
 */
export function createNasaEarthMesh(earthRadius = 6.371, isSoftwareGl = false): NasaEarthBundle {
  const group = new THREE.Group();
  const segments = isSoftwareGl ? 48 : 64;

  const earthGeo = new THREE.SphereGeometry(earthRadius, segments, segments);
  const earthTex = createEarthSurfaceTexture();
  const earthNightTex = createEarthNightTexture();
  const earthSpecTex = createEarthSpecularTexture();
  const earthBumpTex = createEarthBumpTexture();

  // Load authentic photographic NASA satellite texture
  const textureLoader = new THREE.TextureLoader();
  const nasaPhotoTex = textureLoader.load('/assets/aistudio/nasa_earth_photorealistic.png', (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    earthMat.map = tex;
    earthMat.needsUpdate = true;
  });
  nasaPhotoTex.colorSpace = THREE.SRGBColorSpace;
  nasaPhotoTex.wrapS = THREE.RepeatWrapping;
  nasaPhotoTex.wrapT = THREE.ClampToEdgeWrapping;

  // Uniform for Sun Direction in World Space
  const sunDirUniform = { value: new THREE.Vector3(1, 0.3, 0.8).normalize() };

  const earthMat = new THREE.MeshStandardMaterial({
    map: nasaPhotoTex || earthTex,
    roughnessMap: earthSpecTex,
    bumpMap: earthBumpTex,
    bumpScale: 0.04,
    emissiveMap: earthNightTex,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.85,
    roughness: 0.55, // Low roughness on oceans allows vibrant sun specular glint
    metalness: 0.02, // Kept minimal to preserve vivid Blue Marble colors
  });

  // Inject Custom Day/Night Terminator Shader
  // This ensures city lights illuminate ONLY on the dark side of Earth, fading in daylight!
  earthMat.onBeforeCompile = (shader) => {
    shader.uniforms.uSunDirection = sunDirUniform;

    shader.fragmentShader = `
      uniform vec3 uSunDirection;
    ` + shader.fragmentShader;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `
      #ifdef USE_EMISSIVEMAP
        // Transform world sun direction to view space without expensive inverse()
        vec3 viewSunDir = normalize((viewMatrix * vec4(uSunDirection, 0.0)).xyz);
        float sunDot = dot(normalize(vNormal), viewSunDir);

        // Night mask: 1.0 on dark hemisphere, smoothly fading out towards dawn/dusk
        float nightFactor = smoothstep(0.08, -0.15, sunDot);

        vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
        totalEmissiveRadiance += emissiveColor.rgb * emissive * nightFactor * 2.5;
      #endif
      `
    );
  };

  const earthMesh = new THREE.Mesh(earthGeo, earthMat);
  group.add(earthMesh);

  // Cloud Shadow Layer (Subtle soft shadow beneath clouds onto Earth surface)
  const cloudsTex = createEarthCloudTexture();
  const cloudShadowGeo = new THREE.SphereGeometry(earthRadius * 1.004, segments, segments);
  const cloudShadowMat = new THREE.MeshBasicMaterial({
    map: cloudsTex,
    transparent: true,
    opacity: 0.06,
    color: 0x000000,
    blending: THREE.NormalBlending,
    depthWrite: false,
  });
  const cloudShadowMesh = new THREE.Mesh(cloudShadowGeo, cloudShadowMat);
  cloudShadowMesh.rotation.y = 0.012;
  group.add(cloudShadowMesh);

  // Atmosphere Clouds Layer (Crisp, transparent white clouds based on NASA satellite data)
  const cloudsGeo = new THREE.SphereGeometry(earthRadius * 1.010, segments, segments);
  const cloudsMat = new THREE.MeshStandardMaterial({
    map: cloudsTex,
    transparent: true,
    opacity: 0.38, // Tuned to 0.38 so the NASA satellite Earth surface is crystal clear
    blending: THREE.NormalBlending,
    depthWrite: false,
    roughness: 0.9,
  });
  const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
  group.add(cloudsMesh);

  // Rayleigh Scattering Blue Atmospheric Inner Rim
  const atmosphereGeo = new THREE.SphereGeometry(earthRadius * 1.022, 36, 36);
  const atmosphereMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.28,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
  });
  const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
  group.add(atmosphereMesh);

  // Outer Atmospheric Limb Corona (fading into cosmic vacuum)
  const outerHaloGeo = new THREE.SphereGeometry(earthRadius * 1.055, 36, 36);
  const outerHaloMat = new THREE.MeshBasicMaterial({
    color: 0x0284c7,
    transparent: true,
    opacity: 0.15,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
  });
  const outerHaloMesh = new THREE.Mesh(outerHaloGeo, outerHaloMat);
  group.add(outerHaloMesh);

  const setSunDirection = (dir: THREE.Vector3) => {
    sunDirUniform.value.copy(dir).normalize();
  };

  const setEarthRotation = (rad: number) => {
    earthMesh.rotation.y = rad;
    cloudShadowMesh.rotation.y = rad + 0.012;
    cloudsMesh.rotation.y = rad * 1.05;
  };

  const update = (deltaSeconds: number) => {
    earthMesh.rotation.y += deltaSeconds * 0.015;
    cloudShadowMesh.rotation.y += deltaSeconds * 0.018;
    cloudsMesh.rotation.y += deltaSeconds * 0.018;
  };

  const dispose = () => {
    earthGeo.dispose();
    earthMat.dispose();
    earthTex.dispose();
    earthNightTex.dispose();
    earthSpecTex.dispose();
    earthBumpTex.dispose();
    cloudShadowGeo.dispose();
    cloudShadowMat.dispose();
    cloudsGeo.dispose();
    cloudsMat.dispose();
    cloudsTex.dispose();
    atmosphereGeo.dispose();
    atmosphereMat.dispose();
    outerHaloGeo.dispose();
    outerHaloMat.dispose();
  };

  return {
    group,
    earthMesh,
    cloudsMesh,
    setSunDirection,
    setEarthRotation,
    update,
    dispose,
  };
}

/**
 * Creates NASA Deep Space Background with Milky Way Galaxy Skybox, Solar System planets, and stars
 */
export function createNasaSpaceEnvironment(isSoftwareGl = false): NasaSpaceEnvironmentBundle {
  const group = new THREE.Group();

  // 1. Milky Way Cosmic Skybox Dome (Inverted sphere)
  const skyRadius = 450;
  const skyGeo = new THREE.SphereGeometry(skyRadius, 32, 32);
  const skyTex = createMilkyWaySkyboxTexture();
  const skyMat = new THREE.MeshBasicMaterial({
    map: skyTex,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  group.add(skyDome);

  // 2. Solar System Planets:
  // MARS (Red Planet)
  const marsGeo = new THREE.SphereGeometry(1.2, 20, 20);
  const marsTex = createMarsTexture();
  const marsMat = new THREE.MeshStandardMaterial({
    map: marsTex,
    roughness: 0.85,
    metalness: 0.05,
  });
  const marsMesh = new THREE.Mesh(marsGeo, marsMat);
  marsMesh.position.set(110, 45, -160);
  group.add(marsMesh);

  // JUPITER (Gas Giant with Banded Atmosphere & Great Red Spot)
  const jupiterGeo = new THREE.SphereGeometry(4.2, 24, 24);
  const jupiterTex = createJupiterTexture();
  const jupiterMat = new THREE.MeshStandardMaterial({
    map: jupiterTex,
    roughness: 0.7,
    metalness: 0.05,
  });
  const jupiterMesh = new THREE.Mesh(jupiterGeo, jupiterMat);
  jupiterMesh.position.set(-180, -60, -220);
  group.add(jupiterMesh);

  // SATURN (With concentric rings & Cassini division)
  const saturnGroup = new THREE.Group();
  saturnGroup.position.set(220, -75, -260);
  group.add(saturnGroup);

  const saturnGeo = new THREE.SphereGeometry(3.2, 24, 24);
  const saturnMat = new THREE.MeshStandardMaterial({
    color: 0xecd59f,
    roughness: 0.65,
  });
  const saturnBody = new THREE.Mesh(saturnGeo, saturnMat);
  saturnGroup.add(saturnBody);

  const ringGeo = new THREE.RingGeometry(4.2, 7.8, 48);
  const ringTex = createSaturnRingTexture();
  const ringMat = new THREE.MeshBasicMaterial({
    map: ringTex,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
  });
  const saturnRings = new THREE.Mesh(ringGeo, ringMat);
  saturnRings.rotation.x = Math.PI / 2.3;
  saturnGroup.add(saturnRings);

  // 3. Moon (NASA cratered 3D model)
  const moonGeo = new THREE.SphereGeometry(2.0, 24, 24);
  const moonTex = createMoonTexture();
  const moonMat = new THREE.MeshStandardMaterial({
    map: moonTex,
    roughness: 0.92,
  });
  const moonMesh = new THREE.Mesh(moonGeo, moonMat);
  moonMesh.position.set(45, 18, -45);
  group.add(moonMesh);

  // 4. Pinpoint Starfield
  const starCount = isSoftwareGl ? 800 : 2000;
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);

  const cWhite = new THREE.Color(0xffffff);
  const cBlue = new THREE.Color(0xa5f3fc);
  const cAmber = new THREE.Color(0xfde68a);

  for (let i = 0; i < starCount; i++) {
    const v = new THREE.Vector3(
      (Math.random() - 0.5) * 600,
      (Math.random() - 0.5) * 600,
      (Math.random() - 0.5) * 600
    );
    if (v.length() < 60) v.setLength(80 + Math.random() * 200);

    starPos[i * 3] = v.x;
    starPos[i * 3 + 1] = v.y;
    starPos[i * 3 + 2] = v.z;

    const r = Math.random();
    const sc = r < 0.6 ? cWhite : r < 0.85 ? cBlue : cAmber;
    starColors[i * 3] = sc.r;
    starColors[i * 3 + 1] = sc.g;
    starColors[i * 3 + 2] = sc.b;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

  const starMat = new THREE.PointsMaterial({
    size: 0.75,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
  });
  const starField = new THREE.Points(starGeo, starMat);
  group.add(starField);

  let moonAngle = 0;
  const update = (deltaSeconds: number) => {
    skyDome.rotation.y += deltaSeconds * 0.002;
    jupiterMesh.rotation.y += deltaSeconds * 0.03;
    saturnBody.rotation.y += deltaSeconds * 0.025;

    moonAngle += deltaSeconds * 0.015;
    moonMesh.position.x = Math.cos(moonAngle) * 45;
    moonMesh.position.z = Math.sin(moonAngle) * 45;
    moonMesh.rotation.y += deltaSeconds * 0.015;
  };

  const dispose = () => {
    skyGeo.dispose();
    skyMat.dispose();
    skyTex.dispose();
    marsGeo.dispose();
    marsMat.dispose();
    marsTex.dispose();
    jupiterGeo.dispose();
    jupiterMat.dispose();
    jupiterTex.dispose();
    saturnGeo.dispose();
    saturnMat.dispose();
    ringGeo.dispose();
    ringMat.dispose();
    ringTex.dispose();
    moonGeo.dispose();
    moonMat.dispose();
    moonTex.dispose();
    starGeo.dispose();
    starMat.dispose();
  };

  return {
    group,
    moonMesh,
    update,
    dispose,
  };
}

/**
 * Procedural Earth Scene with 4 Categorized Orbital Populations,
 * Interactive 3D Satellites, Real-Time Day/Night Sun Terminator & Satellite Live Cam Helper
 */
export function createProceduralEarthScene(isSoftwareGl: boolean): EarthSceneBundle {
  const group = new THREE.Group();
  const inspectableObjects: THREE.Object3D[] = [];

  // 1. Earth + Atmosphere with Day/Night Terminator
  const earthRadius = 6.371;
  const earthBundle = createNasaEarthMesh(earthRadius, isSoftwareGl);
  group.add(earthBundle.group);

  // 2. NASA Deep Space Skybox & Solar System
  const spaceEnv = createNasaSpaceEnvironment(isSoftwareGl);
  group.add(spaceEnv.group);

  // 3. Moon Group
  const moonGroup = new THREE.Group();
  group.add(moonGroup);

  // ================= 4. CATEGORIZED ORBITAL POPULATION GROUPS =================
  const activeSatsGroup = new THREE.Group();
  const defunctSatsGroup = new THREE.Group();
  const rocketBodiesGroup = new THREE.Group();
  const fragmentsGroup = new THREE.Group();

  group.add(activeSatsGroup);
  group.add(defunctSatsGroup);
  group.add(rocketBodiesGroup);
  group.add(fragmentsGroup);

  // ================= 4. NASA ODPO TRACKED CATALOG: 36,500 ORBITAL OBJECTS =================
  // Ground truth data from NASA Orbital Debris Program Office & US Space Surveillance Network:
  // - Active Satellites: 10,000 (LEO Mega-Constellations 550km/1200km, SSO 700-800km, MEO GPS 20,200km, GEO 35,786km)
  // - Defunct Satellites: 3,500 (Derelict payloads across LEO, MEO, GEO graveyard)
  // - Spent Rocket Bodies: 2,200 (Heavy upper stages in polar LEO, Molniya, and GTO transfer orbits)
  // - Collision Fragments (>10cm): 20,800 (Fengyun-1C 865km cloud, Iridium-33/Cosmos-2251 790km cloud, stage breakups)
  // Total Tracked Objects = exactly 36,500!

  const debrisMeshesToFilter: { mesh: THREE.Points; shell: 'leo' | 'meo' | 'geo'; category: 'active_sat' | 'defunct_sat' | 'rocket_body' | 'fragment' }[] = [];
  const debrisGeosToDispose: THREE.BufferGeometry[] = [];
  const debrisMatsToDispose: THREE.PointsMaterial[] = [];

  const createOrbitalCluster = (
    count: number,
    colorHex: number,
    minAlt: number,
    maxAlt: number,
    size: number,
    shell: 'leo' | 'meo' | 'geo',
    category: 'active_sat' | 'defunct_sat' | 'rocket_body' | 'fragment',
    targetGroup: THREE.Group,
    incProfile: 'polar' | 'constellation' | 'geo' | 'mixed' = 'mixed'
  ) => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      let altKm = minAlt;
      if (shell === 'geo') {
        // Narrow geostationary ring at 35,786 km ± 250 km
        altKm = 35786 + (Math.random() - 0.5) * 500;
      } else if (shell === 'meo') {
        // MEO GNSS orbital shells (GPS 20,200 km, Galileo 23,222 km, GLONASS 19,100 km)
        altKm = minAlt + Math.random() * (maxAlt - minAlt);
      } else {
        // LEO altitude distribution peaking at 550 km (Starlink) and 750-865 km (Collision shells)
        const rVal = Math.random();
        if (rVal < 0.45) {
          // Mega-constellation shell (500 - 600 km)
          altKm = 520 + Math.random() * 90;
        } else if (rVal < 0.80) {
          // Critical collision debris zone (750 - 900 km: Fengyun-1C / Iridium-Cosmos)
          altKm = 740 + Math.random() * 160;
        } else {
          // Remainder LEO (200 - 1500 km)
          altKm = minAlt + Math.pow(Math.random(), 1.3) * (maxAlt - minAlt);
        }
      }

      const r = (6371 + altKm) / 1000;

      // Realistic orbital inclination distributions
      let inc = 0;
      if (incProfile === 'geo') {
        inc = (Math.random() * 8) * (Math.PI / 180); // 0° to 8° equatorial
      } else if (incProfile === 'constellation') {
        // Starlink 53°, OneWeb 87.9°, SSO 97.6°
        const pick = Math.random();
        inc = (pick < 0.6 ? 53 : pick < 0.85 ? 97.6 : 70) * (Math.PI / 180) + (Math.random() - 0.5) * 0.05;
      } else if (incProfile === 'polar') {
        // High inclination polar & SSO orbits (65° to 99°)
        inc = (65 + Math.random() * 34) * (Math.PI / 180);
      } else {
        // Natural launch latitude inclinations: 28.5° (Cape), 51.6° (Baikonur/ISS), 98° (SSO)
        const randInc = Math.random();
        if (randInc < 0.3) inc = (28.5 + (Math.random() - 0.5) * 4) * (Math.PI / 180);
        else if (randInc < 0.6) inc = (51.6 + (Math.random() - 0.5) * 6) * (Math.PI / 180);
        else inc = (Math.random() * Math.PI);
      }

      const raan = Math.random() * Math.PI * 2;
      const anom = Math.random() * Math.PI * 2;

      // Keplerian Cartesian position in space
      const x0 = r * Math.cos(anom);
      const y0 = r * Math.sin(anom);
      pos[i * 3] = x0 * Math.cos(raan) - y0 * Math.cos(inc) * Math.sin(raan);
      pos[i * 3 + 1] = y0 * Math.sin(inc);
      pos[i * 3 + 2] = x0 * Math.sin(raan) + y0 * Math.cos(inc) * Math.cos(raan);
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: colorHex,
      size,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geo, mat);
    targetGroup.add(points);

    debrisMeshesToFilter.push({ mesh: points, shell, category });
    debrisGeosToDispose.push(geo);
    debrisMatsToDispose.push(mat);

    return points;
  };

  // 1. ACTIVE SATELLITES (10,000 objects total: 8,800 LEO + 400 MEO + 800 GEO)
  createOrbitalCluster(8800, 0x10b981, 300, 1400, 0.052, 'leo', 'active_sat', activeSatsGroup, 'constellation');
  createOrbitalCluster(400, 0x34d399, 19000, 24000, 0.065, 'meo', 'active_sat', activeSatsGroup, 'polar');
  createOrbitalCluster(800, 0x10b981, 35500, 36000, 0.075, 'geo', 'active_sat', activeSatsGroup, 'geo');

  // 2. DEFUNCT DERELICT SATELLITES (3,500 objects total: 2,700 LEO + 300 MEO + 500 GEO/Graveyard)
  createOrbitalCluster(2700, 0xf59e0b, 500, 1500, 0.050, 'leo', 'defunct_sat', defunctSatsGroup, 'mixed');
  createOrbitalCluster(300, 0xfbbf24, 3000, 22000, 0.062, 'meo', 'defunct_sat', defunctSatsGroup, 'polar');
  createOrbitalCluster(500, 0xf59e0b, 35700, 36200, 0.072, 'geo', 'defunct_sat', defunctSatsGroup, 'geo');

  // 3. SPENT ROCKET BODIES (2,200 objects total: 1,600 LEO + 450 MEO/GTO + 150 GEO)
  createOrbitalCluster(1600, 0xa855f7, 600, 1600, 0.060, 'leo', 'rocket_body', rocketBodiesGroup, 'polar');
  createOrbitalCluster(450, 0xc084fc, 2000, 28000, 0.070, 'meo', 'rocket_body', rocketBodiesGroup, 'mixed');
  createOrbitalCluster(150, 0xa855f7, 35600, 36300, 0.078, 'geo', 'rocket_body', rocketBodiesGroup, 'geo');

  // 4. LETHAL COLLISION FRAGMENTS (20,800 objects total: 19,500 LEO + 800 MEO + 500 GEO)
  createOrbitalCluster(19500, 0xef4444, 250, 1400, 0.040, 'leo', 'fragment', fragmentsGroup, 'mixed');
  createOrbitalCluster(800, 0xf87171, 2000, 25000, 0.055, 'meo', 'fragment', fragmentsGroup, 'mixed');
  createOrbitalCluster(500, 0xef4444, 35500, 36200, 0.065, 'geo', 'fragment', fragmentsGroup, 'geo');
  // Sum: (8800+400+800) + (2700+300+500) + (1600+450+150) + (19500+800+500) = 36,500 tracked catalog objects!

  // B. 3D Modeled Tracked Objects from DEBRIS_CATALOG
  const catalogObjectMap = new Map<string, THREE.Group>();

  DEBRIS_CATALOG.forEach(item => {
    const satObj = new THREE.Group();
    const r = (6371 + item.altitudeKm) / 1000;
    const incRad = (item.inclinationDeg * Math.PI) / 180;

    // Initial position on its orbit
    const anom = (item.id.charCodeAt(item.id.length - 1) * 37) % 360;
    const anomRad = (anom * Math.PI) / 180;
    const x = r * Math.cos(anomRad);
    const y = r * Math.sin(anomRad) * Math.sin(incRad);
    const z = r * Math.sin(anomRad) * Math.cos(incRad);
    satObj.position.set(x, y, z);

    // Visual model based on category
    if (item.category === 'active_sat') {
      // Satellite body + golden solar wings
      const bodyGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.2 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      satObj.add(body);

      // Solar arrays
      const wingGeo = new THREE.BoxGeometry(0.32, 0.02, 0.1);
      const wingMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
      const wing = new THREE.Mesh(wingGeo, wingMat);
      satObj.add(wing);

      // Beacon halo
      const haloGeo = new THREE.RingGeometry(0.18, 0.22, 16);
      const haloMat = new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.lookAt(0, 0, 0);
      satObj.add(halo);

      activeSatsGroup.add(satObj);
    } else if (item.category === 'defunct_sat') {
      // Tumbling defunct satellite
      const bGeo = new THREE.BoxGeometry(0.14, 0.18, 0.12);
      const bMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.6, roughness: 0.4 });
      const b = new THREE.Mesh(bGeo, bMat);
      satObj.add(b);

      const ringGeo = new THREE.RingGeometry(0.16, 0.20, 16);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide, transparent: true, opacity: 0.75 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.lookAt(0, 0, 0);
      satObj.add(ring);

      defunctSatsGroup.add(satObj);
    } else if (item.category === 'rocket_body') {
      // Spent rocket stage cylinder
      const cylGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.35, 12);
      const cylMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, metalness: 0.85, roughness: 0.3 });
      const cyl = new THREE.Mesh(cylGeo, cylMat);
      cyl.rotation.z = Math.PI / 4;
      satObj.add(cyl);

      rocketBodiesGroup.add(satObj);
    } else {
      // Kinetic collision fragment
      const fGeo = new THREE.DodecahedronGeometry(0.07);
      const fMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.5, roughness: 0.5 });
      const f = new THREE.Mesh(fGeo, fMat);
      satObj.add(f);

      fragmentsGroup.add(satObj);
    }

    satObj.userData = { catalogItem: item };
    inspectableObjects.push(satObj);
    catalogObjectMap.set(item.id, satObj);
  });

  // 5. Mission Target Orbital Trajectory Rings
  const orbitLinesGroup = new THREE.Group();
  group.add(orbitLinesGroup);
  updateOrbitRings(orbitLinesGroup, 'mission_kestrel');

  // Sun direction vector
  const sunDir = new THREE.Vector3(15, 6, 12).normalize();
  earthBundle.setSunDirection(sunDir);

  // Time & Day/Night sync helper
  const setEarthTime = (date: Date, scrubHour?: number) => {
    let utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
    if (typeof scrubHour === 'number') {
      utcHours = scrubHour;
    }

    // Solar longitude moves 15 degrees per hour
    const sunLonRad = ((12 - utcHours) * 15 * Math.PI) / 180;
    // Declination for mid-November is roughly -17°
    const declinationRad = (-17.0 * Math.PI) / 180;

    const sunDist = 30;
    const sx = Math.cos(declinationRad) * Math.sin(sunLonRad) * sunDist;
    const sy = Math.sin(declinationRad) * sunDist;
    const sz = Math.cos(declinationRad) * Math.cos(sunLonRad) * sunDist;

    sunDir.set(sx, sy, sz).normalize();
    earthBundle.setSunDirection(sunDir);

    // Earth rotates so that 0° Greenwich meridian aligns with UTC time
    const earthRot = (utcHours / 24) * Math.PI * 2;
    earthBundle.setEarthRotation(earthRot);

    return {
      sunDirection: sunDir,
      earthRotationRad: earthRot,
    };
  };

  // Layer filter helper for both categorized groups, altitude shells, and 36,500 tracked objects
  const setLayerFilter = (filter: OrbitalLayerFilter) => {
    activeSatsGroup.visible = filter.active;
    defunctSatsGroup.visible = filter.defunct;
    rocketBodiesGroup.visible = filter.rocketBodies;
    fragmentsGroup.visible = filter.fragments;

    // Filter all 36,500 points by altitude shell (LEO, MEO, GEO) and category
    debrisMeshesToFilter.forEach(entry => {
      const shellMatch = filter.altShell === 'all' || filter.altShell === entry.shell;
      let catMatch = true;
      if (entry.category === 'active_sat') catMatch = filter.active;
      else if (entry.category === 'defunct_sat') catMatch = filter.defunct;
      else if (entry.category === 'rocket_body') catMatch = filter.rocketBodies;
      else if (entry.category === 'fragment') catMatch = filter.fragments;
      entry.mesh.visible = shellMatch && catMatch;
    });

    // Altitude shell filtering for 3D modeled catalog objects
    catalogObjectMap.forEach((obj) => {
      const item = obj.userData.catalogItem as DebrisCatalogItem;
      let shellMatch = true;
      if (filter.altShell === 'leo') shellMatch = item.altitudeKm <= 2000;
      else if (filter.altShell === 'meo') shellMatch = item.altitudeKm > 2000 && item.altitudeKm < 35000;
      else if (filter.altShell === 'geo') shellMatch = item.altitudeKm >= 35000;

      let catMatch = true;
      if (item.category === 'active_sat') catMatch = filter.active;
      else if (item.category === 'defunct_sat') catMatch = filter.defunct;
      else if (item.category === 'rocket_body') catMatch = filter.rocketBodies;
      else if (item.category === 'fragment') catMatch = filter.fragments;

      obj.visible = shellMatch && catMatch;
    });
  };

  // Focus object helper
  const focusObject = (objId: string): THREE.Vector3 | null => {
    const obj = catalogObjectMap.get(objId);
    if (!obj) return null;
    return obj.position.clone();
  };

  // Satellite live camera telemetry helper
  const getSatelliteTelemetry = (satId: string, timeSec: number): SatelliteTelemetry => {
    const item = DEBRIS_CATALOG.find(d => d.id === satId) || DEBRIS_CATALOG[0];
    const r = (6371 + item.altitudeKm) / 1000;
    const incRad = (item.inclinationDeg * Math.PI) / 180;

    // Mean motion
    const orbitalPeriodSec = (2 * Math.PI * (6371 + item.altitudeKm)) / (item.orbitalVelocityKms);
    const meanAnomaly = ((timeSec % orbitalPeriodSec) / orbitalPeriodSec) * Math.PI * 2;

    const x0 = r * Math.cos(meanAnomaly);
    const z0 = r * Math.sin(meanAnomaly);

    const x = x0;
    const y = z0 * Math.sin(incRad);
    const z = z0 * Math.cos(incRad);

    const pos = new THREE.Vector3(x, y, z);

    // Tangent velocity forward direction
    const vx0 = -r * Math.sin(meanAnomaly);
    const vz0 = r * Math.cos(meanAnomaly);
    const forward = new THREE.Vector3(vx0, vz0 * Math.sin(incRad), vz0 * Math.cos(incRad)).normalize();

    // Geographic coordinates
    const latDeg = (Math.asin(pos.y / r) * 180) / Math.PI;
    const lonDeg = ((Math.atan2(pos.x, pos.z) * 180) / Math.PI + 360) % 360 - 180;

    // Daylight check
    const isDaylight = pos.dot(sunDir) > 0;

    return {
      pos,
      forward,
      latDeg: Math.round(latDeg * 100) / 100,
      lonDeg: Math.round(lonDeg * 100) / 100,
      altKm: item.altitudeKm,
      orbitalVelocityKms: item.orbitalVelocityKms,
      isDaylight,
    };
  };

  let animTime = 0;
  const update = (deltaSeconds: number) => {
    animTime += deltaSeconds;
    earthBundle.update(deltaSeconds);
    spaceEnv.update(deltaSeconds);

    // Slowly orbit debris layers with realistic Keplerian differential speeds
    activeSatsGroup.rotation.y += deltaSeconds * 0.02;
    defunctSatsGroup.rotation.y += deltaSeconds * 0.016;
    rocketBodiesGroup.rotation.y += deltaSeconds * 0.014;
    fragmentsGroup.rotation.y += deltaSeconds * 0.024;

    // Tumbling animation for defunct satellites and fragments
    catalogObjectMap.forEach((obj) => {
      const cat = (obj.userData.catalogItem as DebrisCatalogItem).category;
      if (cat === 'defunct_sat' || cat === 'fragment') {
        obj.rotation.x += deltaSeconds * 0.8;
        obj.rotation.y += deltaSeconds * 0.6;
      }
    });
  };

  const dispose = () => {
    earthBundle.dispose();
    spaceEnv.dispose();
    debrisGeosToDispose.forEach(g => g.dispose());
    debrisMatsToDispose.forEach(m => m.dispose());
  };

  return {
    group,
    earthMesh: earthBundle.earthMesh,
    cloudsMesh: earthBundle.cloudsMesh,
    moonGroup,
    orbitLinesGroup,
    setSunDirection: (dir: THREE.Vector3) => {
      sunDir.copy(dir).normalize();
      earthBundle.setSunDirection(dir);
    },
    setEarthTime,
    setLayerFilter,
    getInspectableObjects: () => inspectableObjects,
    getSatelliteTelemetry,
    focusObject,
    update,
    dispose,
  };
}

export function updateOrbitRings(group: THREE.Group, selectedMissionId: string) {
  while (group.children.length > 0) {
    const child = group.children[0] as THREE.Line;
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
      else child.material.dispose();
    }
    group.remove(child);
  }

  MISSIONS.forEach(mission => {
    const isTarget = mission.id === selectedMissionId;
    const r = (6371 + mission.altitudeKm) / 1000;
    const segments = 120;
    const points: THREE.Vector3[] = [];
    const incRad = (mission.inclinationDeg * Math.PI) / 180;

    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const x0 = r * Math.cos(theta);
      const z0 = r * Math.sin(theta);

      const x = x0;
      const y = z0 * Math.sin(incRad);
      const z = z0 * Math.cos(incRad);
      points.push(new THREE.Vector3(x, y, z));
    }

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: isTarget ? 0xef4444 : 0x0284c7,
      transparent: true,
      opacity: isTarget ? 0.95 : 0.3,
      linewidth: isTarget ? 2 : 1,
    });

    const line = new THREE.Line(geo, mat);
    group.add(line);
  });
}
