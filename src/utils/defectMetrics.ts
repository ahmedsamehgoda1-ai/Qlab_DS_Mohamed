import { DefectRecord, DefectStatus } from "@/types";
import { computeIQRStats, hashToUnit, IQRStats } from "./stats";

/* ---------------------------------------------------------------------- */
/* KPIs                                                                    */
/* ---------------------------------------------------------------------- */

export interface DashboardKpis {
  totalDefects: number;
  openCount: number;
  openPct: number;
  avgResolutionDaysResolved: number; // resolved-only, undistorted by open cases
  rootCauseRate: number; // among defects where it was recorded
}

export function computeKpis(defects: DefectRecord[]): DashboardKpis {
  const total = defects.length;
  const open = defects.filter((d) => d.status === "Open");
  const resolved = defects.filter((d) => d.status === "Resolved");

  const avgResolutionDaysResolved =
    resolved.reduce((sum, d) => sum + d.effectiveResolutionDays, 0) / (resolved.length || 1);

  const withRootCauseInfo = defects.filter((d) => d.rootCauseIdentified !== null);
  const rootCauseYes = withRootCauseInfo.filter((d) => d.rootCauseIdentified === "Yes");
  const rootCauseRate = rootCauseYes.length / (withRootCauseInfo.length || 1);

  return {
    totalDefects: total,
    openCount: open.length,
    openPct: open.length / (total || 1),
    avgResolutionDaysResolved,
    rootCauseRate,
  };
}

/* ---------------------------------------------------------------------- */
/* Top 5 defects (+ Others) — pie chart                                    */
/* ---------------------------------------------------------------------- */

export interface PieDatum {
  name: string;
  value: number;
}

