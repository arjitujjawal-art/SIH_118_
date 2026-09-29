import * as THREE from "three";

export interface ExplodedLayers {
  group: THREE.Group;
  topGlass: THREE.Mesh;
  faceplate: THREE.Mesh;
  reactiveStrip: THREE.Mesh;
  expiryPatch: THREE.Mesh;
  comparatorPads: THREE.Group;
  diffusionMembrane: THREE.Mesh;
  mainChassis: THREE.Mesh;
  siliconeBase: THREE.Mesh;
  strapLeft: THREE.Mesh;
  strapRight: THREE.Mesh;
  updatePositions: (progress: number) => void;
  dispose: () => void;
}

/**
 * Generates dynamic high-resolution canvas textures matching the real STRELA physical dosimeter prototype
 */
function createFaceplateTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    // 1. Base White Faceplate
    ctx.fillStyle = "#F8F9FA";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle brushed noise
    ctx.fillStyle = "rgba(0,0,0,0.015)";
    for (let i = 0; i < 50000; i++) {
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
    }

    // 2. Stitched Perimeter Border
    ctx.strokeStyle = "#8A9494";
    ctx.lineWidth = 6;
    ctx.setLineDash([14, 10]);
    ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);
    ctx.setLineDash([]); // Reset dash

    // Outer solid thin contour
    ctx.strokeStyle = "#D1D5DB";
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);

    // 3. QR Code Graphic (Left Box)
    const qrX = 120, qrY = 100, qrSize = 340;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(qrX, qrY, qrSize, qrSize);
    ctx.strokeStyle = "#1A1A1A";
    ctx.lineWidth = 6;
    ctx.strokeRect(qrX, qrY, qrSize, qrSize);

    // Draw realistic QR pattern
    ctx.fillStyle = "#111827";
    // QR position markers (Top-Left, Top-Right, Bottom-Left)
    const drawMarker = (mx: number, my: number) => {
      ctx.fillRect(mx, my, 70, 70);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(mx + 12, my + 12, 46, 46);
      ctx.fillStyle = "#111827";
      ctx.fillRect(mx + 22, my + 22, 26, 26);
    };
    drawMarker(qrX + 16, qrY + 16);
    drawMarker(qrX + qrSize - 86, qrY + 16);
    drawMarker(qrX + 16, qrY + qrSize - 86);

    // Simulated QR modules
    for (let r = 0; r < 14; r++) {
      for (let c = 0; c < 14; c++) {
        if ((r < 4 && c < 4) || (r < 4 && c > 9) || (r > 9 && c < 4)) continue;
        if ((r * 7 + c * 13 + (r % 3)) % 2 === 0) {
          ctx.fillRect(qrX + 30 + c * 20, qrY + 30 + r * 20, 16, 16);
        }
      }
    }

    // QR Label
    ctx.fillStyle = "#111827";
    ctx.font = "bold 32px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("QR CODE", qrX + qrSize / 2, qrY + qrSize + 55);

    // 4. Expiry Patch Outline & Label (Center-Top)
    const expX = 560, expY = 110, expW = 200, expH = 200;
    ctx.fillStyle = "#ECEFF1";
    ctx.fillRect(expX, expY, expW, expH);
    ctx.strokeStyle = "#263238";
    ctx.lineWidth = 5;
    ctx.strokeRect(expX, expY, expW, expH);

    ctx.font = "bold 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("EXPIRY", expX + expW / 2, expY + expH + 45);
    ctx.fillText("PATCH", expX + expW / 2, expY + expH + 75);

    // 5. Reactive Strip Window Outline & Label (Top-Right)
    const stripX = 860, stripY = 110, stripW = 1060, stripH = 200;
    ctx.fillStyle = "#791B6B"; // Deep anthocyanin reactive color
    ctx.fillRect(stripX, stripY, stripW, stripH);
    ctx.strokeStyle = "#1A1A1A";
    ctx.lineWidth = 6;
    ctx.strokeRect(stripX, stripY, stripW, stripH);

    ctx.font = "bold 32px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("REACTIVE STRIP", stripX + stripW / 2, stripY + stripH + 60);

    // 6. Reference Scale Section (Bottom)
    const scaleY = 560;
    ctx.strokeStyle = "#9CA3AF";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(120, scaleY);
    ctx.lineTo(700, scaleY);
    ctx.moveTo(1340, scaleY);
    ctx.lineTo(1920, scaleY);
    ctx.stroke();

    ctx.fillStyle = "#111827";
    ctx.font = "bold 34px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("REFERENCE SCALE", 1024, scaleY + 12);

    // 6 Colorimetric Benchmark Pads
    const colors = [
      { ppm: "0", hex: "#5C1D58" },   // Deep purple
      { ppm: "10", hex: "#874B80" },  // Purple-pink
      { ppm: "30", hex: "#B0659B" },  // Medium pink
      { ppm: "60", hex: "#D889AA" },  // Light pink
      { ppm: "90", hex: "#E8B2AD" },  // Pale salmon
      { ppm: "120", hex: "#ECCB68" }, // Yellow / high exposure
    ];

    const padW = 180, padH = 180, padGap = 100;
    const startPadX = 260;
    const padY = 640;

    colors.forEach((c, idx) => {
      const px = startPadX + idx * (padW + padGap);
      ctx.fillStyle = c.hex;
      ctx.fillRect(px, padY, padW, padH);
      ctx.strokeStyle = "rgba(0,0,0,0.15)";
      ctx.lineWidth = 2;
      ctx.strokeRect(px, padY, padW, padH);

      ctx.fillStyle = "#111827";
      ctx.font = "bold 32px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText(c.ppm, px + padW / 2, padY + padH + 50);
    });
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates woven fabric texture for the elastic wristband straps
 */
function createStrapBumpTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = "#A0A0A0";
    for (let y = 0; y < 512; y += 8) {
      for (let x = 0; x < 512; x += 8) {
        if ((x + y) % 16 === 0) {
          ctx.fillRect(x, y, 4, 8);
        } else {
          ctx.fillRect(x + 4, y, 4, 8);
        }
      }
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 4);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Builds the complete 3D procedural exploded-view mesh hierarchy
 */
export function createDosimeterAssembly(): ExplodedLayers {
  const group = new THREE.Group();
  const faceplateTexture = createFaceplateTexture();
  const strapBump = createStrapBumpTexture();

  // Common dimensions (aspect ratio ~2.4:1 matching 120mm x 50mm x 4mm physical band)
  const width = 6.4;
  const height = 2.8;
  const cornerRadius = 0.35;
  const depth = 0.18;

  // Helper to create rounded rectangle shape
  const createRoundedRectShape = (w: number, h: number, r: number) => {
    const shape = new THREE.Shape();
    const x = -w / 2;
    const y = -h / 2;
    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + h - r);
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    shape.lineTo(x + r, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);
    return shape;
  };

  const bodyShape = createRoundedRectShape(width, height, cornerRadius);
  const extrudeSettings = { depth, bevelEnabled: true, bevelSegments: 4, steps: 1, bevelSize: 0.04, bevelThickness: 0.04 };

  // ==========================================
  // Layer 1: Top Anti-UV Optical Protective Shield (Polycarbonate Crystal)
  // ==========================================
  const glassGeo = new THREE.ExtrudeGeometry(bodyShape, { depth: 0.04, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xF0FAFF),
    transparent: true,
    opacity: 0.45,
    transmission: 0.94,
    roughness: 0.05,
    metalness: 0.02,
    ior: 1.58,
    thickness: 0.6,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    reflectivity: 0.9,
  });
  const topGlass = new THREE.Mesh(glassGeo, glassMat);
  topGlass.name = "Layer_01_OpticalShield";
  topGlass.castShadow = true;
  group.add(topGlass);

  // ==========================================
  // Layer 2: Calibrated Graphic Faceplate
  // ==========================================
  const faceplateGeo = new THREE.PlaneGeometry(width - 0.1, height - 0.1, 32, 32);
  const faceplateMat = new THREE.MeshStandardMaterial({
    map: faceplateTexture,
    roughness: 0.35,
    metalness: 0.05,
  });
  const faceplate = new THREE.Mesh(faceplateGeo, faceplateMat);
  faceplate.name = "Layer_02_Faceplate";
  faceplate.receiveShadow = true;
  group.add(faceplate);

  // ==========================================
  // Layer 3: Reactive Sensing Core (SbCl3 / Anthocyanin Patch & Comparator)
  // ==========================================
  const reactiveGeo = new THREE.BoxGeometry(3.1, 0.65, 0.06);
  const reactiveMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x7A1A6C), // Deep reacted magenta-purple
    roughness: 0.55,
    metalness: 0.1,
  });
  const reactiveStrip = new THREE.Mesh(reactiveGeo, reactiveMat);
  reactiveStrip.position.set(1.2, 0.62, 0.0);
  reactiveStrip.name = "Layer_03_ReactiveStrip";
  group.add(reactiveStrip);

  // Expiry Control Reference Blank
  const expGeo = new THREE.BoxGeometry(0.7, 0.65, 0.06);
  const expMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xF4F6F7),
    roughness: 0.8,
  });
  const expiryPatch = new THREE.Mesh(expGeo, expMat);
  expiryPatch.position.set(-0.72, 0.62, 0.0);
  expiryPatch.name = "Layer_03_ExpiryPatch";
  group.add(expiryPatch);

  // Comparator Reference Standard (6 stepped pads)
  const comparatorPads = new THREE.Group();
  comparatorPads.name = "Layer_03_ComparatorPads";
  const compColors = [0x5C1D58, 0x874B80, 0xB0659B, 0xD889AA, 0xE8B2AD, 0xECCB68];
  compColors.forEach((hex, i) => {
    const padMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.55, 0.04),
      new THREE.MeshStandardMaterial({ color: hex, roughness: 0.6 })
    );
    padMesh.position.set(-2.0 + i * 0.8, -0.65, 0);
    comparatorPads.add(padMesh);
  });
  group.add(comparatorPads);

  // ==========================================
  // Layer 4: Gas-Permeable Microporous PTFE Diffusion Membrane
  // ==========================================
  const membraneGeo = new THREE.PlaneGeometry(width - 0.3, height - 0.3);
  const membraneMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xE2E8F0),
    transparent: true,
    opacity: 0.88,
    roughness: 0.9,
  });
  const diffusionMembrane = new THREE.Mesh(membraneGeo, membraneMat);
  diffusionMembrane.name = "Layer_04_PTFEMembrane";
  group.add(diffusionMembrane);

  // ==========================================
  // Layer 5: Main Structural TPU Housing / Chassis
  // ==========================================
  const chassisGeo = new THREE.ExtrudeGeometry(bodyShape, extrudeSettings);
  const chassisMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x181C1B), // Dark matte charcoal
    roughness: 0.65,
    metalness: 0.25,
  });
  const mainChassis = new THREE.Mesh(chassisGeo, chassisMat);
  mainChassis.name = "Layer_05_TPUChassis";
  mainChassis.castShadow = true;
  mainChassis.receiveShadow = true;
  group.add(mainChassis);

  // ==========================================
  // Layer 6: Hypoallergenic Medical Silicone Rear Base
  // ==========================================
  const baseGeo = new THREE.ExtrudeGeometry(createRoundedRectShape(width - 0.2, height - 0.2, 0.3), { depth: 0.08, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 });
  const baseMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x28302E),
    roughness: 0.85,
    metalness: 0.1,
  });
  const siliconeBase = new THREE.Mesh(baseGeo, baseMat);
  siliconeBase.name = "Layer_06_SiliconeBase";
  group.add(siliconeBase);

  // ==========================================
  // Layer 7: High-Tensile Elastic Woven Wrist Strap
  // ==========================================
  const strapShape = createRoundedRectShape(2.2, height - 0.25, 0.15);
  const strapGeo = new THREE.ExtrudeGeometry(strapShape, { depth: 0.08, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 });
  const strapMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x121414),
    bumpMap: strapBump,
    bumpScale: 0.04,
    roughness: 0.95,
  });

  const strapLeft = new THREE.Mesh(strapGeo, strapMat);
  strapLeft.position.set(-width / 2 - 0.95, 0, -0.05);
  strapLeft.name = "Layer_07_StrapLeft";
  group.add(strapLeft);

  const strapRight = new THREE.Mesh(strapGeo, strapMat);
  strapRight.position.set(width / 2 + 0.95, 0, -0.05);
  strapRight.name = "Layer_07_StrapRight";
  group.add(strapRight);

  // Center all geometries so pivots coincide at (0, 0, 0)
  topGlass.geometry.center();
  faceplate.geometry.center();
  diffusionMembrane.geometry.center();
  mainChassis.geometry.center();
  siliconeBase.geometry.center();

  // Set initial assembled positions (progress = 0)
  const updatePositions = (progress: number) => {
    // Stage 1 (0.0 to 0.15): Assembled state & tilt
    // Stage 2 (0.15 to 0.45): Front optical & faceplate disassembly (z: +1.5 to +4.8)
    // Stage 3 (0.45 to 0.75): Core diffusion & rear chassis explosion (z: -0.8 to -4.5)
    // Stage 4 (0.75 to 1.0): Macro inspection focus

    const expP = Math.max(0, Math.min(1, (progress - 0.15) / 0.65)); // Explosion interpolation factor

    // Forward exploded components (+Z)
    topGlass.position.z = 0.22 + expP * 4.6;
    faceplate.position.z = 0.16 + expP * 3.2;
    reactiveStrip.position.z = 0.12 + expP * 2.1;
    expiryPatch.position.z = 0.12 + expP * 2.1;
    comparatorPads.position.z = 0.12 + expP * 2.1;
    diffusionMembrane.position.z = 0.06 + expP * 1.1;

    // Central chassis holds reference baseline
    mainChassis.position.z = 0.0;

    // Backward exploded components (-Z)
    siliconeBase.position.z = -0.12 - expP * 2.4;
    strapLeft.position.z = -0.05 - expP * 3.8;
    strapRight.position.z = -0.05 - expP * 3.8;

    // Lateral displacement for dramatic presentation
    strapLeft.position.x = -width / 2 - 0.95 - expP * 1.2;
    strapRight.position.x = width / 2 + 0.95 + expP * 1.2;
  };

  updatePositions(0);

  const dispose = () => {
    faceplateTexture.dispose();
    strapBump.dispose();
    glassGeo.dispose();
    glassMat.dispose();
    faceplateGeo.dispose();
    faceplateMat.dispose();
    reactiveGeo.dispose();
    reactiveMat.dispose();
    expGeo.dispose();
    expMat.dispose();
    membraneGeo.dispose();
    membraneMat.dispose();
    chassisGeo.dispose();
    chassisMat.dispose();
    baseGeo.dispose();
    baseMat.dispose();
    strapGeo.dispose();
    strapMat.dispose();
  };

  return {
    group,
    topGlass,
    faceplate,
    reactiveStrip,
    expiryPatch,
    comparatorPads,
    diffusionMembrane,
    mainChassis,
    siliconeBase,
    strapLeft,
    strapRight,
    updatePositions,
    dispose,
  };
}
