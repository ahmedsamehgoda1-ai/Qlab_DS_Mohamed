import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from "recharts";
import { DefectRecord } from "@/types";
import { defectRateBy, RateDimension } from "@/utils/defectMetrics";
import { ChartCard } from "@/components/shared/ChartCard";
import { AXIS_LINE_COLOR, GRID_COLOR, AXIS_TICK_STYLE, TOOLTIP_STYLE, CHART_PALETTE } from "@/components/shared/chartTheme";

const DIMENSIONS: { id: RateDimension; label: string }[] = [
  { id: "carModel", label: "Model" },
  { id: "motorType", label: "Motor" },
  { id: "designPackage", label: "Package" },
];

type ValueMode = "count" | "pct";

/** Satisfies the case study's "analyze overall defect rates across car models, motor types, and design packages" requirement. */
export function DefectRateBreakdownChart({ defects }: { defects: DefectRecord[] }) {
  const [dimension, setDimension] = useState<RateDimension>("carModel");
  const [valueMode, setValueMode] = useState<ValueMode>("count");
  const data = defectRateBy(defects, dimension);

  return (
    <ChartCard
      title="Defect rate by variant"
      accent="blue"
      infoText="This dataset has no production-volume field — we know how many defects were reported per model/motor/package, but not how many units of each were actually built. So this can't show a true defect rate (defects per unit); '% of total' just reframes the same counts as a relative share, which doesn't correct for one variant simply having more units on the line."
      rightSlot={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="flex gap-1 bg-paper rounded-lg p-0.5">
            {(["count", "pct"] as ValueMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setValueMode(v)}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors ${
                  valueMode === v ? "bg-white text-bmw-blue shadow-sm" : "text-slate-light hover:text-slate"
                }`}
              >
                {v === "count" ? "Count" : "% of total"}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-paper rounded-lg p-0.5">
            {DIMENSIONS.map((d) => (
              <button
                key={d.id}
                onClick={() => setDimension(d.id)}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors ${
                  dimension === d.id ? "bg-white text-bmw-blue shadow-sm" : "text-slate-light hover:text-slate"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
          <XAxis dataKey="key" tick={AXIS_TICK_STYLE} stroke={AXIS_LINE_COLOR} />
          <YAxis
            tick={AXIS_TICK_STYLE}
            stroke={AXIS_LINE_COLOR}
            tickFormatter={(v) => (valueMode === "pct" ? `${v}%` : v)}
          />
          <Tooltip
            formatter={(_value, _name, entry: any) =>
              valueMode === "pct"
                ? [`${entry.payload.pct.toFixed(1)}%`, "Share of total"]
                : [`${entry.payload.count.toLocaleString()} defects`, "Count"]
            }
            contentStyle={TOOLTIP_STYLE}
          />
          <Bar dataKey={valueMode === "pct" ? "pct" : "count"} radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={entry.key} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
