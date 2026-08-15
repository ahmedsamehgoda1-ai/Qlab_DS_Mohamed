import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { DefectRecord } from "@/types";
import { defectRateBy, RateDimension } from "@/utils/defectMetrics";
import { ChartCard } from "@/components/shared/ChartCard";

const DIMENSIONS: { id: RateDimension; label: string }[] = [
  { id: "carModel", label: "Model" },
  { id: "motorType", label: "Motor" },
  { id: "designPackage", label: "Package" },
];

const COLORS = ["#1C69D4", "#4FA8E8", "#16B8A6", "#5B6EF5", "#0E4C8C"];

/** Satisfies the case study's "analyze overall defect rates across car models, motor types, and design packages" requirement. */
export function DefectRateBreakdownChart({ defects }: { defects: DefectRecord[] }) {
  const [dimension, setDimension] = useState<RateDimension>("carModel");
  const data = defectRateBy(defects, dimension);

  return (
    <ChartCard
      title="Defect rate by variant"
      accent="blue"
      infoText="Total defect counts grouped by vehicle model, motor type, or design package — switch the dimension to see where quality issues concentrate."
      rightSlot={
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
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F5" />
          <XAxis dataKey="key" tick={{ fontSize: 11, fill: "#5B6B7C" }} stroke="#E4E9EF" />
          <YAxis tick={{ fontSize: 11, fill: "#5B6B7C" }} stroke="#E4E9EF" />
          <Tooltip
            formatter={(value) => [`${Number(value).toLocaleString()} defects`, "Count"]}
            contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#E4E9EF" }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={entry.key} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
