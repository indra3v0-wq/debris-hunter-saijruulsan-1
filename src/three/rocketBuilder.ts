/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { RocketConfig } from '../types';
import { 
  createRocketHullDetailTexture, 
  createCarbonInterstageTexture, 
  createEngineNozzleTexture, 
  createGoldMliTexture,
  createSolarPanelTexture
} from './proceduralTextures';

export interface RocketPartInfo {
  partId: string;
  nameMn: string;
  nameEn: string;
  categoryMn: string;
  categoryEn: string;
  descriptionMn: string;
  descriptionEn: string;
  specs: { labelMn: string; labelEn: string; val: string }[];
}

export interface RocketModelBundle {
  group: THREE.Group;
  parts: {
    stage1Group: THREE.Group;
    stage2Group: THREE.Group;
    engineCluster: THREE.Group;
    tankMesh: THREE.Mesh;
    sideBoosters: THREE.Group[];
    interstage: THREE.Group;
    fairingLeft: THREE.Mesh;
    fairingRight: THREE.Mesh;
    gridFins: THREE.Group[];
    landingLegs: THREE.Group[];
    raceways: THREE.Group;
    payloadGroup: THREE.Group;
  };
  getInspectableObjects: () => THREE.Object3D[];
  setExplodedProgress: (progress: number) => void;
  update: (deltaSeconds: number) => void;
  dispose: () => void;
}

