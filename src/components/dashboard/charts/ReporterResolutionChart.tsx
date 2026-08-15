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
import { resolutionByReporter } from "@/utils/defectMetrics";
import { ChartCard } from "./ChartCard";

const COLORS = ["#5B6EF5", "#1C69D4", "#4FA8E8", "#16B8A6", "#0E4C8C"];

/** Explicitly requested in the case study brief: "solution time per reporter". */
export function ReporterResolutionChart({ defects }: { defects: DefectRecord[] }) {
  const data = resolutionByReporter(defects);

  return (
    <ChartCard
      title="Resolution time by reporter"
      accent="indigo"
      height="h-64"
      infoText="Average effective resolution time (including open, ongoing cases) per reporter — surfaces differences in handling speed or defect complexity across the team."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F5" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: "#5B6B7C" }} stroke="#E4E9EF" />
          <YAxis
            type="category"
            dataKey="reporter"
            width={100}
            tick={{ fontSize: 11, fill: "#5B6B7C" }}
            stroke="#E4E9EF"
          />
          <Tooltip
            formatter={(value, _key, entry) => [
              `${Number(value).toFixed(2)} days avg (${(entry?.payload as any)?.count ?? 0} defects)`,
              "Resolution",
            ]}
            contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#E4E9EF" }}
          />
          <Bar dataKey="avgDays" radius={[0, 6, 6, 0]}>
            {data.map((entry, i) => (
              <Cell key={entry.reporter} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