export function topDefectsPie(defects: DefectRecord[], topN = 5): PieDatum[] {
  const counts = new Map<string, number>();
  for (const d of defects) {
    counts.set(d.defectName, (counts.get(d.defectName) ?? 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, topN);
  const rest = sorted.slice(topN);
  const othersTotal = rest.reduce((sum, [, count]) => sum + count, 0);

  const result: PieDatum[] = top.map(([name, value]) => ({ name, value }));
  if (othersTotal > 0) {
    result.push({ name: "Others", value: othersTotal });
  }
  return result;
}

/* ---------------------------------------------------------------------- */
/* Severity distribution — "bell curve"                                    */
/* ---------------------------------------------------------------------- */

export interface SeverityBin {
  severity: number;
  label: string;
  category: string;
  count: number;
}

// Severity Rating is an INVERTED scale in the source data: 1 is the most
// extreme (safety/legal/inoperable), 6 is the least severe (next service
// visit). This map is derived once from the data and used for chart labels.
export function severityDistribution(defects: DefectRecord[]): SeverityBin[] {
  const counts = new Map<number, number>();
  const categoryBySeverity = new Map<number, string>();
  for (const d of defects) {
    counts.set(d.severityRating, (counts.get(d.severityRating) ?? 0) + 1);
    if (!categoryBySeverity.has(d.severityRating)) {
      categoryBySeverity.set(d.severityRating, d.severityCategory);
    }
  }
  return [...counts.keys()]
    .sort((a, b) => a - b)
    .map((severity) => ({
      severity,
      label: `${severity}`,
      category: categoryBySeverity.get(severity) ?? "",
      count: counts.get(severity) ?? 0,
    }));
}

/* ---------------------------------------------------------------------- */
/* Resolution time — including open (censored) cases                      */
/* ---------------------------------------------------------------------- */

export interface ResolutionPoint {
  id: string;
  date: string;
  days: number;
  status: DefectStatus;
  isCensored: boolean;
  defectName: string;
}

export function resolutionPoints(defects: DefectRecord[]): ResolutionPoint[] {
  return defects.map((d) => ({
    id: d.id,
    date: d.date,
    days: d.effectiveResolutionDays,
    status: d.status,
    isCensored: d.isCensored,
    defectName: d.defectName,
  }));
}

/* ---------------------------------------------------------------------- */
/* Defect rate by Model / Motor Type / Design Package                     */
/* ---------------------------------------------------------------------- */

export type RateDimension = "carModel" | "motorType" | "designPackage";

export interface RateDatum {
  key: string;
  count: number;
}

export function defectRateBy(defects: DefectRecord[], dimension: RateDimension): RateDatum[] {
  const counts = new Map<string, number>();
  for (const d of defects) {
    const key = d[dimension];
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

/* ---------------------------------------------------------------------- */
/* Station Pareto — defects per station + cumulative %                    */
/* ---------------------------------------------------------------------- */

export interface ParetoDatum {
  station: string;
  count: number;
  cumulativePct: number;
}

export function stationPareto(defects: DefectRecord[]): ParetoDatum[] {
  const counts = new Map<string, number>();
  for (const d of defects) {
    counts.set(d.station, (counts.get(d.station) ?? 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const total = defects.length;
  let running = 0;
  return sorted.map(([station, count]) => {
    running += count;
    return { station, count, cumulativePct: Math.round((running / total) * 1000) / 10 };
  });
}

/* ---------------------------------------------------------------------- */
/* Resolution time — IQR outlier analysis (Task 2)                        */
/* ---------------------------------------------------------------------- */

export interface ResolutionOutlierPoint {
  id: string;
  date: string;
  days: number;
  defectName: string;
  station: string;
  partNumber: number;
  status: DefectStatus;
  isCensored: boolean;
  isOutlier: boolean;
  /** Stable 0..1 value derived from id, used for deterministic visual jitter. */
  jitter: number;
}

export interface ResolutionOutlierAnalysis {
  stats: IQRStats;
  points: ResolutionOutlierPoint[];
  outliers: ResolutionOutlierPoint[];
  normal: ResolutionOutlierPoint[];
}

export function resolutionOutlierAnalysis(defects: DefectRecord[]): ResolutionOutlierAnalysis {
  const values = defects.map((d) => d.effectiveResolutionDays);
  const stats = computeIQRStats(values);

  const points: ResolutionOutlierPoint[] = defects.map((d) => ({
    id: d.id,
    date: d.date,
    days: d.effectiveResolutionDays,
    defectName: d.defectName,
    station: d.station,
    partNumber: d.partNumber,
    status: d.status,
    isCensored: d.isCensored,
    isOutlier: d.effectiveResolutionDays > stats.upperFence,
    jitter: hashToUnit(d.id),
  }));

  return {
    stats,
    points,
    outliers: points.filter((p) => p.isOutlier),
    normal: points.filter((p) => !p.isOutlier),
  };
}

/* ---------------------------------------------------------------------- */
/* Aggregated bubbles for the non-outlier bulk of resolution-time points   */
/* ---------------------------------------------------------------------- */

export interface ResolutionBubble {
  binCenter: number; // days, mean of points in this bin
  count: number;
  minDay: number;
  maxDay: number;
}

/**
 * Bins the (non-outlier) points on a log scale — the data spans ~0.02 to
 * tens of days, so equal-width linear bins would bunch almost everything
 * into the first bin. Rendered as sized bubbles rather than one dot per
 * record: with thousands of points, individual dots would overplot into
 * an unreadable smear and aren't individually actionable anyway (only the
 * outliers are, per Task 3's flagging workflow).
 */
export function binResolutionDays(points: ResolutionOutlierPoint[], binCount = 26): ResolutionBubble[] {
  if (points.length === 0) return [];
  const days = points.map((p) => p.days);
  const min = Math.min(...days);
  const max = Math.max(...days);
  const logMin = Math.log10(Math.max(min, 0.01));
  const logMax = Math.log10(Math.max(max, 0.01));
  const step = (logMax - logMin) / binCount || 1;

  const bins = Array.from({ length: binCount }, () => ({
    sum: 0,
    count: 0,
    min: Infinity,
    max: -Infinity,
  }));

  for (const p of points) {
    const logV = Math.log10(Math.max(p.days, 0.01));
    let idx = Math.floor((logV - logMin) / step);
    idx = Math.min(binCount - 1, Math.max(0, idx));
    bins[idx].sum += p.days;
    bins[idx].count += 1;
    bins[idx].min = Math.min(bins[idx].min, p.days);
    bins[idx].max = Math.max(bins[idx].max, p.days);
  }

  return bins
    .filter((b) => b.count > 0)
    .map((b) => ({
      binCenter: b.sum / b.count,
      count: b.count,
      minDay: b.min,
      maxDay: b.max,
    }));
}

/* ---------------------------------------------------------------------- */
/* Defect × Station anomaly matrix (chi-square residual analysis)          */
/* ---------------------------------------------------------------------- */

export interface MatrixCell {
  defect: string;
  station: string;
  count: number;
  expected: number;
  rowTotal: number;
  colTotal: number;
  pctOfStation: number;
  /** Simple standardized residual: (O - E) / sqrt(E). */
  sr: number;
  /**
   * Adjusted (Haberman) residual — corrects SR for fixed row/column totals,
   * giving more trustworthy significance than the plain SR when totals vary
   * a lot across defects/stations (they do here).
   */
  ar: number;
  /** Expected count < 5 — standard contingency-table rule of thumb for when
   * a residual (SR or AR) becomes statistically unreliable to interpret. */
  lowSample: boolean;
}

export interface DefectStationMatrix {
  defects: string[]; // row labels, sorted by total count desc
  stations: string[]; // column labels, sorted by total count desc
  cells: MatrixCell[][]; // [defectIndex][stationIndex]
  grandTotal: number;
}

export function computeDefectStationMatrix(defects: DefectRecord[]): DefectStationMatrix {
  const defectTotals = new Map<string, number>();
  const stationTotals = new Map<string, number>();
  const cellCounts = new Map<string, number>();

  for (const d of defects) {
    defectTotals.set(d.defectName, (defectTotals.get(d.defectName) ?? 0) + 1);
    stationTotals.set(d.station, (stationTotals.get(d.station) ?? 0) + 1);
    const key = `${d.defectName}|${d.station}`;
    cellCounts.set(key, (cellCounts.get(key) ?? 0) + 1);
  }

  const defectNames = [...defectTotals.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
  const stationNames = [...stationTotals.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
  const N = defects.length;

  const cells: MatrixCell[][] = defectNames.map((defect) => {
    const rowTotal = defectTotals.get(defect)!;
    return stationNames.map((station) => {
      const colTotal = stationTotals.get(station)!;
      const count = cellCounts.get(`${defect}|${station}`) ?? 0;
      const expected = N > 0 ? (rowTotal * colTotal) / N : 0;
      const sr = expected > 0 ? (count - expected) / Math.sqrt(expected) : 0;
      const arDenom = expected * (1 - rowTotal / N) * (1 - colTotal / N);
      const ar = arDenom > 0 ? (count - expected) / Math.sqrt(arDenom) : 0;
      const pctOfStation = colTotal > 0 ? (count / colTotal) * 100 : 0;
      return {
        defect,
        station,
        count,
        expected,
        rowTotal,
        colTotal,
        pctOfStation,
        sr,
        ar,
        lowSample: expected < 5,
      };
    });
  });

  return { defects: defectNames, stations: stationNames, cells, grandTotal: N };
}

export function findMatrixCell(matrix: DefectStationMatrix, defect: string, station: string): MatrixCell | undefined {
  const di = matrix.defects.indexOf(defect);
  const si = matrix.stations.indexOf(station);
  if (di < 0 || si < 0) return undefined;
  return matrix.cells[di][si];
}
