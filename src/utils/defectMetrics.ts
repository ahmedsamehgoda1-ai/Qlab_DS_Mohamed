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
/* Defect rate by Model / Motor Type / Design Package                     */
/* ---------------------------------------------------------------------- */

export type RateDimension = "carModel" | "motorType" | "designPackage";

export interface RateDatum {
  key: string;
  count: number;
  /** % of all defects across every value of this dimension — NOT a true
   * per-unit defect rate. This dataset has no production-volume field, so
   * there's no way to know how many units of each model/motor/package were
   * actually built; a model with more defects here may simply have had
   * more units on the line. This is a relative share of defects, stated as
   * that and nothing more. */
  pct: number;
}

export function defectRateBy(defects: DefectRecord[], dimension: RateDimension): RateDatum[] {
  const counts = new Map<string, number>();
  for (const d of defects) {
    const key = d[dimension];
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const total = defects.length;
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count, pct: total > 0 ? (count / total) * 100 : 0 }))
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
/* Defect × Station process containment                                    */
/* ---------------------------------------------------------------------- */

/**
 * First version used a chi-square independence model, then a purely
 * statistical ≥5%-of-cases threshold to decide which stations counted as a
 * defect's "expected" ones. Both fell short for the same underlying reason:
 * neither used what a quality engineer actually knows — the real
 * manufacturing process. A station appearing frequently for a defect in the
 * data doesn't tell you whether that's *correct* (the right process step)
 * or a symptom of a process/mapping problem; only domain knowledge does.
 *
 * EXPECTED_STATIONS below is that domain knowledge — which stations are the
 * legitimate detection points for each defect type, per the manufacturing
 * process. It's the one deliberately "hardcoded" input in this whole app,
 * and it's hardcoded on purpose: this is exactly the kind of judgment a
 * real quality engineer brings that a purely statistical threshold can't
 * derive from counts alone. Everything downstream of it — every count,
 * every percentage, every flag — is still calculated fresh from whichever
 * month's data is selected. Nothing about the RESULTS is hardcoded, only
 * which stations are structurally appropriate for which defect.
 */
export const EXPECTED_STATIONS: Record<string, string[]> = {
  "loose wiring": ["wire harness installation", "electrical test checkpoint"],
  "cracked windshield": ["windshield installation", "water leak test checkpoint"],
  "faulty battery": ["ev battery installation", "battery end-of-line test", "charging system inspection"],
  // Final Quality is included directly here (not tracked as separate
  // "downstream" detection) — paint defects don't have as clean a
  // installation/dedicated-test split as most other defects do.
  "paint scratch": ["paint booth inspection", "paint cure inspection", "final quality inspection"],
  "hydraulic leak": ["powertrain fluid inspection", "brake fluid fill checkpoint", "underbody inspection checkpoint"],
  // "Brake-related / wheel / underbody" per domain guidance, mapped to the
  // actual stations that theme covers in this dataset.
  "brake malfunction": ["brake fluid fill checkpoint", "underbody inspection checkpoint", "tire and rim installation", "axel installation"],
  "sensor failure": ["adas calibration checkpoint", "electrical test checkpoint"],
  "panel gap misalignment": ["body fit inspection", "door panel installation"],
  // "Assembly station" per domain guidance covers both relevant assembly
  // points a fastener could be missing from, not one specific station.
  "missing fastener": ["second row seats installation", "door panel installation", "torque audit checkpoint"],
  "brake fluid leak": ["brake fluid fill checkpoint", "underbody inspection checkpoint"],
  "headlight aim out of spec": ["headlight installation", "light alignment checkpoint"],
  // "Seat Installation" covers both rows.
  "seat belt anchor loose": ["first row seats installation", "second row seats installation", "torque audit checkpoint"],
  "charging port misalignment": ["charging port installation", "electrical test checkpoint"],
  "software calibration error": ["software flash checkpoint", "end-of-line diagnostics", "adas calibration checkpoint"],
  "paint run": ["paint booth inspection", "paint cure inspection", "final quality inspection"],
};

/** Defects where Final Quality is folded into "expected" (see comment
 * above) rather than tracked as separate downstream detection. */
const FQ_COUNTED_AS_EXPECTED = new Set(["paint scratch", "paint run"]);

