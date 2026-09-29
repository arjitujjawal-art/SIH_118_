import { useState } from "react";
import { ArrowDown, CheckCircle2, Info, AlertTriangle } from "lucide-react";

export default function FlowchartTab() {
  const [selectedStage, setSelectedStage] = useState<number>(0);

  const stages = [
    {
      num: "01",
      title: "Washing Leaves",
      short: "Clean fresh leaves using distilled water.",
      inputs: "Fresh leaves containing anthocyanin, Distilled water.",
      process: "Wash the leaves gently with distilled water to remove dust and surface contaminants. Remove excess water using clean tissue or filter paper.",
      outputs: "Cleaned, slightly damp fresh leaves.",
      limitations: "Do not use harsh chemicals or excessive physical force to prevent premature cell breakdown.",
    },
    {
      num: "02",
      title: "Controlled Drying",
      short: "Dry leaves at 40-45 °C.",
      inputs: "Washed leaves, Oven/dryer.",
      process: "Spread the leaves in a single layer and dry at approximately 40–45 °C until they reach a constant dry mass. Avoid direct sunlight.",
      outputs: "Dried leaves (recorded final dry mass).",
      limitations: "Excessive heat can degrade anthocyanin. Freeze-drying is preferred if available.",
    },
    {
      num: "03",
      title: "Grinding",
      short: "Process into fine powder.",
      inputs: "Dried leaves, Mortar and pestle or mechanical grinder.",
      process: "Grind the dried leaves into a fine powder. Minimize exposure to strong light during grinding. Store in an opaque/amber container.",
      outputs: "Standardized dried leaf powder.",
      limitations: "Must be stored properly to prevent moisture absorption and light-induced degradation before extraction.",
    },
    {
      num: "04",
      title: "Ultrasonic Extraction",
      short: "Aqueous extraction without ethanol.",
      inputs: "2.00 g dried leaf powder, 50 mL distilled water, Ultrasonic bath.",
      process: "Mix powder with distilled water. Place in an ultrasonic bath for approximately 30 minutes, keeping the temperature below 30 °C.",
      outputs: "Aqueous extraction mixture (solid-liquid slurry).",
      limitations: "Do not adjust the extraction mixture to pH 7 at this stage. Avoid thermal degradation.",
    },
    {
      num: "05",
      title: "Centrifugation",
      short: "Mechanically separate solids.",
      inputs: "Extraction mixture, Centrifuge, tubes.",
      process: "Transfer mixture to tubes and centrifuge at 3500 rpm for 15 minutes. Carefully collect the supernatant.",
      outputs: "Clarified supernatant (separated from solid residue).",
      limitations: "Must not disturb the solid pellet during collection.",
    },
    {
      num: "06",
      title: "Filtration",
      short: "Final isolation of crude extract.",
      inputs: "Collected supernatant, Filter paper/membrane filter, Funnel.",
      process: "Filter the supernatant through filter paper, and optionally through a finer membrane filter, into an amber container.",
      outputs: "Clear crude aqueous anthocyanin extract.",
      limitations: "Ensure extract is kept in an opaque/amber bottle immediately to protect from light.",
    },
    {
      num: "07",
      title: "pH Optimization",
      short: "Adjust pH sequentially to find stable purple.",
      inputs: "Crude extract (divided into 5 samples), Dilute NaOH, Dilute citric acid.",
      process: "Adjust samples to pH 5.0, 5.5, 6.0, 6.5, and 7.0 slowly. Allow equilibration for 15-30 minutes in darkness.",
      outputs: "Five pH-stabilized aqueous extracts.",
      limitations: "Avoid adding large quantities of NaOH at once. Correct overshoots carefully with citric acid.",
    },
    {
      num: "08",
      title: "Evaluation & Exposure",
      short: "Color measurement and H₂S detection.",
      inputs: "Optimized extracts, H₂S gas, Color measurement tools (RGB/HSV/L*a*b*).",
      process: "Identify the strongest and most stable purple. Use this optimal extract for controlled H₂S exposure, recording the transition to Red/Pink.",
      outputs: "Quantified color change response (ΔColor).",
      limitations: "H₂S is highly toxic. Must only be performed in appropriate laboratory setups with proper safety controls.",
    },
  ];

  return (
    <div className="space-y-12">
      <div className="text-center max-w-2xl mx-auto">
        <h3 className="font-display text-3xl uppercase tracking-tight text-charcoal">
          8-Stage Extraction & Testing Pipeline
        </h3>
        <p className="text-sm text-sage-muted mt-2">
          Click any stage to inspect its specific inputs, physical/chemical processing, outputs, and limitations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Stages List (Left) */}
        <div className="lg:col-span-6 space-y-3">
          {stages.map((stage, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedStage(idx)}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                selectedStage === idx
                  ? "bg-charcoal text-white border-charcoal shadow-md scale-[1.01]"
                  : "bg-white text-charcoal border-light-surface hover:border-teal-deep/40 hover:bg-warm-white"
              }`}
            >
              <div className="flex items-center gap-4">
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                    selectedStage === idx ? "bg-yellow-golden text-charcoal" : "bg-warm-white text-sage-muted border border-light-surface"
                  }`}
                >
                  {stage.num}
                </span>
                <div>
                  <h4 className="text-sm font-bold">{stage.title}</h4>
                  <p className={`text-xs mt-0.5 line-clamp-1 ${selectedStage === idx ? "text-sage" : "text-sage-muted"}`}>
                    {stage.short}
                  </p>
                </div>
              </div>
              <span className={`text-xs font-semibold ${selectedStage === idx ? "text-yellow-golden" : "text-sage-muted"}`}>
                Details →
              </span>
            </button>
          ))}
        </div>

        {/* Selected Stage Detail Drawer (Right) */}
        <div className="lg:col-span-6 sticky top-24 bg-white rounded-2xl p-8 border border-light-surface shadow-xl">
          <div className="flex items-center justify-between border-b border-light-surface pb-4 mb-6">
            <span className="text-xs font-mono font-bold text-teal-deep px-2.5 py-1 rounded bg-teal-light">
              STAGE {stages[selectedStage].num} SPECIFICATION
            </span>
            <span className="text-xs text-sage-muted">MOP Pipeline</span>
          </div>

          <h3 className="font-display text-3xl uppercase tracking-tight text-charcoal mb-4">
            {stages[selectedStage].title}
          </h3>

          <div className="space-y-6">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-sage-muted mb-1">Inputs</div>
              <div className="text-sm text-charcoal bg-warm-white p-3 rounded-xl border border-light-surface">
                {stages[selectedStage].inputs}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-sage-muted mb-1">Transformation Process</div>
              <div className="text-sm text-charcoal bg-warm-white p-3 rounded-xl border border-light-surface leading-relaxed">
                {stages[selectedStage].process}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-sage-muted mb-1">Outputs</div>
              <div className="text-sm font-medium text-teal-deep bg-teal-light/40 p-3 rounded-xl border border-teal-deep/20">
                {stages[selectedStage].outputs}
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-start gap-2 text-xs text-amber-900 bg-amber-50 p-3 rounded-xl border border-amber-200">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <strong className="font-semibold">Limitations & Controls:</strong> {stages[selectedStage].limitations}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
