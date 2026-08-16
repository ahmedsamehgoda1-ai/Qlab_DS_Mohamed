import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { defects } from "@/data/loadDefects";
import { DefectsTable } from "./DefectsTable";

export function DefectsView() {
  const [search, setSearch] = useState("");

  // Filtered here, not inside DefectsTable — this component owns the search
  // box, so it owns the filtering; DefectsTable stays a dumb "sort and
  // paginate whatever array you give me" component, reusable anywhere a
  // list of DefectRecords needs a table, not tied to this one search UI.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return defects;
    return defects.filter(
      (d) =>
        d.defectName.toLowerCase().includes(q) ||
        d.station.toLowerCase().includes(q) ||
        d.partOfCar.toLowerCase().includes(q) ||
        d.reporterName.toLowerCase().includes(q) ||
        d.carModel.toLowerCase().includes(q) ||
        d.motorType.toLowerCase().includes(q) ||
        d.designPackage.toLowerCase().includes(q) ||
        d.defectCategory.toLowerCase().includes(q) ||
        d.severityCategory.toLowerCase().includes(q) ||
        d.productionShift.toLowerCase().includes(q) ||
        String(d.partNumber).includes(q)
    );
  }, [search]);

  return (
    <div className="p-5 md:p-8 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 w-full sm:w-80 rounded-lg border border-hairline bg-white px-3 py-2.5 focus-within:border-bmw-blue transition-colors">
          <Search size={14} className="text-slate-light shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search defects, parts, stations, reporters, part #…"
            className="w-full text-[13px] outline-none placeholder:text-slate-light"
          />
        </div>
        <p className="text-[13px] text-slate">
          Full defect log, spreadsheet-style — click any column header to sort. Sorted by most
          recent date by default.
        </p>
      </div>
      <DefectsTable data={filtered} />
    </div>
  );
}
