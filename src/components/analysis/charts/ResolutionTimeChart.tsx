import { useEffect, useMemo, useRef, useState, MouseEvent as ReactMouseEvent } from "react";
import { ZoomOut, Search } from "lucide-react";
import { DefectRecord, FlaggedOutlier } from "@/types";
import {
  resolutionOutlierAnalysis,
  binResolutionDays,
  ResolutionOutlierPoint,
} from "@/utils/defectMetrics";
import { ChartCard } from "@/components/shared/ChartCard";

/* ---------------------------------------------------------------------- */
/* Layout constants                                                        */
/* ---------------------------------------------------------------------- */

const VB_WIDTH = 760;
const VB_HEIGHT = 300;
const PAD_X = 46;
const PLOT_LEFT = PAD_X;
const PLOT_RIGHT = VB_WIDTH - PAD_X;

// No box plot anymore — outlier band and bubble band now split the freed
// vertical space between them.
const BUBBLE_BAND_Y = 172;
const BUBBLE_BAND_HEIGHT = 168;
const AXIS_Y = 258;

const LOG_FLOOR = 0.01;
const MIN_DRAG_PX = 10;

type ViewMode = "resolved" | "unresolved";

/* ---------------------------------------------------------------------- */
/* Scales                                                                   */
/* ---------------------------------------------------------------------- */

function makeXScale(domainMin: number, domainMax: number) {
  const logMin = Math.log10(Math.max(domainMin, LOG_FLOOR));
  const logMax = Math.log10(Math.max(domainMax, LOG_FLOOR));
  const span = logMax - logMin || 1;
  return (day: number) => {
    const t = (Math.log10(Math.max(day, LOG_FLOOR)) - logMin) / span;
    return PLOT_LEFT + t * (PLOT_RIGHT - PLOT_LEFT);
  };
}

function invertX(px: number, domainMin: number, domainMax: number) {
  const logMin = Math.log10(Math.max(domainMin, LOG_FLOOR));
  const logMax = Math.log10(Math.max(domainMax, LOG_FLOOR));
  const t = (px - PLOT_LEFT) / (PLOT_RIGHT - PLOT_LEFT);
  return Math.pow(10, logMin + t * (logMax - logMin));
}

function bubbleRadius(count: number, maxCount: number) {
  const minR = 3.5;
  const maxR = 17;
  const t = Math.sqrt(count / Math.max(maxCount, 1));
  return minR + t * (maxR - minR);
}

function computeTicks(min: number, max: number): number[] {
  if (max <= min) return [min];
  const rawStep = (max - min) / 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep || min || 1)));
  const residual = rawStep / magnitude;
  let step = magnitude;
  if (residual > 5) step = 10 * magnitude;
  else if (residual > 2) step = 5 * magnitude;
  else if (residual > 1) step = 2 * magnitude;
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + 1e-9; v += step) {
    ticks.push(Math.round(v * 1000) / 1000);
  }
  return ticks.length ? ticks : [min, max];
}

function formatDay(v: number): string {
  return v < 1 ? v.toFixed(2) : v < 10 ? v.toFixed(1) : String(Math.round(v));
}

/* ---------------------------------------------------------------------- */
/* Local UI state types                                                    */
/* ---------------------------------------------------------------------- */

interface TooltipState {
  x: number;
  y: number;
  lines: string[];
}

interface PopoverState {
  id: string;
  x: number;
  y: number;
  defectName: string;
  station: string;
  partNumber: number;
  days: number;
  date: string;
  draft: string;
  isExisting: boolean;
}

interface ResolutionTimeChartProps {
  defects: DefectRecord[];
  selectedMonth: string;
  flagged: Record<string, FlaggedOutlier>;
  onFlag: (entry: FlaggedOutlier) => void;
  onUnflag: (id: string) => void;
  onUpdateComment: (id: string, comment: string) => void;
}

/* ---------------------------------------------------------------------- */
/* Component                                                                */
/* ---------------------------------------------------------------------- */

