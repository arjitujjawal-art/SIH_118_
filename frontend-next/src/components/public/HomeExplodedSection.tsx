"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import DosimeterCanvas from "@/components/3d/DosimeterCanvas";
import {
  Watch,
  Smartphone,
  FileBarChart2,
  Sparkles,
  Layers,
  ChevronRight,
  RotateCcw,
  Activity,
  QrCode,
  ShieldCheck,
  FlaskConical,
  Eye,
  Sliders,
  CheckCircle2,
  Maximize2
} from "lucide-react";

export interface ComponentMilestone {
  id: string;
  stageName: string;
  layerTitle: string;
  layerTag: string;
  scrollRange: [number, number];
  depthMm: string;
  description: string;
  highlights: string[];
  specs: { label: string; value: string }[];
  pinPosition: { x: number; y: number };
}

const MILESTONES: ComponentMilestone[] = [
  {
    id: "assembled",
    stageName: "STAGE 01 · ASSEMBLED STATE",
    layerTitle: "STRELA Passive Dosimeter Device",
    layerTag: "Assembled Hardware",
    scrollRange: [0.0, 0.18],
    depthMm: "0.0 mm (Locked)",
    description: "Zero-power wearable colorimetric chemical dosimeter engineered with lead-free organic plant chemistry for refinery personnel safety monitoring.",
    highlights: [
      "100% passive zero-battery wearable wristband",
      "Integrated 5-component optical and chemical architecture",
      "Safe non-toxic organic formulation"
    ],
    specs: [
      { label: "Power", value: "0.00 W (Passive)" },
      { label: "Formulation", value: "Lead-Free Bio-Anthocyanin" },
      { label: "Wear Period", value: "7-Day Rotation" },
    ],
    pinPosition: { x: 50, y: 48 },
  },
  {
    id: "shield",
    stageName: "STAGE 02 · POROUS PROTECTIVE LAYER",
    layerTitle: "Layer 01: Porous Protective Layer",
    layerTag: "Porous Gas Shield",
    scrollRange: [0.18, 0.35],
    depthMm: "+4.8 mm (Forward)",
    description: "It's a porous layer which prevents the internal sensing layer from the temperature and humidity of the surroundings, and also lets the airborne H₂S gas pass through for the reaction to occur.",
    highlights: [
      "Prevents temperature and humidity interference from surroundings",
      "Porous structure allows H₂S gas through for reaction to occur",
      "Protects active chemistry from physical contamination"
    ],
    specs: [
      { label: "Function", value: "Temp & Humidity Barrier" },
      { label: "Gas Flow", value: "Porous H₂S Diffusion" },
      { label: "Protection", value: "Environmental Shield" },
    ],
    pinPosition: { x: 42, y: 36 },
  },
  {
    id: "faceplate",
    stageName: "STAGE 03 · EMPLOYEE QR CODE",
    layerTitle: "Layer 02: Employee QR Code Matrix",
    layerTag: "Employee Tracking",
    scrollRange: [0.35, 0.52],
    depthMm: "+3.6 mm (Forward)",
    description: "The QR code has the details of the employees, automatically connecting the physical wristband to the worker's shift records and digital exposure ledger upon scanning.",
    highlights: [
      "Contains the full profile details of the employee",
      "Instant optical capture at shift check-in and check-out",
      "Eliminates manual paper logs with automatic cloud tracking"
    ],
    specs: [
      { label: "Data Contents", value: "Employee Profile & ID" },
      { label: "Scan Method", value: "Smartphone Camera" },
      { label: "Ledger Sync", value: "Instant Cloud Tracking" },
    ],
    pinPosition: { x: 26, y: 36 },
  },
  {
    id: "expiry",
    stageName: "STAGE 04 · EXPIRY PATCH",
    layerTitle: "Layer 03: 7-Day Expiry Patch",
    layerTag: "Bio-Freshness Control",
    scrollRange: [0.52, 0.68],
    depthMm: "+2.4 mm (Forward)",
    description: "The expiry patch is made of purple cabbage extract which fades colour after a time period of 7 days, acting as a built-in freshness indicator to ensure active reliability.",
    highlights: [
      "Made of natural purple cabbage extract",
      "Fades colour after a time period of 7 days",
      "Ensures expired bands are automatically flagged and replaced"
    ],
    specs: [
      { label: "Composition", value: "Purple Cabbage Extract" },
      { label: "Time Window", value: "7-Day Color Fade" },
      { label: "Safety Goal", value: "Freshness Verification" },
    ],
    pinPosition: { x: 44, y: 36 },
  },
  {
    id: "reactive",
    stageName: "STAGE 05 · CHEMICAL SENSING STRIP",
    layerTitle: "Layer 04: Reactive Chemical Strip",
    layerTag: "Active H₂S Sensor",
    scrollRange: [0.68, 0.85],
    depthMm: "+1.2 mm (Center)",
    description: "The chemical strip is made of anthocyanin and SbCl₃ which shows an irreversible colour change when reacted with H₂S, permanently capturing exposure without any electronics.",
    highlights: [
      "Made of pure anthocyanin and SbCl₃ formulation",
      "Shows an irreversible colour change when reacted with H₂S",
      "Zero-power chemical accumulation of airborne gas"
    ],
    specs: [
      { label: "Active Chemistry", value: "Anthocyanin + SbCl₃" },
      { label: "Color Response", value: "Irreversible Shift" },
      { label: "Target Gas", value: "Hydrogen Sulfide (H₂S)" },
    ],
    pinPosition: { x: 68, y: 36 },
  },
  {
    id: "comparator",
    stageName: "STAGE 06 · REFERENCE SCALE",
    layerTitle: "Layer 05: Multi-Step Reference Scale",
    layerTag: "Lighting Calibration",
    scrollRange: [0.85, 1.0],
    depthMm: "0.0 mm (Baseline)",
    description: "The reference scale is used to compare the colour change at bad lighting conditions so it will be easy for the model to compare the colour change made by H₂S and the reference scale to detect the appropriate exposure.",
    highlights: [
      "Used to compare colour change at bad lighting conditions",
      "Enables model to compare H₂S change against standard scale",
      "Detects the exact appropriate exposure under any lighting"
    ],
    specs: [
      { label: "Scale Standard", value: "0 to 120 Visual Swatches" },
      { label: "Lighting Role", value: "Low-Light Compensation" },
      { label: "AI Reading", value: "Appropriate Exposure LOD" },
    ],
    pinPosition: { x: 50, y: 64 },
  },
];

