/**
 * Generic statistics helpers — IQR-based outlier detection.
 *
 * Method chosen: Tukey's IQR fence rather than mean ± k·std-dev.
 * Time-to-resolution is heavily right-skewed (median ~0.32 days, but a
 * max near 56 days), so a mean/std-dev approach would be dragged upward
 * by the same extreme values it's trying to flag, inflating the threshold
 * and under-flagging real outliers. IQR uses the median and quartiles,
 * which are robust to skew and extreme values.
 *
 * Only the upper fence is used (Q3 + 1.5 * IQR) — deliberately one-sided.
 * A defect resolved unusually FAST is not a quality problem worth flagging;
 * only unusually SLOW resolutions are actionable for engineers. A standard
 * two-sided box plot would also flag fast outliers below Q1 - 1.5*IQR,
 * which isn't meaningful here (and resolution time can't go below 0 anyway).
 */

export interface IQRStats {
  min: number;
  q1: number;
  median: number;
  q3: number;
  iqr: number;
  upperFence: number;
  /** Largest observed value that is NOT an outlier — the whisker's true end. */
  upperWhisker: number;
  max: number;
}

/** Linear-interpolation percentile (matches Excel's PERCENTILE.INC / numpy default). */
export function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  const idx = (p / 100) * (sortedValues.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sortedValues[lower];
  const weight = idx - lower;
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

export function computeIQRStats(values: number[]): IQRStats {
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = percentile(sorted, 25);
  const median = percentile(sorted, 50);
  const q3 = percentile(sorted, 75);
  const iqr = q3 - q1;
  const upperFence = q3 + 1.5 * iqr;
  const nonOutliers = sorted.filter((v) => v <= upperFence);
  return {
    min: sorted[0] ?? 0,
    q1,
    median,
    q3,
    iqr,
    upperFence,
    upperWhisker: nonOutliers.length ? nonOutliers[nonOutliers.length - 1] : q3,
    max: sorted[sorted.length - 1] ?? 0,
  };
}

/** Deterministic 0..1 hash of a string id — used for stable, jitter-free-on-rerender point offsets. */
export function hashToUnit(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff;
  }
  return ((hash >>> 0) % 1000) / 1000;
}
