import { FlaskConical, CheckCircle, Clock, AlertCircle, BookOpen } from "lucide-react";

export default function ChemistryTab() {
  return (
    <div className="space-y-12 max-w-5xl mx-auto">
      <div className="text-center max-w-2xl mx-auto">
        <h3 className="font-display text-3xl uppercase tracking-tight text-charcoal">
          Aqueous Anthocyanin Chemistry
        </h3>
        <p className="text-sm text-sage-muted mt-2">
          Ethanol-free extraction and pH optimization for H₂S detection.
        </p>
      </div>

      {/* Chemical Principle & CIELAB Math */}
      <div className="bg-white rounded-2xl p-8 border border-light-surface shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-light-surface pb-4">
          <FlaskConical className="w-6 h-6 text-teal-deep" />
          <h4 className="font-display text-2xl uppercase tracking-tight text-charcoal">
            Chemical Principle & Color Transition
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-3">
            <h5 className="font-bold text-charcoal">Chemical Reaction Mechanism:</h5>
            <p className="text-sage-muted leading-relaxed text-xs">
              Anthocyanin is extracted from fresh leaves using 100% distilled water. The extract is then optimized to a specific pH (between 5.0 and 7.0) to achieve a strong and stable purple coloration. When exposed to Hydrogen Sulfide (H₂S), the gas alters the chemical environment, triggering a structural change in the anthocyanin molecule.
            </p>
            <div className="p-3 bg-warm-white rounded-xl border border-light-surface font-mono text-xs text-charcoal">
              Purple Anthocyanin + H₂S → Red/Pink (via pH/environment change)
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="font-bold text-charcoal">Colorimetric Quantification:</h5>
            <p className="text-sage-muted leading-relaxed text-xs">
              The color transition is evaluated quantitatively. Rather than relying on human perception, digital sensors (or smartphones) capture identical sample images under controlled lighting to compute the color difference (ΔColor) in various color spaces.
            </p>
            <div className="p-3 bg-warm-white rounded-xl border border-light-surface font-mono text-xs text-charcoal">
              Measurement via RGB, HSV, and CIE L*a*b* values
            </div>
          </div>
        </div>
      </div>

      {/* 4 Categorized Research Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Block 1: Extraction Solvent */}
        <div className="bg-warm-white rounded-2xl p-6 border border-light-surface card-hover-lift">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-teal-deep mb-3 uppercase">
            <BookOpen className="w-4 h-4" />
            1. Extraction Medium
          </div>
          <h4 className="font-display text-xl uppercase tracking-tight text-charcoal mb-3">
            100% Aqueous Extraction
          </h4>
          <ul className="space-y-2 text-xs text-sage-muted leading-relaxed list-disc list-inside">
            <li>Zero ethanol is used during the extraction process.</li>
            <li>Solvent is purely distilled/deionized water.</li>
            <li>2.00 g dried leaf powder to 50 mL distilled water ratio (1:25).</li>
            <li>Ultrasonic bath processing for 30 minutes at &lt;30 °C.</li>
          </ul>
        </div>

        {/* Block 2: pH Optimization */}
        <div className="bg-warm-white rounded-2xl p-6 border border-light-surface card-hover-lift">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-teal-deep mb-3 uppercase">
            <FlaskConical className="w-4 h-4" />
            2. pH Optimization
          </div>
          <h4 className="font-display text-xl uppercase tracking-tight text-charcoal mb-3">
            Finding Stable Purple
          </h4>
          <ul className="space-y-2 text-xs text-sage-muted leading-relaxed list-disc list-inside">
            <li>Crude extract is divided and tested at pH 5.0, 5.5, 6.0, 6.5, and 7.0.</li>
            <li>Adjusted using dilute NaOH or dilute citric acid.</li>
            <li>Equilibrated for 15-30 minutes in darkness.</li>
            <li>Goal: identify strongest, most stable purple color for baseline.</li>
          </ul>
        </div>

        {/* Block 3: Experimental Control */}
        <div className="bg-warm-white rounded-2xl p-6 border border-light-surface card-hover-lift">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-700 mb-3 uppercase">
            <CheckCircle className="w-4 h-4" />
            3. Critical Controls
          </div>
          <h4 className="font-display text-xl uppercase tracking-tight text-charcoal mb-3">
            Standardization Requirements
          </h4>
          <ul className="space-y-2 text-xs text-sage-muted leading-relaxed list-disc list-inside">
            <li>Constant leaf-to-water ratio and extraction temperature.</li>
            <li>Consistent sonication (3500 rpm for 15 min) and filtration.</li>
            <li>Identical lighting, camera settings, and sample volume for color measurement.</li>
            <li>Storage in amber/opaque containers to prevent photolytic degradation.</li>
          </ul>
        </div>

        {/* Block 4: H2S Detection */}
        <div className="bg-warm-white rounded-2xl p-6 border border-light-surface card-hover-lift">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-700 mb-3 uppercase">
            <Clock className="w-4 h-4" />
            4. H₂S Response
          </div>
          <h4 className="font-display text-xl uppercase tracking-tight text-charcoal mb-3">
            Target Gas Exposure
          </h4>
          <ul className="space-y-2 text-xs text-sage-muted leading-relaxed list-disc list-inside">
            <li>Selected optimal purple condition is exposed to controlled H₂S gas.</li>
            <li>Record initial and final pH, RGB, HSV, and L*a*b* values.</li>
            <li>Observe distinct color shift from Purple to Red/Pink.</li>
            <li>Strict safety protocols: highly toxic H₂S tested only in ventilated lab setups.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