export function ResolutionTimeChart({
  defects,
  selectedMonth,
  flagged,
  onFlag,
  onUnflag,
  onUpdateComment,
}: ResolutionTimeChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [view, setView] = useState<ViewMode>("resolved");

  const monthLabel = selectedMonth
    ? new Date(`${selectedMonth}-01T00:00:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : "";

  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null);
  const [drag, setDrag] = useState<{ startPx: number; currentPx: number } | null>(null);
  const [search, setSearch] = useState("");

  // Switching between resolved/unresolved swaps the underlying data entirely
  // (and therefore the axis domain), so any zoom/tooltip/popover from the
  // previous view no longer applies.
  useEffect(() => {
    setZoomDomain(null);
    setTooltip(null);
    setPopover(null);
    setDrag(null);
  }, [view, selectedMonth]);

  const filteredDefects = useMemo(
    () =>
      defects.filter(
        (d) =>
          (view === "resolved" ? d.status === "Resolved" : d.status === "Open") &&
          d.date.slice(0, 7) === selectedMonth
      ),
    [defects, view, selectedMonth]
  );

  const analysis = useMemo(() => resolutionOutlierAnalysis(filteredDefects), [filteredDefects]);
  const { stats, normal, outliers } = analysis;

  const fullDomainMin = stats.min;
  const fullDomainMax = Math.max(stats.max, stats.upperFence * 1.05);
  const [domainMin, domainMax] = zoomDomain ?? [fullDomainMin, fullDomainMax];

  const x = useMemo(() => makeXScale(domainMin, domainMax), [domainMin, domainMax]);
  const ticks = useMemo(() => computeTicks(domainMin, domainMax), [domainMin, domainMax]);

  const searchLower = search.trim().toLowerCase();
  const matchesSearch = (p: { defectName: string; station: string; partNumber: number }) =>
    !searchLower ||
    p.defectName.toLowerCase().includes(searchLower) ||
    p.station.toLowerCase().includes(searchLower) ||
    String(p.partNumber).includes(searchLower);

  const visibleNormal = useMemo(() => normal.filter(matchesSearch), [normal, searchLower]);
  const visibleOutliers = useMemo(() => outliers.filter(matchesSearch), [outliers, searchLower]);

  const bubbles = useMemo(() => binResolutionDays(visibleNormal, 26), [visibleNormal]);
  const maxBubbleCount = Math.max(...bubbles.map((b) => b.count), 1);

  function svgPointX(evt: ReactMouseEvent): number {
    const svg = svgRef.current;
    if (!svg) return 0;
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return 0;
    return pt.matrixTransform(ctm.inverse()).x;
  }

  function showTooltip(evt: ReactMouseEvent, lines: string[]) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || popover) return;
    setTooltip({ x: evt.clientX - rect.left, y: evt.clientY - rect.top, lines });
  }

  function openPopover(evt: ReactMouseEvent, o: ResolutionOutlierPoint) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip(null);
    const existing = flagged[o.id];
    setPopover({
      id: o.id,
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top,
      defectName: o.defectName,
      station: o.station,
      partNumber: o.partNumber,
      days: o.days,
      date: o.date,
      draft: existing?.comment ?? "",
      isExisting: Boolean(existing),
    });
  }

  function confirmPopover() {
    if (!popover) return;
    if (popover.isExisting) {
      onUpdateComment(popover.id, popover.draft);
    } else {
      onFlag({
        id: popover.id,
        defectName: popover.defectName,
        station: popover.station,
        partNumber: popover.partNumber,
        days: popover.days,
        date: popover.date,
        comment: popover.draft,
        flaggedAt: new Date().toISOString(),
      });
    }
    setPopover(null);
  }

  function unflagFromPopover() {
    if (!popover) return;
    onUnflag(popover.id);
    setPopover(null);
  }

  function handleBackgroundMouseDown(evt: ReactMouseEvent) {
    if (popover) {
      setPopover(null);
      return;
    }
    const px = svgPointX(evt);
    setDrag({ startPx: px, currentPx: px });
  }

  function handleBackgroundMouseMove(evt: ReactMouseEvent) {
    if (!drag) return;
    setDrag({ ...drag, currentPx: svgPointX(evt) });
  }

  function handleBackgroundMouseUp() {
    if (!drag) return;
    const { startPx, currentPx } = drag;
    const widthPx = Math.abs(currentPx - startPx);
    if (widthPx >= MIN_DRAG_PX) {
      const loPx = Math.min(startPx, currentPx);
      const hiPx = Math.max(startPx, currentPx);
      const lo = invertX(Math.max(loPx, PLOT_LEFT), domainMin, domainMax);
      const hi = invertX(Math.min(hiPx, PLOT_RIGHT), domainMin, domainMax);
      if (hi > lo) setZoomDomain([lo, hi]);
    }
    setDrag(null);
  }

  const flaggedCount = Object.keys(flagged).length;
  const isZoomed = zoomDomain !== null;

  return (
    <ChartCard
      title={`Time to resolution — ${monthLabel}`}
      accent="sky"
      height="h-[440px]"
      infoText={
        view === "resolved"
          ? `IQR outlier method (Q1 ${stats.q1.toFixed(2)}d · median ${stats.median.toFixed(2)}d · Q3 ${stats.q3.toFixed(2)}d) — only the upper fence (Q3 + 1.5×IQR = ${stats.upperFence.toFixed(2)}d) is used, since resolving fast isn't a problem worth flagging. Drag to zoom into a cluster; click a yellow outlier to flag it with a comment.`
          : `Same IQR method, computed separately on still-open defects using elapsed days since reported (fence = ${stats.upperFence.toFixed(2)}d). These aren't final resolution times — a defect resolved tomorrow would drop off this view.`
      }
      rightSlot={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="flex items-center gap-1.5 bg-paper rounded-lg px-2 py-1">
            <Search size={12} className="text-slate-light shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search outliers or part #…"
              className="bg-transparent text-[11px] outline-none w-24 sm:w-32 placeholder:text-slate-light"
            />
          </div>
          <div className="flex gap-1 bg-paper rounded-lg p-0.5">
            {(["resolved", "unresolved"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors capitalize ${
                  view === v ? "bg-white text-bmw-blue shadow-sm" : "text-slate-light hover:text-slate"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-slate-light">
            {visibleOutliers.length}
            {search ? ` of ${outliers.length}` : ""} outliers{flaggedCount > 0 ? ` · ${flaggedCount} flagged` : ""}
          </span>
          {isZoomed && (
            <button
              onClick={() => setZoomDomain(null)}
              className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md bg-paper text-bmw-blue hover:bg-[#EAF2FC] transition-colors"
            >
              <ZoomOut size={12} /> Reset zoom
            </button>
          )}
        </div>
      }
    >
      <div ref={containerRef} className="relative w-full h-full">
        {normal.length === 0 && outliers.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[12px] text-slate-light">
            No {view} defects in {monthLabel}.
          </div>
        ) : visibleNormal.length === 0 && visibleOutliers.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[12px] text-slate-light">
            No results match "{search}".
          </div>
        ) : (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
            className="w-full h-full select-none"
            onMouseLeave={() => {
              setTooltip(null);
              setDrag(null);
            }}
          >
            <rect
              x={PLOT_LEFT}
              y={0}
              width={PLOT_RIGHT - PLOT_LEFT}
              height={VB_HEIGHT}
              fill="transparent"
              style={{ cursor: drag ? "ew-resize" : "crosshair" }}
              onMouseDown={handleBackgroundMouseDown}
              onMouseMove={handleBackgroundMouseMove}
              onMouseUp={handleBackgroundMouseUp}
            />

            <line x1={PLOT_LEFT} y1={AXIS_Y} x2={PLOT_RIGHT} y2={AXIS_Y} stroke="#E4E9EF" strokeWidth={1} />
            {ticks.map((t) => (
              <g key={t}>
                <line x1={x(t)} y1={AXIS_Y} x2={x(t)} y2={AXIS_Y + 4} stroke="#C9D3DE" strokeWidth={1} />
                <text x={x(t)} y={AXIS_Y + 16} fontSize={10} fill="#5B6B7C" textAnchor="middle">
                  {formatDay(t)}d
                </text>
              </g>
            ))}
            <text x={(PLOT_LEFT + PLOT_RIGHT) / 2} y={AXIS_Y + 32} fontSize={10} fill="#9FB0C3" textAnchor="middle">
              {view === "resolved" ? "Resolution time" : "Days elapsed so far"} (log scale) — drag to zoom
            </text>

            <line x1={x(stats.upperFence)} y1={16} x2={x(stats.upperFence)} y2={AXIS_Y} stroke="#E8B33A" strokeWidth={1} strokeDasharray="4 3" />
            <text x={x(stats.upperFence)} y={12} fontSize={9} fill="#B8860B" textAnchor="middle">
              fence
            </text>

            {bubbles.map((b, i) => {
              const r = bubbleRadius(b.count, maxBubbleCount);
              const cx = x(b.binCenter);
              const cy = BUBBLE_BAND_Y + (((i * 37) % 100) / 100 - 0.5) * (BUBBLE_BAND_HEIGHT - r * 2);
              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="#1C69D4"
                  fillOpacity={0.32}
                  stroke="#1C69D4"
                  strokeOpacity={0.5}
                  strokeWidth={1}
                  onMouseEnter={(e) => showTooltip(e, [`${b.count.toLocaleString()} defects`, `${b.minDay.toFixed(2)}–${b.maxDay.toFixed(2)} days`])}
                  onMouseMove={(e) => showTooltip(e, [`${b.count.toLocaleString()} defects`, `${b.minDay.toFixed(2)}–${b.maxDay.toFixed(2)} days`])}
                />
              );
            })}

            {visibleOutliers.map((o: ResolutionOutlierPoint) => {
              const cx = x(o.days);
              const cy = BUBBLE_BAND_Y + (o.jitter - 0.5) * (BUBBLE_BAND_HEIGHT - 10);
              const isFlagged = Boolean(flagged[o.id]);
              const color = isFlagged ? "#E4443A" : "#F2B705";
              const hoverLines = [
                o.defectName,
                o.station,
                `${o.days.toFixed(2)} days${o.isCensored ? " (open, elapsed so far)" : ""}`,
                isFlagged ? "Flagged for review — click to edit comment" : "Click to flag for review",
              ];
              return (
                <g
                  key={o.id}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    openPopover(e, o);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseEnter={(e) => showTooltip(e, hoverLines)}
                  onMouseMove={(e) => showTooltip(e, hoverLines)}
                >
                  <circle cx={cx} cy={cy} r={9} fill="transparent" />
                  <circle cx={cx} cy={cy} r={5} fill={color} stroke="white" strokeWidth={1.25} />
                </g>
              );
            })}
          </svg>
        )}

        {drag && Math.abs(drag.currentPx - drag.startPx) >= MIN_DRAG_PX && (
          <div
            className="pointer-events-none absolute top-0 bottom-0 bg-bmw-blue/10 border-x border-bmw-blue/40"
            style={{
              left: `${(Math.min(drag.startPx, drag.currentPx) / VB_WIDTH) * 100}%`,
              width: `${(Math.abs(drag.currentPx - drag.startPx) / VB_WIDTH) * 100}%`,
            }}
          />
        )}

        {tooltip && !popover && (
          <div
            className="pointer-events-none absolute z-10 rounded-lg bg-navy-900 text-white text-[11px] leading-relaxed px-3 py-2 shadow-lg"
            style={{ left: tooltip.x + 12, top: tooltip.y - 8, maxWidth: 220 }}
          >
            {tooltip.lines.map((line, i) => (
              <div key={i} className={i === 0 ? "font-medium" : "text-[#CBD9E8]"}>
                {line}
              </div>
            ))}
          </div>
        )}

        {popover && (
          <div
            className="absolute z-20 w-64 rounded-xl bg-white border border-hairline shadow-xl p-3"
            style={{
              left: Math.min(popover.x + 12, VB_WIDTH - 260),
              top: popover.y + 12,
            }}
          >
            <div className="text-[12px] font-semibold text-ink">{popover.defectName}</div>
            <div className="text-[11px] text-slate-light mb-2">
              {popover.station} · {popover.days.toFixed(2)}d · {popover.date}
            </div>
            <textarea
              autoFocus
              value={popover.draft}
              onChange={(e) => setPopover({ ...popover, draft: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Escape") setPopover(null);
              }}
              placeholder="e.g. Battery anomaly — investigate calibration"
              rows={3}
              className="w-full text-[12px] rounded-lg border border-hairline px-2.5 py-2 resize-none focus:outline-none focus:border-bmw-blue"
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={confirmPopover}
                className="flex-1 text-[12px] font-medium px-3 py-1.5 rounded-lg bg-bmw-blue text-white hover:bg-[#155ab8] transition-colors"
              >
                {popover.isExisting ? "Save comment" : "Flag for review"}
              </button>
              {popover.isExisting && (
                <button
                  onClick={unflagFromPopover}
                  className="text-[12px] font-medium px-3 py-1.5 rounded-lg bg-[#FDECEC] text-[#C4342E] hover:bg-[#FBDADA] transition-colors"
                >
                  Unflag
                </button>
              )}
              <button
                onClick={() => setPopover(null)}
                className="text-[12px] font-medium px-3 py-1.5 rounded-lg text-slate hover:bg-paper transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="absolute bottom-0 right-0 flex items-center gap-4 text-[11px] text-slate">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-bmw-blue/40 border border-bmw-blue" />
            Normal (aggregated)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#F2B705" }} />
            Outlier
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#E4443A" }} />
            Flagged for review
          </span>
        </div>
      </div>
    </ChartCard>
  );
}
