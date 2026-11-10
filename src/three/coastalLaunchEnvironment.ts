import * as THREE from 'three';

/** Adds a coastal launch-site environment to the existing Three.js launch scene. */
const decoratedScenes = new WeakSet<THREE.Scene>();
const adjustedCameras = new WeakSet<THREE.Camera>();
const originalRender = THREE.WebGLRenderer.prototype.render;

function makeGrassTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not create the launch-site grass texture.');

  context.fillStyle = '#29491e';
  context.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 18000; i++) {
    const shade = Math.random() > 0.5 ? 'rgba(126, 151, 54, 0.16)' : 'rgba(10, 31, 16, 0.2)';
    context.fillStyle = shade;
    context.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 3, 1 + Math.random() * 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(36, 24);
  return texture;
}

function addCoastalEnvironment(root: THREE.Group): void {
  const grass = new THREE.MeshStandardMaterial({
    map: makeGrassTexture(),
    color: 0xb5c985,
    roughness: 1,
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 700), grass);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.16, 300);
  ground.receiveShadow = true;
  root.add(ground);

  const ocean = new THREE.Mesh(
    new THREE.PlaneGeometry(900, 500),
    new THREE.MeshStandardMaterial({ color: 0x07517a, roughness: 0.28, metalness: 0.18 })
  );
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.set(0, -0.18, -300);
  root.add(ocean);

  const shore = new THREE.Mesh(
    new THREE.PlaneGeometry(900, 5),
    new THREE.MeshStandardMaterial({ color: 0xb4a77a, roughness: 0.95 })
  );
  shore.rotation.x = -Math.PI / 2;
  shore.position.set(0, -0.12, -50);
  root.add(shore);

  // Soft green headlands frame the waterline without blocking the rocket.
  const hillGeometry = new THREE.SphereGeometry(1, 16, 12);
  const hillMaterial = new THREE.MeshStandardMaterial({ color: 0x355b2a, roughness: 1 });
  for (const [x, z, sx, sy, sz] of [
    [-105, -55, 75, 12, 24],
    [105, -58, 82, 15, 28],
    [-205, -70, 95, 19, 34],
    [210, -72, 100, 18, 36],
  ]) {
    const hill = new THREE.Mesh(hillGeometry, hillMaterial);
    hill.position.set(x, 0, z);
    hill.scale.set(sx, sy, sz);
    root.add(hill);
  }

  // A few distant trees add scale and make the pad feel grounded in a landscape.
  const trunkGeometry = new THREE.CylinderGeometry(0.35, 0.5, 4, 6);
  const leafGeometry = new THREE.ConeGeometry(2.2, 7, 7);
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x49351e, roughness: 1 });
  const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x234a25, roughness: 1 });
  for (let i = 0; i < 18; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const tree = new THREE.Group();
    tree.position.set(side * (24 + Math.random() * 38), 0, 12 + Math.random() * 110);
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 2;
    tree.add(trunk);
    const leaves = new THREE.Mesh(leafGeometry, leafMaterial);
    leaves.position.y = 6;
    tree.add(leaves);
    root.add(tree);
  }

  // Warm light on the pad complements the existing engine plume at ignition.
  const engineGlow = new THREE.PointLight(0xff7a2f, 2.2, 48, 2);
  engineGlow.position.set(0, 2, 0);
  root.add(engineGlow);

  // Replace the deep-space dome in this scene with a clear daytime sky.
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const geometry = object.geometry as THREE.SphereGeometry;
    if (geometry.parameters?.radius !== 450) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (material instanceof THREE.MeshBasicMaterial) {
        material.map = null;
        material.color.set(0x82c7f5);
        material.needsUpdate = true;
      }
    }
  });
}

THREE.WebGLRenderer.prototype.render = function (scene: THREE.Scene, camera: THREE.Camera): void {
  if (!decoratedScenes.has(scene)) {
    let launchRoot: THREE.Group | null = null;
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && (object.geometry as THREE.SphereGeometry).parameters?.radius === 75) {
        launchRoot = object.parent as THREE.Group;
      }
    });
    if (launchRoot) {
      addCoastalEnvironment(launchRoot);
      if (scene.fog instanceof THREE.FogExp2) scene.fog.color.set(0x82c7f5);
      decoratedScenes.add(scene);
    }
  }

  if (decoratedScenes.has(scene) && !adjustedCameras.has(camera) && camera instanceof THREE.PerspectiveCamera) {
    camera.fov = 43;
    camera.position.set(-5, 7, 20);
    camera.lookAt(0, 6, 0);
    camera.updateProjectionMatrix();
    adjustedCameras.add(camera);
  }

  originalRender.call(this, scene, camera);
};
