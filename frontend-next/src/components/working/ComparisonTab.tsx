export default function ComparisonTab() {
  const comparisons = [
    {
      approach: "Aqueous Extraction (100% Water)",
      role: "Proposed Green Method",
      evidence: "Extracts polar anthocyanin pigments effectively using ultrasonic assistance.",
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
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <h3 className="font-display text-3xl uppercase tracking-tight text-charcoal">
          Extraction Methodology Comparison
        </h3>
        <p className="text-sm text-sage-muted mt-2">
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
              {comparisons.map((row, idx) => (
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
  );
}
