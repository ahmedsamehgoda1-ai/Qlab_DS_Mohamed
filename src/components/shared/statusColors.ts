/**
 * Shared badge/status color pairs (background + text). Same reasoning as
 * chartTheme.ts: red/green/amber pill colors were being retyped as raw hex
 * literals in six different files (Defects table, Tracking Dashboard,
 * process-containment signals, Process Containment Insight, KPI deltas, flag popover)
 * — pulled into one place so the palette can't quietly drift between them.
 */
export const STATUS_RED = { bg: "#FDECEC", fg: "#C4342E" };
export const STATUS_GREEN = { bg: "#E9F7EF", fg: "#1F9254" };
export const STATUS_AMBER = { bg: "#FFF7E8", fg: "#9A7A1E" };
