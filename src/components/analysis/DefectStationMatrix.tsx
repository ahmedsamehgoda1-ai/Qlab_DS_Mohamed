import { useMemo, useRef, useState, MouseEvent as ReactMouseEvent } from "react";
import { AlertTriangle } from "lucide-react";
import { DefectRecord } from "@/types";
import { computeDefectStationMatrix, MatrixCell } from "@/utils/defectMetrics";
import { ChartCard } from "@/components/shared/ChartCard";

type ViewMode = "count" | "pct" | "anomaly";
type ResidualKind = "sr" | "ar";

interface TooltipState {
  x: number;
  y: number;
  cell: MatrixCell;
}

const BMW_BLUE: [number, number, number] = [28, 105, 212];
const RED: [number, number, number] = [228, 68, 58];
const WHITE: [number, number, number] = [255, 255, 255];
const PALE_BLUE: [number, number, number] = [234, 242, 252];

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

function rgb([r, g, b]: [number, number, number]) {
  return `rgb(${r},${g},${b})`;
}

/** Light blue -> strong BMW blue, for count/percentage (single-direction magnitude). */
function sequentialColor(t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  return rgb([
    lerp(PALE_BLUE[0], BMW_BLUE[0], clamped),
    lerp(PALE_BLUE[1], BMW_BLUE[1], clamped),
    lerp(PALE_BLUE[2], BMW_BLUE[2], clamped),
  ]);
}

/** Blue (lower than expected) -> white (as expected) -> red (higher than expected), for residuals. */
function divergingColor(value: number, cap: number): string {
  const t = Math.max(-1, Math.min(1, value / cap));
  if (t >= 0) {
    return rgb([lerp(WHITE[0], RED[0], t), lerp(WHITE[1], RED[1], t), lerp(WHITE[2], RED[2], t)]);
  }
  const s = -t;
  return rgb([lerp(WHITE[0], BMW_BLUE[0], s), lerp(WHITE[1], BMW_BLUE[1], s), lerp(WHITE[2], BMW_BLUE[2], s)]);
}

const RESIDUAL_CAP = 4; // |residual| >= this is fully saturated color

