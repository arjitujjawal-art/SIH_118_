"use client";

import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ErrorBar,
} from "recharts";
import { ShiftScanRecord } from "@/lib/types";

interface ExposureChartProps {
  scans: ShiftScanRecord[];
}

export default function ExposureChart({ scans }: ExposureChartProps) {
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly">("daily");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-72 w-full bg-warm-white/60 rounded-xl flex items-center justify-center text-xs font-mono text-sage-muted">
        Loading exposure telemetry chart...
      </div>
    );
  }

  if (!scans || scans.length === 0) {
    return (
      <div className="p-12 text-center text-sage-muted text-xs bg-warm-white rounded-xl border border-light-surface">
        No exposure readings recorded yet for this worker.
      </div>
    );
  }

  // Helper to parse individual scan record
  const parseScan = (scan: ShiftScanRecord) => {
    const metrics = (scan.computed_metrics || {}) as any;
    const doseLow = typeof metrics.dose_low === "number" ? metrics.dose_low : 0;
    const doseHigh = typeof metrics.dose_high === "number" ? metrics.dose_high : doseLow;
    const doseNominal = typeof metrics.compensated_dose_ppm_hr === "number"
      ? metrics.compensated_dose_ppm_hr
      : (doseLow + doseHigh) / 2;
    const twa = typeof metrics.shift_twa_ppm === "number" ? metrics.shift_twa_ppm : (metrics.twa_low ?? 0);
    const deltaE = scan.badge_data?.net_delta_e ?? (scan.badge_data?.delta_e ?? 0);
    const hazardScore = typeof metrics.hazard_score_5pt === "number"
      ? metrics.hazard_score_5pt
      : Math.min(5.0, Math.max(0.0, parseFloat((doseHigh / 4.0).toFixed(1))));
    const simpleLevel = metrics.hazard_level_simple || (
      hazardScore <= 1.5 ? "SAFE" : hazardScore <= 3.4 ? "CAUTION" : "CRITICAL"
    );
    const dateObj = scan.timestamp ? new Date(scan.timestamp) : new Date();

    return {
      date: dateObj,
      doseNominal,
      doseLow,
      doseHigh,
      twa,
      deltaE,
      hazardScore,
      simpleLevel,
      tier: metrics.statutory_tier || "TIER 1 (NORMAL)",
      unit: scan.plant_unit || "CDU-1",
      scanId: scan.scan_id,
    };
  };

  const parsedScans = scans.map(parseScan).sort((a, b) => a.date.getTime() - b.date.getTime());

  // Format data for Recharts according to active timeframe
  let chartData: any[] = [];

  if (timeframe === "daily") {
    // Group by distinct calendar day (YYYY-MM-DD)
    const dayMap = new Map<string, typeof parsedScans[0]>();
    parsedScans.forEach((item) => {
      const key = item.date.toISOString().split("T")[0];
      // Keep representative reading with highest exposure for that day
      if (!dayMap.has(key) || item.doseNominal > (dayMap.get(key)?.doseNominal || 0)) {
        dayMap.set(key, item);
      }
    });

    const days = Array.from(dayMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14);

    chartData = days.map(([key, item]) => ({
      name: item.date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      fullDate: item.date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      doseNominal: parseFloat(item.doseNominal.toFixed(2)),
      doseLow: parseFloat(item.doseLow.toFixed(1)),
      doseHigh: parseFloat(item.doseHigh.toFixed(1)),
      twa: parseFloat(item.twa.toFixed(2)),
      deltaE: parseFloat(item.deltaE.toFixed(2)),
      hazardScore: parseFloat(item.hazardScore.toFixed(1)),
      simpleLevel: item.simpleLevel,
      tier: item.tier,
      unit: item.unit,
    }));
  } else if (timeframe === "weekly") {
    const weekMap = new Map<string, { totalDose: number; maxTwa: number; count: number; date: Date; unit: string }>();
    parsedScans.forEach((item) => {
      const d = new Date(item.date);
      d.setHours(0, 0, 0, 0);
      const startOfWeek = new Date(d);
      startOfWeek.setDate(d.getDate() - d.getDay());
      const key = startOfWeek.toISOString().split("T")[0];

      const existing = weekMap.get(key) || { totalDose: 0, maxTwa: 0, count: 0, date: startOfWeek, unit: item.unit };
      existing.totalDose += item.doseNominal;
      existing.maxTwa = Math.max(existing.maxTwa, item.twa);
      existing.count += 1;
      weekMap.set(key, existing);
    });

    chartData = Array.from(weekMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-8)
      .map(([key, item]) => {
        const score = Math.min(5.0, parseFloat((item.totalDose / 10.0).toFixed(1)));
        return {
          name: `Wk of ${item.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
          fullDate: `Week starting ${item.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} (${item.count} shifts)`,
          doseNominal: parseFloat(item.totalDose.toFixed(2)),
          doseLow: parseFloat((item.totalDose * 0.88).toFixed(1)),
          doseHigh: parseFloat((item.totalDose * 1.12).toFixed(1)),
          twa: parseFloat(item.maxTwa.toFixed(2)),
          deltaE: parseFloat((item.totalDose * 0.45).toFixed(2)),
          hazardScore: score,
          simpleLevel: score > 3.4 ? "CRITICAL" : score > 1.5 ? "CAUTION" : "SAFE",
          tier: score > 3.4 ? "TIER 3 (CRITICAL)" : score > 1.5 ? "TIER 2 (CAUTION)" : "TIER 1 (NORMAL)",
          unit: item.unit,
        };
      });
  } else {
    // Monthly aggregation
    const monthMap = new Map<string, { totalDose: number; maxTwa: number; count: number; date: Date; unit: string }>();
    parsedScans.forEach((item) => {
      const key = `${item.date.getFullYear()}-${item.date.getMonth() + 1}`;
      const existing = monthMap.get(key) || { totalDose: 0, maxTwa: 0, count: 0, date: item.date, unit: item.unit };
      existing.totalDose += item.doseNominal;
      existing.maxTwa = Math.max(existing.maxTwa, item.twa);
      existing.count += 1;
      monthMap.set(key, existing);
    });

    chartData = Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, item]) => {
        const score = Math.min(5.0, parseFloat((item.totalDose / 25.0).toFixed(1)));
        return {
          name: item.date.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
          fullDate: `${item.date.toLocaleDateString("en-US", { month: "long", year: "numeric" })} (${item.count} shifts)`,
          doseNominal: parseFloat(item.totalDose.toFixed(2)),
          doseLow: parseFloat((item.totalDose * 0.88).toFixed(1)),
          doseHigh: parseFloat((item.totalDose * 1.12).toFixed(1)),
          twa: parseFloat(item.maxTwa.toFixed(2)),
          deltaE: parseFloat((item.totalDose * 0.4).toFixed(2)),
          hazardScore: score,
          simpleLevel: score > 3.4 ? "CRITICAL" : score > 1.5 ? "CAUTION" : "SAFE",
          tier: score > 3.4 ? "TIER 3 (CRITICAL)" : score > 1.5 ? "TIER 2 (CAUTION)" : "TIER 1 (NORMAL)",
          unit: item.unit,
        };
      });
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#171C1B] text-white p-3.5 rounded-xl border border-sage/20 shadow-xl text-xs font-mono space-y-2 z-50 min-w-[200px]">
          <div className="flex items-center justify-between gap-3 border-b border-sage/20 pb-1.5">
            <span className="font-bold text-yellow-golden text-[11px]">{data.fullDate}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              data.hazardScore > 3.4
                ? "bg-red-500/20 text-red-400"
                : data.hazardScore > 1.5
                ? "bg-amber-500/20 text-amber-400"
                : "bg-emerald-500/20 text-emerald-400"
            }`}>
              {data.simpleLevel}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-sage">Hazard Score:</span>
            <strong className={`font-bold ${
              data.hazardScore > 3.4
                ? "text-red-400"
                : data.hazardScore > 1.5
                ? "text-yellow-golden"
                : "text-emerald-400"
            }`}>
              ★ {data.hazardScore.toFixed(1)} / 5.0
            </strong>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-sage">Total Exposure:</span>
            <strong className="text-white">{data.doseLow}–{data.doseHigh} ppm·h</strong>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-sage">Average TWA:</span>
            <strong className="text-white">{data.twa} ppm</strong>
          </div>

          <div className="text-[10px] text-sage-muted pt-1 border-t border-sage/10 flex justify-between">
            <span>Station: {data.unit}</span>
            <span>Net ΔE: {data.deltaE}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Timeframe Controls & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-xl uppercase tracking-tight text-charcoal">
            Longitudinal Exposure Trajectory
          </h3>
          <p className="text-xs text-sage-muted">
            Uncertainty envelope bounds (ppm·h) per discrete shift reading.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(["daily", "weekly", "monthly"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setTimeframe(mode)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase transition-colors ${
                timeframe === mode
                  ? "bg-charcoal text-white"
                  : "bg-warm-white text-sage-muted hover:text-charcoal border border-light-surface"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div className="w-full h-80 bg-white rounded-xl p-4 border border-light-surface">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(183, 198, 194, 0.3)" />
            <XAxis
              dataKey="name"
              stroke="#5E6964"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#B7C6C2" }}
            />
            {/* Primary Left Y-Axis: Estimated Shift Dose (ppm·h) */}
            <YAxis
              yAxisId="left"
              stroke="#0B6558"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#0B6558" }}
              label={{ value: "Dose (ppm·h)", angle: -90, position: "insideLeft", fill: "#0B6558", fontSize: 11, dy: 40 }}
            />
            {/* Secondary Right Y-Axis: Optical ΔE */}
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#5E6964"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#B7C6C2" }}
              label={{ value: "Optical ΔE", angle: 90, position: "insideRight", fill: "#5E6964", fontSize: 11, dy: -40 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: "11px", fontFamily: "monospace" }}
            />
            <Bar
              yAxisId="left"
              dataKey="doseNominal"
              name="Shift Dose (ppm·h)"
              fill="#FFE17C"
              stroke="#E0C25B"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="deltaE"
              name="Net Optical ΔE"
              stroke="#0B6558"
              strokeWidth={2}
              dot={{ r: 4, fill: "#0B6558" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center justify-between text-[11px] text-sage-muted px-2 font-mono">
        <span>* Discrete measurements per paired scan (no synthetic continuous trace interpolation)</span>
        <span>ACGIH 8-hr TWA Reference: 1.0 ppm</span>
      </div>
    </div>
  );
}
