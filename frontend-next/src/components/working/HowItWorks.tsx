import Link from "next/link";
import { ArrowRight, Smartphone, Sparkles } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "ASSIGN & CAPTURE",
      desc: "Link the worker profile and physical wristband QR code. The smartphone camera captures the initial baseline optical density (ΔE_start) and starts the active shift in the control room.",
      sub: "Day 1–5 Lifecycle tracking initialized.",
    },
    {
      num: "02",
      title: "WEAR & READ",
      desc: "The worker wears the sealed dosimeter cartridge in the refinery unit. At shift conclusion, the smartphone optical scanner captures the terminal state, evaluating image quality and Patch B/C integrity.",
      sub: "Rejects glare (>25%) and unaligned substrates.",
    },
    {
      num: "03",
      title: "ANALYSE & RECORD",
      desc: "The deterministic engine computes differential net darkening (ΔE_net), resolves eligible calibration curves, updates the rolling 7d/30d/90d ledgers, and assigns statutory risk tiers.",
      sub: "Zero-LLM mathematical rigor.",
    },
  ];

  return (
    <section className="py-24 px-6 lg:px-12 bg-warm-white border-b border-light-surface">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Sticky Column (4 of 12 cols) */}
        <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-6">
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-teal-deep">
              SUMMARY WORKFLOW
            </span>
            <h2 className="font-display text-5xl sm:text-6xl uppercase tracking-tight text-charcoal leading-tightest">
              HOW IT WORKS.
            </h2>
            <p className="text-sm text-sage-muted leading-relaxed">
              Three deterministic steps bridging physical chemistry and refinery occupational safety records.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-bold text-charcoal hover:text-teal-deep transition-colors group"
              >
                <span>Launch Platform</span>
                <ArrowRight className="w-4 h-4 text-yellow-golden group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Enhanced Video Demonstration Card */}
          <div className="bg-white rounded-2xl p-3 border border-light-surface shadow-xl card-hover-lift">
            <div className="flex items-center justify-between px-2 py-1.5 mb-2 border-b border-light-surface">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono font-bold text-charcoal uppercase tracking-wider">
                  Live Strip Scanner Demo
                </span>
              </div>
              <span className="text-[10px] font-mono text-sage-muted font-bold">MOBILE AI SCAN</span>
            </div>

            <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-black shadow-inner border border-charcoal/10">
              <video
                src="/Demonstrating_gas_detection_stri.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 right-2 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center justify-between text-[11px] font-mono text-white">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-yellow-golden" />
                  <span>Optical Strip Reading</span>
                </span>
                <span className="text-yellow-golden font-bold">COLOR RESPONSE</span>
              </div>
            </div>

            <div className="mt-2.5 px-2 flex items-center justify-between text-[11px] text-sage-muted">
              <span>Automatic QR & Color Analysis</span>
              <Link href="/manager/scan" className="text-teal-deep font-bold hover:underline">
                Try Scanner →
              </Link>
            </div>
          </div>
        </div>

        {/* Right Steps (8 of 12 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-8 border border-light-surface shadow-sm card-hover-lift flex flex-col sm:flex-row items-start gap-6 group focus-within:ring-2 focus-within:ring-yellow-golden transition-all"
              tabIndex={0}
            >
              {/* Large Yellow Numeral */}
              <div className="font-display text-6xl sm:text-7xl text-yellow-golden leading-none group-hover:scale-110 group-focus:scale-110 transition-transform duration-300 select-none shrink-0">
                {step.num}
              </div>

              <div className="space-y-2 flex-1">
                <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-tight text-charcoal">
                  {step.title}
                </h3>
                <p className="text-sm text-sage-muted leading-relaxed">
                  {step.desc}
                </p>
                <div className="text-xs font-mono text-teal-deep font-semibold pt-1">
                  → {step.sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
