import { useState } from "react";
import { NavId } from "@/types";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { AnalysisView } from "@/components/analysis/AnalysisView";
import { DefectsView } from "@/components/defects/DefectsView";
import { InfoView } from "@/components/info/InfoView";

// Plain lookup tables instead of a router library: there are exactly 4 tabs,
// none with sub-routes or deep links, so react-router would add a dependency
// and boilerplate for something a Record<NavId, ...> already does in two
// objects. If URL-addressable tabs or nested routes are ever needed, this is
// the seam to swap in a router at.
const PAGE_META: Record<NavId, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Production quality overview — BMW iX0, Plant Debrecen",
  },
  analysis: {
    title: "Analysis",
    subtitle: "Outlier detection and the flagged-for-review tracking dashboard",
  },
  defects: {
    title: "Defects",
    subtitle: "Searchable, sortable defect log",
  },
  info: {
    title: "Documentation",
    subtitle: "Assumptions, statistical methods, and reflection",
  },
};

const VIEWS: Record<NavId, () => JSX.Element> = {
  dashboard: DashboardView,
  analysis: AnalysisView,
  defects: DefectsView,
  info: InfoView,
};

export default function App() {
  const [active, setActive] = useState<NavId>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const meta = PAGE_META[active];
  const ActiveView = VIEWS[active];

  return (
    <div className="flex h-full min-h-screen w-full bg-paper font-sans">
      <Sidebar active={active} setActive={setActive} open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar title={meta.title} subtitle={meta.subtitle} setOpen={setSidebarOpen} />
        <main className="flex-1 overflow-auto">
          <ActiveView />
        </main>
      </div>
    </div>
  );
}
