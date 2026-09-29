import { Droplets, Activity, Layers, ActivitySquare, TestTube2, FlaskConical } from "lucide-react";

export default function BentoGrid() {
  return (
    <section className="py-16 px-6 lg:px-12 bg-white border-b border-light-surface">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-bold uppercase tracking-widest text-teal-deep mb-2">Experimental Stages</div>
          <h2 className="font-display text-5xl sm:text-6xl uppercase tracking-tight text-charcoal leading-tightest">
            THE EXTRACTION PROCESS
          </h2>
          <p className="text-base text-sage-muted mt-4">
            Six distinct stages for the aqueous laboratory formulation and evaluation of anthocyanin extract.
          </p>
        </div>

        {/* 3-Column Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-[minmax(360px,auto)]">
          {/* Card 1: Sample Preparation (Spans 2 Columns) */}
          <div className="lg:col-span-2 bg-[#171C1B] text-white rounded-2xl p-8 border border-dark-surface flex flex-col justify-between shadow-lg card-hover-lift">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-yellow-golden uppercase font-bold">Stage 01</span>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-teal-deep text-white">Leaves</span>
              </div>
              <h3 className="font-display text-3xl uppercase tracking-tight text-white mb-3">
                Sample Preparation
              </h3>
              <p className="text-sm text-sage leading-relaxed max-w-xl mb-6">
                Fresh leaves must be washed gently, dried at controlled temperatures to maintain compound integrity, and processed into fine powder while minimizing light exposure.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#242A29] p-3.5 rounded-xl border border-yellow-golden/30">
                  <div className="text-xs font-bold text-yellow-golden mb-1">Step A: Washing</div>
                  <div className="text-[11px] text-sage">Wash with distilled water to remove dust/contaminants. Remove excess water with tissue.</div>
                </div>
                <div className="bg-[#242A29] p-3.5 rounded-xl border border-sage/20">
                  <div className="text-xs font-bold text-white mb-1">Step B: Drying</div>
                  <div className="text-[11px] text-sage">Spread in a single layer. Dry at 40–45 °C until constant dry mass. Avoid direct sunlight.</div>
                </div>
                <div className="bg-[#242A29] p-3.5 rounded-xl border border-sage/20">
                  <div className="text-xs font-bold text-white mb-1">Step C: Grinding</div>
                  <div className="text-[11px] text-sage">Grind dried leaves into fine powder. Store in an opaque/amber container before extraction.</div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-dark-surface text-xs text-sage flex items-center justify-between">
              <span>Standardized precursor state</span>
              <span className="font-mono text-yellow-golden">Freeze-drying preferred</span>
            </div>
          </div>

          {/* Card 2: Extraction (1 Column) */}
          <div className="bg-warm-white text-charcoal rounded-2xl p-8 border border-light-surface flex flex-col justify-between shadow-sm card-hover-lift">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-teal-deep uppercase font-bold">Stage 02</span>
                <Droplets className="w-5 h-5 text-teal-deep" />
              </div>
              <h3 className="font-display text-3xl uppercase tracking-tight text-charcoal mb-3">
                Ultrasonic Extraction
              </h3>
              <p className="text-sm text-sage-muted leading-relaxed mb-4">
                A 100% aqueous phase without ethanol. Sonicate the powder to draw out the anthocyanins rapidly while preventing thermal degradation.
              </p>
              <div className="space-y-2 text-xs font-medium text-charcoal bg-white p-3 rounded-xl border border-light-surface">
                <div className="flex justify-between">
                  <span>Ratio:</span>
                  <span className="font-mono text-teal-deep">2g : 50mL Water</span>
                </div>
                <div className="flex justify-between">
                  <span>Sonication Time:</span>
                  <span className="font-mono text-teal-deep">30 Minutes</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Temp:</span>
                  <span className="font-mono text-teal-deep">&lt; 30 °C</span>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-light-surface text-xs text-sage-muted">
              Do not adjust pH at this step
            </div>
          </div>

          {/* Card 3: Separation (1 Column) */}
          <div className="bg-warm-white text-charcoal rounded-2xl p-8 border border-light-surface flex flex-col justify-between shadow-sm card-hover-lift">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-teal-deep uppercase font-bold">Stage 03</span>
                <Layers className="w-5 h-5 text-teal-deep" />
              </div>
              <h3 className="font-display text-3xl uppercase tracking-tight text-charcoal mb-3">
                Separation Process
              </h3>
              <p className="text-sm text-sage-muted leading-relaxed mb-4">
                Removing solid cellular debris from the solution using mechanical forces to isolate the crude aqueous extract.
              </p>
              <div className="p-3 bg-white rounded-xl border border-light-surface font-mono text-xs text-charcoal">
                <strong>Centrifuge:</strong> 3500 rpm × 15 min <br/>
                <strong>Filter:</strong> Paper + Membrane
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-light-surface text-xs text-sage-muted">
              Collect supernatant carefully
            </div>
          </div>

          {/* Card 4: pH Optimization (Spans 2 Columns) */}
          <div className="lg:col-span-2 bg-[#171C1B] text-white rounded-2xl p-8 border border-dark-surface flex flex-col justify-between shadow-lg card-hover-lift">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-yellow-golden uppercase font-bold">Stage 04</span>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-amber-900/50 text-yellow-golden border border-yellow-golden/30">
                  Screening
                </span>
              </div>
              <h3 className="font-display text-3xl uppercase tracking-tight text-white mb-3">
                pH Optimization & Stabilization
              </h3>
              <p className="text-sm text-sage leading-relaxed max-w-xl mb-6">
                Divide the extract and adjust pH sequentially. Anthocyanin color is highly pH-dependent; the goal is to locate the most stable and vivid purple state prior to gas exposure.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center">
                {[5.0, 5.5, 6.0, 6.5, 7.0].map((ph) => (
                  <div key={ph} className="bg-[#1E2423] p-2 rounded-xl border border-sage/10">
                    <div className="text-[10px] text-sage font-mono uppercase">Target</div>
                    <div className="text-lg font-bold text-yellow-golden font-mono mt-1">pH {ph.toFixed(1)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-dark-surface text-xs text-sage flex items-center justify-between">
              <span>Use dilute NaOH & Citric Acid</span>
              <span className="text-yellow-golden font-mono">15–30 min equilibration</span>
            </div>
          </div>

          {/* Card 5: Color Evaluation (1 Column) */}
          <div className="bg-warm-white text-charcoal rounded-2xl p-8 border border-light-surface flex flex-col justify-between shadow-sm card-hover-lift">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-teal-deep uppercase font-bold">Stage 05</span>
                <ActivitySquare className="w-5 h-5 text-teal-deep" />
              </div>
              <h3 className="font-display text-3xl uppercase tracking-tight text-charcoal mb-3">
                Color Evaluation
              </h3>
              <p className="text-sm text-sage-muted leading-relaxed mb-4">
                Quantify the resulting color intensity and stability under strictly identical lighting and camera parameters.
              </p>
              <div className="bg-white p-3 rounded-xl border border-light-surface text-xs font-mono text-charcoal space-y-1">
                <div>RGB / HSV metrics</div>
                <div>CIE L*a*b* space</div>
                <div>UV-Vis spectrum</div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-light-surface text-xs text-sage-muted">
              Select strongest purple
            </div>
          </div>

          {/* Card 6: H2S Exposure (1 Column) */}
          <div className="bg-warm-white text-charcoal rounded-2xl p-8 border border-light-surface flex flex-col justify-between shadow-sm card-hover-lift">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-teal-deep uppercase font-bold">Stage 06</span>
                <FlaskConical className="w-5 h-5 text-teal-deep" />
              </div>
              <h3 className="font-display text-3xl uppercase tracking-tight text-charcoal mb-3">
                H₂S Response Test
              </h3>
              <p className="text-sm text-sage-muted leading-relaxed mb-4">
                The working extract is exposed to controlled H₂S, driving a chemical shift that translates to a measurable visual change.
              </p>
              <div className="flex items-center justify-center gap-2 font-mono text-sm font-bold">
                <span className="text-purple-600">Purple</span>
                <span>→</span>
                <span className="text-pink-600">Red/Pink</span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-light-surface text-xs text-sage-muted">
              Calculate final ΔColor
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
