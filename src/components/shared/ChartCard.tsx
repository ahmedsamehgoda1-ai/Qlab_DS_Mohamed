import { ReactNode } from "react";
import { Info } from "lucide-react";
import { AccentName } from "@/types";
import { ACCENTS } from "@/components/dashboard/accents";

interface ChartCardProps {
  title: string;
  accent?: AccentName;
  height?: string;
  infoText?: string;
  rightSlot?: ReactNode;
  children: ReactNode;
}

/** Shared frame for every dashboard chart: title, color dot, optional info tooltip and header control. */
export function ChartCard({
  title,
  accent = "blue",
  height = "h-80",
  infoText,
  rightSlot,
  children,
}: ChartCardProps) {
  const c = ACCENTS[accent];
  return (
    <div className={`bg-white border border-hairline rounded-xl p-5 ${height} flex flex-col`}>
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: c.fg }} />
          <h3 className="text-[14px] font-semibold text-ink truncate">{title}</h3>
          {infoText && (
            <span className="group relative shrink-0">
              <Info size={13} className="text-slate-light cursor-help" />
              <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 rounded-lg bg-navy-900 text-white text-[11px] leading-relaxed px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg">
                {infoText}
              </span>
            </span>
          )}
        </div>
        {rightSlot}
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