export function DefectStationMatrix({ defects, monthLabel }: { defects: DefectRecord[]; monthLabel: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<ViewMode>("anomaly");
  const [residualKind, setResidualKind] = useState<ResidualKind>("ar");
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const matrix = useMemo(() => computeDefectStationMatrix(defects), [defects]);
  const { defects: defectNames, stations, cells, grandTotal } = matrix;

  const maxCount = Math.max(...cells.flat().map((c) => c.count), 1);
  const maxPct = Math.max(...cells.flat().map((c) => c.pctOfStation), 1);

  function cellColor(cell: MatrixCell): string {
    if (view === "count") return sequentialColor(cell.count / maxCount);
    if (view === "pct") return sequentialColor(cell.pctOfStation / maxPct);
    const value = residualKind === "sr" ? cell.sr : cell.ar;
    return divergingColor(value, RESIDUAL_CAP);
  }

  function cellText(cell: MatrixCell): string {
    if (view === "count") return String(cell.count);
    if (view === "pct") return `${cell.pctOfStation.toFixed(0)}%`;
    const value = residualKind === "sr" ? cell.sr : cell.ar;
    return cell.count === 0 && cell.expected === 0 ? "" : value.toFixed(1);
  }

  function cellIntensity(cell: MatrixCell): number {
    if (view === "count") return cell.count / maxCount;
    if (view === "pct") return cell.pctOfStation / maxPct;
    const value = residualKind === "sr" ? cell.sr : cell.ar;
    return Math.abs(value) / RESIDUAL_CAP;
  }

  function showTooltip(evt: ReactMouseEvent, cell: MatrixCell) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({ x: evt.clientX - rect.left, y: evt.clientY - rect.top, cell });
  }

  return (
    <ChartCard
      title={`Defect × Station — ${monthLabel}`}
      accent="indigo"
      height="h-auto"
      infoText="Chi-square residual analysis: for each defect/station combination, Expected = (defect total × station total) / grand total. The residual compares Observed to Expected — red means this combo happens more often than the overall rates would predict, blue means less. Adjusted residual (AR) corrects for uneven row/column totals and is more reliable than the simple standardized residual (SR); cells with expected count under 5 are hatched since the residual there is statistically shaky."
      rightSlot={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="flex gap-1 bg-paper rounded-lg p-0.5">
            {(
              [
                ["count", "Count"],
                ["pct", "% of station"],
                ["anomaly", "Anomaly"],
              ] as [ViewMode, string][]
            ).map(([v, label]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors ${
                  view === v ? "bg-white text-bmw-blue shadow-sm" : "text-slate-light hover:text-slate"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {view === "anomaly" && (
            <div className="flex gap-1 bg-paper rounded-lg p-0.5">
              {(["sr", "ar"] as ResidualKind[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setResidualKind(k)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-md uppercase transition-colors ${
                    residualKind === k ? "bg-white text-bmw-blue shadow-sm" : "text-slate-light hover:text-slate"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          )}
        </div>
      }
    >
      <div ref={containerRef} className="relative">
        <div className="overflow-x-auto">
          <table className="border-collapse text-[11px]">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white p-0" style={{ minWidth: 150, height: 130 }} />
                {stations.map((station) => (
                  <th key={station} className="relative p-0" style={{ minWidth: 30, height: 130 }}>
                    <div
                      className="absolute bottom-1 left-1/2 origin-bottom-left -rotate-[55deg] whitespace-nowrap text-[10px] text-slate font-medium"
                      title={station}
                    >
                      {station}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {defectNames.map((defect, i) => (
                <tr key={defect}>
                  <td
                    className="sticky left-0 z-10 bg-white px-3 py-1.5 text-[11px] font-medium text-ink whitespace-nowrap border-r border-hairline"
                    style={{ minWidth: 150 }}
                  >
                    {defect}
                  </td>
                  {cells[i].map((cell) => {
                    const intensity = cellIntensity(cell);
                    const textColor = intensity > 0.55 ? "#FFFFFF" : "#26313D";
                    return (
                      <td
                        key={cell.station}
                        className="text-center align-middle cursor-default select-none"
                        style={{
                          width: 30,
                          height: 26,
                          backgroundColor: cellColor(cell),
                          backgroundImage: cell.lowSample && view === "anomaly" ? "repeating-linear-gradient(45deg, rgba(255,255,255,0.5) 0, rgba(255,255,255,0.5) 2px, transparent 2px, transparent 5px)" : undefined,
                        }}
                        onMouseEnter={(e) => showTooltip(e, cell)}
                        onMouseMove={(e) => showTooltip(e, cell)}
                        onMouseLeave={() => setTooltip(null)}
                      >
                        <span style={{ color: textColor, fontSize: 9.5 }}>{cellText(cell)}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {tooltip && (
          <div
            className="pointer-events-none absolute z-20 rounded-lg bg-navy-900 text-white text-[11px] leading-relaxed px-3 py-2 shadow-lg"
            style={{ left: Math.min(tooltip.x + 12, 500), top: tooltip.y + 12, maxWidth: 240 }}
          >
            <div className="font-medium">{tooltip.cell.defect}</div>
            <div className="text-[#CBD9E8] mb-1">{tooltip.cell.station}</div>
            <div className="text-[#CBD9E8]">
              Observed {tooltip.cell.count} · Expected {tooltip.cell.expected.toFixed(1)}
            </div>
            <div className="text-[#CBD9E8]">
              SR {tooltip.cell.sr.toFixed(2)} · AR {tooltip.cell.ar.toFixed(2)}
            </div>
            <div className="text-[#CBD9E8]">{tooltip.cell.pctOfStation.toFixed(1)}% of this station's defects</div>
            {tooltip.cell.lowSample && (
              <div className="flex items-center gap-1 mt-1 text-[#F2B705]">
                <AlertTriangle size={11} /> Low expected count — residual unreliable
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 mt-3 text-[11px] text-slate-light">
          {view === "anomaly" ? (
            <>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: rgb(BMW_BLUE) }} /> Less than expected
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm border border-hairline" style={{ background: rgb(WHITE) }} /> As expected
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: rgb(RED) }} /> More than expected
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-sm border border-hairline"
                  style={{ backgroundImage: "repeating-linear-gradient(45deg, #D7E0EA 0, #D7E0EA 1.5px, transparent 1.5px, transparent 4px)" }}
                />
                Low sample (E &lt; 5)
              </span>
            </>
          ) : (
            <span>{grandTotal.toLocaleString()} defects this month across {defectNames.length} defect types and {stations.length} stations</span>
          )}
        </div>
      </div>
    </ChartCard>
  );
}
