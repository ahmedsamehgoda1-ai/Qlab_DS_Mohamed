import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { AlertTriangle, ShieldAlert, Info as InfoIcon } from "lucide-react";
import { DefectRecord } from "@/types";
import { computeProcessContainment, ProcessContainmentRow } from "@/utils/defectMetrics";
import { ChartCard } from "@/components/shared/ChartCard";
import { AXIS_LINE_COLOR, GRID_COLOR, AXIS_TICK_STYLE, TOOLTIP_STYLE } from "@/components/shared/chartTheme";
import { STATUS_RED, STATUS_AMBER } from "@/components/shared/statusColors";

const COLORS = {
  containment: "#1C69D4",
  finalQuality: "#E8B33A",
  other: "#E4443A",
};

function SignalBadge({ signal }: { signal: "high-containment" | "potential-escape" | "data-quality-concern" }) {
  if (signal === "data-quality-concern") {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
        style={{ background: STATUS_RED.bg, color: STATUS_RED.fg }}
      >
        <ShieldAlert size={10} /> Data-quality concern
      </span>
    );
  }
  if (signal === "potential-escape") {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
        style={{ background: STATUS_AMBER.bg, color: STATUS_AMBER.fg }}
      >
        <AlertTriangle size={10} /> Potential escape
      </span>
    );
  }
  return <span className="text-[10.5px] text-slate-light">High containment</span>;
}