export const FINAL_QUALITY_STATION = "final quality inspection";

/** Final Quality Detection % at/above this triggers the soft "potential
 * escape" flag. A plain, adjustable heuristic, not a statistical test —
 * the brief explicitly wants this as a soft signal, not an automatic
 * classification. */
const ESCAPE_FLAG_THRESHOLD_PCT = 25;

/** When neither the expected stations nor Final Quality account for most of
 * a defect's cases, that's a stronger signal than an ordinary escape — it
 * suggests the domain mapping itself doesn't match what's happening on the
 * floor, which needs checking before treating the pattern as real. */
const DATA_QUALITY_CONCERN_THRESHOLD_PCT = 40;

export interface StationShare {
  station: string;
  count: number;
  pct: number; // % of this defect's total cases detected at this station
}

export type ContainmentSignal = "high-containment" | "potential-escape" | "data-quality-concern";

export interface ProcessContainmentRow {
  defect: string;
  total: number;
  /** Every station this defect was detected at, sorted by count desc. */
  stationBreakdown: StationShare[];
  /** This defect's domain-mapped expected stations, with their live counts/%. */
  expectedStations: StationShare[];
  /** % of cases caught at the defect's own expected/process stations. */
  processContainmentPct: number;
  /** % of cases caught at Final Quality specifically (0 if folded into
   * "expected" for this defect — see FQ_COUNTED_AS_EXPECTED). */
  finalQualityPct: number;
  /** Remainder — cases caught somewhere that's neither an expected station
   * nor Final Quality. */
  otherPct: number;
  signal: ContainmentSignal;
}

export function computeProcessContainment(defects: DefectRecord[]): ProcessContainmentRow[] {
  const byDefect = new Map<string, Map<string, number>>();
  const totals = new Map<string, number>();

  for (const d of defects) {
    if (!byDefect.has(d.defectName)) byDefect.set(d.defectName, new Map());
    const stationCounts = byDefect.get(d.defectName)!;
    stationCounts.set(d.station, (stationCounts.get(d.station) ?? 0) + 1);
    totals.set(d.defectName, (totals.get(d.defectName) ?? 0) + 1);
  }

  const rows: ProcessContainmentRow[] = [];

  for (const [defect, stationCounts] of byDefect.entries()) {
    const total = totals.get(defect)!;

    const stationBreakdown: StationShare[] = [...stationCounts.entries()]
      .map(([station, count]) => ({ station, count, pct: (count / total) * 100 }))
      .sort((a, b) => b.count - a.count);

    const expectedNames = EXPECTED_STATIONS[defect] ?? [];
    const fqIsExpected = FQ_COUNTED_AS_EXPECTED.has(defect);

    const expectedStations: StationShare[] = expectedNames.map((station) => {
      const count = stationCounts.get(station) ?? 0;
      return { station, count, pct: (count / total) * 100 };
    });
    const processContainmentPct = expectedStations.reduce((sum, s) => sum + s.pct, 0);

    const fqCount = stationCounts.get(FINAL_QUALITY_STATION) ?? 0;
    const finalQualityPct = fqIsExpected ? 0 : (fqCount / total) * 100;

    // Clamp with an epsilon, not just Math.max(0, ...) — floating-point
    // division (e.g. 1/3 * 100 twice) can leave a residual as small as
    // 1e-14, which displays as "0.0%" after rounding but still counts as
    // "> 0" for exact comparisons, wrongly coloring an effectively-zero
    // cell as if it were a real nonzero value.
    const otherPctRaw = 100 - processContainmentPct - finalQualityPct;
    const otherPct = otherPctRaw < 1e-6 ? 0 : otherPctRaw;

    let signal: ContainmentSignal = "high-containment";
    if (otherPct >= DATA_QUALITY_CONCERN_THRESHOLD_PCT) {
      signal = "data-quality-concern";
    } else if (!fqIsExpected && finalQualityPct >= ESCAPE_FLAG_THRESHOLD_PCT) {
      signal = "potential-escape";
    }

    rows.push({
      defect,
      total,
      stationBreakdown,
      expectedStations,
      processContainmentPct,
      finalQualityPct,
      otherPct,
      signal,
    });
  }

  return rows.sort((a, b) => b.total - a.total);
}
