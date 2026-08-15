import { Gauge, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import { defects } from "@/data/loadDefects";
import { computeKpis } from "@/utils/defectMetrics";
import { KpiCard } from "./KpiCard";
import { TopDefectsPieChart } from "./charts/TopDefectsPieChart";
import { SeverityBellChart } from "./charts/SeverityBellChart";
import { DefectRateBreakdownChart } from "./charts/DefectRateBreakdownChart";
import { StationParetoChart } from "./charts/StationParetoChart";

export function DashboardView() {
  const kpis = computeKpis(defects);

  return (
    <div className="p-5 md:p-8 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={Gauge} label="Total defects" value={kpis.totalDefects.toLocaleString()} accent="blue" />
        <KpiCard icon={Clock} label="Avg. resolution (resolved)" value={`${kpis.avgResolutionDaysResolved.toFixed(2)} d`} accent="sky" />
        <KpiCard icon={CheckCircle2} label="Root cause identified" value={`${(kpis.rootCauseRate * 100).toFixed(1)}%`} accent="teal" />
        <KpiCard icon={TrendingUp} label="Open / unresolved" value={kpis.openCount.toLocaleString()} delta={`${(kpis.openPct * 100).toFixed(1)}%`} positive={false} accent="indigo" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <TopDefectsPieChart defects={defects} />
        <SeverityBellChart defects={defects} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <DefectRateBreakdownChart defects={defects} />
        <StationParetoChart defects={defects} />
      </div>
    </div>
  );
}
