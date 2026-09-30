"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Lenis from "lenis";
import DosimeterCanvas from "./DosimeterCanvas";
import { 
  Shield, 
  Layers, 
  Eye, 
  Sliders, 
  RotateCcw, 
  Download, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  QrCode,
  Activity,
  ArrowRight,
  Info,
  Maximize2
} from "lucide-react";

interface ComponentMilestone {
  id: string;
  stageName: string;
  layerTitle: string;
  layerTag: string;
  scrollRange: [number, number];
  depthMm: string;
  description: string;
  highlights: string[];
  specs: { label: string; value: string }[];
  pinPosition: { x: number; y: number }; // Percentage on screen
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

export default function ScrollyDashboard() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeLayer, setActiveLayer] = useState<string | null>(null);
  const [manualScrub, setManualScrub] = useState(false);
  const scrollTrackRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  // Initialize Lenis Smooth Inertial Scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.9,
    });
    lenisRef.current = lenis;

    const onScroll = () => {
      if (scrollTrackRef.current) {
        const rect = scrollTrackRef.current.getBoundingClientRect();
        const totalHeight = scrollTrackRef.current.clientHeight - window.innerHeight;
        const currentScroll = -rect.top;
        const progress = Math.max(0, Math.min(1, currentScroll / Math.max(1, totalHeight)));
        setScrollProgress(progress);
      }
    };

    lenis.on("scroll", onScroll);

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // Determine active milestone based on scroll progress
  const currentMilestone = MILESTONES.find(
    (m) => scrollProgress >= m.scrollRange[0] && scrollProgress <= m.scrollRange[1]
  ) || MILESTONES[0];

  // Zero-jitter 2D image crossfade opacity (1.0 at 0% scroll -> 0.0 at 8% scroll)
  const imageOpacity = Math.max(0, 1 - scrollProgress / 0.08);

  // Jump to specific milestone
  const scrollToStage = (targetProgress: number) => {
    if (lenisRef.current && scrollTrackRef.current) {
      const totalHeight = scrollTrackRef.current.clientHeight - window.innerHeight;
      lenisRef.current.scrollTo(targetProgress * totalHeight, { duration: 1.5 });
    }
  };

  return (
    <div className="relative w-full bg-[#0E1111] text-white selection:bg-yellow-golden selection:text-charcoal font-sans">
      
      {/* ======================================================== */}
      {/* 1. FIXED BACKGROUND 3D WEBGL CANVAS                     */}
      {/* ======================================================== */}
      <div className="fixed inset-0 z-0 pointer-events-auto">
        <DosimeterCanvas
          scrollProgress={scrollProgress}
          activeLayerName={activeLayer}
          onLayerHover={(name) => setActiveLayer(name)}
        />
      </div>

      {/* ======================================================== */}
      {/* 2. ZERO-JITTER 2D IMAGE CROSSFADE OVERLAY (0% -> 8%)     */}
      {/* ======================================================== */}
      <div
        className="fixed inset-0 z-10 pointer-events-none flex items-center justify-center transition-opacity duration-300"
        style={{ opacity: imageOpacity }}
      >
        <div className="w-[85vw] max-w-[760px] aspect-[2.4/1] relative">
          <img
            src="/images/dosimeter_prototype_real.png"
            alt="Physical STRELA Dosimeter Wristband Prototype"
            className="w-full h-full object-contain filter drop-shadow-[0_25px_35px_rgba(0,0,0,0.6)]"
          />
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-[11px] font-mono text-yellow-golden flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>AUTHENTIC PHYSICAL HARDWARE PROTOTYPE</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. LUXURY TOP NAVIGATION BAR                             */}
      {/* ======================================================== */}
      <header className="fixed top-0 left-0 right-0 h-20 z-40 px-6 lg:px-12 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent backdrop-blur-xs">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-mono text-sage hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10"
          >
            <ChevronLeft className="w-4 h-4 text-yellow-golden" />
            <span>Exit 3D Lab</span>
          </Link>
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-white/10">
            <span className="font-display tracking-wider text-sm font-bold text-white uppercase">STRELA · 3D EXPLODED ARCHITECTURE</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-deep text-white">PATENT PENDING</span>
          </div>
        </div>

        {/* Quick Stepper Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => scrollToStage(0.0)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all border ${
              scrollProgress < 0.18
                ? "bg-yellow-golden text-charcoal font-bold border-yellow-golden shadow-md"
                : "bg-white/5 text-sage hover:text-white border-white/10"
            }`}
          >
            Assembled
          </button>
          <button
            onClick={() => scrollToStage(0.55)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all border ${
              scrollProgress >= 0.18 && scrollProgress < 0.8
                ? "bg-yellow-golden text-charcoal font-bold border-yellow-golden shadow-md"
                : "bg-white/5 text-sage hover:text-white border-white/10"
            }`}
          >
            Exploded (5 Layers)
          </button>
          <button
            onClick={() => scrollToStage(0.95)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all border ${
              scrollProgress >= 0.8
                ? "bg-yellow-golden text-charcoal font-bold border-yellow-golden shadow-md"
                : "bg-white/5 text-sage hover:text-white border-white/10"
            }`}
          >
            Macro Sensing
          </button>

          <Link
            href="/manager/scan"
            className="hidden md:inline-flex items-center gap-1.5 bg-yellow-golden text-charcoal hover:bg-yellow-hover font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md ml-2"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Launch Scanner</span>
          </Link>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 4. PINNED 3D CALLOUT ANCHOR PINS                         */}
      {/* ======================================================== */}
      {scrollProgress > 0.15 && (
        <div className="fixed inset-0 z-20 pointer-events-none">
          {/* Reactive Strip Pin */}
          <div
            className="absolute transition-all duration-700 pointer-events-auto group cursor-pointer"
            style={{
              top: `${currentMilestone.pinPosition.y}%`,
              left: `${currentMilestone.pinPosition.x}%`,
            }}
            onMouseEnter={() => setActiveLayer(currentMilestone.id)}
            onMouseLeave={() => setActiveLayer(null)}
            onClick={() => setActiveLayer(activeLayer === currentMilestone.id ? null : currentMilestone.id)}
          >
            <div className="relative -translate-x-1/2 -translate-y-1/2 flex items-center gap-3">
              <div className="relative w-7 h-7 flex items-center justify-center">
                <span className="w-full h-full rounded-full bg-yellow-golden/40 animate-ping absolute" />
                <span className="w-3.5 h-3.5 rounded-full bg-yellow-golden shadow-lg border-2 border-charcoal relative z-10" />
              </div>
              <div className="bg-neutral-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-yellow-golden/40 shadow-xl text-left pointer-events-none group-hover:scale-105 transition-transform">
                <div className="text-[9px] font-mono text-yellow-golden font-bold uppercase tracking-wider">ACTIVE LAYER</div>
                <div className="text-xs font-bold text-white whitespace-nowrap">{currentMilestone.layerTag}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. 500vh SCROLL TRACK WITH FLOATING GLASSMORPHIC CARDS   */}
      {/* ======================================================== */}
      <div ref={scrollTrackRef} className="relative z-30 h-[500vh] pointer-events-none">
        
        {/* Hero Landing Card (0% - 15%) */}
        <section className="h-screen sticky top-0 flex items-center justify-between px-6 lg:px-16 pointer-events-none">
          <div className="max-w-md bg-neutral-950/75 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl pointer-events-auto transition-all duration-500 hover:border-yellow-golden/40">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-yellow-golden text-[10px] font-mono font-bold mb-4 uppercase">
              <Sparkles className="w-3.5 h-3.5 text-yellow-golden" />
              Interactive 3D Hardware Teardown
            </div>
            <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-tight text-white leading-tight mb-4">
              EXPLODING THE <br />
              <span className="text-yellow-golden">STRELA DOSIMETER</span>
            </h1>
            <p className="text-sm text-sage leading-relaxed mb-6 font-normal">
              Scroll down to peel apart the zero-power optical dosimeter layer by layer. Witness the lead-free anthocyanin sensing chemistry and precision calibration matrix.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => scrollToStage(0.35)}
                className="px-5 py-3 rounded-2xl bg-yellow-golden text-charcoal hover:bg-yellow-hover font-bold text-xs flex items-center gap-2 transition-all shadow-md group"
              >
                <span>Begin Disassembly</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <span className="text-[11px] font-mono text-sage-muted">Scroll or Drag ↓</span>
            </div>
          </div>

          {/* Right Live Specs Pill */}
          <div className="hidden xl:block bg-neutral-950/70 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl pointer-events-auto max-w-xs text-left">
            <div className="text-[10px] font-mono text-teal-light uppercase font-bold mb-2 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-teal-light" />
              Device Specification
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-sage-muted">Chemical Formulation</div>
                <div className="text-sm font-bold text-white">SbCl₃ + Natural Anthocyanin</div>
              </div>
              <div>
                <div className="text-xs text-sage-muted">Power Consumption</div>
                <div className="text-sm font-bold text-emerald-400">0.00 Watts (100% Passive)</div>
              </div>
              <div>
                <div className="text-xs text-sage-muted">Hazard Calibration</div>
                <div className="text-sm font-bold text-yellow-golden">0.0 to 5.0 Continuous Risk Score</div>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Milestones (15% - 100%) */}
        {MILESTONES.slice(1).map((m, idx) => {
          const isVisible = scrollProgress >= m.scrollRange[0] && scrollProgress <= m.scrollRange[1];
          return (
            <section
              key={m.id}
              className={`h-screen sticky top-0 flex items-center justify-end px-6 lg:px-16 pointer-events-none transition-opacity duration-500 ${
                isVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="max-w-lg bg-neutral-950/80 backdrop-blur-2xl p-8 rounded-3xl border border-white/15 shadow-2xl pointer-events-auto hover:border-yellow-golden/50 transition-all text-left">
                {/* Stage Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                  <span className="text-[10px] font-mono font-bold text-yellow-golden uppercase tracking-wider">
                    {m.stageName}
                  </span>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/10">
                    {m.depthMm}
                  </span>
                </div>

                {/* Layer Title & Tag */}
                <div className="mb-4">
                  <span className="text-xs font-mono text-teal-light uppercase font-semibold">{m.layerTag}</span>
                  <h2 className="font-display text-2xl sm:text-3xl uppercase tracking-tight text-white mt-0.5">
                    {m.layerTitle}
                  </h2>
                </div>

                <p className="text-xs text-sage leading-relaxed mb-6 font-normal">
                  {m.description}
                </p>

                {/* Key Highlights Bullet points */}
                <div className="space-y-2 mb-6 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div className="text-[10px] font-mono text-sage-muted uppercase font-bold mb-1">Key Engineering Attributes:</div>
                  {m.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-white">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-golden mt-1.5 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>

                {/* Technical Specs Grid */}
                <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
                  {m.specs.map((s, i) => (
                    <div key={i} className="bg-black/40 p-2.5 rounded-xl border border-white/5 text-center">
                      <div className="text-[9px] font-mono text-sage-muted truncate">{s.label}</div>
                      <div className="text-xs font-bold text-white font-mono mt-0.5 truncate">{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 6. LUXURY STICKY BOTTOM HUD CONTROLLER                   */}
      {/* ======================================================== */}
      <footer className="fixed bottom-6 left-6 right-6 z-40 pointer-events-auto">
        <div className="max-w-5xl mx-auto bg-neutral-950/85 backdrop-blur-2xl px-6 py-4 rounded-3xl border border-white/15 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Left: Active Milestone Info */}
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="w-10 h-10 rounded-2xl bg-yellow-golden/15 border border-yellow-golden/30 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-yellow-golden" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-sage-muted uppercase font-bold">
                {currentMilestone.stageName}
              </div>
              <div className="text-sm font-bold text-white tracking-tight">
                {currentMilestone.layerTitle.split(":")[0]} · <span className="text-yellow-golden">{currentMilestone.depthMm}</span>
              </div>
            </div>
          </div>

          {/* Center: Live Progress Bar & Scrubbing Slider */}
          <div className="w-full sm:max-w-xs flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-sage-muted">
              <span>EXPLOSION PROGRESS</span>
              <span className="text-white font-bold">{Math.round(scrollProgress * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden relative cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const newProgress = Math.max(0, Math.min(1, clickX / rect.width));
                scrollToStage(newProgress);
              }}
            >
              <div
                className="h-full bg-gradient-to-r from-teal-deep via-yellow-golden to-yellow-hover rounded-full transition-all duration-150"
                style={{ width: `${scrollProgress * 100}%` }}
              />
            </div>
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => scrollToStage(0)}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sage hover:text-white transition-colors"
              title="Reset View to Assembled State"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <Link
              href="/working?tab=chemistry"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
            >
              <Info className="w-3.5 h-3.5 text-teal-light" />
              <span>SOP Specs</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
