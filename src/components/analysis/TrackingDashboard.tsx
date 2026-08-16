import { useMemo, useState } from "react";
import { ArrowUp, ArrowDown, ArrowUpDown, Search, Flag, Download } from "lucide-react";
import { FlaggedOutlier, SortDirection } from "@/types";
import { STATUS_RED } from "@/components/shared/statusColors";
import { buildCsv, downloadCsv } from "@/utils/csvExport";

type SortKey = "defectName" | "station" | "days" | "date" | "flaggedAt";

const COLUMNS: { key: SortKey; header: string; align?: "right" }[] = [
  { key: "defectName", header: "Defect Name" },
  { key: "station", header: "Station" },
  { key: "days", header: "Days", align: "right" },
  { key: "date", header: "Date" },
  { key: "flaggedAt", header: "Flagged At" },
];

interface TrackingDashboardProps {
  items: FlaggedOutlier[];
  onUnflag: (id: string) => void;
  onUpdateComment: (id: string, comment: string) => void;
}

/**
 * Dedicated tracking panel for every defect flagged for review from the
 * resolution-time chart. Updates dynamically as items are flagged/unflagged
 * (it's just rendering whatever's in the shared `flagged` store), and
 * supports searching (including by part number), sorting per column, and
 * exporting the current view to CSV — Task 4's feature, built directly
 * against the "flags reset on refresh" limitation: exporting gives a way to
 * keep a record outside the app until real persistence exists.
 */
export function TrackingDashboard({ items, onUnflag, onUpdateComment }: TrackingDashboardProps) {
  const [search, setSearch] = useState("");
  // Newest-flagged-first by default: whatever an engineer just flagged is
  // what they're most likely checking on next, not an old item from weeks ago.
  const [sortKey, setSortKey] = useState<SortKey>("flaggedAt");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.defectName.toLowerCase().includes(q) ||
        i.station.toLowerCase().includes(q) ||
        i.comment.toLowerCase().includes(q) ||
        String(i.partNumber).includes(q)
    );
  }, [items, search]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  // Exports exactly what's currently on screen — respects the active
  // search/sort, so "export" means "export what I'm looking at right now,"
  // not a silent full dump that ignores whatever the user just filtered to.
  function handleExport() {
    const headers = ["Defect Name", "Station", "Part Number", "Days", "Date", "Flagged At", "Status", "Comment"];
    const rows = sorted.map((item) => [
      item.defectName,
      item.station,
      item.partNumber,
      item.days.toFixed(2),
      item.date,
      // ISO date (YYYY-MM-DD), not toLocaleDateString() — a locale-formatted
      // date like "8/16/2026" gets auto-detected by Excel on CSV import,
      // which then applies its own date display format wider than the
      // default column width, showing "#####" instead of the value. ISO
      // format avoids that ambiguity and matches the Date column already.
      new Date(item.flaggedAt).toISOString().slice(0, 10),
      "Flagged for review",
      item.comment,
    ]);
    const csv = buildCsv(headers, rows);
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`tracking-dashboard-${timestamp}.csv`, csv);
  }

  return (
    <div className="bg-white border border-hairline rounded-xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-hairline flex-wrap">
        <div className="flex items-center gap-2">
          <Flag size={15} className="text-[#E4443A]" />
          <h3 className="text-[14px] font-semibold text-ink">Tracking Dashboard</h3>
          <span className="text-[11px] text-slate-light">{items.length} flagged for review</span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 flex-1 sm:w-64 rounded-lg border border-hairline bg-paper px-3 py-1.5 focus-within:border-bmw-blue transition-colors">
            <Search size={13} className="text-slate-light shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search flagged, part #…"
              className="w-full text-[12px] bg-transparent outline-none placeholder:text-slate-light"
            />
          </div>
          <button
            onClick={handleExport}
            disabled={sorted.length === 0}
            className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg border border-hairline text-slate hover:border-bmw-blue hover:text-bmw-blue disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="text-[12px] text-slate-light text-center py-10 px-4">
          {items.length === 0
            ? "No defects flagged for review yet. Click a yellow outlier on the chart above to flag one."
            : `No flagged items match "${search}".`}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-gradient-to-r from-paper to-[#EAF2FC] border-b border-hairline">
                {COLUMNS.map((col) => {
                  const isActive = col.key === sortKey;
                  return (
                    <th
                      key={col.key}
                      onClick={() => toggleSort(col.key)}
                      className={`px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate whitespace-nowrap select-none cursor-pointer hover:text-bmw-blue transition-colors ${
                        col.align === "right" ? "text-right" : "text-left"
                      }`}
                    >
                      <span className={`inline-flex items-center gap-1 ${col.align === "right" ? "flex-row-reverse" : ""}`}>
                        {col.header}
                        {isActive ? (
                          sortDir === "asc" ? (
                            <ArrowUp size={11} className="text-bmw-blue" />
                          ) : (
                            <ArrowDown size={11} className="text-bmw-blue" />
                          )
                        ) : (
                          <ArrowUpDown size={11} className="text-slate-light opacity-40" />
                        )}
                      </span>
                    </th>
                  );
                })}
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate text-left">
                  Status
                </th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate text-left min-w-[220px]">
                  Comment
                </th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((item) => (
                <tr key={item.id} className="border-b border-[#F0F3F7] last:border-0 hover:bg-[#FAFBFD]">
                  <td className="px-4 py-2.5 text-[#26313D] whitespace-nowrap">{item.defectName}</td>
                  <td className="px-4 py-2.5 text-[#26313D] whitespace-nowrap">{item.station}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-[#26313D]">{item.days.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-[#26313D] whitespace-nowrap">{item.date}</td>
                  <td className="px-4 py-2.5 text-[#26313D] whitespace-nowrap">
                    {new Date(item.flaggedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className="text-[11px] font-semibold px-2 py-1 rounded-full whitespace-nowrap"
                      style={{ background: STATUS_RED.bg, color: STATUS_RED.fg }}
                    >
                      Flagged for review
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="text"
                      value={item.comment}
                      onChange={(e) => onUpdateComment(item.id, e.target.value)}
                      placeholder="Add a note…"
                      className="w-full text-[12px] rounded-md border border-hairline px-2 py-1 focus:outline-none focus:border-bmw-blue"
                    />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => onUnflag(item.id)}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-paper text-slate hover:bg-[#FDECEC] hover:text-[#C4342E] transition-colors whitespace-nowrap"
                    >
                      Unflag
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
