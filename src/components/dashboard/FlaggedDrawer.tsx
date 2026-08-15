import { useState } from "react";
import { Flag, X } from "lucide-react";
import { FlaggedOutlier } from "@/types";

interface FlaggedDrawerProps {
  items: FlaggedOutlier[];
  onUnflag: (id: string) => void;
  onUpdateComment: (id: string, comment: string) => void;
}

/**
 * A persistent side tab (right edge of the viewport) that expands into a
 * drawer listing every flagged outlier with its comment. A lightweight
 * preview of Task 3's full tracking dashboard — this list currently holds
 * outliers flagged from the resolution-time chart specifically.
 */
export function FlaggedDrawer({ items, onUnflag, onUpdateComment }: FlaggedDrawerProps) {
  const [open, setOpen] = useState(false);
  const count = items.length;
  const sorted = [...items].sort((a, b) => b.flaggedAt.localeCompare(a.flaggedAt));

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setOpen(false)} />}

      {/* vertical edge tab */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`fixed top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-2 rounded-l-xl bg-navy-900 text-white px-2.5 py-4 shadow-lg transition-[right] duration-300 ${
          open ? "right-80" : "right-0"
        }`}
      >
        <Flag size={15} className={count > 0 ? "text-[#E4443A]" : "text-[#7C93AC]"} />
        <span className="text-[11px] font-semibold tracking-wide [writing-mode:vertical-rl]">
          Flagged {count > 0 ? `(${count})` : ""}
        </span>
      </button>

      {/* drawer panel */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-80 bg-white border-l border-hairline shadow-2xl flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-hairline shrink-0">
          <h3 className="text-[14px] font-semibold text-ink">Flagged defects</h3>
          <button onClick={() => setOpen(false)} className="text-slate-light hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sorted.length === 0 && (
            <p className="text-[12px] text-slate-light mt-4 text-center">
              No defects flagged yet. Click a yellow outlier on the resolution-time chart to flag it.
            </p>
          )}
          {sorted.map((item) => (
            <div key={item.id} className="rounded-lg border border-hairline p-3 bg-[#FAFBFD]">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[12.5px] font-semibold text-ink truncate">{item.defectName}</div>
                  <div className="text-[11px] text-slate-light">
                    {item.station} · {item.days.toFixed(2)}d · {item.date}
                  </div>
                </div>
                <button
                  onClick={() => onUnflag(item.id)}
                  className="shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full bg-[#FDECEC] text-[#C4342E] hover:bg-[#FBDADA] transition-colors"
                >
                  Unflag
                </button>
              </div>
              <textarea
                value={item.comment}
                onChange={(e) => onUpdateComment(item.id, e.target.value)}
                placeholder="Add a note…"
                rows={2}
                className="mt-2 w-full text-[12px] rounded-md border border-hairline px-2 py-1.5 resize-none focus:outline-none focus:border-bmw-blue bg-white"
              />
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
