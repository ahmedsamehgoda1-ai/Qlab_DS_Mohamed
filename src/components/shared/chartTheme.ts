/**
 * Shared recharts styling constants.
 *
 * Extracted because the same literal objects — tooltip style, axis tick
 * style, grid stroke — were copy-pasted identically across every Dashboard
 * and Analysis chart. One source of truth means a palette or style tweak
 * happens here once, instead of six files needing to be found and edited
 * in lockstep (and risking them silently drifting apart over time).
 */

export const AXIS_LINE_COLOR = "#E4E9EF";
export const GRID_COLOR = "#EEF1F5";

export const AXIS_TICK_STYLE = { fontSize: 11, fill: "#5B6B7C" };

export const TOOLTIP_STYLE = {
  fontSize: 12,
  borderRadius: 8,
  borderColor: AXIS_LINE_COLOR,
};

/** Default multi-series color order — BMW blue family, cycles for >6 series. */
export const CHART_PALETTE = ["#1C69D4", "#4FA8E8", "#16B8A6", "#5B6EF5", "#0E4C8C", "#9FB0C3"];
