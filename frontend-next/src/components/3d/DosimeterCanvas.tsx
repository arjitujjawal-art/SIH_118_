"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createDosimeterAssembly, ExplodedLayers } from "./Dosimeter3DModel";

interface DosimeterCanvasProps {
  scrollProgress: number; // 0.0 to 1.0
  activeLayerName?: string | null;
  onLayerHover?: (layerName: string | null) => void;
  className?: string;
}

export default function DosimeterCanvas({
  scrollProgress,
  activeLayerName,
  onLayerHover,
  className = "",
}: DosimeterCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const assemblyRef = useRef<ExplodedLayers | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const reqIdRef = useRef<number | null>(null);

  // Initialize Three.js Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene & Background
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera Setup (FOV 38 deg matching flat 2D photograph)
    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0, 11.5);
    cameraRef.current = camera;

    // 3. WebGL Renderer with High-DPI clamp
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting Rig
    // Key Light (Warm Sunlight)
    const keyLight = new THREE.DirectionalLight(0xFFFBF0, 2.2);
    keyLight.position.set(6, 8, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);

    // Fill Light (Cool Teal Ambient Fill)
    const fillLight = new THREE.DirectionalLight(0xCCE7E8, 1.3);
    fillLight.position.set(-8, -3, 6);
    scene.add(fillLight);

    // Rim Light (Golden Backlight for sharp bevels)
    const rimLight = new THREE.DirectionalLight(0xF5A623, 1.8);
    rimLight.position.set(0, -6, -6);
    scene.add(rimLight);

    // Soft Ambient
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.75);
    scene.add(ambientLight);

    // Spot highlight on chemical sensor window
    const spotLight = new THREE.PointLight(0xFFFFFF, 2.5, 10);
    spotLight.position.set(1.5, 1.0, 3.5);
    scene.add(spotLight);

    // 5. Create Procedural Assembly
    const assembly = createDosimeterAssembly();
    scene.add(assembly.group);
    assemblyRef.current = assembly;

    // 6. Mouse Parallax Listeners
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseRef.current.targetX = x * 0.4;
      mouseRef.current.targetY = y * 0.4;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // 7. Resize Observer
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObs = new ResizeObserver(handleResize);
    resizeObs.observe(container);

    // 8. Animation Loop
    const clock = new THREE.Clock();
    const animate = () => {
      reqIdRef.current = requestAnimationFrame(animate);

      // Smooth mouse lerp
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      const delta = clock.getDelta();
      // Subtle float when exploded
      if (assemblyRef.current) {
        assemblyRef.current.group.position.y = Math.sin(clock.getElapsedTime() * 1.5) * 0.06;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 9. Cleanup on Unmount
    return () => {
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
      window.removeEventListener("mousemove", handleMouseMove);
      resizeObs.disconnect();
      if (assemblyRef.current) assemblyRef.current.dispose();
      if (rendererRef.current && rendererRef.current.domElement) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Update exploded layers, camera perspective & rotation based on scroll progress
  useEffect(() => {
    const assembly = assemblyRef.current;
    const camera = cameraRef.current;
    if (!assembly || !camera) return;

    // Stage 1 (0% – 15%): Assembled state & tilt from flat 2D (0, 0, 0) to 3D isometric
    // Stage 2 (15% – 45%): Front disassembly (Glass & Faceplate forward)
    // Stage 3 (45% – 75%): Heart of Sensing & Chassis explosion
    // Stage 4 (75% – 100%): Macro Focus & Component Orbit

    const p = Math.max(0, Math.min(1, scrollProgress));
    assembly.updatePositions(p);

    // Dynamic 3D Model Rotation
    if (p < 0.12) {
      // Smooth handoff from flat 2D to 3D isometric tilt
      const tiltFactor = p / 0.12;
      assembly.group.rotation.x = tiltFactor * 0.38 + mouseRef.current.y * 0.15;
      assembly.group.rotation.y = -tiltFactor * 0.46 + mouseRef.current.x * 0.15;
      assembly.group.rotation.z = tiltFactor * 0.08;
      camera.position.z = 11.5 - tiltFactor * 0.5;
    } else if (p < 0.75) {
      // Exploded View Angle
      const expFactor = (p - 0.12) / 0.63;
      assembly.group.rotation.x = 0.38 + Math.sin(expFactor * Math.PI) * 0.12 + mouseRef.current.y * 0.2;
      assembly.group.rotation.y = -0.46 - expFactor * 0.35 + mouseRef.current.x * 0.2;
      assembly.group.rotation.z = 0.08 + expFactor * 0.05;
      camera.position.z = 11.0 + expFactor * 1.8;
      camera.position.x = expFactor * 0.6;
    } else {
      // Stage 4: Macro Close-up on Sensor Core
      const macroP = (p - 0.75) / 0.25;
      assembly.group.rotation.x = 0.42 - macroP * 0.15 + mouseRef.current.y * 0.25;
      assembly.group.rotation.y = -0.81 + macroP * 0.45 + mouseRef.current.x * 0.25;
      assembly.group.rotation.z = 0.13;
      camera.position.z = 12.8 - macroP * 4.8; // Camera dollies inward for macro inspection
      camera.position.x = 0.6 - macroP * 0.8;
      camera.position.y = macroP * 0.4;
    }
  }, [scrollProgress]);

  // Highlight active layer when user interacts with dashboard controls
  useEffect(() => {
    const assembly = assemblyRef.current;
    if (!assembly) return;

    const layers = [
      { name: "shield", mesh: assembly.topGlass },
      { name: "faceplate", mesh: assembly.faceplate },
      { name: "reactive", mesh: assembly.reactiveStrip },
      { name: "expiry", mesh: assembly.expiryPatch },
      { name: "comparator", mesh: assembly.comparatorPads },
      { name: "membrane", mesh: assembly.diffusionMembrane },
      { name: "chassis", mesh: assembly.mainChassis },
      { name: "silicone", mesh: assembly.siliconeBase },
    ];

    layers.forEach((l) => {
      const isTarget = activeLayerName && l.name === activeLayerName;
      if (l.mesh instanceof THREE.Mesh && l.mesh.material) {
        const mat = l.mesh.material as THREE.MeshStandardMaterial;
        if (isTarget) {
          mat.emissive = new THREE.Color(0xF5A623);
          mat.emissiveIntensity = 0.45;
        } else {
          mat.emissive = new THREE.Color(0x000000);
          mat.emissiveIntensity = 0.0;
        }
      }
    });
  }, [activeLayerName]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative ${className}`}
      style={{ touchAction: "none" }}
    />
  );
}
