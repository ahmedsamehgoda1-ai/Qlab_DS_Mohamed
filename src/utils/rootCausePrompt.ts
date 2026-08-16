import { FlaggedOutlier } from "@/types";
import { ProcessContainmentRow } from "./defectMetrics";

/**
 * Builds the prompt for the Root Cause Assist panel (Task 5).
 *
 * Focused on the Defect x Station process-containment analysis (§5) — the
 * app's own domain-mapped "expected station" assumption tells you WHICH
 * defects show a potential-escape or data-quality-concern signal, but not
 * WHY. That "why" is exactly what's handed to the LLM to reason about,
 * fresh each time, rather than pre-written: the app supplies only the
 * station names/percentages already on screen, never a canned explanation.
 *
 * Also cross-references flagged items (Task 3) for any of these same
 * defects when available, so it leverages both existing analytics and
 * human-flagged data — but isn't gated on flags existing, since the
 * containment analysis alone is always enough to reason about.
 */
export function buildRootCausePrompt(
  containmentRows: ProcessContainmentRow[],
  flaggedItems: FlaggedOutlier[]
): string | null {
  const signalRows = containmentRows.filter((r) => r.signal !== "high-containment");
  if (signalRows.length === 0) return null;

  const rowLines = signalRows.map((r) => {
    const stations = r.stationBreakdown
      .slice(0, 6)
      .map((s) => `${s.station} (${s.pct.toFixed(1)}%, n=${s.count})`)
      .join("; ");
    const expected = r.expectedStations.map((s) => s.station).join(", ") || "none mapped";

    const relatedFlags = flaggedItems.filter((f) => f.defectName === r.defect);
    const flagText =
      relatedFlags.length > 0
        ? ` Engineer-flagged example(s): ${relatedFlags
            .map((f) => `"${f.station}"${f.comment.trim() ? ` — note: "${f.comment.trim()}"` : ""}`)
            .join("; ")}.`
        : "";

    return `- ${r.defect} [signal: ${r.signal}] — total ${r.total} cases, containment ${r.processContainmentPct.toFixed(1)}%, Final Quality ${r.finalQualityPct.toFixed(1)}%, other ${r.otherPct.toFixed(1)}%. Expected stations (domain-mapped): ${expected}. Full station breakdown: ${stations}.${flagText}`;
  });

  return `You are assisting a BMW quality engineer reviewing a Defect x Station process-containment analysis.

Below are the defect types this month whose detection pattern raised a signal — "potential-escape" means a large share of cases are only caught at Final Quality (the shared downstream checkpoint) instead of their own expected station(s); "data-quality-concern" means most cases were caught at stations that have no domain-mapped connection to that defect type at all.

${rowLines.join("\n")}

Task: for each defect listed, give a short, plausible, factual explanation of WHY that pattern might be occurring — grounded only in the station names and percentages given above, never invented. For a data-quality-concern defect, say directly whether the pattern reads more like a real production issue or a station-logging/process-mapping problem. Be short: under 130 words total, 1-2 bullet points per defect. Do not add pleasantries, disclaimers, or ask follow-up questions — this is a one-shot analysis, not a conversation.`;
}
