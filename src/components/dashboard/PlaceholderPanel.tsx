import { AccentName } from "@/types";
import { ACCENTS } from "./accents";

interface PlaceholderPanelProps {
  title: string;
  height?: string;
  note: string;
  accent?: AccentName;
}

export function PlaceholderPanel({
  title,
  height = "h-72",
  note,
  accent = "blue",
}: PlaceholderPanelProps) {
  const c = ACCENTS[accent];
  return (
    <div className={`bg-white border border-hairline rounded-xl p-5 ${height} flex flex-col`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.fg }} />
          <h3 className="text-[14px] font-semibold text-ink">{title}</h3>
        </div>
        <span className="text-[11px] text-slate-light">chart placeholder</span>
      </div>
      <div
        className="flex-1 rounded-lg border border-dashed flex items-center justify-center"
        style={{ borderColor: "#D7E0EA", background: "#FAFBFD" }}
      >
        <span className="text-[12px] text-slate-light">{note}</span>
      </div>
    </div>
  );
}
