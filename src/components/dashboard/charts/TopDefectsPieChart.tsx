import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DefectRecord } from "@/types";
import { topDefectsPie } from "@/utils/defectMetrics";
import { ChartCard } from "@/components/shared/ChartCard";

const COLORS = ["#1C69D4", "#16B8A6", "#5B6EF5", "#4FA8E8", "#0E4C8C", "#9FB0C3"];

export function TopDefectsPieChart({ defects }: { defects: DefectRecord[] }) {
  const data = topDefectsPie(defects, 5);
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <ChartCard
      title="Top 5 defects"
      accent="indigo"
      infoText="The 5 most frequent defect names by record count. Every other defect type is grouped into 'Others' so rare defects don't clutter the view."
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="48%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={1.5}
          >
            {data.map((entry, i) => (
              <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [
              `${Number(value).toLocaleString()} (${((Number(value) / total) * 100).toFixed(1)}%)`,
              name,
            ]}
            contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#E4E9EF" }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
