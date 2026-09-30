import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Leaf,
  Eye,
  Smartphone,
  Database,
  Scale,
  Sparkles,
  FlaskConical,
  Biohazard,
  Clock,
  Coins,
} from "lucide-react";

export default function ComparisonTab() {
  // 1. Plain English KPI Highlights (No cryptic formulas)
  const benchmarkMetrics = [
    {
      title: "Detection Sensitivity",
      statLead: "Low (5 – 10 ppm)",
      statNovel: "High (0.2 ppm)",
      novelAdvantage: "Catches Tiny Micro Leaks",
      icon: FlaskConical,
    },
    {
      title: "Worker Safety",
      statLead: "Toxic Heavy Metal (Lead)",
      statNovel: "Safe Natural Plant Extract",
      novelAdvantage: "100% Safe for Skin Contact",
      icon: Leaf,
    },
    {
      title: "Reading Method",
      statLead: "Naked-Eye Guesswork",
      statNovel: "Smart Phone Camera Scan",
      novelAdvantage: "Instant & Accurate (No Bias)",
      icon: Smartphone,
    },
    {
      title: "Record Keeping",
      statLead: "Handwritten Paper Logs",
      statNovel: "Automatic Cloud Dashboard",
      novelAdvantage: "Instant Digital Tracking",
      icon: Database,
    },
  ];

  // 2. Plain English 10-Dimension Comparison Matrix
  const leadAcetateVsNovelRows = [
    {
      dimension: "Sensing Material",
      leadAcetate: "Toxic Lead Chemical: Uses hazardous lead acetate that turns black when exposed to gas, leaving toxic chemical residue.",
      novelBand: "Natural Plant Extract: Uses purple cabbage plant extract that safely shifts color from purple to pink/red when gas is present.",
      impact: "Replaces dangerous heavy metal chemicals with safe, eco-friendly natural ingredients.",
      icon: FlaskConical,
    },
    {
      dimension: "Worker Skin Safety",
      leadAcetate: "Dangerous to Touch: Contains toxic lead that can be absorbed through the body and harm organs. Prohibited from touching bare skin.",
      novelBand: "100% Skin Safe: Made from edible organic plant extracts housed in a skin-friendly, protective wristband.",
      impact: "Workers can safely wear it on their wrists all day for entire 8-hour shifts with zero health risk.",
      icon: ShieldAlert,
    },
    {
      dimension: "Detection Sensitivity",
      leadAcetate: "Low Sensitivity (5 to 10 ppm): Only notices gas after heavy concentration builds up. Misses small, chronic leaks.",
      novelBand: "High Sensitivity (0.2 ppm): Detects tiny gas leaks early, long before they build up into dangerous levels.",
      impact: "Warns workers up to 25 to 50 times earlier, preventing accidental gas poisoning.",
      icon: Sparkles,
    },
    {
      dimension: "How You Read the Results",
      leadAcetate: "Naked-Eye Guessing: A worker has to guess the gas level by comparing colors on paper. Bad lighting and human error cause big mistakes.",
      novelBand: "Automatic Phone Camera Scan: A smartphone app automatically analyzes the exact color change in seconds.",
      impact: "Eliminates all human guesswork and gives an exact, tamper-proof reading every single time.",
      icon: Eye,
    },
    {
      dimension: "Resistance to Sun & Weather",
      leadAcetate: "Fades in Sunlight & Air: The black stain fades quickly under sunlight, heat, and humidity, giving false 'safe' readings.",
      novelBand: "Weather Compensated: Uses built-in reference color spots that automatically correct for humidity and outdoor sunlight.",
      impact: "Stays clear and accurate in harsh refinery heat and humid weather without fading.",
      icon: Scale,
    },
    {
      dimension: "False Alarm Prevention",
      leadAcetate: "Easily Fooled: Often triggers false alarms from vehicle exhaust, sewer fumes, or other factory gases.",
      novelBand: "Targeted Gas Response: Formulated to react specifically to toxic hydrogen sulfide gas, ignoring normal refinery fumes.",
      impact: "Stops annoying false alarms and keeps refinery operations running smoothly.",
      icon: AlertTriangle,
    },
    {
      dimension: "Speed of Reaction",
      leadAcetate: "Slow Reaction (10 to 30 minutes): Takes a long time for colors to darken visibly at lower gas levels.",
      novelBand: "Fast Reaction (< 1 minute): Shows a noticeable color change almost immediately when gas is present.",
      impact: "Allows fast, instant scanning at the end of each shift with zero waiting.",
      icon: Clock,
    },
    {
      dimension: "Safety Records & Logs",
      leadAcetate: "Paper Clipboards: Hand-written logs on paper that can be easily lost, damaged, forgotten, or altered.",
      novelBand: "Instant Cloud Dashboard: Every scan instantly logs the worker's name, time, and exposure level to a secure online dashboard.",
      impact: "Complete digital compliance history with zero paperwork or administrative hassle.",
      icon: Database,
    },
    {
      dimension: "Disposal & Environmental Impact",
      leadAcetate: "Hazardous Chemical Waste: Must be treated as toxic heavy metal waste and disposed of in special chemical bins.",
      novelBand: "Eco-Friendly & Recyclable: Made from natural plant extracts and recycled fabric wristbands.",
      impact: "Produces zero hazardous chemical waste and is completely safe for normal disposal.",
      icon: Leaf,
    },
    {
      dimension: "Cost & Practicality",
      leadAcetate: "Hidden High Costs: The strips look cheap, but hazardous waste disposal and manual paperwork make them expensive.",
      novelBand: "Very Low Cost (< $0.50 per strip): Made with affordable plant extracts and a reusable wristband band holder.",
      impact: "Extremely cost-effective to deploy across thousands of refinery workers and contractors.",
      icon: Coins,
    },
  ];

  // 3. Extraction Methodology Comparison Data
  const extractionComparisons = [
    {
      approach: "Aqueous Extraction (100% Water)",
      role: "Proposed Green Method",
      evidence: "Extracts natural plant pigments effectively using sound waves (ultrasonic) with pure water instead of chemicals.",
      limitations: "Extracts should be stored in dark, cool bottles to stay fresh for a long time.",
      status: "Selected Method",
      statusColor: "bg-teal-light text-teal-deep border-teal-deep/30",
    },
    {
      approach: "Alcohol / Solvent Extraction",
      role: "Traditional Chemical Method",
      evidence: "Commonly used in older lab methods to pull pigments with alcohol.",
      limitations: "Uses flammable, toxic chemical solvents that are bad for the environment and worker safety.",
      status: "Excluded (Safety Risk)",
      statusColor: "bg-gray-100 text-gray-700 border-gray-300",
    },
    {
      approach: "Immediate Neutralization during Extraction",
      role: "One-Step Shortcut",
      evidence: "Tries to extract and balance the pH level all in a single step.",
      limitations: "Risks destroying the delicate plant pigments before they can properly stabilize.",
      status: "Excluded (Too Unstable)",
      statusColor: "bg-gray-100 text-gray-700 border-gray-300",
    },
    {
      approach: "Controlled Step-by-Step pH Screening",
      role: "Careful Optimization",
      evidence: "Extracts safely first, then gently adjusts the liquid to find the most vibrant, stable purple color.",
      limitations: "Takes a few extra testing steps to find the perfect color balance.",
      status: "Selected Method",
      statusColor: "bg-teal-light text-teal-deep border-teal-deep/30",
    },
  ];

  return (
    <div className="space-y-16">
      {/* ========================================================================= */}
      {/* SECTION 1: LEAD STRIPS VS. NOVEL RESEARCH BAND COMPARISON                */}
      {/* ========================================================================= */}
      <div className="space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-teal-deep bg-teal-light px-3 py-1 rounded-full border border-teal-deep/20">
            TECHNOLOGY COMPARISON
          </span>
          <h3 className="font-display text-3xl sm:text-4xl uppercase tracking-tight text-charcoal">
            Traditional Lead Strips vs. Our New Smart Dosimeter Band
          </h3>
          <p className="text-sm text-sage-muted leading-relaxed">
            A simple, side-by-side comparison showing why our safe, plant-based smart wristband outperforms traditional toxic lead strips.
          </p>
        </div>

        {/* 4 Metric Highlight Cards in Plain English */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {benchmarkMetrics.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-5 border border-light-surface shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sage-muted">
                    {item.title}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-warm-white border border-light-surface flex items-center justify-center text-teal-deep">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline justify-between text-xs border-b border-light-surface/60 pb-1.5">
                    <span className="text-sage-muted font-medium">Old Lead Strip:</span>
                    <span className="font-medium text-gray-700">{item.statLead}</span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-teal-deep font-bold">STRELA Band:</span>
                    <span className="font-bold text-charcoal">{item.statNovel}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-light-surface flex items-center gap-1.5 text-[11px] font-mono font-bold text-teal-deep bg-teal-light/50 px-2 py-1 rounded-md">
                  <Sparkles className="w-3 h-3 text-yellow-golden" />
                  <span>{item.novelAdvantage}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Lead Acetate vs Novel Band Table */}
        <div className="bg-white rounded-2xl border border-light-surface shadow-md overflow-hidden">
          <div className="p-4 sm:p-6 bg-charcoal text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-display text-xl uppercase tracking-wider text-white">
                Detailed Feature-by-Feature Comparison
              </h4>
              <p className="text-xs text-sage mt-1">
                Comparing safety, accuracy, ease of use, and environmental impact.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-full bg-red-950/80 text-red-300 border border-red-700/40">
                Old Method: Toxic Lead Strip
              </span>
              <span className="px-2.5 py-1 rounded-full bg-teal-hover text-yellow-golden border border-yellow-golden/30">
                Our Solution: Safe STRELA Band
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-warm-white border-b border-light-surface text-xs font-mono font-bold uppercase text-charcoal">
                  <th className="p-4 pl-6 w-[20%]">Feature</th>
                  <th className="p-4 w-[28%] bg-red-50/40 border-x border-light-surface">
                    <div className="flex items-center gap-1.5 text-red-900">
                      <Biohazard className="w-4 h-4 text-red-600" />
                      <span>Traditional Lead Strip</span>
                    </div>
                  </th>
                  <th className="p-4 w-[28%] bg-teal-light/40 border-r border-light-surface">
                    <div className="flex items-center gap-1.5 text-teal-deep">
                      <ShieldCheck className="w-4 h-4 text-teal-deep" />
                      <span>Our New STRELA Band</span>
                    </div>
                  </th>
                  <th className="p-4 pr-6 w-[24%]">Why It Matters</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-surface text-xs text-charcoal">
                {leadAcetateVsNovelRows.map((row, idx) => {
                  const RowIcon = row.icon;
                  return (
                    <tr key={idx} className="hover:bg-warm-white/40 transition-colors">
                      {/* Dimension */}
                      <td className="p-4 pl-6 align-top">
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 p-1 rounded bg-warm-white border border-light-surface text-teal-deep shrink-0">
                            <RowIcon className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-sm text-charcoal leading-snug">
                            {row.dimension}
                          </span>
                        </div>
                      </td>

                      {/* Lead Acetate */}
                      <td className="p-4 align-top bg-red-50/20 border-x border-light-surface text-sage-muted leading-relaxed">
                        <div className="flex items-start gap-1.5">
                          <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                          <span>{row.leadAcetate}</span>
                        </div>
                      </td>

                      {/* Novel STRELA Band */}
                      <td className="p-4 align-top bg-teal-light/20 border-r border-light-surface text-charcoal font-medium leading-relaxed">
                        <div className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-deep mt-0.5 shrink-0" />
                          <span>{row.novelBand}</span>
                        </div>
                      </td>

                      {/* Impact */}
                      <td className="p-4 pr-6 align-top text-sage-muted leading-relaxed font-normal">
                        <div className="bg-warm-white/80 p-2.5 rounded-lg border border-light-surface/80">
                          <span className="text-charcoal font-semibold block text-[11px] font-mono mb-1 text-teal-deep">
                            KEY ADVANTAGE:
                          </span>
                          {row.impact}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Visual Divider */}
      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-light-surface"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-warm-white px-4 text-xs font-mono uppercase text-sage-muted font-bold tracking-widest">
            Laboratory Extraction Process
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: EXTRACTION METHODOLOGY COMPARISON                              */}
      {/* ========================================================================= */}
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-teal-deep">
            EXTRACTION LAB METHODS
          </span>
          <h3 className="font-display text-3xl uppercase tracking-tight text-charcoal">
            Extraction Methodology Comparison
          </h3>
          <p className="text-sm text-sage-muted">
            Comparing different ways to extract natural purple pigments safely and cleanly.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-light-surface shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-warm-white border-b border-light-surface text-xs font-mono font-bold uppercase text-charcoal">
                  <th className="p-4 pl-6">Approach</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">How It Works</th>
                  <th className="p-4">Limitations</th>
                  <th className="p-4 pr-6">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-surface text-xs text-charcoal">
                {extractionComparisons.map((row, idx) => (
                  <tr key={idx} className="hover:bg-warm-white/50 transition-colors">
                    <td className="p-4 pl-6 font-bold text-sm text-charcoal">
                      {row.approach}
                    </td>
                    <td className="p-4 text-sage-muted font-medium">
                      {row.role}
                    </td>
                    <td className="p-4 text-sage-muted leading-relaxed max-w-xs">
                      {row.evidence}
                    </td>
                    <td className="p-4 text-sage-muted leading-relaxed max-w-xs">
                      {row.limitations}
                    </td>
                    <td className="p-4 pr-6">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-mono font-bold border ${row.statusColor}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
