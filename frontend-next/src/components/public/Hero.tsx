"use client";

import Link from "next/link";
import { ArrowRight, Shield, QrCode, Sparkles, CheckCircle2 } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 px-6 lg:px-12 bg-hero-grid bg-warm-white overflow-hidden border-b border-light-surface">
      <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-charcoal/10 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <span className="w-2 h-2 rounded-full bg-teal-deep animate-pulse" />
          <span className="text-[11px] sm:text-xs font-bold tracking-widest text-charcoal uppercase">
            STRELA · PASSIVE WRISTBAND · DIGITAL EXPOSURE RECORDS
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl uppercase tracking-tight text-charcoal leading-tightest max-w-5xl mb-8">
          WHEN EXPOSURE <br className="hidden sm:inline" />
          BECOMES DATA, <br className="hidden md:inline" />
          SAFETY BECOMES <span className="highlight-yellow">SMARTER.</span>
        </h1>

        {/* Supporting Copy */}
        <p className="text-lg sm:text-xl text-sage-muted max-w-2xl leading-relaxed mb-10 font-normal">
          A colour-changing wristband and smartphone reading workflow designed to connect H₂S exposure-related readings with each worker’s history.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16 w-full sm:w-auto">
          <Link
            href="/prototype-3d"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-charcoal text-white hover:bg-black font-bold text-base px-8 py-4 rounded-full transition-all duration-300 shadow-xl hover:shadow-2xl border border-yellow-golden/50 group"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-golden animate-ping mr-1" />
            <span>3D EXPLODED TEARDOWN</span>
            <ArrowRight className="w-5 h-5 text-yellow-golden group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/working"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-yellow-golden text-charcoal hover:bg-yellow-hover font-bold text-base px-8 py-4 rounded-full transition-all duration-300 shadow hover:shadow-md group"
          >
            <span>EXPLORE PIPELINE</span>
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-warm-white text-charcoal hover:bg-white border border-light-surface font-semibold text-base px-8 py-4 rounded-full transition-all duration-300 shadow-sm"
          >
            <span>MANAGER LOGIN</span>
          </Link>
        </div>

        {/* MOP Process Showcase */}
        <div className="w-full max-w-5xl bg-white rounded-3xl p-6 sm:p-8 border border-light-surface shadow-2xl card-hover-lift text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-light-surface pb-4 mb-6">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-teal-deep">Laboratory Process</div>
              <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-tight text-charcoal">Lead-Free Organic Extraction</h3>
            </div>
            <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 self-start sm:self-auto font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Green Chemistry
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-warm-white rounded-2xl p-4 border border-light-surface flex flex-col items-center">
              <div className="relative w-full h-48 md:h-64 overflow-hidden rounded-xl shadow border border-charcoal/10 bg-black flex items-center justify-center">
                <img
                  src="/lab%20setup.jpeg"
                  alt="Laboratory Setup"
                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
              <div className="mt-4 text-center">
                <div className="text-[10px] font-mono font-bold text-teal-deep uppercase">01 / PREPARATION</div>
                <div className="text-sm font-semibold text-charcoal mt-1">Initial Laboratory Setup</div>
              </div>
            </div>
            
            <div className="bg-warm-white rounded-2xl p-4 border border-light-surface flex flex-col items-center">
              <div className="relative w-full h-48 md:h-64 overflow-hidden rounded-xl shadow border border-charcoal/10 bg-black flex items-center justify-center">
                <video
                  src="/filtering%20of%20centrifuged%20antrocynin%20solution%20extracted%20from%20red%20cabbage.mp4"
                  controls
                  autoPlay
                  loop
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="mt-4 text-center">
                <div className="text-[10px] font-mono font-bold text-teal-deep uppercase">02 / SEPARATION</div>
                <div className="text-sm font-semibold text-charcoal mt-1">Filtration Process</div>
              </div>
            </div>
            
            <div className="bg-warm-white rounded-2xl p-4 border border-light-surface flex flex-col items-center">
              <div className="relative w-full h-48 md:h-64 overflow-hidden rounded-xl shadow border border-charcoal/10 bg-black flex items-center justify-center">
                <img
                  src="/ultra%20sound%20bagth%20in%20sonicator.jpeg"
                  alt="Ultrasonic Bath"
                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
              <div className="mt-4 text-center">
                <div className="text-[10px] font-mono font-bold text-teal-deep uppercase">03 / EXTRACTION</div>
                <div className="text-sm font-semibold text-charcoal mt-1">Ultrasonic Bath Sonication</div>
              </div>
            </div>
            
            <div className="bg-warm-white rounded-2xl p-4 border border-light-surface flex flex-col items-center">
              <div className="relative w-full h-48 md:h-64 overflow-hidden rounded-xl shadow border border-charcoal/10 bg-black flex items-center justify-center">
                <img
                  src="/strip%20color%20change%20in%20reacting%20with%20acid%20and%20base.jpeg"
                  alt="Color Change"
                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
              <div className="mt-4 text-center">
                <div className="text-[10px] font-mono font-bold text-teal-deep uppercase">04 / REACTION</div>
                <div className="text-sm font-semibold text-charcoal mt-1">Strip Colorimetric Response</div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 text-xs text-sage-muted bg-warm-white p-3.5 rounded-lg border border-light-surface">
            <span className="font-bold text-charcoal shrink-0">CRITICAL NOTE:</span>
            <span>Aqueous, ethanol-free extraction creates a safer, lead-free organic formulation for H₂S dosimetric sensing.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
