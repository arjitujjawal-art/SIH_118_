import { Leaf, Waves, Filter, Sliders, ChevronRight, Sparkles, Layers } from "lucide-react";

export default function MopHeader() {
  const architectureSteps = [
    {
      num: "01",
      title: "Bio Preparation",
      sub: "Washing & Gentle Drying",
      desc: "Distilled water wash + 40–45°C drying preserves delicate plant anthocyanins.",
      icon: Leaf,
    },
    {
      num: "02",
      title: "Ultrasonic Extraction",
      sub: "100% Solvent-Free Water",
      desc: "Soundwave cavitation at < 30°C extracts pure pigments with zero toxic alcohols.",
      icon: Waves,
    },
    {
      num: "03",
      title: "Phase Filtration",
      sub: "Centrifugation & Separation",
      desc: "3500 rpm rotational separation yields a particulate-free, clear liquid extract.",
      icon: Filter,
    },
    {
      num: "04",
      title: "pH Optimization",
      sub: "Vibrant Color Baseline",
      desc: "Controlled titration (pH 5.0–7.0) locks in the active purple-to-pink gas response.",
      icon: Sliders,
    },
  ];

  return (
    <section className="pt-20 pb-12 px-6 lg:px-12 bg-warm-white border-b border-light-surface">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Main Title & Subheading */}
        <div className="text-center max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-light border border-teal-deep/20 text-teal-deep text-xs font-mono font-bold tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>LABORATORY PROCESS ARCHITECTURE</span>
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl uppercase tracking-tight text-charcoal leading-none">
              THE MOP.
            </h1>
            <p className="font-mono text-base sm:text-lg uppercase tracking-widest text-teal-deep font-bold">
              (METHOD OF PREPARATION)
            </p>
          </div>

          <p className="text-sm sm:text-base text-sage-muted max-w-2xl mx-auto leading-relaxed">
            Our end-to-end chemical engineering workflow: transforming raw botanical matter into a calibrated, lead-free gas dosimeter sensor strip using 100% green aqueous chemistry.
          </p>
        </div>

        {/* 4-Step Process Architecture Pipeline */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-light-surface shadow-md">
          <div className="flex items-center justify-between pb-6 border-b border-light-surface mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-warm-white border border-light-surface flex items-center justify-center text-teal-deep">
                <Layers className="w-4 h-4" />
              </div>
              <span className="font-display text-lg uppercase tracking-wider text-charcoal">
                Synthesis Pipeline Architecture
              </span>
            </div>
            <span className="hidden sm:inline-block text-xs font-mono font-bold text-sage-muted uppercase tracking-wider">
              4-Stage Sequential Flow
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {architectureSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={idx}
                  className="relative bg-warm-white/70 rounded-2xl p-5 border border-light-surface flex flex-col justify-between space-y-4 hover:bg-warm-white transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-3xl text-yellow-golden group-hover:scale-110 transition-transform">
                      {step.num}
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-white border border-light-surface shadow-sm flex items-center justify-center text-teal-deep">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-display text-base uppercase tracking-tight text-charcoal">
                      {step.title}
                    </h3>
                    <p className="text-[11px] font-mono text-teal-deep font-bold">
                      {step.sub}
                    </p>
                    <p className="text-xs text-sage-muted leading-relaxed pt-1">
                      {step.desc}
                    </p>
                  </div>

                  {/* Desktop Right Chevron Arrow (between cards 1, 2, 3) */}
                  {idx < 3 && (
                    <div className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white border border-light-surface shadow-sm items-center justify-center text-sage-muted">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
