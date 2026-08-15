import { useMemo, useState } from "react";
import { ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { DefectRecord, SortDirection } from "@/types";
import { COLUMNS } from "./columns";

const PAGE_SIZE = 50;

interface DefectsTableProps {
  data: DefectRecord[];
}

export function DefectsTable({ data }: DefectsTableProps) {
  const [sortKey, setSortKey] = useState<string>("date");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [page, setPage] = useState(0);

  const column = useMemo(() => COLUMNS.find((c) => c.key === sortKey)!, [sortKey]);

  const sorted = useMemo(() => {
    const copy = [...data];
    copy.sort((a, b) => {
      const av = column.sortValue(a);
      const bv = column.sortValue(b);
      let cmp: number;
      if (typeof av === "number" && typeof bv === "number") {
        cmp = av - bv;
      } else {
        cmp = String(av).localeCompare(String(bv));
      }
      // Secondary sort by time for stable, sensible ordering on date ties.
      if (cmp === 0 && column.key !== "time") {
        cmp = a.time.localeCompare(b.time);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [data, column, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const clampedPage = Math.min(page, pageCount - 1);
  const pageRows = sorted.slice(clampedPage * PAGE_SIZE, clampedPage * PAGE_SIZE + PAGE_SIZE);

  function toggleSort(key: string) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(0);
  }

  const rangeStart = clampedPage * PAGE_SIZE + 1;
  const rangeEnd = Math.min(sorted.length, rangeStart + PAGE_SIZE - 1);

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-white border border-hairline rounded-xl overflow-hidden">
        <div className="overflow-auto max-h-[65vh]">
          <table className="border-collapse text-[13px] w-full">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gradient-to-r from-paper to-[#EAF2FC] border-b border-hairline">
                {COLUMNS.map((col) => {
                  const isActive = col.key === sortKey;
                  return (
                    <th
                      key={col.key}
                      className={`${col.minWidth ?? ""} px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate whitespace-nowrap select-none cursor-pointer hover:text-bmw-blue transition-colors ${
                        col.align === "right" ? "text-right" : "text-left"
                      }`}
                      onClick={() => toggleSort(col.key)}
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
                          <ArrowUpDown size={11} className="text-slate-light opacity-0 group-hover:opacity-100" />
                        )}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <tr key={row.id} className="border-b border-[#F0F3F7] last:border-0 hover:bg-[#FAFBFD]">
                  {COLUMNS.map((col) => {
                    if (col.key === "status") {
                      return (
                        <td key={col.key} className="px-4 py-2.5 whitespace-nowrap">
                          <span
                            className={`text-[11px] font-semibold px-2 py-1 rounded-full ${
                              row.status === "Open"
                                ? "bg-[#FDECEC] text-[#C4342E]"
                                : "bg-[#E9F7EF] text-[#1F9254]"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                      );
                    }
                    return (
                      <td
                        key={col.key}
                        className={`px-4 py-2.5 whitespace-nowrap text-[#26313D] ${
                          col.align === "right" ? "text-right tabular-nums" : "text-left"
                        }`}
                      >
                        {col.render(row)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <span className="text-[12px] text-slate-light">
          Showing <span className="font-medium text-slate">{rangeStart}–{rangeEnd}</span> of{" "}
          <span className="font-medium text-slate">{sorted.length.toLocaleString()}</span> records
          {" · "}
          <span title="Effective resolution days for still-open defects are marked with * (days elapsed so far, not a final value)">
            * = open, elapsed so far
          </span>
        </span>
        <div className="sm:ml-auto flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={clampedPage === 0}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-hairline bg-white text-slate disabled:opacity-40 disabled:cursor-not-allowed hover:border-bmw-blue hover:text-bmw-blue transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-[12px] text-slate min-w-[80px] text-center">
            Page {clampedPage + 1} of {pageCount}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={clampedPage >= pageCount - 1}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-hairline bg-white text-slate disabled:opacity-40 disabled:cursor-not-allowed hover:border-bmw-blue hover:text-bmw-blue transition-colors"
            aria-label="Next page"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
