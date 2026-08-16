import { useMemo, useState } from "react";
import { defects } from "@/data/loadDefects";
import { FlaggedOutlier } from "@/types";
import { MonthNavigator } from "./MonthNavigator";
import { ResolutionTimeChart } from "./charts/ResolutionTimeChart";
import { ProcessContainmentAnalysis } from "./ProcessContainmentAnalysis";
import { TrackingDashboard } from "./TrackingDashboard";
import { ProcessContainmentInsight } from "./ProcessContainmentInsight";

export function AnalysisView() {
  // Flagged-outlier store lives here — shared between the chart (which
  // writes flags) and the Tracking Dashboard below it (which reads/edits
  // them), so the list updates live as records are flagged or unflagged.
  const [flagged, setFlagged] = useState<Record<string, FlaggedOutlier>>({});

  function handleFlag(entry: FlaggedOutlier) {
    setFlagged((prev) => ({ ...prev, [entry.id]: entry }));
  }
  function handleUnflag(id: string) {
    setFlagged((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }
  function handleUpdateComment(id: string, comment: string) {
    setFlagged((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], comment } } : prev));
  }

  // Shared month selection — both the resolution-time chart and the
  // defect × station matrix describe the same slice of data at once,
  // rather than each having its own independent month picker.
  const months = useMemo(() => {
    const set = new Set(defects.map((d) => d.date.slice(0, 7)));
    return [...set].sort();
  }, []);
  const [selectedMonth, setSelectedMonth] = useState<string>(months[months.length - 1] ?? "");
  const monthDefects = useMemo(() => defects.filter((d) => d.date.slice(0, 7) === selectedMonth), [selectedMonth]);
  const monthLabel = selectedMonth
    ? new Date(`${selectedMonth}-01T00:00:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : "";

  // Shared between the containment table and Process Containment Insight below it —
  // the AI should always be reasoning about the exact same slice of data
  // the table is currently showing, not silently defaulting to something
  // else when the table is switched to "all time".
  const [containmentScope, setContainmentScope] = useState<"month" | "all-time">("month");
  const containmentActiveLabel = containmentScope === "month" ? monthLabel : "all time";

  return (
    <div className="p-5 md:p-8 space-y-6">
      <MonthNavigator months={months} selectedMonth={selectedMonth} onChange={setSelectedMonth} />

      <ResolutionTimeChart
        defects={defects}
        selectedMonth={selectedMonth}
        flagged={flagged}
        onFlag={handleFlag}
        onUnflag={handleUnflag}
        onUpdateComment={handleUpdateComment}
      />

      <TrackingDashboard
        items={Object.values(flagged)}
        onUnflag={handleUnflag}
        onUpdateComment={handleUpdateComment}
      />

      <ProcessContainmentAnalysis
        allDefects={defects}
        monthDefects={monthDefects}
        monthLabel={monthLabel}
        scope={containmentScope}
        onScopeChange={setContainmentScope}
      />

      <ProcessContainmentInsight
        flaggedItems={Object.values(flagged)}
        allDefects={defects}
        monthDefects={monthDefects}
        scope={containmentScope}
        activeLabel={containmentActiveLabel}
      />
    </div>
  );
}
