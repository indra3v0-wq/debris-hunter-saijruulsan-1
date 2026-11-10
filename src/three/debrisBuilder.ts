/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { MissionTarget } from '../types';
import { createGoldMliTexture, createSolarPanelTexture } from './proceduralTextures';

export interface DebrisModelBundle {
  group: THREE.Group;
  target: MissionTarget;
  update: (deltaSeconds: number) => void;
  dispose: () => void;
}

export function buildDebrisModel(target: MissionTarget): DebrisModelBundle {
  const root = new THREE.Group();
  const geometriesToDispose: THREE.BufferGeometry[] = [];

  const goldMliTex = createGoldMliTexture();
  const solarTex = createSolarPanelTexture();

  const debrisBodyMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.6,
    metalness: 0.7,
  });

  const goldMliMat = new THREE.MeshStandardMaterial({
    map: goldMliTex,
    roughness: 0.35,
    metalness: 0.85,
    color: 0xcca01a,
  });

  const damagedSolarMat = new THREE.MeshStandardMaterial({
    map: solarTex,
    roughness: 0.4,
    metalness: 0.5,
  });

  const charredMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.85,
    metalness: 0.2,
  });

  if (target.type === 'upper_stage') {
    // Abandoned Heavy Rocket Stage: Large cylinder with fuel tank dome & engine nozzle
    const stageGeo = new THREE.CylinderGeometry(1.4, 1.4, 4.8, 24);
    geometriesToDispose.push(stageGeo);
    const stageMesh = new THREE.Mesh(stageGeo, debrisBodyMat);
    root.add(stageMesh);

    // Forward Dome
    const domeGeo = new THREE.SphereGeometry(1.39, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
    geometriesToDispose.push(domeGeo);
    const domeMesh = new THREE.Mesh(domeGeo, debrisBodyMat);
    domeMesh.position.y = 2.4;
    root.add(domeMesh);

    // Main Engine Bell (Rocket exhaust nozzle)
    const bellGeo = new THREE.ConeGeometry(0.85, 1.4, 24, 1, true);
    geometriesToDispose.push(bellGeo);
    const bellMesh = new THREE.Mesh(bellGeo, charredMat);
    bellMesh.position.y = -2.9;
    bellMesh.rotation.x = Math.PI;
    root.add(bellMesh);

    // Interstage Grid Ribs
    const ringGeo = new THREE.TorusGeometry(1.42, 0.05, 8, 32);
    geometriesToDispose.push(ringGeo);
    const ring1 = new THREE.Mesh(ringGeo, debrisBodyMat);
    ring1.rotation.x = Math.PI / 2;
    ring1.position.y = 0.8;
    const ring2 = ring1.clone();
    ring2.position.y = -0.8;
    root.add(ring1);
    root.add(ring2);

  } else if (target.type === 'debris_swarm' || target.type === 'small_debris' || target.type === 'multiple_cleanup') {
    // Multi-fragment irregular shards
    const shardCount = 7;
    for (let i = 0; i < shardCount; i++) {
      const shardGeo = new THREE.DodecahedronGeometry(0.35 + Math.random() * 0.45, 0);
      geometriesToDispose.push(shardGeo);
      const shardMesh = new THREE.Mesh(shardGeo, i % 2 === 0 ? charredMat : debrisBodyMat);
      shardMesh.position.set(
        (Math.random() - 0.5) * 2.5,
        (Math.random() - 0.5) * 2.5,
        (Math.random() - 0.5) * 2.5
      );
      shardMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      root.add(shardMesh);
    }

  } else {
    // Defunct Satellite (e.g. Kestrel-4 or Aura-7)
    const busGeo = new THREE.BoxGeometry(1.5, 2.4, 1.4);
    geometriesToDispose.push(busGeo);
    const busMesh = new THREE.Mesh(busGeo, goldMliMat);
    root.add(busMesh);

    // Damaged Solar Array Left (partially bent/snapped)
    const wingLeftGeo = new THREE.BoxGeometry(2.4, 0.04, 0.9);
    geometriesToDispose.push(wingLeftGeo);
    const wingLeft = new THREE.Mesh(wingLeftGeo, damagedSolarMat);
    wingLeft.position.set(-2.2, 0.4, 0);
    wingLeft.rotation.z = -0.25; // bent angle
    root.add(wingLeft);

    // Damaged Solar Array Right (broken stump + dangling panel)
    const stumpGeo = new THREE.BoxGeometry(0.8, 0.04, 0.9);
    geometriesToDispose.push(stumpGeo);
    const stump = new THREE.Mesh(stumpGeo, damagedSolarMat);
    stump.position.set(1.4, 0.4, 0);
    root.add(stump);

    const danglingGeo = new THREE.BoxGeometry(1.4, 0.04, 0.9);
    geometriesToDispose.push(danglingGeo);
    const dangling = new THREE.Mesh(danglingGeo, damagedSolarMat);
    dangling.position.set(2.4, -0.2, 0.2);
    dangling.rotation.set(0.4, 0.3, 0.6); // twisted dangling
    root.add(dangling);

    // Bent High-Gain Antenna
    const dishGeo = new THREE.SphereGeometry(0.4, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.4);
    geometriesToDispose.push(dishGeo);
    const dish = new THREE.Mesh(dishGeo, debrisBodyMat);
    dish.position.set(0, 1.5, 0.5);
    dish.rotation.x = -1.2;
    dish.rotation.z = 0.5;
    root.add(dish);
  }

  // Tumble rates from target specs
  const tumbleSpeed = (target.tumbleRateDegS * Math.PI) / 180;

  const update = (deltaSeconds: number) => {
    root.rotation.x += tumbleSpeed * 0.8 * deltaSeconds;
    root.rotation.y += tumbleSpeed * deltaSeconds;
    root.rotation.z += tumbleSpeed * 0.5 * deltaSeconds;
  };

  const dispose = () => {
    geometriesToDispose.forEach(g => g.dispose());
    debrisBodyMat.dispose();
    goldMliMat.dispose();
    damagedSolarMat.dispose();
    charredMat.dispose();
    goldMliTex.dispose();
    solarTex.dispose();
  };

  return {
    group: root,
    target,
    update,
    dispose,
  };
}
