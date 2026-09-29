import { AlertTriangle, CheckCircle2 } from "lucide-react";

export default function ProblemSolution() {
  const problems = [
    { title: "Solvent Selection", desc: "Extract anthocyanin from plant leaves using only distilled water as the extraction solvent." },
    { title: "Physical Breakdown", desc: "Grind dried leaves and use an ultrasonic bath for effective extraction below 30°C." },
    { title: "Separation", desc: "Centrifuge at 3500 rpm for 15 minutes, followed by filtration to collect the crude aqueous extract." },
    { title: "pH Optimization", desc: "Divide the extract and adjust pH slowly using dilute NaOH to find the most stable purple color." },
    { title: "Storage", desc: "Store the aqueous anthocyanin extract in an amber/opaque container protected from direct light." },
  ];

  const solutions = [
    { title: "Initial State", desc: "Start with the optimal purple anthocyanin solution determined during pH screening." },
    { title: "Gas Exposure", desc: "Controlled exposure to hydrogen sulfide (H₂S) gas in a safe laboratory environment." },
    { title: "Chemical Shift", desc: "The H₂S induces a change in the chemical environment and local pH of the solution." },
    { title: "Visual Transition", desc: "The solution undergoes a distinct color change from Purple to Red/Pink." },
    { title: "Data Recording", desc: "Measure and record final RGB, HSV, and CIE L*a*b* values to quantify the ΔColor." },
  ];

  return (
    <section className="py-16 px-6 lg:px-12 bg-warm-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: The Extraction Objective (Charcoal) */}
          <div className="bg-charcoal text-white rounded-2xl p-8 lg:p-10 border border-dark-surface shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-red-400 mb-4 uppercase">
                <AlertTriangle className="w-4 h-4" />
                The Objective
              </div>
              <h2 className="font-display text-4xl sm:text-5xl uppercase tracking-tight text-white mb-6">
                AQUEOUS EXTRACTION
              </h2>
              <p className="text-sm text-sage leading-relaxed mb-8">
                Extract anthocyanin from plant leaves using only distilled water, avoiding ethanol, for a pure indicator solution.
              </p>

              <div className="space-y-4">
                {problems.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      ✓
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white">{item.title}</h3>
                      <p className="text-xs text-sage mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: The Target Response (Dark Gray with Yellow Accent Border) */}
          <div className="bg-gray-dark text-white rounded-2xl p-8 lg:p-10 border-2 border-yellow-golden shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-yellow-golden mb-4 uppercase">
                <CheckCircle2 className="w-4 h-4 text-yellow-golden" />
                The Indicator
              </div>
              <h2 className="font-display text-4xl sm:text-5xl uppercase tracking-tight text-white mb-6">
                TARGET RESPONSE
              </h2>
              <p className="text-sm text-sage leading-relaxed mb-8">
                A robust colorimetric transition triggered by H₂S exposure, providing a clear visual and digital signal.
              </p>

              <div className="space-y-4">
                {solutions.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-yellow-golden text-charcoal flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      ✓
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-yellow-golden">{item.title}</h3>
                      <p className="text-xs text-sage-light mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

