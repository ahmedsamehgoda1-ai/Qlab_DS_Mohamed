import { DefectRecord, FlaggedOutlier } from "@/types";
import { computeDefectStationMatrix, findMatrixCell } from "./defectMetrics";

/**
 * Builds the prompt for the Root Cause Assist panel (Task 5).
 *
 * Deliberately leverages TWO existing analyses rather than raw data alone:
 * the human-written flag comments (Task 3) and the chi-square anomaly
 * matrix (adjusted residual per defect/station combo) — cross-referencing
 * them is the "1-2 steps further" the brief asks for, and isn't something
 * either analysis does on its own.
 */
export function buildRootCausePrompt(flaggedItems: FlaggedOutlier[], monthDefects: DefectRecord[]): string {
  const matrix = computeDefectStationMatrix(monthDefects);

  const lines = flaggedItems.map((item) => {
    const cell = findMatrixCell(matrix, item.defectName, item.station);
    const arText = cell
      ? `AR=${cell.ar.toFixed(1)}${cell.lowSample ? " (low sample, unreliable)" : ""}`
      : "no matrix data";
    const comment = item.comment.trim() || "(no comment left)";
    return `- "${item.defectName}" at "${item.station}", ${item.days.toFixed(2)} days to resolve, engineer's note: "${comment}" — station anomaly ${arText}`;
  });

  return `You are assisting a BMW quality engineer investigating flagged production defects.

Below are defects an engineer has manually flagged as anomalies this month, each cross-referenced with an adjusted standardized residual (AR) from a defect x station chi-square anomaly matrix. AR > 2 means that defect/station combination happens notably more often than the plant's overall rates would predict; AR < -2 means notably less.

Flagged items:
${lines.join("\n")}

Task: identify any likely common root cause(s) linking two or more of these flagged items — a shared station, a shared defect type, or a pattern across the engineers' notes. Be short (under 100 words total), factual, and specific: reference the actual defect/station names and AR values given, don't invent details not present above. Output 2-4 short bullet points. If the items don't share an obvious common cause, say so plainly in one line instead of speculating. Do not add pleasantries, disclaimers, or ask follow-up questions — this is a one-shot analysis, not a conversation.`;
}