export function ProcessContainmentAnalysis({
  allDefects,
  monthDefects,
  monthLabel,
  scope,
  onScopeChange,
}: {
  allDefects: DefectRecord[];
  monthDefects: DefectRecord[];
  monthLabel: string;
  scope: "month" | "all-time";
  onScopeChange: (scope: "month" | "all-time") => void;
}) {
  // Scope is owned by the parent (AnalysisView), not local state here —
  // Process Containment Insight below needs to reason about the exact same slice of
  // data this table is showing, so both read from one shared value instead
  // of risking the AI explaining a different scope than what's on screen.
  const activeDefects = scope === "month" ? monthDefects : allDefects;
  const activeLabel = scope === "month" ? monthLabel : "all time";

  // Row order is always the all-time ranking, not whichever scope is on
  // screen — otherwise switching Month <-> All time (or even just paging
  // between months) reshuffles every row, since a defect's rank by count
  // can differ month to month. Keeping a fixed order means only the bars
  // and percentages change when you switch scope, not the layout itself.
  const allTimeRows = useMemo(() => computeProcessContainment(allDefects), [allDefects]);
  const canonicalOrder = useMemo(() => allTimeRows.map((r) => r.defect), [allTimeRows]);

  const scopedRows = useMemo(() => computeProcessContainment(activeDefects), [activeDefects]);
  const rows = useMemo(() => {
    const byDefect = new Map(scopedRows.map((r) => [r.defect, r]));
    return canonicalOrder
      .map((name) => byDefect.get(name))
      .filter((r): r is ProcessContainmentRow => Boolean(r));
  }, [scopedRows, canonicalOrder]);

  const chartData = rows.map((r) => ({
    defect: r.defect,
    "Process containment": Math.round(r.processContainmentPct * 10) / 10,
    "Final Quality": Math.round(r.finalQualityPct * 10) / 10,
    Other: Math.round(r.otherPct * 10) / 10,
  }));

  return (
    <ChartCard
      title={`Defect × Station — process containment — ${activeLabel}`}
      accent="indigo"
      height="h-auto"
      infoText={`Expected stations per defect come from manufacturing process knowledge, not a statistical guess — a defect could never plausibly occur at just any station, so 'expected' has to be domain-defined. Every count and percentage below is still calculated live from ${scope === "month" ? "this month's" : "the full dataset's"} records; only the station-to-defect mapping itself is fixed.`}
      rightSlot={
        <div className="flex gap-1 bg-paper rounded-lg p-0.5">
          {(["month", "all-time"] as const).map((s) => (
            <button
              key={s}
              onClick={() => onScopeChange(s)}
              className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors ${
                scope === s ? "bg-white text-bmw-blue shadow-sm" : "text-slate-light hover:text-slate"
              }`}
            >
              {s === "month" ? "Month" : "All time"}
            </button>
          ))}
        </div>
      }
    >
      <div className="space-y-6">
        {/* 100% stacked bar */}
        <div style={{ height: Math.max(280, rows.length * 34 + 60) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={AXIS_TICK_STYLE}
                stroke={AXIS_LINE_COLOR}
              />
              <YAxis
                type="category"
                dataKey="defect"
                width={150}
                tick={AXIS_TICK_STYLE}
                stroke={AXIS_LINE_COLOR}
              />
              <Tooltip
                formatter={(value: number, name: string) => [`${value}%`, name]}
                contentStyle={TOOLTIP_STYLE}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} iconSize={10} />
              <Bar dataKey="Process containment" stackId="a" fill={COLORS.containment} />
              <Bar dataKey="Final Quality" stackId="a" fill={COLORS.finalQuality} />
              <Bar dataKey="Other" stackId="a" fill={COLORS.other} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* table */}
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-hairline">
                <th className="text-left font-semibold text-slate uppercase tracking-wide text-[10.5px] px-3 py-2">Defect</th>
                <th className="text-right font-semibold text-slate uppercase tracking-wide text-[10.5px] px-3 py-2">Total</th>
                <th className="text-right font-semibold text-slate uppercase tracking-wide text-[10.5px] px-3 py-2">Containment</th>
                <th className="text-right font-semibold text-slate uppercase tracking-wide text-[10.5px] px-3 py-2">Final Quality</th>
                <th className="text-right font-semibold text-slate uppercase tracking-wide text-[10.5px] px-3 py-2">Other</th>
                <th className="text-left font-semibold text-slate uppercase tracking-wide text-[10.5px] px-3 py-2">Expected stations</th>
                <th className="text-left font-semibold text-slate uppercase tracking-wide text-[10.5px] px-3 py-2">Signal</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.defect} className="border-b border-[#F0F3F7] last:border-0 hover:bg-[#FAFBFD]">
                  <td className="px-3 py-2 font-medium text-ink whitespace-nowrap">{r.defect}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-[#26313D]">{r.total.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium" style={{ color: COLORS.containment }}>
                    {r.processContainmentPct.toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium" style={{ color: "#9A7A1E" }}>
                    {r.finalQualityPct.toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium" style={{ color: r.otherPct > 0 ? COLORS.other : "#9FB0C3" }}>
                    {r.otherPct.toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 text-slate-light whitespace-nowrap">
                    {r.expectedStations.length > 0
                      ? r.expectedStations.map((s) => s.station).join(", ")
                      : "— none mapped —"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <SignalBadge signal={r.signal} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-start gap-2 text-[11px] text-slate-light bg-paper rounded-lg px-3 py-2.5">
          <InfoIcon size={13} className="shrink-0 mt-0.5" />
          <p>
            <strong className="text-slate">High containment</strong> → the defect is being caught where the
            process expects it; a prevention/root-cause focus makes sense.{" "}
            <strong className="text-slate">Potential escape</strong> → a substantial share is only caught at
            Final Quality — worth investigating whether earlier detection is failing, though this is a soft
            signal, not a confirmed escape (some defects are only visible once the vehicle is fully assembled).{" "}
            <strong className="text-slate">Data-quality concern</strong> → most cases fall outside both the
            expected stations and Final Quality — a stronger signal that the process mapping itself may not
            match reality, worth checking before treating the pattern as a real production issue. No
            production-volume data exists in this dataset, so these are case counts and detection percentages
            only — not true defect rates. Process Containment Insight below explains <em>why</em> a
            potential-escape or data-quality-concern signal might be happening, generated fresh
            from this table each time — not written in advance.
          </p>
        </div>
      </div>
    </ChartCard>
  );
}
