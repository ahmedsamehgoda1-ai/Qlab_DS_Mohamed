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
import { severityDistribution } from "@/utils/defectMetrics";
import { ChartCard } from "@/components/shared/ChartCard";

/**
 * Severity Rating in the source data is an INVERTED scale: 1 is the most
 * extreme severity ("Extreme - safety/legal/inoperable"), 6 is the least
 * severe ("Medium - next service visit"). The distribution across 1-6 is
 * shown as bars with a smoothed line overlay to read the underlying shape.
 */
export function SeverityBellChart({ defects }: { defects: DefectRecord[] }) {
  const data = severityDistribution(defects);

  return (
    <ChartCard
      title="Severity distribution"
      accent="teal"
      infoText="Severity Rating is an inverted scale: 1 = most extreme (safety/legal/inoperable), 6 = least severe (next service visit). Bars show record counts per rating; the line traces the overall shape."
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F5" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#5B6B7C" }}
            stroke="#E4E9EF"
            label={{ value: "Severity rating (1 = most extreme)", position: "insideBottom", offset: -2, fontSize: 10, fill: "#9FB0C3" }}
          />
          <YAxis tick={{ fontSize: 11, fill: "#5B6B7C" }} stroke="#E4E9EF" />
          <Tooltip
            formatter={(value) => [`${Number(value).toLocaleString()} defects`, "Count"]}
            labelFormatter={(label, payload) =>
              `Rating ${label} — ${(payload?.[0]?.payload as any)?.category ?? ""}`
            }
            contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#E4E9EF" }}
          />
          <Bar dataKey="count" fill="#16B8A6" fillOpacity={0.25} radius={[4, 4, 0, 0]} />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#1C69D4"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#1C69D4" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
