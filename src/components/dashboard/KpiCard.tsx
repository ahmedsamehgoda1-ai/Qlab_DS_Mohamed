import { LucideIcon } from "lucide-react";
import { AccentName } from "@/types";
import { ACCENTS } from "./accents";

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  delta?: string;
  positive?: boolean;
  accent?: AccentName;
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  delta,
  positive = true,
  accent = "blue",
}: KpiCardProps) {
  const c = ACCENTS[accent];
  return (
    <div className="relative bg-white border border-hairline rounded-xl p-5 shadow-[0_1px_2px_rgba(10,22,38,0.04)] overflow-hidden">
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, ${c.fg}, transparent)` }}
      />
      <div className="flex items-center justify-between">
        <div
          className="h-9 w-9 rounded-lg flex items-center justify-center"
          style={{ background: c.bg }}
        >
          <Icon size={18} style={{ color: c.fg }} />
        </div>
        {delta && (
          <span
            className={`text-[11px] font-semibold px-2 py-1 rounded-full ${
              positive ? "bg-[#E9F7EF] text-[#1F9254]" : "bg-[#FDECEC] text-[#C4342E]"
            }`}
          >
            {delta}
          </span>
        )}
      </div>
      <div className="mt-4 text-[26px] font-semibold text-ink tracking-tight">{value}</div>
      <div className="text-[13px] text-slate mt-1">{label}</div>
    </div>
  );
}
