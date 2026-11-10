/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

// Procedural texture generators using HTML5 2D Canvas - zero external file dependencies
// Engineered to match NASA Visible Earth "Blue Marble", "Black Marble", LRO, Juno, and SpaceX/NASA launch vehicle engineering specs.

/**
 * Procedural Earth Surface Texture matching NASA "Blue Marble" true-color satellite imagery
 * Features accurate continental topography, biome coloring, coastal shallows, and ice caps.
 */
/**
 * Procedural Earth Surface Texture matching NASA "Blue Marble" true-color satellite imagery
 * Features accurate continental topography, biome coloring, coastal shallows, coral reefs, and ice caps.
 */
export function createEarthSurfaceTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 1. Vibrant Oceanic Blue Marble Gradient (Deep Sapphire, Royal Blue, and Mid-Latitude Azure)
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#062854');      // Arctic Deep Blue
  oceanGrad.addColorStop(0.12, '#083c7d');   // North Atlantic / Pacific
  oceanGrad.addColorStop(0.28, '#0b4d9c');   // Temperate Royal Blue
  oceanGrad.addColorStop(0.5, '#0d59b2');    // Equatorial Azure
  oceanGrad.addColorStop(0.72, '#0b4d9c');   // South Atlantic / Pacific
  oceanGrad.addColorStop(0.88, '#083c7d');   // Southern Ocean
  oceanGrad.addColorStop(1, '#062854');      // Antarctic Deep Blue
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Helper for drawing realistic continents with fractal coastlines, shallow turquoise lagoons, and biome fills
  const drawFractalLandmass = (
    pts: [number, number][],
    baseColor: string,
    shelfColor = '#00a8cc',
    shallowRim = '#22d3ee',
    innerBiome?: { color: string; cx: number; cy: number; rx: number; ry: number }[]
  ) => {
    // Generate fine fractal micro-steps along polygon
    const finePoints: { x: number; y: number }[] = [];
    for (let i = 0; i < pts.length; i++) {
      const p1 = pts[i];
      const p2 = pts[(i + 1) % pts.length];
      const steps = 18;
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        const bx = p1[0] + (p2[0] - p1[0]) * t;
        const by = p1[1] + (p2[1] - p1[1]) * t;
        // Harmonic fractal roughness for authentic continental coastlines
        const angle = (bx * 83.1 + by * 109.7) * Math.PI;
        const noise = (Math.sin(angle * 3.5) * 0.0035 + Math.cos(angle * 7.2) * 0.002);
        finePoints.push({
          x: (bx + noise) * width,
          y: (by + noise) * height,
        });
      }
    }

    // A. Outer Continental Shelf (Turquoise / Cyan Shallow Waters)
    ctx.strokeStyle = shelfColor;
    ctx.lineWidth = 18;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < finePoints.length; i++) {
      if (i === 0) ctx.moveTo(finePoints[i].x, finePoints[i].y);
      else ctx.lineTo(finePoints[i].x, finePoints[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    // Secondary Vivid Aqua Marine Rim (Tropical Coral Reef / Beach Lagoon)
    ctx.strokeStyle = shallowRim;
    ctx.lineWidth = 6;
    ctx.stroke();

    // B. Base Landmass Fill
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    for (let i = 0; i < finePoints.length; i++) {
      if (i === 0) ctx.moveTo(finePoints[i].x, finePoints[i].y);
      else ctx.lineTo(finePoints[i].x, finePoints[i].y);
    }
    ctx.closePath();
    ctx.fill();

    // C. Internal Biomes (Rainforests, Deserts, Savannas, Mountain Steppes)
    if (innerBiome) {
      ctx.save();
      ctx.clip();
      for (const b of innerBiome) {
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.ellipse(b.cx * width, b.cy * height, b.rx * width, b.ry * height, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  };

  // 2. Realistic Continents & Island Systems
  // NORTH AMERICA (Alaska, Canada boreal forest, USA Great Plains, Appalachians, Rockies, California, Florida, Mexico)
  drawFractalLandmass(
    [
      [0.06, 0.20], [0.10, 0.14], [0.16, 0.12], [0.24, 0.14], [0.31, 0.22],
      [0.32, 0.30], [0.28, 0.37], [0.25, 0.43], [0.22, 0.49], [0.18, 0.44],
      [0.15, 0.38], [0.12, 0.32], [0.08, 0.26]
    ],
    '#2d5a27', // Deep temperate forest green
    '#0284c7',
    '#38bdf8',
    [
      { color: '#1b4332', cx: 0.18, cy: 0.20, rx: 0.08, ry: 0.06 }, // Canadian Boreal Shield
      { color: '#52796f', cx: 0.22, cy: 0.32, rx: 0.05, ry: 0.05 }, // Great Plains
      { color: '#c29b62', cx: 0.16, cy: 0.38, rx: 0.04, ry: 0.04 }, // American Southwest / Mojave Desert
      { color: '#1e4620', cx: 0.27, cy: 0.35, rx: 0.03, ry: 0.05 }, // Eastern US Forests
    ]
  );

  // Florida Peninsula & Caribbean Islands
  drawFractalLandmass([[0.25, 0.38], [0.26, 0.42], [0.27, 0.40], [0.26, 0.37]], '#2d6a4f', '#0ea5e9', '#67e8f9');
  drawFractalLandmass([[0.27, 0.44], [0.30, 0.43], [0.29, 0.46]], '#2d6a4f', '#06b6d4', '#67e8f9');

  // Greenland Ice Sheet (Dazzling Glacial White & Coastal Turquoise)
  drawFractalLandmass(
    [[0.33, 0.08], [0.43, 0.07], [0.41, 0.18], [0.34, 0.20]],
    '#f1f5f9', '#0284c7', '#38bdf8',
    [{ color: '#e2e8f0', cx: 0.38, cy: 0.13, rx: 0.04, ry: 0.05 }]
  );

  // SOUTH AMERICA (Amazon rainforest, Brazilian Highlands, Andes, Pampas, Patagonia)
  drawFractalLandmass(
    [
      [0.22, 0.48], [0.30, 0.46], [0.36, 0.52], [0.35, 0.68],
      [0.32, 0.78], [0.28, 0.86], [0.26, 0.76], [0.21, 0.58]
    ],
    '#194d20', // Lush Amazon Rainforest Green
    '#0284c7',
    '#38bdf8',
    [
      { color: '#0f3814', cx: 0.28, cy: 0.56, rx: 0.07, ry: 0.07 }, // Amazon Core Jungle
      { color: '#40916c', cx: 0.33, cy: 0.65, rx: 0.04, ry: 0.06 }, // Cerrado & Brazilian Highlands
      { color: '#84754e', cx: 0.28, cy: 0.76, rx: 0.03, ry: 0.07 }, // Pampas & Patagonian Steppe
      { color: '#736b60', cx: 0.23, cy: 0.64, rx: 0.015, ry: 0.14 }, // Andes Ridge
    ]
  );

  // EURASIA (Western Europe, Scandinavia, Mediterranean, Russia, Central Asia, Mongolia, China, India, SE Asia)
  drawFractalLandmass(
    [
      [0.45, 0.22], [0.52, 0.15], [0.65, 0.12], [0.84, 0.14], [0.94, 0.22],
      [0.89, 0.34], [0.83, 0.46], [0.76, 0.54], [0.68, 0.46], [0.60, 0.40],
      [0.53, 0.42], [0.46, 0.34]
    ],
    '#2d5e2e', // Eurasian Base Forest & Steppe
    '#0284c7',
    '#38bdf8',
    [
      { color: '#1e3f20', cx: 0.66, cy: 0.18, rx: 0.14, ry: 0.06 }, // Siberian Taiga
      { color: '#386641', cx: 0.50, cy: 0.28, rx: 0.05, ry: 0.05 }, // Central & Western Europe
      { color: '#d4a373', cx: 0.64, cy: 0.36, rx: 0.07, ry: 0.04 }, // Central Asian Steppes & Deserts
      { color: '#e09f3e', cx: 0.75, cy: 0.32, rx: 0.06, ry: 0.035 }, // Gobi Desert & Mongolian Plains
      { color: '#40916c', cx: 0.73, cy: 0.28, rx: 0.05, ry: 0.025 }, // Mongolian Northern Khangai Forest
      { color: '#15803d', cx: 0.79, cy: 0.38, rx: 0.06, ry: 0.06 }, // East China Plains
      { color: '#166534', cx: 0.70, cy: 0.46, rx: 0.05, ry: 0.05 }, // India Monsoon Greens
      { color: '#0f3814', cx: 0.78, cy: 0.52, rx: 0.04, ry: 0.04 }, // Southeast Asian Rainforest
    ]
  );

  // British Isles, Scandinavia Fjords & Japan Archipelago
  drawFractalLandmass([[0.45, 0.22], [0.48, 0.20], [0.47, 0.27]], '#2d6a4f', '#0284c7', '#38bdf8');
  drawFractalLandmass([[0.86, 0.30], [0.89, 0.28], [0.88, 0.36], [0.86, 0.35]], '#2d6a4f', '#0284c7', '#38bdf8');
  drawFractalLandmass([[0.83, 0.32], [0.84, 0.30], [0.84, 0.35]], '#2d6a4f', '#0284c7', '#38bdf8'); // Korea

  // AFRICA (Sahara golden ochre sands, Nile delta, Sahel, Congo rainforest, Kalahari)
  drawFractalLandmass(
    [
      [0.47, 0.36], [0.60, 0.35], [0.64, 0.44], [0.59, 0.62],
      [0.54, 0.76], [0.49, 0.60], [0.43, 0.43]
    ],
    '#c8963e', // Sahara Golden Ochre
    '#0284c7',
    '#38bdf8',
    [
      { color: '#d97706', cx: 0.53, cy: 0.42, rx: 0.08, ry: 0.06 }, // Core Sahara Sand Sea
      { color: '#84cc16', cx: 0.54, cy: 0.50, rx: 0.07, ry: 0.03 }, // Sahel Savannah
      { color: '#14532d', cx: 0.54, cy: 0.58, rx: 0.05, ry: 0.06 }, // Congo Basin Deep Rainforest
      { color: '#ca8a04', cx: 0.53, cy: 0.70, rx: 0.03, ry: 0.04 }, // Kalahari Desert
      { color: '#2d6a4f', cx: 0.53, cy: 0.74, rx: 0.02, ry: 0.02 }, // Cape Coast Greenery
    ]
  );

  // Madagascar & Indonesian Archipelago
  drawFractalLandmass([[0.62, 0.64], [0.65, 0.62], [0.64, 0.73]], '#2d6a4f', '#0284c7', '#38bdf8');
  drawFractalLandmass([[0.76, 0.56], [0.82, 0.58], [0.81, 0.62], [0.75, 0.59]], '#15803d', '#00b4d8', '#67e8f9'); // Sumatra & Java
  drawFractalLandmass([[0.80, 0.52], [0.84, 0.51], [0.83, 0.56]], '#15803d', '#00b4d8', '#67e8f9'); // Borneo

  // AUSTRALIA (Red Outback center, Great Dividing Range, coastal fringe)
  drawFractalLandmass(
    [
      [0.77, 0.65], [0.86, 0.63], [0.90, 0.73], [0.85, 0.81],
      [0.77, 0.79], [0.74, 0.70]
    ],
    '#b45309', // Warm Australian Ochre
    '#00b4d8',
    '#67e8f9',
    [
      { color: '#c2410c', cx: 0.81, cy: 0.72, rx: 0.05, ry: 0.04 }, // Red Desert Center
      { color: '#2d6a4f', cx: 0.87, cy: 0.72, rx: 0.02, ry: 0.06 }, // Eastern Green Coastal Belt
    ]
  );

  // New Zealand & Tasmania
  drawFractalLandmass([[0.92, 0.76], [0.94, 0.74], [0.93, 0.82]], '#2d6a4f', '#0284c7', '#38bdf8');
  drawFractalLandmass([[0.84, 0.84], [0.86, 0.83], [0.85, 0.86]], '#2d6a4f', '#0284c7', '#38bdf8');

  // 3. Iconic Geographic Landmarks
  // Nile River Green Ribbon & Delta
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(width * 0.58, height * 0.48);
  ctx.lineTo(width * 0.575, height * 0.38);
  ctx.stroke();
  // Nile Delta fan
  ctx.fillStyle = '#16a34a';
  ctx.beginPath();
  ctx.arc(width * 0.575, height * 0.375, 6, 0, Math.PI * 2);
  ctx.fill();

  // Lake Baikal (North of Mongolia) & Great Lakes of North America
  ctx.fillStyle = '#0a4b91';
  ctx.beginPath();
  ctx.ellipse(width * 0.74, height * 0.25, 14, 4, -0.6, 0, Math.PI * 2); // Baikal
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(width * 0.24, height * 0.28, 16, 8, 0, 0, Math.PI * 2); // Great Lakes
  ctx.fill();

  // Caspian Sea & Black Sea
  ctx.beginPath();
  ctx.ellipse(width * 0.61, height * 0.32, 10, 22, 0.1, 0, Math.PI * 2); // Caspian
  ctx.ellipse(width * 0.56, height * 0.32, 16, 9, 0, 0, Math.PI * 2); // Black Sea
  ctx.fill();

  // 4. Alpine Snow Peaks (Himalayas, Andes, Rockies, Alps)
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  // Himalayas (Highest mountain range on Earth)
  ctx.beginPath();
  ctx.moveTo(width * 0.68, height * 0.39);
  ctx.lineTo(width * 0.77, height * 0.38);
  ctx.stroke();
  // Tibetan Plateau high altitude sheen
  ctx.fillStyle = 'rgba(235, 230, 215, 0.75)';
  ctx.beginPath();
  ctx.ellipse(width * 0.72, height * 0.36, width * 0.035, height * 0.02, 0, 0, Math.PI * 2);
  ctx.fill();

  // Andes Spine
  ctx.beginPath();
  ctx.moveTo(width * 0.23, height * 0.52);
  ctx.lineTo(width * 0.27, height * 0.82);
  ctx.stroke();

  // European Alps
  ctx.beginPath();
  ctx.moveTo(width * 0.50, height * 0.30);
  ctx.lineTo(width * 0.53, height * 0.29);
  ctx.stroke();

  // 5. Polar Ice Caps (Brilliant White & Glacial Blue Margins)
  // Arctic Sea Ice
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height * 0.05);
  // Fractured sea ice shelf
  ctx.fillStyle = 'rgba(240, 249, 255, 0.85)';
  for (let i = 0; i < 40; i++) {
    const ix = Math.random() * width;
    const iy = height * 0.04 + Math.random() * height * 0.03;
    ctx.fillRect(ix, iy, 12 + Math.random() * 30, 4 + Math.random() * 8);
  }

  // Antarctica Continent & Ice Shelves (Ross / Ronne)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, height * 0.88, width, height * 0.12);
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, height * 0.86, width, height * 0.025);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Procedural Earth Specular Water Mask Texture
 * Black (0.0) = Mirror specular ocean reflection (gorgeous sun glint)
 * White (1.0) = Matte land (no plastic shine on continents)
 */
export function createEarthSpecularTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Oceans are deep black (roughness = 0.04 for razor-sharp sun specular highlight)
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  // Continents are rough matte (roughness = 0.88 - 0.95)
  ctx.fillStyle = '#e5e7eb';

  const fillContinent = (pts: [number, number][]) => {
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const x = pts[i][0] * width;
      const y = pts[i][1] * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  };

  // North America
  fillContinent([[0.06, 0.20], [0.16, 0.12], [0.31, 0.22], [0.28, 0.37], [0.22, 0.49], [0.15, 0.38], [0.08, 0.26]]);
  fillContinent([[0.33, 0.08], [0.43, 0.07], [0.41, 0.18], [0.34, 0.20]]); // Greenland
  // South America
  fillContinent([[0.22, 0.48], [0.36, 0.52], [0.35, 0.68], [0.28, 0.86], [0.21, 0.58]]);
  // Eurasia
  fillContinent([[0.45, 0.22], [0.65, 0.12], [0.94, 0.22], [0.83, 0.46], [0.68, 0.46], [0.46, 0.34]]);
  // Africa
  fillContinent([[0.47, 0.36], [0.64, 0.44], [0.54, 0.76], [0.43, 0.43]]);
  // Australia
  fillContinent([[0.77, 0.65], [0.90, 0.73], [0.85, 0.81], [0.74, 0.70]]);

  // Polar Ice Caps (Semi-reflective ice, roughness ~ 0.35)
  ctx.fillStyle = '#555555';
  ctx.fillRect(0, 0, width, height * 0.06);
  ctx.fillRect(0, height * 0.87, width, height * 0.13);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Procedural Earth Bump/Elevation Texture for 3D Mountain Relief
 */
export function createEarthBumpTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Neutral ocean elevation
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, width, height);

  // Mountain ridges with high elevation
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  // Himalayas & Tibetan Plateau
  ctx.beginPath();
  ctx.moveTo(width * 0.68, height * 0.39);
  ctx.lineTo(width * 0.77, height * 0.38);
  ctx.stroke();
  // Andes
  ctx.beginPath();
  ctx.moveTo(width * 0.23, height * 0.52);
  ctx.lineTo(width * 0.27, height * 0.82);
  ctx.stroke();
  // Rockies
  ctx.beginPath();
  ctx.moveTo(width * 0.16, height * 0.22);
  ctx.lineTo(width * 0.22, height * 0.40);
  ctx.stroke();
  // Alps
  ctx.beginPath();
  ctx.moveTo(width * 0.50, height * 0.30);
  ctx.lineTo(width * 0.53, height * 0.29);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Procedural Earth Cloud layer texture based on NASA MODIS satellite imagery
 * CRITICAL: Canvas is 100% transparent (NO solid black background), allowing vibrant Earth to shine through!
 */
export function createEarthCloudTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Clear to full transparency so Earth is never shrouded in grey or black!
  ctx.clearRect(0, 0, width, height);

  // 1. Equatorial Intertropical Convergence Zone (ITCZ) Feathery Cloud Bands
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * width;
    const y = height * 0.49 + (Math.random() - 0.5) * height * 0.10;
    const rx = 80 + Math.random() * 160;
    const ry = 18 + Math.random() * 32;

    const cloudGrad = ctx.createRadialGradient(x, y, 0, x, y, rx);
    cloudGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
    cloudGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.55)');
    cloudGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

    ctx.fillStyle = cloudGrad;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, (Math.random() - 0.5) * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Realistic Swirling Cyclones (Atlantic Hurricane, Pacific Typhoon, Southern Ocean Vortex)
  const drawCyclonicSpiral = (cx: number, cy: number, maxRadius: number, direction: number) => {
    ctx.save();
    // Spiral arms
    for (let arm = 0; arm < 3; arm++) {
      const armOffset = (arm * Math.PI * 2) / 3;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let a = 0.5; a < Math.PI * 3.5; a += 0.15) {
        const r = (a / (Math.PI * 3.5)) * maxRadius;
        const x = cx + Math.cos(a * direction + armOffset) * r;
        const y = cy + Math.sin(a * direction + armOffset) * r * 0.65;
        if (a === 0.5) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Dense cloud wall around eye
    const wallGrad = ctx.createRadialGradient(cx, cy, maxRadius * 0.08, cx, cy, maxRadius * 0.35);
    wallGrad.addColorStop(0, 'rgba(255, 255, 255, 0.0)'); // Eye
    wallGrad.addColorStop(0.2, 'rgba(255, 255, 255, 0.95)'); // Eyewall
    wallGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = wallGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, maxRadius * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  drawCyclonicSpiral(width * 0.26, height * 0.28, 110, 1);  // North Atlantic Storm
  drawCyclonicSpiral(width * 0.44, height * 0.24, 120, 1);  // European Front
  drawCyclonicSpiral(width * 0.84, height * 0.29, 115, 1);  // West Pacific Typhoon
  drawCyclonicSpiral(width * 0.34, height * 0.70, 110, -1); // South Atlantic Vortex
  drawCyclonicSpiral(width * 0.72, height * 0.74, 120, -1); // Indian Ocean Cyclone

  // 3. Mid-Latitude Weather Fronts & Cirrus Filaments
  for (let i = 0; i < 110; i++) {
    const cx = Math.random() * width;
    const cy = height * 0.12 + Math.random() * height * 0.76;
    const rx = 50 + Math.random() * 140;
    const ry = 10 + Math.random() * 26;

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
    grad.addColorStop(0, `rgba(255, 255, 255, ${0.45 + Math.random() * 0.35})`);
    grad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, (Math.random() - 0.5) * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Procedural Earth Night City Lights Texture (NASA "Black Marble")
 * Engineered with exact geographic latitude/longitude coordinate projections:
 * - Ulaanbaatar (47.9°N, 106.9°E) & Trans-Mongolian railway corridor
 * - Beijing (39.9°N, 116.4°E), Tokyo (35.7°N, 139.7°E), Seoul (37.6°N, 127.0°E)
 * - New York (40.7°N, 74.0°W), London (51.5°N, 0.1°W), Paris, Moscow, Delhi, Los Angeles
 * Featuring high-density central metropolitan cores with soft atmospheric diffusion and organic suburban sprawl.
 */
export function createEarthNightTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  // Exact geographic projection helper: Lat/Lon to Canvas Pixel Coordinates
  const getGeoXY = (latDeg: number, lonDeg: number): [number, number] => {
    const x = ((lonDeg + 180) / 360) * width;
    const y = ((90 - latDeg) / 180) * height;
    return [x, y];
  };

  const addGeoCity = (
    latDeg: number,
    lonDeg: number,
    radius: number,
    density: number,
    sprawlCount = 4
  ) => {
    const [cx, cy] = getGeoXY(latDeg, lonDeg);

    // 1. Soft atmospheric light dome glow around city
    const glowGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, radius * 1.6);
    glowGrad.addColorStop(0, 'rgba(251, 191, 36, 0.35)'); // Warm sodium core
    glowGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.12)');
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.6, 0, Math.PI * 2);
    ctx.fill();

    // 2. High-density central urban core
    for (let i = 0; i < density; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.pow(Math.random(), 1.8) * radius;
      const x = cx + Math.cos(angle) * dist;
      const y = cy + Math.sin(angle) * dist;

      const r = Math.random();
      if (r < 0.60) {
        // Warm sodium incandescent (2700K)
        ctx.fillStyle = 'rgba(251, 191, 36, 0.95)';
        ctx.fillRect(x, y, 1.5, 1.5);
      } else if (r < 0.88) {
        // Modern LED white (5000K)
        ctx.fillStyle = 'rgba(254, 243, 199, 0.98)';
        ctx.fillRect(x, y, 2.2, 2.2);
      } else {
        // Intense high-rise / stadium light spike
        ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
        ctx.fillRect(x, y, 2.8, 2.8);
      }
    }

    // 3. Sprawling transit arteries and suburban ribbons
    for (let s = 0; s < sprawlCount; s++) {
      const sprawlAngle = (s / sprawlCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const sprawlLen = radius * (1.2 + Math.random() * 0.8);
      const steps = 18;
      let sx = cx;
      let sy = cy;
      for (let st = 0; st < steps; st++) {
        const t = st / steps;
        sx = cx + Math.cos(sprawlAngle) * sprawlLen * t + (Math.random() - 0.5) * 3;
        sy = cy + Math.sin(sprawlAngle) * sprawlLen * t + (Math.random() - 0.5) * 3;
        ctx.fillStyle = `rgba(245, 158, 11, ${0.7 - t * 0.45})`;
        ctx.fillRect(sx, sy, 1.2, 1.2);
      }
    }
  };

  // Geographic Highway Corridor Helper (Connecting cities along rail & road corridors)
  const addCorridor = (lat1: number, lon1: number, lat2: number, lon2: number, points = 35) => {
    const [x1, y1] = getGeoXY(lat1, lon1);
    const [x2, y2] = getGeoXY(lat2, lon2);
    for (let i = 0; i < points; i++) {
      const t = i / points;
      const x = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 3;
      const y = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 3;
      ctx.fillStyle = 'rgba(245, 158, 11, 0.65)';
      ctx.fillRect(x, y, 1.2, 1.2);
    }
  };

  // ================= EXACT GEOGRAPHIC CITY LIGHT NODES =================
  // 1. MONGOLIA: Ulaanbaatar (Capital) + Trans-Mongolian Railway Corridor
  addGeoCity(47.92, 106.92, 22, 280, 5); // Ulaanbaatar (Central Core)
  addGeoCity(49.03, 104.04, 12, 110, 3); // Erdenet Mining City
  addGeoCity(49.46, 105.95, 10, 90, 2);  // Darkhan Industrial City
  addGeoCity(43.72, 111.84, 8, 60, 2);   // Zamyn-Uud Border
  // Trans-Mongolian rail corridor linking Russia -> Darkhan -> Ulaanbaatar -> China
  addCorridor(51.83, 107.61, 47.92, 106.92, 40); // Ulan-Ude to UB
  addCorridor(47.92, 106.92, 43.72, 111.84, 45); // UB to Zamyn-Uud

  // 2. EAST ASIA:
  addGeoCity(39.90, 116.40, 55, 650, 8); // Beijing (Massive core & ring roads)
  addGeoCity(35.68, 139.65, 52, 700, 8); // Tokyo (Tokyo Bay Mega-conurbation)
  addGeoCity(37.57, 126.98, 42, 540, 6); // Seoul & Incheon
  addGeoCity(31.23, 121.47, 58, 680, 8); // Shanghai & Yangtze Delta
  addGeoCity(23.13, 113.26, 62, 720, 8); // Guangzhou & Hong Kong Pearl River
  addGeoCity(34.69, 135.50, 36, 420, 5); // Osaka & Kyoto

  // 3. NORTH AMERICA:
  addGeoCity(40.71, -74.00, 56, 680, 8);  // New York & Bos-Wash corridor
  addGeoCity(34.05, -118.24, 48, 520, 7); // Los Angeles & Southern California
  addGeoCity(41.88, -87.63, 42, 460, 6);  // Chicago & Great Lakes
  addGeoCity(37.77, -122.42, 36, 380, 6); // San Francisco & Silicon Valley
  addGeoCity(29.76, -95.37, 38, 390, 5);  // Houston & Texas Gulf

  // 4. EUROPE:
  addGeoCity(51.51, -0.13, 50, 620, 8);  // London & Southeast England
  addGeoCity(48.86, 2.35, 46, 560, 7);   // Paris & Ile-de-France
  addGeoCity(55.75, 37.62, 48, 520, 6);  // Moscow & ring highways
  addGeoCity(52.52, 13.40, 35, 360, 5);  // Berlin & Rhine-Ruhr belt
  addGeoCity(41.90, 12.50, 32, 340, 5);  // Rome & Northern Italy Po Valley

  // 5. SOUTH ASIA & MIDDLE EAST & AUSTRALIA & SOUTH AMERICA:
  addGeoCity(28.61, 77.21, 52, 600, 7);  // New Delhi & Ganges corridor
  addGeoCity(19.08, 72.88, 48, 540, 6);  // Mumbai
  addGeoCity(30.04, 31.24, 38, 420, 5);  // Cairo & Nile Valley Ribbon
  addGeoCity(25.20, 55.27, 34, 380, 5);  // Dubai & Persian Gulf Coast
  addGeoCity(-23.55, -46.63, 46, 480, 6); // Sao Paulo
  addGeoCity(-33.87, 151.21, 38, 380, 5); // Sydney
  addGeoCity(-37.81, 144.96, 34, 340, 5); // Melbourne

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * PBR ABLATIVE CERAMIC HEAT SHIELD TILE TEXTURE
 * Modeled after NASA Orion and SpaceX Dragon underside thermal protection system (TPS).
 * Features individual ceramic tiles, fine expansion gaps, serial number markings, and carbonized sheen.
 */
export function createCapsuleHeatShieldTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base Matte Carbon Black (Pyrolytic carbon / phenolic impregnated carbon ablator)
  ctx.fillStyle = '#11141a';
  ctx.fillRect(0, 0, size, size);

  // Orthogonal Tile Expansion Joints
  const tileSize = 64;
  const gap = 2.5;

  ctx.strokeStyle = '#05070a'; // Deep recessed gap
  ctx.lineWidth = gap;

  for (let x = 0; x < size; x += tileSize) {
    for (let y = 0; y < size; y += tileSize) {
      // Subtle per-tile ceramic density variation
      const tileNoise = (Math.sin(x * 12.7 + y * 19.3) * 0.5 + 0.5);
      const tone = Math.floor(18 + tileNoise * 14);
      ctx.fillStyle = `rgb(${tone}, ${tone + 1}, ${tone + 3})`;
      ctx.fillRect(x + gap, y + gap, tileSize - gap * 2, tileSize - gap * 2);

      // Fine perimeter bevel
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + gap + 1, y + gap + 1, tileSize - gap * 2 - 2, tileSize - gap * 2 - 2);

      // Tiny ceramic tile serial code stencils
      if ((x / tileSize + y / tileSize) % 3 === 0) {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.28)';
        ctx.font = 'bold 7px "JetBrains Mono", monospace';
        ctx.fillText(`TPS-${((x * 7 + y) % 999).toString().padStart(3, '0')}`, x + 6, y + tileSize - 8);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

/**
 * PBR CREW CAPSULE HULL TILE TEXTURE
 * White Fibrous Refractory Composite Insulation (FRCI) thermal blankets,
 * inspection doors, avionics hatches, rivets, and Mongolian aerospace markings.
 */
export function createCapsuleHullTileTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // 1. Off-white aerospace ceramic coating
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, size, size);

  // Quilted thermal blanket seam lines
  const blanketW = 128;
  const blanketH = 96;

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
  ctx.lineWidth = 1.8;

  for (let x = 0; x < size; x += blanketW) {
    for (let y = 0; y < size; y += blanketH) {
      ctx.strokeRect(x, y, blanketW, blanketH);

      // Fastener rivets at corners
      ctx.fillStyle = 'rgba(71, 85, 105, 0.6)';
      ctx.fillRect(x + 4, y + 4, 2.5, 2.5);
      ctx.fillRect(x + blanketW - 6, y + 4, 2.5, 2.5);
      ctx.fillRect(x + 4, y + blanketH - 6, 2.5, 2.5);
      ctx.fillRect(x + blanketW - 6, y + blanketH - 6, 2.5, 2.5);
    }
  }

  // 2. Technical Inspection Panels
  const drawHatch = (hx: number, hy: number, hw: number, hh: number, label: string) => {
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.2;
    ctx.strokeRect(hx, hy, hw, hh);

    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(hx + 2, hy + 2, hw - 4, hh - 4);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.fillText(label, hx + 8, hy + hh / 2 + 3);
  };

  drawHatch(160, 240, 110, 48, 'AVIONICS 1');
  drawHatch(680, 240, 110, 48, 'AVIONICS 2');
  drawHatch(380, 560, 140, 52, 'ECLSS O2 ACCESS');

  // 3. Stencils & Warnings in Aerospace Typography
  ctx.font = 'bold 16px "Space Grotesk", sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('QUASAR // CH-13 CREW MODULE', 160, 120);

  ctx.font = 'bold 11px "JetBrains Mono", monospace';
  ctx.fillStyle = '#0284c7';
  ctx.fillText('ULAANBAATAR SPACE PROGRAM', 160, 140);

  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 10px "JetBrains Mono", monospace';
  ctx.fillText('▲ RESCUE // CUT HERE FOR EMERGENCY ACCESS', 540, 120);
  ctx.fillText('▲ PITOT STATIC PORT // DO NOT COVER', 540, 420);

  // 4. Authentic Mongolian Soyombo & Flag
  const flagW = 120;
  const flagH = 60;
  const fx = 740;
  const fy = 80;

  ctx.fillStyle = '#da291c';
  ctx.fillRect(fx, fy, flagW / 3, flagH);
  ctx.fillStyle = '#0055b8';
  ctx.fillRect(fx + flagW / 3, fy, flagW / 3, flagH);
  ctx.fillStyle = '#da291c';
  ctx.fillRect(fx + (flagW / 3) * 2, fy, flagW / 3, flagH);

  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.arc(fx + flagW / 6, fy + flagH / 2, 8, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * PBR COCKPIT MULTI-FUNCTION DIGITAL DISPLAY (MFD) TEXTURE
 * Digital glass cockpit screens: Attitude Director Indicator, Orbital Map, and Power/Telemetry.
 */
export function createCockpitDisplayTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#030712';
  ctx.fillRect(0, 0, size, size);

  // SCREEN 1: Primary Flight Display (Attitude Director Indicator / Artificial Horizon)
  const drawPFD = (sx: number, sy: number, sw: number, sh: number) => {
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 3;
    ctx.strokeRect(sx, sy, sw, sh);

    ctx.fillStyle = '#080e1a';
    ctx.fillRect(sx + 3, sy + 3, sw - 6, sh - 6);

    // Artificial horizon sphere/box
    const cx = sx + sw / 2;
    const cy = sy + sh / 2;
    const rad = sw * 0.32;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.clip();

    // Sky blue top, brown pitch ground bottom
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(cx - rad, cy - rad, rad * 2, rad);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(cx - rad, cy, rad * 2, rad);

    // Horizon line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - rad, cy);
    ctx.lineTo(cx + rad, cy);
    ctx.stroke();

    // Pitch ladder
    ctx.lineWidth = 1.5;
    for (let p = -30; p <= 30; p += 10) {
      if (p === 0) continue;
      const py = cy - p * 2.2;
      ctx.beginPath();
      ctx.moveTo(cx - 25, py);
      ctx.lineTo(cx + 25, py);
      ctx.stroke();
    }
    ctx.restore();

    // Fixed airplane crosshairs
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 35, cy);
    ctx.lineTo(cx - 12, cy);
    ctx.lineTo(cx, cy + 10);
    ctx.lineTo(cx + 12, cy);
    ctx.lineTo(cx + 35, cy);
    ctx.stroke();

    // Heading tape
    ctx.fillStyle = '#0ea5e9';
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.fillText('HDG 084° | PITCH +04.2° | ROLL 00.0°', sx + 18, sy + 28);
    ctx.fillStyle = '#10b981';
    ctx.fillText('ALT: 420.0 KM | VEL: 7.66 KM/S', sx + 18, sy + sh - 16);
  };

  // SCREEN 2: Orbital Trajectory Map
  const drawOrbitalMap = (sx: number, sy: number, sw: number, sh: number) => {
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 3;
    ctx.strokeRect(sx, sy, sw, sh);

    ctx.fillStyle = '#080e1a';
    ctx.fillRect(sx + 3, sy + 3, sw - 6, sh - 6);

    const cx = sx + sw / 2;
    const cy = sy + sh / 2;

    // Earth wireframe globe
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 60, 0, Math.PI * 2);
    ctx.stroke();

    // Chaser orbit ring (cyan)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 95, 75, 0.2, 0, Math.PI * 2);
    ctx.stroke();

    // Spacecraft icon
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(cx + 85, cy - 25, 5, 0, Math.PI * 2);
    ctx.fill();

    // Target orbit ring (red)
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 115, 85, -0.1, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.fillText('ORBITAL TRAJECTORY TRACKER', sx + 18, sy + 28);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText('APOGEE: 540 KM | PERIGEE: 418 KM', sx + 18, sy + sh - 32);
    ctx.fillText('INC: 51.6° | PERIOD: 92.4 MIN', sx + 18, sy + sh - 14);
  };

  // SCREEN 3: Life Support (ECLSS) & Power Telemetry
  const drawSystemsScreen = (sx: number, sy: number, sw: number, sh: number) => {
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 3;
    ctx.strokeRect(sx, sy, sw, sh);

    ctx.fillStyle = '#080e1a';
    ctx.fillRect(sx + 3, sy + 3, sw - 6, sh - 6);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 15px "JetBrains Mono", monospace';
    ctx.fillText('SPACECRAFT SUBSYSTEMS STATUS', sx + 18, sy + 28);

    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('CABIN PRESSURE: 101.3 kPa (NOMINAL)', sx + 18, sy + 64);
    ctx.fillText('OXYGEN FRACTION: 20.9% O2', sx + 18, sy + 88);
    ctx.fillText('CABIN TEMPERATURE: 21.4 °C', sx + 18, sy + 112);
    ctx.fillText('ELECTRICAL BUS: 28.2 VDC // 3,420 W', sx + 18, sy + 136);
    ctx.fillText('SOLAR ARRAY WINGS: DEPLOYED (100%)', sx + 18, sy + 160);
    ctx.fillText('RCS PROPELLANT: 88.5% HYDRAZINE', sx + 18, sy + 184);

    // Docking crosshair reticle
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    const rcx = sx + sw - 80;
    const rcy = sy + sh - 80;
    ctx.beginPath();
    ctx.arc(rcx, rcy, 36, 0, Math.PI * 2);
    ctx.moveTo(rcx - 45, rcy); ctx.lineTo(rcx + 45, rcy);
    ctx.moveTo(rcx, rcy - 45); ctx.lineTo(rcx, rcy + 45);
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.fillText('NDS DOCKING HUD', rcx - 42, rcy + 52);
  };

  drawPFD(32, 32, 460, 440);
  drawOrbitalMap(520, 32, 460, 440);
  drawSystemsScreen(32, 510, 950, 470);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural Deep Space Milky Way & Cosmic Nebula Skybox Texture
 */
export function createMilkyWaySkyboxTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#01030a';
  ctx.fillRect(0, 0, width, height);

  const drawGalacticBand = (yCenter: number, r: number, g: number, b: number, alpha: number) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, yCenter - 80);
    ctx.bezierCurveTo(width * 0.3, yCenter - 140, width * 0.7, yCenter + 120, width, yCenter + 60);
    ctx.lineTo(width, yCenter + 180);
    ctx.bezierCurveTo(width * 0.7, yCenter + 240, width * 0.3, yCenter - 20, 0, yCenter + 40);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, yCenter - 100, 0, yCenter + 200);
    grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
    grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${alpha})`);
    grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  };

  drawGalacticBand(height * 0.52, 99, 102, 241, 0.28);
  drawGalacticBand(height * 0.50, 168, 85, 247, 0.22);
  drawGalacticBand(height * 0.54, 56, 189, 248, 0.18);

  for (let n = 0; n < 8; n++) {
    const cx = (n / 8) * width + (Math.random() - 0.5) * 150;
    const cy = height * 0.45 + (Math.random() - 0.5) * 180;
    const rad = 120 + Math.random() * 160;

    const nebGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, rad);
    if (n % 2 === 0) {
      nebGrad.addColorStop(0, 'rgba(236, 72, 153, 0.25)');
      nebGrad.addColorStop(0.6, 'rgba(147, 51, 234, 0.12)');
      nebGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else {
      nebGrad.addColorStop(0, 'rgba(56, 189, 248, 0.22)');
      nebGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.10)');
      nebGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    }
    ctx.fillStyle = nebGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  const starCount = 2200;
  for (let i = 0; i < starCount; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const tempRand = Math.random();

    let starColor = 'rgba(255, 255, 255, ';
    if (tempRand < 0.25) starColor = 'rgba(186, 230, 253, ';
    else if (tempRand < 0.40) starColor = 'rgba(254, 240, 138, ';
    else if (tempRand < 0.48) starColor = 'rgba(254, 202, 202, ';

    const brightness = 0.35 + Math.random() * 0.65;
    const size = Math.random() > 0.96 ? 2.5 : Math.random() > 0.85 ? 1.8 : 1.0;

    ctx.fillStyle = starColor + brightness + ')';
    ctx.fillRect(x, y, size, size);

    if (size > 2.0 && Math.random() > 0.6) {
      ctx.strokeStyle = starColor + (brightness * 0.7) + ')';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y);
      ctx.moveTo(x, y - 5); ctx.lineTo(x, y + 5);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Procedural Mars Surface Texture
 */
export function createMarsTexture(): THREE.CanvasTexture {
  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#b44a28';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#652a18';
  ctx.beginPath();
  ctx.ellipse(width * 0.45, height * 0.52, 80, 45, 0.2, 0, Math.PI * 2);
  ctx.ellipse(width * 0.75, height * 0.48, 60, 35, -0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f1f5f9';
  ctx.beginPath();
  ctx.ellipse(width * 0.5, 8, 45, 10, 0, 0, Math.PI * 2);
  ctx.ellipse(width * 0.5, height - 8, 55, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural Jupiter Gas Giant Texture
 */
export function createJupiterTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const bands = [
    '#d9c4aa', '#c29b7a', '#9e623f', '#e6d8c3', '#b8784d',
    '#e2d6c1', '#8c4825', '#d4be9c', '#c78a59', '#decbb4'
  ];

  const bandH = height / bands.length;
  for (let i = 0; i < bands.length; i++) {
    ctx.fillStyle = bands[i];
    ctx.fillRect(0, i * bandH, width, bandH + 2);
  }

  ctx.fillStyle = 'rgba(140, 72, 37, 0.4)';
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    ctx.beginPath();
    ctx.ellipse(x, y, 35 + Math.random() * 40, 6 + Math.random() * 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Great Red Spot
  ctx.fillStyle = '#b84224';
  ctx.beginPath();
  ctx.ellipse(width * 0.62, height * 0.64, 48, 28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f5b59a';
  ctx.beginPath();
  ctx.ellipse(width * 0.62, height * 0.64, 25, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural Saturn Concentric Rings Texture
 */
export function createSaturnRingTexture(): THREE.CanvasTexture {
  const width = 512;
  const height = 64;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, width, 0);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.15, 'rgba(190, 165, 125, 0.65)');
  grad.addColorStop(0.40, 'rgba(220, 195, 150, 0.95)');
  grad.addColorStop(0.68, 'rgba(20, 15, 10, 0.05)');
  grad.addColorStop(0.74, 'rgba(205, 180, 140, 0.85)');
  grad.addColorStop(0.96, 'rgba(160, 140, 110, 0.4)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural Moon Surface Texture
 */
export function createMoonTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#b8bec8';
  ctx.fillRect(0, 0, width, height);

  const drawMare = (cx: number, cy: number, rx: number, ry: number) => {
    ctx.fillStyle = 'rgba(70, 75, 85, 0.75)';
    ctx.beginPath();
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const wobble = 0.85 + Math.sin(angle * 4) * 0.15 + Math.cos(angle * 7) * 0.1;
      const x = cx + Math.cos(angle) * rx * wobble;
      const y = cy + Math.sin(angle) * ry * wobble;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  };

  drawMare(width * 0.35, height * 0.4, 110, 75);
  drawMare(width * 0.52, height * 0.42, 85, 60);
  drawMare(width * 0.45, height * 0.58, 65, 50);

  for (let i = 0; i < 90; i++) {
    const cx = Math.random() * width;
    const cy = Math.random() * height;
    const r = 3 + Math.random() * 16;

    ctx.strokeStyle = 'rgba(240, 245, 255, 0.7)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(cx - 0.8, cy - 0.8, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(45, 50, 58, 0.8)';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
    ctx.fill();

    if (r > 10) {
      ctx.fillStyle = 'rgba(230, 235, 245, 0.85)';
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * ULTRA-REALISTIC ROCKET HULL PBR TEXTURE
 * Features aluminum-lithium panel weld seams, stringers, inspection hatches, LOX/RP-1 stencils, warning labels
 */
export function createRocketHullDetailTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 1. Base Aerospace White Thermal Coating with subtle panel variance
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);

  // Subtle vertical stringer lines (internal structural ribs reflecting through skin)
  ctx.strokeStyle = 'rgba(203, 213, 225, 0.35)';
  ctx.lineWidth = 1.5;
  for (let x = 0; x < width; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // 2. Circumferential Weld Rings & Section Joints
  const weldYPositions = [0.08, 0.22, 0.38, 0.55, 0.72, 0.88];
  weldYPositions.forEach(yPct => {
    const y = yPct * height;
    // Dark seam line
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.6)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();

    // Metallic highlight rim
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y - 2);
    ctx.lineTo(width, y - 2);
    ctx.stroke();

    // Rivet dots along the weld line
    ctx.fillStyle = 'rgba(100, 116, 139, 0.6)';
    for (let rx = 8; rx < width; rx += 24) {
      ctx.beginPath();
      ctx.arc(rx, y + 5, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // 3. Technical Stencils and Markings in Crisp Aerospace Typography
  ctx.font = 'bold 22px "JetBrains Mono", monospace';
  ctx.fillStyle = '#0f172a';

  // Core Stage Designation
  ctx.fillText('FIRST STAGE CORE // S-1B', 60, height * 0.45);
  ctx.font = 'bold 16px "JetBrains Mono", monospace';
  ctx.fillStyle = '#0284c7';
  ctx.fillText('ULAANBAATAR SPACE PROGRAM // CH-13', 60, height * 0.48);

  // LOX Vent Stencil & Warning
  ctx.font = 'bold 14px "JetBrains Mono", monospace';
  ctx.fillStyle = '#dc2626';
  ctx.fillText('▲ LIQUID OXYGEN // LOX FILL / DRAIN', width * 0.45, height * 0.26);
  ctx.fillText('▲ HIGH PRESSURE HELIUM COPV PORT', width * 0.45, height * 0.30);
  ctx.fillText('▲ RP-1 REFINED HYDROCARBON FUEL', width * 0.45, height * 0.60);

  // 'NO STEP' and 'STATIC PORT' Stencils
  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.font = 'bold 11px "JetBrains Mono", monospace';
  for (let i = 0; i < 6; i++) {
    const sx = 80 + i * 320;
    ctx.fillText('NO STEP', sx, height * 0.12);
    ctx.fillText('STATIC PORT // DO NOT PAINT', sx, height * 0.76);
    ctx.fillText('GROUND TEST ACCESS', sx, height * 0.84);
  }

  // 4. Inspection Panels / Hinged Hatches
  const drawInspectionHatch = (hx: number, hy: number, hw: number, hh: number, label: string) => {
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(hx, hy, hw, hh);

    // Fasteners at corners
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(hx + 3, hy + 3, 3, 3);
    ctx.fillRect(hx + hw - 6, hy + 3, 3, 3);
    ctx.fillRect(hx + 3, hy + hh - 6, 3, 3);
    ctx.fillRect(hx + hw - 6, hy + hh - 6, 3, 3);

    // Label
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText(label, hx + 8, hy + hh / 2 + 3);
  };

  drawInspectionHatch(width * 0.25, height * 0.32, 120, 48, 'AVIONICS BUS A');
  drawInspectionHatch(width * 0.65, height * 0.32, 120, 48, 'AVIONICS BUS B');
  drawInspectionHatch(width * 0.35, height * 0.68, 140, 52, 'VALVE MANIFOLD');
  drawInspectionHatch(width * 0.75, height * 0.68, 140, 52, 'PURGE SYSTEM');

  // 5. Authentic Mongolian Soyombo & Aerospace Insignia
  const flagW = 180;
  const flagH = 90;
  const fx = width * 0.72;
  const fy = height * 0.42;

  ctx.fillStyle = '#da291c';
  ctx.fillRect(fx, fy, flagW / 3, flagH);
  ctx.fillStyle = '#0055b8';
  ctx.fillRect(fx + flagW / 3, fy, flagW / 3, flagH);
  ctx.fillStyle = '#da291c';
  ctx.fillRect(fx + (flagW / 3) * 2, fy, flagW / 3, flagH);

  // Gold Soyombo
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.arc(fx + flagW / 6, fy + flagH / 2, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = 'bold 24px "Space Grotesk", sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('QUASAR', fx, fy + flagH + 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Procedural Carbon-Fiber Interstage Adapter Texture with Vent Ports
 */
export function createCarbonInterstageTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0b0f19';
  ctx.fillRect(0, 0, size, size);

  // Carbon twill weave pattern
  const twill = 16;
  ctx.fillStyle = '#1e293b';
  for (let x = 0; x < size; x += twill) {
    for (let y = 0; y < size; y += twill) {
      if ((x / twill + y / twill) % 2 === 0) {
        ctx.fillRect(x, y, twill, twill);
      }
    }
  }

  // Interstage hot-staging vent ports (perforated exhaust relief slots)
  ctx.fillStyle = '#020617';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  for (let vx = 32; vx < size; vx += 64) {
    ctx.beginPath();
    ctx.roundRect(vx, size * 0.35, 36, 120, 6);
    ctx.fill();
    ctx.stroke();
  }

  // Staging Separation Joint Band
  ctx.fillStyle = '#475569';
  ctx.fillRect(0, size - 24, size, 8);
  ctx.fillStyle = '#e2e8f0';
  for (let px = 16; px < size; px += 32) {
    ctx.fillRect(px, size - 22, 6, 4); // pneumatic pushers
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 1);
  return texture;
}

/**
 * Procedural Rocket Engine Nozzle Inconel/Niobium Metallic Texture
 */
export function createEngineNozzleTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Dark metallic base (Inconel 718 / Niobium alloy)
  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, '#b45309'); // Copper/Gold regeneratively cooled throat
  grad.addColorStop(0.25, '#334155'); // Transition zone
  grad.addColorStop(0.7, '#1e293b');  // Radiatively cooled dark bell
  grad.addColorStop(1, '#0f172a');   // Nozzle exit lip
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Circumferential cooling channels and stiffener rings
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.2;
  for (let y = 12; y < size; y += 14) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  // Heat discoloration streaks (rainbow oxidation: bronze, blue, violet)
  const drawHeatBand = (yPos: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, yPos, size, 12);
  };
  drawHeatBand(size * 0.18, 'rgba(56, 189, 248, 0.15)'); // Blue oxidation
  drawHeatBand(size * 0.22, 'rgba(168, 85, 247, 0.12)'); // Violet heat tint
  drawHeatBand(size * 0.28, 'rgba(245, 158, 11, 0.15)'); // Bronze

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Procedural Gold Multi-Layer Insulation (MLI) Thermal Blanket Texture
 */
export function createGoldMliTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#d49b28';
  ctx.fillRect(0, 0, size, size);

  const gridSize = 64;
  ctx.strokeStyle = '#996515';
  ctx.lineWidth = 1.5;
  for (let x = 0; x <= size; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }
  for (let y = 0; y <= size; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255, 230, 130, 0.18)';
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const w = 4 + Math.random() * 16;
    const h = 4 + Math.random() * 16;
    ctx.fillRect(x, y, w, h);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

/**
 * Procedural Silicon Solar Panel Texture with Wafer Cells & Metallic Grid Lines
 */
export function createSolarPanelTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#081736';
  ctx.fillRect(0, 0, size, size);

  const cellSize = 64;
  const padding = 3;

  for (let x = 0; x < size; x += cellSize) {
    for (let y = 0; y < size; y += cellSize) {
      const cellGrad = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
      cellGrad.addColorStop(0, '#0f2b60');
      cellGrad.addColorStop(0.5, '#133575');
      cellGrad.addColorStop(1, '#091c42');
      ctx.fillStyle = cellGrad;
      ctx.fillRect(x + padding, y + padding, cellSize - padding * 2, cellSize - padding * 2);

      ctx.strokeStyle = 'rgba(200, 225, 255, 0.4)';
      ctx.lineWidth = 1;
      for (let gx = x + 8; gx < x + cellSize - 8; gx += 12) {
        ctx.beginPath();
        ctx.moveTo(gx, y + padding);
        ctx.lineTo(gx, y + cellSize - padding);
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(240, 248, 255, 0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + cellSize / 2, y + padding);
      ctx.lineTo(x + cellSize / 2, y + cellSize - padding);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Procedural Spacecraft Hull Panel Texture
 */
export function createHullPanelTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#222938';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, size - 8, size - 8);
  ctx.strokeRect(size / 2, 4, size / 2 - 4, size - 8);

  ctx.fillStyle = '#64748b';
  for (let i = 16; i < size; i += 32) {
    ctx.beginPath();
    ctx.arc(i, 8, 2, 0, Math.PI * 2);
    ctx.arc(i, size - 8, 2, 0, Math.PI * 2);
    ctx.arc(8, i, 2, 0, Math.PI * 2);
    ctx.arc(size - 8, i, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural Mongolian National Flag Texture with authentic Soyombo emblem
 */
export function createMongolianFlagTexture(): THREE.CanvasTexture {
  const width = 600;
  const height = 300;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const colWidth = width / 3;

  ctx.fillStyle = '#da291c';
  ctx.fillRect(0, 0, colWidth, height);
  ctx.fillStyle = '#0055b8';
  ctx.fillRect(colWidth, 0, colWidth, height);
  ctx.fillStyle = '#da291c';
  ctx.fillRect(colWidth * 2, 0, colWidth, height);

  const cx = colWidth / 2;
  const cy = height / 2;

  ctx.fillStyle = '#ffd700';
  ctx.strokeStyle = '#ffd700';

  ctx.beginPath();
  ctx.arc(cx, cy - 85, 14, 0, Math.PI * 2);
  ctx.arc(cx - 15, cy - 78, 9, 0, Math.PI * 2);
  ctx.arc(cx + 15, cy - 78, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy - 50, 18, 0, Math.PI);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy - 56, 11, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx - 24, cy - 32);
  ctx.lineTo(cx + 24, cy - 32);
  ctx.lineTo(cx, cy - 14);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx - 24, cy + 32);
  ctx.lineTo(cx + 24, cy + 32);
  ctx.lineTo(cx, cy + 14);
  ctx.closePath();
  ctx.fill();

  ctx.fillRect(cx - 28, cy - 10, 56, 6);
  ctx.fillRect(cx - 28, cy + 4, 56, 6);

  ctx.beginPath();
  ctx.arc(cx, cy - 1, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillRect(cx - 36, cy - 36, 6, 76);
  ctx.fillRect(cx + 30, cy - 36, 6, 76);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural Rocket Booster Decal with Mongolian Flag & QUASAR Stencil
 */
export function createRocketDecalTexture(): THREE.CanvasTexture {
  const width = 512;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);

  const flagW = 240;
  const flagH = 120;
  const fx = (width - flagW) / 2;
  const fy = 60;

  ctx.fillStyle = '#da291c';
  ctx.fillRect(fx, fy, flagW / 3, flagH);
  ctx.fillStyle = '#0055b8';
  ctx.fillRect(fx + flagW / 3, fy, flagW / 3, flagH);
  ctx.fillStyle = '#da291c';
  ctx.fillRect(fx + (flagW / 3) * 2, fy, flagW / 3, flagH);

  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.arc(fx + flagW / 6, fy + flagH / 2, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 36px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('QUASAR', width / 2, 230);

  ctx.font = 'bold 20px "JetBrains Mono", monospace';
  ctx.fillStyle = '#0284c7';
  ctx.fillText('MONGOLIA', width / 2, 260);

  ctx.font = '14px "JetBrains Mono", monospace';
  ctx.fillStyle = '#64748b';
  ctx.fillText('ORBITAL GUARDIAN // CH-13', width / 2, 290);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
