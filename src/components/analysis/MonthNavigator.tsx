import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface MonthNavigatorProps {
  months: string[]; // "YYYY-MM", ascending
  selectedMonth: string;
  onChange: (month: string) => void;
}

/** Shared page-level month picker — drives both the resolution-time chart and the defect × station matrix, so they always describe the same slice of data. */
export function MonthNavigator({ months, selectedMonth, onChange }: MonthNavigatorProps) {
  const index = months.indexOf(selectedMonth);
  const label = selectedMonth
    ? new Date(`${selectedMonth}-01T00:00:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : "";

  function go(delta: number) {
    const next = index + delta;
    if (next >= 0 && next < months.length) onChange(months[next]);
  }

  return (
    <div className="flex items-center gap-2 bg-white border border-hairline rounded-xl px-3 py-2 w-fit">
      <Calendar size={14} className="text-slate-light" />
      <span className="text-[12px] font-medium text-slate">Showing</span>
      <div className="flex items-center gap-1 bg-paper rounded-lg p-0.5">
        <button
          onClick={() => go(-1)}
          disabled={index <= 0}
          className="h-6 w-6 flex items-center justify-center rounded-md text-slate hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft size={13} />
        </button>
        <span className="text-[12px] font-semibold text-ink px-1.5 min-w-[100px] text-center">{label}</span>
        <button
          onClick={() => go(1)}
          disabled={index >= months.length - 1}
          className="h-6 w-6 flex items-center justify-center rounded-md text-slate hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Next month"
        >
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