export default function HomeExplodedSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeLayer, setActiveLayer] = useState<string | null>(null);

  // Monitor native scroll position within the 450vh pinned track
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const totalScrollable = containerRef.current.clientHeight - windowHeight;

      if (totalScrollable <= 0) return;

      const currentScrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, currentScrolled / totalScrollable));
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial run

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Compute active milestone based on scroll progress
  const currentMilestone =
    MILESTONES.find(
      (m) => scrollProgress >= m.scrollRange[0] && scrollProgress <= m.scrollRange[1]
    ) || MILESTONES[0];

  // Animation Choreography:
  // 1. Initial State (0.0 to 0.12): Photo on left, text on right
  // 2. Center Animation (0.05 to 0.16): Photo glides to center
  // 3. 2D to 3D Handoff (0.10 to 0.18): 2D photo fades out smoothly as 3D Canvas activates
  const photoToCenterProgress = Math.max(0, Math.min(1, scrollProgress / 0.16));
  const initialHeaderOpacity = Math.max(0, 1 - scrollProgress / 0.14);
  const initialHeaderTransformY = scrollProgress * 80;

  // 2D image crossfade opacity
  const imageOpacity = Math.max(0, Math.min(1, 1 - (scrollProgress - 0.08) / 0.10));

  // Pinned Exploded Dashboard Opacity
  const explodedUiOpacity = Math.max(0, Math.min(1, (scrollProgress - 0.14) / 0.08));

  // Smooth scroll to specific progress
  const scrollToProgress = (targetProgress: number) => {
    if (!containerRef.current) return;
    const topPos =
      containerRef.current.offsetTop +
      targetProgress * (containerRef.current.clientHeight - window.innerHeight);
    window.scrollTo({ top: topPos, behavior: "smooth" });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[450vh] bg-warm-white border-b border-light-surface"
    >
      {/* Pinned Viewport Container (Sticky 100vh) */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between">
        
        {/* ======================================================== */}
        {/* 1. 3D WEBGL CANVAS (Active when user enters 3D phase)     */}
        {/* ======================================================== */}
        <div
          className="absolute inset-0 z-0 pointer-events-auto transition-opacity duration-700"
          style={{
            opacity: scrollProgress > 0.06 ? 1 : 0,
            pointerEvents: scrollProgress > 0.12 ? "auto" : "none",
          }}
        >
          <DosimeterCanvas
            scrollProgress={scrollProgress}
            activeLayerName={activeLayer}
            onLayerHover={(name) => setActiveLayer(name)}
          />
        </div>

        {/* ======================================================== */}
        {/* 2. INITIAL HERO VIEW (Left Photo + Right Header Text)    */}
        {/* ======================================================== */}
        {scrollProgress < 0.25 && (
          <div
            className="absolute inset-0 z-10 pointer-events-none flex items-center px-6 lg:px-16 max-w-7xl mx-auto w-full transition-opacity duration-300"
            style={{ opacity: initialHeaderOpacity }}
          >
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Column: Prototype 2D Photo */}
              <div
                className="lg:col-span-6 flex justify-center transition-transform duration-500 will-change-transform"
                style={{
                  transform: `translateX(${photoToCenterProgress * 45}%) scale(${
                    1 + photoToCenterProgress * 0.15
                  })`,
                }}
              >
                <div
                  className="relative w-full max-w-[520px] aspect-[2.4/1] rounded-2xl overflow-hidden shadow-2xl border border-light-surface bg-white p-2 group"
                  style={{ opacity: imageOpacity }}
                >
                  <img
                    src="/images/dosimeter_prototype_real.png"
                    alt="Physical STRELA Dosimeter Wristband Prototype"
                    className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-charcoal/85 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-mono font-bold text-yellow-golden flex items-center gap-1.5 shadow-md">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>AUTHENTIC PHYSICAL PROTOTYPE</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Section Header & 3-Step Pillars */}
              <div
                className="lg:col-span-6 space-y-6 text-left pointer-events-auto will-change-transform"
                style={{
                  transform: `translateY(${initialHeaderTransformY}px)`,
                }}
              >
                <div className="space-y-3">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-teal-deep bg-teal-light px-3 py-1 rounded-full border border-teal-deep/20">
                    INTEGRATED PLATFORM WORKFLOW
                  </span>
                  <h2 className="font-display text-5xl sm:text-6xl md:text-7xl uppercase tracking-tight text-charcoal leading-tightest">
                    ONE BAND. <br />
                    <span className="text-teal-deep">A CONNECTED RECORD.</span>
                  </h2>
                  <p className="text-base text-sage-muted leading-relaxed max-w-lg">
                    Bridging the gap between physical colourimetric response and compliant digital health intelligence across petroleum refining operations.
                  </p>
                </div>

                {/* 3 Interactive Quick Pillars */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="bg-white p-3.5 rounded-2xl border border-light-surface shadow-sm">
                    <div className="text-[10px] font-mono font-bold text-teal-deep mb-1">01 / WEAR</div>
                    <div className="text-xs font-bold text-charcoal">Passive Badge</div>
                  </div>
                  <div className="bg-white p-3.5 rounded-2xl border border-light-surface shadow-sm">
                    <div className="text-[10px] font-mono font-bold text-teal-deep mb-1">02 / READ</div>
                    <div className="text-xs font-bold text-charcoal">AI Optical Scan</div>
                  </div>
                  <div className="bg-white p-3.5 rounded-2xl border border-light-surface shadow-sm">
                    <div className="text-[10px] font-mono font-bold text-teal-deep mb-1">03 / REVIEW</div>
                    <div className="text-xs font-bold text-charcoal">Cloud Ledgers</div>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => scrollToProgress(0.35)}
                    className="px-5 py-3 rounded-full bg-charcoal text-white hover:bg-teal-deep font-bold text-xs flex items-center gap-2 transition-all shadow-md group"
                  >
                    <span>Explore 3D Exploded Teardown</span>
                    <ChevronRight className="w-4 h-4 text-yellow-golden group-hover:translate-x-1 transition-transform" />
                  </button>
                  <span className="text-xs font-mono text-sage-muted">Scroll down to disassemble ↓</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. LIGHT THEME 3D EXPLODED DASHBOARD OVERLAYS (0.14+)    */}
        {/* ======================================================== */}
        {scrollProgress > 0.12 && (
          <div
            className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-6 lg:p-12 transition-opacity duration-500"
            style={{ opacity: explodedUiOpacity }}
          >
            {/* Top Bar: Component Selector Pills */}
            <div className="flex flex-wrap items-center justify-between gap-4 max-w-7xl mx-auto w-full pointer-events-auto">
              <div className="flex items-center gap-3 bg-white/90 backdrop-blur-xl px-4 py-2 rounded-full border border-light-surface shadow-md">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono font-bold text-charcoal uppercase tracking-wider">
                  3D HARDWARE EXPLOSION
                </span>
                <span className="text-[10px] font-mono font-bold bg-teal-light text-teal-deep px-2 py-0.5 rounded-full border border-teal-deep/20">
                  PATENT PENDING
                </span>
              </div>

              {/* Layer Stepper Pills (Matching exact 5 layers) */}
              <div className="flex items-center gap-1 bg-white/90 backdrop-blur-xl p-1.5 rounded-full border border-light-surface shadow-md overflow-x-auto max-w-full">
                <button
                  onClick={() => scrollToProgress(0.0)}
                  className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
                    scrollProgress < 0.18
                      ? "bg-charcoal text-white shadow-sm"
                      : "text-sage-muted hover:text-charcoal"
                  }`}
                >
                  Assembled
                </button>
                <button
                  onClick={() => scrollToProgress(0.26)}
                  className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
                    scrollProgress >= 0.18 && scrollProgress < 0.35
                      ? "bg-charcoal text-white shadow-sm"
                      : "text-sage-muted hover:text-charcoal"
                  }`}
                >
                  01 Porous Layer
                </button>
                <button
                  onClick={() => scrollToProgress(0.43)}
                  className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
                    scrollProgress >= 0.35 && scrollProgress < 0.52
                      ? "bg-charcoal text-white shadow-sm"
                      : "text-sage-muted hover:text-charcoal"
                  }`}
                >
                  02 QR Code
                </button>
                <button
                  onClick={() => scrollToProgress(0.60)}
                  className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
                    scrollProgress >= 0.52 && scrollProgress < 0.68
                      ? "bg-charcoal text-white shadow-sm"
                      : "text-sage-muted hover:text-charcoal"
                  }`}
                >
                  03 Expiry Patch
                </button>
                <button
                  onClick={() => scrollToProgress(0.76)}
                  className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
                    scrollProgress >= 0.68 && scrollProgress < 0.85
                      ? "bg-charcoal text-white shadow-sm"
                      : "text-sage-muted hover:text-charcoal"
                  }`}
                >
                  04 Chemical Strip
                </button>
                <button
                  onClick={() => scrollToProgress(0.92)}
                  className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
                    scrollProgress >= 0.85
                      ? "bg-charcoal text-white shadow-sm"
                      : "text-sage-muted hover:text-charcoal"
                  }`}
                >
                  05 Reference Scale
                </button>
              </div>
            </div>

            {/* Middle Section: Floating Light-Themed Flash Card */}
            <div className="flex items-center justify-end max-w-7xl mx-auto w-full pointer-events-none my-auto">
              <div className="w-full max-w-md bg-white/95 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-light-surface shadow-2xl pointer-events-auto text-left transition-all duration-300 hover:shadow-3xl">
                {/* Stage Header */}
                <div className="flex items-center justify-between border-b border-light-surface pb-3 mb-4">
                  <span className="text-[10px] font-mono font-bold text-teal-deep uppercase tracking-wider bg-teal-light px-2.5 py-0.5 rounded-full">
                    {currentMilestone.stageName}
                  </span>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-warm-white text-charcoal border border-light-surface">
                    {currentMilestone.depthMm}
                  </span>
                </div>

                {/* Layer Title & Tag */}
                <div className="mb-3">
                  <span className="text-[11px] font-mono text-sage-muted uppercase font-semibold">
                    {currentMilestone.layerTag}
                  </span>
                  <h3 className="font-display text-2xl uppercase tracking-tight text-charcoal mt-0.5">
                    {currentMilestone.layerTitle}
                  </h3>
                </div>

                <p className="text-xs text-charcoal leading-relaxed mb-5 font-normal">
                  {currentMilestone.description}
                </p>

                {/* Key Highlights */}
                <div className="space-y-1.5 mb-5 bg-warm-white/90 p-4 rounded-2xl border border-light-surface">
                  <div className="text-[10px] font-mono text-teal-deep uppercase font-bold mb-1">
                    Key Attributes & Mechanism:
                  </div>
                  {currentMilestone.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-charcoal">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-deep mt-1.5 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-3 gap-2 border-t border-light-surface pt-4">
                  {currentMilestone.specs.map((s, i) => (
                    <div
                      key={i}
                      className="bg-warm-white p-2.5 rounded-xl border border-light-surface text-center"
                    >
                      <div className="text-[9px] font-mono text-sage-muted truncate">
                        {s.label}
                      </div>
                      <div className="text-xs font-bold text-charcoal font-mono mt-0.5 truncate">
                        {s.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Floating Controller HUD */}
            <div className="max-w-4xl mx-auto w-full pointer-events-auto">
              <div className="bg-white/95 backdrop-blur-2xl px-6 py-3.5 rounded-full border border-light-surface shadow-xl flex items-center justify-between gap-4">
                {/* Active Layer Tag */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-teal-light border border-teal-deep/20 flex items-center justify-center text-teal-deep">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-sage-muted font-bold uppercase">
                      ACTIVE COMPONENT
                    </div>
                    <div className="text-xs font-bold text-charcoal truncate max-w-[180px] sm:max-w-none">
                      {currentMilestone.layerTitle.split(":")[0]}
                    </div>
                  </div>
                </div>

                {/* Progress Scrub Bar */}
                <div className="hidden sm:flex flex-1 items-center gap-3 max-w-xs">
                  <span className="text-[10px] font-mono text-sage-muted font-bold">
                    EXPLOSION:
                  </span>
                  <div
                    className="flex-1 h-2 bg-warm-white rounded-full overflow-hidden border border-light-surface cursor-pointer relative"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const newProgress = Math.max(0, Math.min(1, clickX / rect.width));
                      scrollToProgress(newProgress);
                    }}
                  >
                    <div
                      className="h-full bg-teal-deep rounded-full transition-all duration-150"
                      style={{ width: `${scrollProgress * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-charcoal">
                    {Math.round(scrollProgress * 100)}%
                  </span>
                </div>

                {/* Reset View Button */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => scrollToProgress(0)}
                    className="p-2 rounded-full bg-warm-white hover:bg-light-surface border border-light-surface text-sage-muted hover:text-charcoal transition-colors"
                    title="Reset to Assembled View"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <Link
                    href="/working?tab=chemistry"
                    className="px-3.5 py-1.5 rounded-full bg-teal-light hover:bg-teal-hover hover:text-white border border-teal-deep/20 text-xs font-mono font-bold text-teal-deep transition-colors flex items-center gap-1.5"
                  >
                    <span>Lab MOP</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
