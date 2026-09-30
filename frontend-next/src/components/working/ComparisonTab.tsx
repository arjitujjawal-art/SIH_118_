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
  // 1. Industry Standard Lead Acetate vs. Novel Research Band Comparison
  const benchmarkMetrics = [
    {
      title: "Detection Sensitivity",
      statLead: "5 – 10 ppm",
      statNovel: "200 ppb (0.2 ppm)",
      novelAdvantage: "25× to 50× Lower LOD",
      icon: FlaskConical,
    },
    {
      title: "Worker Toxicity Risk",
      statLead: "IARC 2A/2B Lead Hazard",
      statNovel: "100% Food-Grade Bio-Matrix",
      novelAdvantage: "Zero Dermal Toxicity",
      icon: Leaf,
    },
    {
      title: "Readout Technology",
      statLead: "Subjective Visual Eye",
      statNovel: "AI/CV CIE L*a*b* ΔE₀₀",
      novelAdvantage: "Deterministic & Digital",
      icon: Smartphone,
    },
    {
      title: "Compliance Ledger",
      statLead: "Manual Paper Clipboards",
      statNovel: "Real-Time Cloud Ledger",
      novelAdvantage: "Automated OSHA 7d/30d/90d",
      icon: Database,
    },
  ];

  const leadAcetateVsNovelRows = [
    {
      dimension: "Active Sensing Chemistry",
      leadAcetate: "Lead(II) Acetate trihydrate [Pb(CH₃COO)₂]. Reacts with H₂S gas to precipitate black Lead Sulfide [PbS↓ + 2 CH₃COOH].",
      novelBand: "Aqueous Purple-Cabbage Anthocyanin (flavylium bio-chromophore) + Micro-dispersed SbCl₃ (0.5 wt%) chemo-complexation matrix.",
      impact: "Replaces toxic heavy metal salts with a renewable botanical chromophore and selective transition-metal coordination.",
      icon: FlaskConical,
    },
    {
      dimension: "Occupational Safety & Skin Contact",
      leadAcetate: "Severe Hazard: Lead is a cumulative neurotoxin, reproductive hazard, and suspected carcinogen (OSHA 29 CFR 1910.1025, CA Prop 65). Requires gloves; strict skin-contact prohibitions.",
      novelBand: "Safe & Non-Hazardous: Non-toxic natural plant extract. Formulation housed in a sealed, skin-separated cartridge with breathable PTFE diffusion window.",
      impact: "Eliminates toxic chemical exposure risk for refinery operators during daily 8-hour wrist wear.",
      icon: ShieldAlert,
    },
    {
      dimension: "Detection Limit (LOD) & Sensitivity",
      leadAcetate: "5.0 – 10.0 ppm effective LOD. Cannot reliably detect sub-ppm chronic leaks; prolonged accumulation required for 1–3 ppm visibility.",
      novelBand: "200 ppb (0.2 ppm) LOD. High dynamic range with linear ΔE_net chromatic response across 0.5 – 10.0 ppm.",
      impact: "Detects micro-leaks and acute sub-ppm threshold crossings before toxic ambient buildup occurs.",
      icon: Sparkles,
    },
    {
      dimension: "Measurement & Readout Method",
      leadAcetate: "Subjective Naked-Eye Inspection: Field worker compares darkened swatch against paper color card. Highly prone to lighting error, glare, and human parallax (±35% error).",
      novelBand: "Automated Smartphone CV Colorimetry: Algorithm calculates Euclidean chromatic distance in CIE L*a*b* (ΔE_ab / ΔE₀₀) with automatic white balance calibration.",
      impact: "Zero subjective human bias; delivers deterministic, mathematically auditable dosimetric readings.",
      icon: Eye,
    },
    {
      dimension: "Environmental Stability & Fading",
      leadAcetate: "Vulnerable to Oxidative Bleaching: PbS stains bleach and fade rapidly when exposed to ambient UV sunlight, ozone (O₃), or atmospheric SO₂.",
      novelBand: "Stable 3-Patch Differential Normalization: Uses active Strip A alongside Reference Patch B (humidity/pH) and Patch C (unreactive baseline).",
      impact: "Guarantees test integrity across 10%–95% RH swings and refinery weather conditions without false negatives.",
      icon: Scale,
    },
    {
      dimension: "Cross-Gas Interference",
      leadAcetate: "High cross-sensitivity to Sulfur Dioxide (SO₂), methyl mercaptans, and strong oxidizing industrial fumes.",
      novelBand: "Targeted selectivity: Chemo-complexation is tuned specifically to sulfide ion binding, filtering out typical petrochemical background VOCs.",
      impact: "Prevents costly false alarms in refinery sulfur recovery units (SRU) and crude distillation units.",
      icon: AlertTriangle,
    },
    {
      dimension: "Response Time & Kinetics",
      leadAcetate: "Slow progression: 10 to 30 minutes needed for visible contrast at low concentrations.",
      novelBand: "Rapid chromatic response: Detectable color shift occurs in < 60 seconds at threshold concentrations.",
      impact: "Enables instant shift-end triage and prompt evacuation notifications.",
      icon: Clock,
    },
    {
      dimension: "Regulatory Compliance & Audit Trail",
      leadAcetate: "Manual Paper Records: Vulnerable to lost sheets, unlogged shifts, delayed transcription, and zero automated compliance alerts.",
      novelBand: "Automated Cloud Dosimetry Ledger: QR serialization syncs instantly to refinery cloud, auto-updating 7d, 30d, and 90d OSHA cumulative TWA limits.",
      impact: "100% audit-ready digital compliance with zero administrative delay or clerical tampering.",
      icon: Database,
    },
    {
      dimension: "Disposal & Environmental Footprint",
      leadAcetate: "Hazardous Chemical Waste (RCRA D008 Toxic Waste). Requires regulated hazardous disposal containers and heavy-metal manifest protocols.",
      novelBand: "Eco-Friendly & Sustainable: Upcycled/recycled polyester wristband with organic bio-extract cartridge. Non-hazardous standard disposal.",
      impact: "Zero toxic waste disposal liability; aligns directly with corporate ESG and green industrial initiatives.",
      icon: Leaf,
    },
    {
      dimension: "Unit Economics & Maintenance",
      leadAcetate: "Low badge unit cost, but high overhead for hazardous waste disposal, manual record keeping, and potential worker compensation liabilities.",
      novelBand: "Ultra-low cost (< $0.50 per replacement cartridge) using agricultural bio-waste; reusable wristband chassis; zero electronic sensor maintenance.",
      impact: "High ROI and massive scalability across thousands of refinery workers and contractors.",
      icon: Coins,
    },
  ];

  // 2. Extraction Methodology Comparison Data
  const extractionComparisons = [
    {
      approach: "Aqueous Extraction (100% Water)",
      role: "Proposed Green Method",
      evidence: "Extracts polar anthocyanin pigments effectively using ultrasonic assistance without organic solvents.",
      limitations: "Extracts may spoil faster than alcohol-based methods; requires proper storage (amber bottle, cool temps).",
      status: "Selected Method",
      statusColor: "bg-teal-light text-teal-deep border-teal-deep/30",
    },
    {
      approach: "Ethanol/Methanol Extraction",
      role: "Traditional Solvent Method",
      evidence: "Commonly used in literature; provides higher yields of some hydrophobic compounds.",
      limitations: "Uses volatile organic solvents (VOCs) which are flammable, toxic, and environmentally harmful.",
      status: "Excluded (Safety/Environmental)",
      statusColor: "bg-gray-100 text-gray-700 border-gray-300",
    },
    {
      approach: "Direct pH 7 Adjustment during Extraction",
      role: "Immediate Neutralization",
      evidence: "Simplifies process by combining extraction and optimization into one step.",
      limitations: "Risks immediate degradation of anthocyanin during sonication and heating. Misses the optimal purple point which may be between pH 5 and 6.5.",
      status: "Excluded (Stability Risks)",
      statusColor: "bg-gray-100 text-gray-700 border-gray-300",
    },
    {
      approach: "Post-Extraction pH Screening (pH 5.0 - 7.0)",
      role: "Controlled Optimization",
      evidence: "Ensures extraction happens at natural acidic pH, then carefully adjusts to find the most stable purple baseline.",
      limitations: "Requires multiple sample divisions and careful titration with NaOH/Citric acid.",
      status: "Selected Method",
      statusColor: "bg-teal-light text-teal-deep border-teal-deep/30",
    },
  ];

  return (
    <div className="space-y-16">
      {/* ========================================================================= */}
      {/* SECTION 1: LEAD ACETATE VS. NOVEL RESEARCH BAND COMPARISON               */}
      {/* ========================================================================= */}
      <div className="space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-teal-deep bg-teal-light px-3 py-1 rounded-full border border-teal-deep/20">
            TECHNOLOGY BENCHMARK
          </span>
          <h3 className="font-display text-3xl sm:text-4xl uppercase tracking-tight text-charcoal">
            Industry Lead Acetate vs. Novel STRELA Dosimeter
          </h3>
          <p className="text-sm text-sage-muted leading-relaxed">
            Head-to-head technical evaluation comparing conventional toxic Lead Acetate (Pb(OAc)₂) badges against our laboratory-formulated Aqueous Anthocyanin + micro-SbCl₃ passive dosimeter band.
          </p>
        </div>

        {/* 4 Metric Highlight Cards */}
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
                    <span className="text-sage-muted font-medium">Industry Pb(OAc)₂:</span>
                    <span className="font-mono text-gray-700 font-semibold">{item.statLead}</span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-teal-deep font-bold">STRELA Band:</span>
                    <span className="font-mono text-charcoal font-bold">{item.statNovel}</span>
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
                Comprehensive Technical Specification Matrix
              </h4>
              <p className="text-xs text-sage mt-1">
                Quantitative chemical, toxicological, optical, and operational comparison across 10 industrial dimensions.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-full bg-red-950/80 text-red-300 border border-red-700/40">
                Legacy: Lead Acetate
              </span>
              <span className="px-2.5 py-1 rounded-full bg-teal-hover text-yellow-golden border border-yellow-golden/30">
                Novel: STRELA Research Band
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-warm-white border-b border-light-surface text-xs font-mono font-bold uppercase text-charcoal">
                  <th className="p-4 pl-6 w-[20%]">Dimension / Metric</th>
                  <th className="p-4 w-[28%] bg-red-50/40 border-x border-light-surface">
                    <div className="flex items-center gap-1.5 text-red-900">
                      <Biohazard className="w-4 h-4 text-red-600" />
                      <span>Industry Standard (Lead Acetate)</span>
                    </div>
                  </th>
                  <th className="p-4 w-[28%] bg-teal-light/40 border-r border-light-surface">
                    <div className="flex items-center gap-1.5 text-teal-deep">
                      <ShieldCheck className="w-4 h-4 text-teal-deep" />
                      <span>STRELA Novel Bio-Composite</span>
                    </div>
                  </th>
                  <th className="p-4 pr-6 w-[24%]">Impact & Advantage</th>
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
                            OPERATIONAL BENEFIT:
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
            Laboratory Chemistry Decisions
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: EXTRACTION METHODOLOGY COMPARISON                              */}
      {/* ========================================================================= */}
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-teal-deep">
            MOP CHEMICAL FORMULATION
          </span>
          <h3 className="font-display text-3xl uppercase tracking-tight text-charcoal">
            Extraction Methodology Comparison
          </h3>
          <p className="text-sm text-sage-muted">
            Evaluating alternative solvents and pH adjustment approaches for anthocyanin extraction.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-light-surface shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-warm-white border-b border-light-surface text-xs font-mono font-bold uppercase text-charcoal">
                  <th className="p-4 pl-6">Approach</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Rationale</th>
                  <th className="p-4">Limitations</th>
                  <th className="p-4 pr-6">Project Status</th>
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
