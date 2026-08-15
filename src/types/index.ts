// Shared domain types for the QLab Total Vehicle Quality dashboard.
// Mirrors Quality_Notional_Data_v2_resolution_variation_final.xlsx (9,000 rows).

export type NavId = "dashboard" | "analysis" | "defects" | "info";

export type CarModel = "Base" | "IX0M" | "Long" | "Alpina" | "Pick-Up";
export type MotorType = "Standard" | "Long Range" | "High Performance";
export type DesignPackage = "Offroad" | "Race" | "Luxury" | "Eco";
export type ProductionShift = "Morning" | "Afternoon";
export type DefectCategory =
  | "Electrical"
  | "Cosmetic"
  | "Functional"
  | "Safety"
  | "Critical"
  | "Structural";
export type RootCauseIdentified = "Yes" | "No";
export type DefectStatus = "Open" | "Resolved";

/** Raw shape as exported from the source spreadsheet (src/data/defects.json). */
export interface RawDefectRecord {
  date: string; // ISO date, defect reported
  time: string;
  defectName: string;
  station: string;
  partOfCar: string;
  reporterName: string;
  partNumber: number;
  severityRating: number; // 1-6. NOTE: inverted scale — 1 is most severe
  // ("Extreme - safety/legal/inoperable"), 6 is least severe
  // ("Medium - next service visit"). See severityCategory for the mapping.
  severityCategory: string;
  carModel: CarModel;
  motorType: MotorType;
  designPackage: DesignPackage;
  productionShift: ProductionShift;
  timeToResolutionDays: number | null; // null => still open
  rootCauseIdentified: RootCauseIdentified | null;
  defectCategory: DefectCategory;
  resolutionDate: string | null;
  reworkTimeMinutes: number;
}

/** Enriched record used throughout the app, with derived fields computed once at load time. */
export interface DefectRecord extends RawDefectRecord {
  id: string;
  status: DefectStatus;
  /**
   * Resolution time in days, including open cases.
   * - Resolved: the recorded timeToResolutionDays.
   * - Open: days elapsed between the report date and "now" (censored — the
   *   true resolution time is >= this value since the defect isn't closed
   *   yet). Flagged via isCensored so downstream stats/outlier logic can
   *   treat it differently from a true observed value.
   */
  effectiveResolutionDays: number;
  isCensored: boolean;
}

export interface AccentTokens {
  bg: string;
  fg: string;
}

export type AccentName = "blue" | "teal" | "indigo" | "sky";

export type SortDirection = "asc" | "desc";

/** A single outlier the user has flagged for review from the resolution-time chart. */
export interface FlaggedOutlier {
  id: string;
  defectName: string;
  station: string;
  partNumber: number;
  days: number;
  date: string;
  comment: string;
  flaggedAt: string; // ISO timestamp
}
