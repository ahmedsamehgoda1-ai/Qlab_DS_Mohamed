import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { DefectRecord } from "@/types";
import { stationPareto } from "@/utils/defectMetrics";
import { ChartCard } from "@/components/shared/ChartCard";

/**
 * Suggested addition: a Pareto chart of defects by production station, with
 * a cumulative-% line. Classic quality-engineering tool — tells engineers
 * which stations to fix first for the biggest reduction in overall defects
 * (the "vital few" vs the "trivial many").
 */
export function StationParetoChart({ defects }: { defects: DefectRecord[] }) {
  const data = stationPareto(defects).slice(0, 12); // top 12 stations keeps labels legible

  return (
    <ChartCard
      title="Defects by station — Pareto"
      accent="sky"
      height="h-96"
      infoText="Stations ranked by defect count, with a cumulative-% line. The stations left of where the line crosses ~80% are the highest-impact places to focus improvement efforts first."
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 5, right: 30, bottom: 60, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F5" />
          <XAxis
            dataKey="station"
            tick={{ fontSize: 10, fill: "#5B6B7C" }}
            stroke="#E4E9EF"
            angle={-35}
            textAnchor="end"
            interval={0}
            height={80}
          />
          <YAxis
            yAxisId="count"
            tick={{ fontSize: 11, fill: "#5B6B7C" }}
            stroke="#E4E9EF"
            label={{ value: "Defects", angle: -90, position: "insideLeft", fontSize: 10, fill: "#9FB0C3" }}
          />
          <YAxis
            yAxisId="pct"
            orientation="right"
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "#5B6B7C" }}
            stroke="#E4E9EF"
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            formatter={(value, key) =>
              key === "cumulativePct" ? [`${value}%`, "Cumulative"] : [`${Number(value).toLocaleString()}`, "Defects"]
            }
            contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#E4E9EF" }}
          />
          <Bar yAxisId="count" dataKey="count" fill="#4FA8E8" radius={[4, 4, 0, 0]} />
          <Line
            yAxisId="pct"
            type="monotone"
            dataKey="cumulativePct"
            stroke="#5B6EF5"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#5B6EF5" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