export function buildModularRocket(config: RocketConfig): RocketModelBundle {
  const root = new THREE.Group();
  const geometriesToDispose: THREE.BufferGeometry[] = [];
  const materialsToDispose: THREE.Material[] = [];
  const texturesToDispose: THREE.Texture[] = [];
  const inspectableObjects: THREE.Object3D[] = [];

  // ================= 1. ULTRA-DETAILED PBR MATERIALS =================
  // A. White Aerospace Thermal Protection Hull Skin (Weld seams, stringers, stencils, Mongolian flag)
  const hullDetailTex = createRocketHullDetailTexture();
  texturesToDispose.push(hullDetailTex);

  const whiteHullMat = new THREE.MeshStandardMaterial({
    map: hullDetailTex,
    color: 0xffffff,
    roughness: 0.28,
    metalness: 0.65,
  });
  materialsToDispose.push(whiteHullMat);

  // B. Carbon-Fiber Composite (Hot-staging interstage with ventilation slots & separation pushers)
  const carbonTex = createCarbonInterstageTexture();
  texturesToDispose.push(carbonTex);

  const carbonMat = new THREE.MeshStandardMaterial({
    map: carbonTex,
    roughness: 0.42,
    metalness: 0.75,
  });
  materialsToDispose.push(carbonMat);

  // C. Engine Nozzle Alloy (Inconel 718 / Niobium with heat discoloration & stiffeners)
  const engineNozzleTex = createEngineNozzleTexture();
  texturesToDispose.push(engineNozzleTex);

  const engineNozzleMat = new THREE.MeshStandardMaterial({
    map: engineNozzleTex,
    roughness: 0.32,
    metalness: 0.92,
  });
  materialsToDispose.push(engineNozzleMat);

  // D. Regenerative Cooling Copper Throat
  const copperThroatMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.25,
    metalness: 0.95,
  });
  materialsToDispose.push(copperThroatMat);

  // E. Polished Stainless Steel (Raceways, Feedlines, Pushers, Fasteners)
  const stainlessSteelMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.18,
    metalness: 0.92,
  });
  materialsToDispose.push(stainlessSteelMat);

  // F. Forged Titanium (Grid Fins & Actuator Hinges)
  const titaniumMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.35,
    metalness: 0.88,
  });
  materialsToDispose.push(titaniumMat);

  // G. PICA-X Thermal Base Heatshield
  const heatshieldMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.88,
    metalness: 0.15,
  });
  materialsToDispose.push(heatshieldMat);

  // H. Gold MLI (Multi-Layer Insulation for Spacecraft Bus & COPV wrap)
  const goldMliTex = createGoldMliTexture();
  texturesToDispose.push(goldMliTex);

  const goldMliMat = new THREE.MeshStandardMaterial({
    map: goldMliTex,
    color: 0xffd700,
    metalness: 0.92,
    roughness: 0.25,
  });
  materialsToDispose.push(goldMliMat);

  // I. Silicon Solar Array Cells
  const solarTex = createSolarPanelTexture();
  texturesToDispose.push(solarTex);

  const solarMat = new THREE.MeshStandardMaterial({
    map: solarTex,
    metalness: 0.65,
    roughness: 0.22,
  });
  materialsToDispose.push(solarMat);

  // ================= 2. STAGE 1 (MAIN BOOSTER CORE) =================
  const stage1Group = new THREE.Group();
  root.add(stage1Group);

  const tankRadius = config.tank.diameterM * 0.25;
  const tankHeight = 7.4;

  // A. Main Propellant Tank Cylinder
  const tankGeo = new THREE.CylinderGeometry(tankRadius, tankRadius, tankHeight, 36);
  geometriesToDispose.push(tankGeo);
  const tankMesh = new THREE.Mesh(tankGeo, whiteHullMat);
  tankMesh.position.y = tankHeight / 2 + 0.3;
  stage1Group.add(tankMesh);

  tankMesh.userData = {
    partInfo: {
      partId: 'stage1_tank',
      nameMn: `1-р Шатын Их Бие ба Түлшний Сав (${config.tank.nameMn})`,
      nameEn: `Stage 1 Core Tank (${config.tank.name})`,
      categoryMn: 'Бүтцийн Их Бие // Шингэн Түлшний Систем',
      categoryEn: 'Structural Airframe // Cryogenic Propellant',
      descriptionMn: 'Хөнгөн цагаан-литийн (Al-Li) хайлшаар хийгдсэн, изогрид бүтцийн хавиргатай криоген шингэн хүчилтөрөгч (LOX) болон керосин (RP-1) хадгалах даралтат сав.',
      descriptionEn: 'Aluminum-lithium alloy orthogrid tanks storing cryogenic liquid oxygen (LOX) and refined hydrocarbon (RP-1) fuel with internal anti-slosh baffles.',
      specs: [
        { labelMn: 'Диаметр', labelEn: 'Diameter', val: `${config.tank.diameterM} m` },
        { labelMn: 'Багтаамж', labelEn: 'Fuel Capacity', val: `${config.tank.fuelCapacityKg.toLocaleString()} kg` },
        { labelMn: 'Хуурай масс', labelEn: 'Dry Mass', val: `${config.tank.dryMassKg.toLocaleString()} kg` },
        { labelMn: 'Материал', labelEn: 'Alloy', val: 'Al-Li 2195 Orthogrid' },
      ],
    } as RocketPartInfo,
  };
  inspectableObjects.push(tankMesh);

  // B. Longitudinal Cable Raceways & Liquid Oxygen Transfer Conduit
  const raceways = new THREE.Group();
  stage1Group.add(raceways);

  for (let r = 0; r < 2; r++) {
    const angle = r * Math.PI;
    const racewayGroup = new THREE.Group();
    racewayGroup.rotation.y = angle;

    // Aerodynamic fairing duct along rocket skin
    const ductGeo = new THREE.BoxGeometry(0.12, tankHeight - 0.6, 0.08);
    geometriesToDispose.push(ductGeo);
    const ductMesh = new THREE.Mesh(ductGeo, stainlessSteelMat);
    ductMesh.position.set(0, tankHeight / 2 + 0.3, tankRadius + 0.04);
    racewayGroup.add(ductMesh);

    // Cable bracket joints along duct
    for (let by = 1.0; by < tankHeight; by += 1.4) {
      const bGeo = new THREE.BoxGeometry(0.16, 0.08, 0.1);
      geometriesToDispose.push(bGeo);
      const bMesh = new THREE.Mesh(bGeo, titaniumMat);
      bMesh.position.set(0, by, tankRadius + 0.04);
      racewayGroup.add(bMesh);
    }

    raceways.add(racewayGroup);
  }

  // C. High-Pressure Helium COPV Pressurization Spheres
  const copvGroup = new THREE.Group();
  stage1Group.add(copvGroup);

  for (let c = 0; c < 3; c++) {
    const angle = (c / 3) * Math.PI * 2 + Math.PI / 4;
    const sphereGeo = new THREE.SphereGeometry(0.16, 16, 16);
    geometriesToDispose.push(sphereGeo);
    const sphere = new THREE.Mesh(sphereGeo, goldMliMat);
    sphere.position.set(
      Math.cos(angle) * (tankRadius - 0.05),
      tankHeight - 0.7,
      Math.sin(angle) * (tankRadius - 0.05)
    );
    copvGroup.add(sphere);

    // COPV mounting bracket
    const ringGeo = new THREE.TorusGeometry(0.17, 0.02, 8, 16);
    geometriesToDispose.push(ringGeo);
    const ring = new THREE.Mesh(ringGeo, titaniumMat);
    ring.position.copy(sphere.position);
    copvGroup.add(ring);
  }

  copvGroup.userData = {
    partInfo: {
      partId: 'copv',
      nameMn: 'Гелийн Өндөр Даралтын COPV Баллонууд',
      nameEn: 'Helium COPV Pressurization Vessels',
      categoryMn: 'Даралтын Систем // Криоген Шахалт',
      categoryEn: 'Pneumatics // Cryogenic Pressurization',
      descriptionMn: 'Нүүрстөрөгчийн шилэн ороомогтой (COPV) 300+ бар даралтын гелийн баллонууд нь түлш шатах үед саван доторх ажлын даралтыг тогтвортой барьдаг.',
      descriptionEn: 'Carbon-overwrapped pressure vessels storing supercritical helium at 350 bar to backfill and maintain tank ullage pressure during ascent.',
      specs: [
        { labelMn: 'Ажлын даралт', labelEn: 'Pressure', val: '350 bar (5,000 psi)' },
        { labelMn: 'Хий', labelEn: 'Gas', val: 'Cryogenic Helium (He)' },
        { labelMn: 'Бүтэц', labelEn: 'Liner', val: 'Titanium + Carbon Fiber Wrap' },
      ],
    } as RocketPartInfo,
  };
  inspectableObjects.push(copvGroup);

  // D. Titanium Open-Lattice Grid Fins (4 units at top of Stage 1)
  const gridFins: THREE.Group[] = [];
  if (config.hasInterstageGridFins) {
    for (let f = 0; f < 4; f++) {
      const finGroup = new THREE.Group();
      const angle = (f / 4) * Math.PI * 2;
      finGroup.position.set(
        Math.cos(angle) * (tankRadius + 0.05),
        tankHeight - 0.35,
        Math.sin(angle) * (tankRadius + 0.05)
      );
      finGroup.rotation.y = angle;

      // Hinge actuator block
      const hingeGeo = new THREE.BoxGeometry(0.18, 0.22, 0.16);
      geometriesToDispose.push(hingeGeo);
      const hinge = new THREE.Mesh(hingeGeo, titaniumMat);
      hinge.position.set(0, 0, 0.08);
      finGroup.add(hinge);

      // Open-lattice grid fin frame
      const frameGeo = new THREE.BoxGeometry(0.55, 0.65, 0.05);
      geometriesToDispose.push(frameGeo);
      const frame = new THREE.Mesh(frameGeo, titaniumMat);
      frame.position.set(0, 0, 0.38);
      finGroup.add(frame);

      // Lattice inner mesh crossbars
      for (let lx = -0.18; lx <= 0.18; lx += 0.12) {
        const barGeo = new THREE.BoxGeometry(0.02, 0.58, 0.04);
        geometriesToDispose.push(barGeo);
        const bar = new THREE.Mesh(barGeo, titaniumMat);
        bar.position.set(lx, 0, 0.38);
        finGroup.add(bar);
      }
      for (let ly = -0.22; ly <= 0.22; ly += 0.14) {
        const hBarGeo = new THREE.BoxGeometry(0.48, 0.02, 0.04);
        geometriesToDispose.push(hBarGeo);
        const hBar = new THREE.Mesh(hBarGeo, titaniumMat);
        hBar.position.set(0, ly, 0.38);
        finGroup.add(hBar);
      }

      finGroup.userData = {
        partInfo: {
          partId: 'grid_fins',
          nameMn: 'Титан Торлог Аэродинамик Далавч',
          nameEn: 'Titanium Lattice Grid Fins',
          categoryMn: 'Аэродинамик Удирдлага // Буултын Систем',
          categoryEn: 'Aerodynamic Steering // Re-entry Control',
          descriptionMn: 'Хэт авианы (Hypersonic) хурдаар уур амьсгалд буцах үед пуужинг 3 тэнхлэгээр өндөр нарийвчлалтай залахад зориулагдсан халуунд тэсвэртэй титан торлог далавч.',
          descriptionEn: 'Forged titanium aerodynamic grid fins capable of independent roll, pitch, and yaw control across supersonic and transonic atmospheric descent.',
          specs: [
            { labelMn: 'Материал', labelEn: 'Material', val: 'Forged Titanium' },
            { labelMn: 'Хүч дамжуулагч', labelEn: 'Actuators', val: 'High-pressure Hydraulic' },
            { labelMn: 'Хамгийн их хурд', labelEn: 'Max Regime', val: 'Mach 4.5+ Atmospheric Entry' },
          ],
        } as RocketPartInfo,
      };

      stage1Group.add(finGroup);
      gridFins.push(finGroup);
      inspectableObjects.push(finGroup);
    }
  }

  // E. Retractable A-Frame Landing Legs (4 units folded along booster base)
  const landingLegs: THREE.Group[] = [];
  for (let l = 0; l < 4; l++) {
    const legGroup = new THREE.Group();
    const angle = (l / 4) * Math.PI * 2 + Math.PI / 4;
    legGroup.position.set(Math.cos(angle) * tankRadius, 0.4, Math.sin(angle) * tankRadius);
    legGroup.rotation.y = angle;

    // Main A-Frame leg strut (folded flat against hull)
    const legMainGeo = new THREE.BoxGeometry(0.12, 3.2, 0.06);
    geometriesToDispose.push(legMainGeo);
    const legMesh = new THREE.Mesh(legMainGeo, carbonMat);
    legMesh.position.set(0, 1.6, 0.04);
    legGroup.add(legMesh);

    // Telescoping hydraulic cylinder (gold titanium nitride)
    const pGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.8, 12);
    geometriesToDispose.push(pGeo);
    const pMesh = new THREE.Mesh(pGeo, copperThroatMat);
    pMesh.position.set(0, 1.4, 0.08);
    legGroup.add(pMesh);

    // Foot pad at the bottom
    const footGeo = new THREE.BoxGeometry(0.24, 0.08, 0.28);
    geometriesToDispose.push(footGeo);
    const foot = new THREE.Mesh(footGeo, titaniumMat);
    foot.position.set(0, 0.04, 0.08);
    legGroup.add(foot);

    legGroup.userData = {
      partInfo: {
        partId: 'landing_legs',
        nameMn: 'Эвхэгддэг Буултын Хөл (Carbon-Composite A-Frame)',
        nameEn: 'Deployable Landing Legs (Carbon A-Frame)',
        categoryMn: 'Сэргээн Ашиглах Бүтэц // Буултын Механизм',
        categoryEn: 'Recovery Systems // Landing Gear',
        descriptionMn: 'Нүүрстөрөгчийн мяндас ба хөнгөн цагаан зөгийн үүр хэлбэрт цөм бүхий эвхэгддэг 4 хөл. Газардах үеийн энергийг шингээх гидравлик цохилт бууруулагчтай.',
        descriptionEn: 'Four carbon-fiber A-frame legs with internal aluminum honeycomb crush cores to absorb kinetic energy during vertical propulsive touchdowns.',
        specs: [
          { labelMn: 'Бүтэц', labelEn: 'Construction', val: 'High-modulus Carbon Fiber' },
          { labelMn: 'Дэлгэлт', labelEn: 'Deployment', val: 'Pneumatic Cold Helium Release' },
          { labelMn: 'Шингээх цохилт', labelEn: 'Shock Absorption', val: 'Crushable Honeycomb Core' },
        ],
      } as RocketPartInfo,
    };

    stage1Group.add(legGroup);
    landingLegs.push(legGroup);
    inspectableObjects.push(legGroup);
  }

  // F. Engine Octoweb Thrust Puck & Engine Cluster
  const engineCluster = new THREE.Group();
  engineCluster.position.y = 0;
  stage1Group.add(engineCluster);

  // Thrust Puck Housing & Base Heatshield (PICA-X)
  const puckGeo = new THREE.CylinderGeometry(tankRadius * 0.98, tankRadius * 0.94, 0.45, 32);
  geometriesToDispose.push(puckGeo);
  const puckMesh = new THREE.Mesh(puckGeo, heatshieldMat);
  puckMesh.position.y = 0.22;
  engineCluster.add(puckMesh);

  // Engines Modeling (Octoweb 9 pattern or 7/1 depending on config)
  const engineCount = config.engine.type === 'kerolox' ? 9 : config.engine.type === 'methalox' ? 7 : 1;
  const outerRadius = tankRadius * 0.60;
  const nozzleBaseRad = config.engine.type === 'solid' ? 0.46 : 0.17;
  const nozzleHeight = config.engine.type === 'solid' ? 1.05 : 0.72;

  for (let i = 0; i < engineCount; i++) {
    const engineUnit = new THREE.Group();
    if (i === 0) {
      engineUnit.position.set(0, 0, 0);
    } else {
      const angle = ((i - 1) / (engineCount - 1)) * Math.PI * 2;
      engineUnit.position.set(Math.cos(angle) * outerRadius, 0, Math.sin(angle) * outerRadius);
    }

    // 1. Combustion chamber & regenerative cooling copper throat collar
    const throatGeo = new THREE.CylinderGeometry(0.12, 0.10, 0.22, 16);
    geometriesToDispose.push(throatGeo);
    const throat = new THREE.Mesh(throatGeo, copperThroatMat);
    throat.position.y = 0.15;
    engineUnit.add(throat);

    // 2. Bell Nozzle (Inconel 718 with cooling ribs)
    const nozzleGeo = new THREE.ConeGeometry(nozzleBaseRad, nozzleHeight, 20, 1, true);
    geometriesToDispose.push(nozzleGeo);
    const nozzle = new THREE.Mesh(nozzleGeo, engineNozzleMat);
    nozzle.rotation.x = Math.PI;
    nozzle.position.y = -nozzleHeight / 2 + 0.05;
    engineUnit.add(nozzle);

    // 3. Turbopump Gas Generator Exhaust Dump Pipe
    const dumpPipeGeo = new THREE.CylinderGeometry(0.03, 0.035, nozzleHeight * 0.9, 8);
    geometriesToDispose.push(dumpPipeGeo);
    const dumpPipe = new THREE.Mesh(dumpPipeGeo, stainlessSteelMat);
    dumpPipe.position.set(nozzleBaseRad * 0.65, -nozzleHeight / 2, 0);
    dumpPipe.rotation.z = -0.12;
    engineUnit.add(dumpPipe);

    // 4. Hydraulic Gimbal Pushrod Actuators (Piston pair for TVC - Thrust Vector Control)
    for (let g = 0; g < 2; g++) {
      const gAngle = (g === 0 ? 0.5 : -0.5) * Math.PI;
      const pistonGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.42, 8);
      geometriesToDispose.push(pistonGeo);
      const piston = new THREE.Mesh(pistonGeo, stainlessSteelMat);
      piston.position.set(Math.cos(gAngle) * 0.12, 0.05, Math.sin(gAngle) * 0.12);
      piston.rotation.x = 0.15;
      engineUnit.add(piston);
    }

    engineCluster.add(engineUnit);
  }

  engineCluster.userData = {
    partInfo: {
      partId: 'engine_cluster',
      nameMn: `Үндсэн Түлхэгч Хөдөлгүүрийн Багц (${config.engine.nameMn})`,
      nameEn: `Octoweb Engine Cluster (${config.engine.name})`,
      categoryMn: 'Хөдөлгүүрийн Систем // Зүтгүүр ба Вектор Удирдлага',
      categoryEn: 'Propulsion Assembly // Thrust Vector Control (TVC)',
      descriptionMn: `Нийт ${engineCount} ширхэг регенератив хөргөлттэй, турбопомп бүхий шингэн пуужингийн хөдөлгүүр. Гадаргуугийн түвшний өндөр зүтгүүр, гидравлик тэнхлэгийн хазайлт (TVC) вектор удирдлагатай.`,
      descriptionEn: `${engineCount} regeneratively cooled closed-cycle gas generator engines with high expansion ratio Inconel nozzles, copper throat inserts, and dual-axis hydraulic gimbal actuators for Thrust Vector Control.`,
      specs: [
        { labelMn: 'Хөдөлгүүрийн тоо', labelEn: 'Engine Count', val: `${engineCount}x Units` },
        { labelMn: 'Нэгж зүтгүүр', labelEn: 'Thrust per Unit', val: `${config.engine.thrustKn} kN` },
        { labelMn: 'Хувийн импульс (Isp)', labelEn: 'Specific Impulse', val: `${config.engine.ispSeconds} s` },
        { labelMn: 'Түлшний төрөл', labelEn: 'Propellant Type', val: config.engine.type.toUpperCase() },
        { labelMn: 'Тэнхлэгийн хазайлт', labelEn: 'Gimbal Range', val: '± 5.0° Dual Axis TVC' },
      ],
    } as RocketPartInfo,
  };
  inspectableObjects.push(engineCluster);

  // G. Side Strap-on Boosters (0, 2, or 4 boosters)
  const sideBoosters: THREE.Group[] = [];
  if (config.boosterCount > 0) {
    for (let b = 0; b < config.boosterCount; b++) {
      const boosterGroup = new THREE.Group();
      const angle = (b / config.boosterCount) * Math.PI * 2 + (config.boosterCount === 2 ? Math.PI / 2 : 0);
      const dist = tankRadius + 0.62;
      boosterGroup.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);

      // Booster cylinder body
      const sGeo = new THREE.CylinderGeometry(0.42, 0.42, 5.8, 28);
      geometriesToDispose.push(sGeo);
      const sMesh = new THREE.Mesh(sGeo, whiteHullMat);
      sMesh.position.y = 2.9 + 0.3;
      boosterGroup.add(sMesh);

      // Slanted Aerodynamic Nosecone
      const coneGeo = new THREE.ConeGeometry(0.42, 1.1, 28);
      geometriesToDispose.push(coneGeo);
      const coneMesh = new THREE.Mesh(coneGeo, carbonMat);
      coneMesh.position.y = 5.8 + 0.3 + 0.55;
      coneMesh.rotation.z = -0.08;
      boosterGroup.add(coneMesh);

      // Forward separation rocket blisters
      for (let sb = 0; sb < 2; sb++) {
        const blisterGeo = new THREE.ConeGeometry(0.08, 0.22, 12);
        geometriesToDispose.push(blisterGeo);
        const blister = new THREE.Mesh(blisterGeo, titaniumMat);
        blister.position.set(0.38, 5.8 + 0.2, (sb === 0 ? 0.15 : -0.15));
        blister.rotation.z = Math.PI / 3;
        boosterGroup.add(blister);
      }

      // Structural attachment cross-struts connecting to core
      const strutGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.45, 8);
      geometriesToDispose.push(strutGeo);
      const upperStrut = new THREE.Mesh(strutGeo, stainlessSteelMat);
      upperStrut.position.set(-0.25, 5.0, 0);
      upperStrut.rotation.z = Math.PI / 2;
      boosterGroup.add(upperStrut);

      const lowerStrut = new THREE.Mesh(strutGeo, stainlessSteelMat);
      lowerStrut.position.set(-0.25, 1.2, 0);
      lowerStrut.rotation.z = Math.PI / 2;
      boosterGroup.add(lowerStrut);

      // Booster exhaust nozzle
      const sNozGeo = new THREE.ConeGeometry(0.28, 0.68, 16, 1, true);
      geometriesToDispose.push(sNozGeo);
      const sNoz = new THREE.Mesh(sNozGeo, engineNozzleMat);
      sNoz.rotation.x = Math.PI;
      sNoz.position.y = -0.1;
      boosterGroup.add(sNoz);

      boosterGroup.userData = {
        partInfo: {
          partId: 'side_booster',
          nameMn: `Нэмэлт Хурдасгагч Пуужин #${b + 1} (Strap-on Booster)`,
          nameEn: `Strap-on Side Booster #${b + 1}`,
          categoryMn: 'Хөөргөлтийн Нэмэлт Зүтгүүр // Шатлал',
          categoryEn: 'Auxiliary Propulsion // Booster Staging',
          descriptionMn: 'Анхдагч хөөрөлтийн үед нэмэлт их зүтгүүр үзүүлж, уур амьсгалын доод давхаргад шаталт дууссаны дараа пиротехникийн салгагчаар цэвэр салдаг.',
          descriptionEn: 'High-thrust auxiliary booster providing extra liftoff acceleration through Max-Q before pneumatic/explosive bolt jettison.',
          specs: [
            { labelMn: 'Нэмэлт зүтгүүр', labelEn: 'Aux Thrust', val: '+ 1,850 kN' },
            { labelMn: 'Салгалт', labelEn: 'Separation', val: 'Pneumatic Pushers + Collet Release' },
          ],
        } as RocketPartInfo,
      };

      stage1Group.add(boosterGroup);
      sideBoosters.push(boosterGroup);
      inspectableObjects.push(boosterGroup);
    }
  }

  // ================= 3. INTERSTAGE & STAGE 2 (UPPER STAGE) =================
  const stage2Group = new THREE.Group();
  stage2Group.position.y = tankHeight + 0.3;
  root.add(stage2Group);

  // A. Carbon Interstage Adapter
  const interstageHeight = 0.85;
  const interstageGroup = new THREE.Group();
  stage2Group.add(interstageGroup);

  const interstageGeo = new THREE.CylinderGeometry(tankRadius * 1.01, tankRadius * 1.01, interstageHeight, 36);
  geometriesToDispose.push(interstageGeo);
  const interstageMesh = new THREE.Mesh(interstageGeo, carbonMat);
  interstageMesh.position.y = interstageHeight / 2;
  interstageGroup.add(interstageMesh);

  // Pneumatic Stage Pushers (3 separation pistons)
  for (let p = 0; p < 3; p++) {
    const pAngle = (p / 3) * Math.PI * 2;
    const pusherGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.45, 12);
    geometriesToDispose.push(pusherGeo);
    const pusher = new THREE.Mesh(pusherGeo, stainlessSteelMat);
    pusher.position.set(Math.cos(pAngle) * (tankRadius * 0.8), 0.2, Math.sin(pAngle) * (tankRadius * 0.8));
    interstageGroup.add(pusher);
  }

  interstageGroup.userData = {
    partInfo: {
      partId: 'interstage',
      nameMn: 'Нүүрстөрөгчийн Шат Хоорондын Салгагч (Interstage Adapter)',
      nameEn: 'Carbon Composite Interstage Adapter',
      categoryMn: 'Шатлалын Салгагч // Халуун Салгалт (Hot-Staging)',
      categoryEn: 'Stage Separation // Hot-Staging Structure',
      descriptionMn: 'Өндөр бат бэхтэй нүүрстөрөгчийн нийлмэл бүтэц. Дээд шатны хөдөлгүүрийн утааг гадагшлуулах халуун салгах нүхнүүд болон хийн түлхэгч бүлүүртэй.',
      descriptionEn: 'High-strength carbon-fiber composite interstage with vented hot-staging exhaust relief ports and pneumatic separation pushers.',
      specs: [
        { labelMn: 'Материал', labelEn: 'Material', val: 'Carbon Composite Honeycomb' },
        { labelMn: 'Салгах систем', labelEn: 'Separation', val: 'Pneumatic Center Pusher + Collets' },
        { labelMn: 'Агаарын нүх', labelEn: 'Ventilation', val: 'Hot-Staging Gas Relief Ports' },
      ],
    } as RocketPartInfo,
  };
  inspectableObjects.push(interstageGroup);

  // B. Stage 2 Cryogenic Fuel Tank
  const s2Height = 2.6;
  const s2Geo = new THREE.CylinderGeometry(tankRadius, tankRadius, s2Height, 36);
  geometriesToDispose.push(s2Geo);
  const s2Mesh = new THREE.Mesh(s2Geo, whiteHullMat);
  s2Mesh.position.y = s2Height / 2 + interstageHeight;
  stage2Group.add(s2Mesh);

  s2Mesh.userData = {
    partInfo: {
      partId: 'stage2_tank',
      nameMn: '2-р Шатны Криоген Түлшний Сав (Stage 2)',
      nameEn: 'Stage 2 Upper Propellant Tank',
      categoryMn: 'Дээд Шатны Бүтэц // Тойрог Замд Оруулах',
      categoryEn: 'Upper Stage // Orbital Insertion Propellant',
      descriptionMn: 'Сансрын вакуум орчинд ажиллах криоген LOX/RP-1 түлшний даралтат сав. Дулаан тусгаарлагч хөөсөн бүрхүүл ба микро солироос хамгаалах давхаргатай.',
      descriptionEn: 'Cryogenic propellant tank engineered for prolonged coasting in space vacuum, featuring thermal insulation blankets and titanium pressurization spheres.',
      specs: [
        { labelMn: 'Өндөр', labelEn: 'Height', val: `${s2Height.toFixed(1)} m` },
        { labelMn: 'Даралт', labelEn: 'Pressurization', val: 'Autogenous / Helium' },
      ],
    } as RocketPartInfo,
  };
  inspectableObjects.push(s2Mesh);

  // C. Cold-Gas Reaction Control System (RCS Quads - 4 pods around S2)
  for (let q = 0; q < 4; q++) {
    const qAngle = (q / 4) * Math.PI * 2;
    const rcsGroup = new THREE.Group();
    rcsGroup.position.set(
      Math.cos(qAngle) * (tankRadius + 0.02),
      interstageHeight + s2Height * 0.75,
      Math.sin(qAngle) * (tankRadius + 0.02)
    );
    rcsGroup.rotation.y = qAngle;

    const rcsBlockGeo = new THREE.BoxGeometry(0.10, 0.12, 0.08);
    geometriesToDispose.push(rcsBlockGeo);
    const rcsBlock = new THREE.Mesh(rcsBlockGeo, titaniumMat);
    rcsGroup.add(rcsBlock);

    // 4 micro nozzles (+X, -X, +Y, -Y)
    for (let mn = 0; mn < 4; mn++) {
      const mnAngle = (mn / 4) * Math.PI * 2;
      const nozGeo = new THREE.ConeGeometry(0.02, 0.05, 8);
      geometriesToDispose.push(nozGeo);
      const noz = new THREE.Mesh(nozGeo, copperThroatMat);
      noz.position.set(Math.cos(mnAngle) * 0.04, Math.sin(mnAngle) * 0.04, 0.05);
      noz.rotation.x = Math.PI / 2;
      rcsGroup.add(noz);
    }

    stage2Group.add(rcsGroup);
  }

  // D. Stage 2 Vacuum Engine (MVac - Large Niobium Extension Skirt)
  const vacNozGeo = new THREE.ConeGeometry(0.44, 0.95, 24, 1, true);
  geometriesToDispose.push(vacNozGeo);
  const vacNoz = new THREE.Mesh(vacNozGeo, engineNozzleMat);
  vacNoz.rotation.x = Math.PI;
  vacNoz.position.y = 0.42;
  stage2Group.add(vacNoz);

  vacNoz.userData = {
    partInfo: {
      partId: 'mvac_engine',
      nameMn: 'Вакуум Хөдөлгүүр (High-Expansion Vacuum Engine)',
      nameEn: 'Vacuum Engine (High-Expansion Nozzle)',
      categoryMn: 'Вакуум Зүтгүүр // Ниобийн Өргөтгөл',
      categoryEn: 'Upper Stage Propulsion // Radiatively Cooled Nozzle',
      descriptionMn: 'Сансрын вакуумд хамгийн өндөр хувийн импульс (348+ сек) гаргах том амсартай цацрагаар хөрдөг ниобийн хайлшин хошуутай вакуум хөдөлгүүр.',
      descriptionEn: 'High-expansion vacuum engine equipped with a radiatively cooled spun niobium-alloy nozzle extension optimized for maximum vacuum Isp (348s+).',
      specs: [
        { labelMn: 'Вакуум зүтгүүр', labelEn: 'Vac Thrust', val: '981 kN' },
        { labelMn: 'Вакуум Isp', labelEn: 'Vacuum Isp', val: '348 s' },
        { labelMn: 'Хошууны хайлш', labelEn: 'Nozzle Skirt', val: 'Niobium C-103 Alloy' },
        { labelMn: 'Дахин асаалт', labelEn: 'Re-ignition', val: 'Dual TEA-TEB Pyrophoric Igniters' },
      ],
    } as RocketPartInfo,
  };
  inspectableObjects.push(vacNoz);

  // ================= 4. PAYLOAD FAIRING & ENCAPSULATED SPACECRAFT =================
  const payloadGroup = new THREE.Group();
  payloadGroup.position.y = s2Height + interstageHeight;
  stage2Group.add(payloadGroup);

  // A. Encapsulated Spacecraft Bus (Inside fairing)
  const satBodyGeo = new THREE.BoxGeometry(0.72, 1.05, 0.72);
  geometriesToDispose.push(satBodyGeo);
  const satBody = new THREE.Mesh(satBodyGeo, goldMliMat);
  satBody.position.y = 0.85;
  payloadGroup.add(satBody);

  // Folded solar array wings
  for (let s = 0; s < 2; s++) {
    const sSign = s === 0 ? 1 : -1;
    const panelGeo = new THREE.BoxGeometry(0.06, 0.95, 0.60);
    geometriesToDispose.push(panelGeo);
    const panel = new THREE.Mesh(panelGeo, solarMat);
    panel.position.set(sSign * 0.42, 0.85, 0);
    payloadGroup.add(panel);
  }

  // High-gain parabolic antenna dish
  const dishGeo = new THREE.ConeGeometry(0.24, 0.08, 16, 1, true);
  geometriesToDispose.push(dishGeo);
  const dish = new THREE.Mesh(dishGeo, goldMliMat);
  dish.rotation.x = -Math.PI / 2;
  dish.position.set(0, 1.45, 0.22);
  payloadGroup.add(dish);

  payloadGroup.userData = {
    partInfo: {
      partId: 'payload',
      nameMn: 'Тээвэрлэгдэх Сансрын Хөлөг (Encapsulated Spacecraft)',
      nameEn: 'Encapsulated Orbital Spacecraft Bus',
      categoryMn: 'Ачаа Тээвэр // Цэвэрлэгч Хиймэл Дагуул',
      categoryEn: 'Primary Payload // ADR Servicing Spacecraft',
      descriptionMn: 'Алтан MLI дулаан тусгаарлагч, нарны зай, хог барих гар эсвэл торны системээр тоноглогдсон сансрын хог хаягдал цэвэрлэх идэвхтэй үндсэн хөлөг.',
      descriptionEn: 'Active Debris Removal (ADR) servicing spacecraft protected inside the fairing, outfitted with multi-layer thermal insulation, deployable solar wings, and capture mechanisms.',
      specs: [
        { labelMn: 'Хөлгийн масс', labelEn: 'Craft Mass', val: '1,250 kg (Wet Mass)' },
        { labelMn: 'Цахилгаан чадал', labelEn: 'Power Output', val: '2.4 kW Gallium Arsenide Arrays' },
        { labelMn: 'Холбоо', labelEn: 'Comms', val: 'Ka-band High-gain Steerable Dish' },
      ],
    } as RocketPartInfo,
  };
  inspectableObjects.push(payloadGroup);

  // B. Biconic Aerodynamic Fairing Shell (Left & Right Halves)
  const fairingRad = config.fairing.diameterM * 0.24;
  const fairingHeight = config.fairing.heightM * 0.25;

  const fairingGeo = new THREE.ConeGeometry(fairingRad, fairingHeight, 36, 1, false, 0, Math.PI);
  geometriesToDispose.push(fairingGeo);

  const fairingLeft = new THREE.Mesh(fairingGeo, whiteHullMat);
  fairingLeft.position.set(0, fairingHeight / 2 + 0.1, 0);
  payloadGroup.add(fairingLeft);

  const fairingRight = new THREE.Mesh(fairingGeo, whiteHullMat);
  fairingRight.position.set(0, fairingHeight / 2 + 0.1, 0);
  fairingRight.rotation.y = Math.PI;
  payloadGroup.add(fairingRight);

  // Apex Pitot Probe / Telemetry Mast on top of Fairing
  const probeGeo = new THREE.CylinderGeometry(0.015, 0.03, 0.55, 8);
  geometriesToDispose.push(probeGeo);
  const probe = new THREE.Mesh(probeGeo, stainlessSteelMat);
  probe.position.y = fairingHeight + 0.35;
  payloadGroup.add(probe);

  const fairingPartInfo: RocketPartInfo = {
    partId: 'fairing',
    nameMn: `Аэродинамик Хамгаалалтын Хавтас (${config.fairing.nameMn})`,
    nameEn: `Aerodynamic Payload Fairing (${config.fairing.name})`,
    categoryMn: 'Аэродинамик Хаалт // Дуу чимээ шингээгч',
    categoryEn: 'Payload Enclosure // Acoustic Attenuation',
    descriptionMn: 'Уур амьсгалын хурц агаарын эсэргүүцэл, дуу чимээ, аэродинамик халалтаас сансрын хөлгийг хамгаалах нүүрстөрөгчийн нийлмэл бүтэцтэй biconic хавтас.',
    descriptionEn: 'Carbon-composite biconic fairing equipped with acoustic dampening acoustic tile lining, nitrogen jettison thrusters, and dual unlatching latch pins.',
    specs: [
      { labelMn: 'Диаметр', labelEn: 'Diameter', val: `${config.fairing.diameterM} m` },
      { labelMn: 'Өндөр', labelEn: 'Height', val: `${config.fairing.heightM} m` },
      { labelMn: 'Масс', labelEn: 'Fairing Mass', val: `${config.fairing.massKg} kg` },
      { labelMn: 'Салгах систем', labelEn: 'Jettison System', val: 'Cold Nitrogen Thrusters + Latch Release' },
    ],
  };

  fairingLeft.userData = { partInfo: fairingPartInfo };
  fairingRight.userData = { partInfo: fairingPartInfo };
  inspectableObjects.push(fairingLeft);
  inspectableObjects.push(fairingRight);

  // ================= 5. EXPLODED ASSEMBLY VIEW LOGIC =================
  const setExplodedProgress = (progress: number) => {
    // Stage 1 drops down
    stage1Group.position.y = -progress * 2.2;

    // Stage 2 lifts up
    stage2Group.position.y = (tankHeight + 0.3) + progress * 2.6;

    // Interstage separates downward relative to Stage 2
    interstageGroup.position.y = -progress * 1.2;

    // Fairing halves open laterally outward
    fairingLeft.position.x = -progress * 2.8;
    fairingRight.position.x = progress * 2.8;
    fairingLeft.rotation.z = -progress * 0.15;
    fairingRight.rotation.z = progress * 0.15;

    // Spacecraft elevates higher within fairing gap
    payloadGroup.position.y = (s2Height + interstageHeight) + progress * 1.5;

    // Grid fins deploy outward slightly
    gridFins.forEach(f => {
      f.rotation.z = progress * (Math.PI / 2.5);
    });

    // Landing legs extend slightly outward in exploded view
    landingLegs.forEach(l => {
      l.rotation.z = progress * 0.35;
    });

    // Side boosters push outward radially
    sideBoosters.forEach((b, idx) => {
      const angle = (idx / sideBoosters.length) * Math.PI * 2 + (sideBoosters.length === 2 ? Math.PI / 2 : 0);
      const baseDist = tankRadius + 0.62;
      const newDist = baseDist + progress * 1.8;
      b.position.set(Math.cos(angle) * newDist, -progress * 1.0, Math.sin(angle) * newDist);
    });
  };

  const update = (deltaSeconds: number) => {
    // Subtle idle animation
  };

  const dispose = () => {
    geometriesToDispose.forEach(g => g.dispose());
    materialsToDispose.forEach(m => m.dispose());
    texturesToDispose.forEach(t => t.dispose());
  };

  return {
    group: root,
    parts: {
      stage1Group,
      stage2Group,
      engineCluster,
      tankMesh,
      sideBoosters,
      interstage: interstageGroup,
      fairingLeft,
      fairingRight,
      gridFins,
      landingLegs,
      raceways,
      payloadGroup,
    },
    getInspectableObjects: () => inspectableObjects,
    setExplodedProgress,
    update,
    dispose,
  };
}
