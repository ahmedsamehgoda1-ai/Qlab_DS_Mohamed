import rawData from "./defects.json";
import { DefectRecord, RawDefectRecord } from "@/types";

/**
 * Reference "now" for computing elapsed time on still-open defects.
 * The dataset's own max date is used as a fallback if the system clock is
 * somehow earlier than the data (keeps demo behaviour sane in any environment).
 */
function getReferenceDate(records: RawDefectRecord[]): Date {
  const now = new Date();
  const maxDataDate = records.reduce((max, r) => {
    const d = new Date(r.date);
    return d > max ? d : max;
  }, new Date(0));
  return now > maxDataDate ? now : maxDataDate;
}

function daysBetween(a: Date, b: Date): number {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.max(0, (b.getTime() - a.getTime()) / MS_PER_DAY);
}

function enrich(raw: RawDefectRecord, index: number, referenceDate: Date): DefectRecord {
  const isOpen = raw.timeToResolutionDays === null;
  const effectiveResolutionDays = isOpen
    ? Math.round(daysBetween(new Date(raw.date), referenceDate) * 100) / 100
    : (raw.timeToResolutionDays as number);

  return {
    ...raw,
    id: `${raw.partNumber}-${raw.date}-${index}`,
    status: isOpen ? "Open" : "Resolved",
    effectiveResolutionDays,
    isCensored: isOpen,
  };
}

const rows = rawData as RawDefectRecord[];
const referenceDate = getReferenceDate(rows);

/** Full enriched dataset, computed once at module load. */
export const defects: DefectRecord[] = rows.map((r, i) => enrich(r, i, referenceDate));
