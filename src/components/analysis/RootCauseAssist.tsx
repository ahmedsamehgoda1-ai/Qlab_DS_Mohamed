import { useMemo, useState } from "react";
import { Sparkles, Loader2, AlertTriangle, RefreshCw, ShieldAlert } from "lucide-react";
import { DefectRecord, FlaggedOutlier } from "@/types";
import { computeProcessContainment } from "@/utils/defectMetrics";
import { buildRootCausePrompt } from "@/utils/rootCausePrompt";
import { generateWithOllama } from "@/utils/ollamaClient";
import { STATUS_RED, STATUS_AMBER } from "@/components/shared/statusColors";

const DEFAULT_MODEL = "llama3.2";

interface RootCauseAssistProps {
  flaggedItems: FlaggedOutlier[];
  allDefects: DefectRecord[];
  monthDefects: DefectRecord[];
  scope: "month" | "all-time";
  activeLabel: string;
}

type Status = "idle" | "loading" | "done" | "error";

/**
 * Task 5 — Gen AI. Focused on the Defect x Station process-containment
 * analysis: it reasons about WHY a potential-escape or data-quality-concern
 * signal might be happening, generated fresh from that table each time —
 * nothing here is a pre-written explanation. Deliberately NOT a chatbot: a
 * single "generate" action over one fixed, structured prompt, not an open
 * conversation. Styled distinctly from the deterministic charts (dashed
 * indigo border, "AI-generated" badge) so it's unmistakably a different
 * kind of output — a synthesis, not a measurement.
 */
export function RootCauseAssist({ flaggedItems, allDefects, monthDefects, scope, activeLabel }: RootCauseAssistProps) {
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Same scope the containment table above is showing — reasoning about a
  // different slice than what's on screen would be confusing to read
  // against, so this is a controlled prop, not independent state.
  const activeDefects = scope === "month" ? monthDefects : allDefects;
  const containmentRows = useMemo(() => computeProcessContainment(activeDefects), [activeDefects]);
  const signalRows = containmentRows.filter((r) => r.signal !== "high-containment");
  const hasSignals = signalRows.length > 0;

  async function handleGenerate() {
    const prompt = buildRootCausePrompt(containmentRows, flaggedItems, activeLabel);
    if (!prompt) return;
    setStatus("loading");
    setErrorMessage("");
    const outcome = await generateWithOllama(model.trim() || DEFAULT_MODEL, prompt);
    if ("error" in outcome) {
      setStatus("error");
      setErrorMessage(outcome.error.message);
    } else {
      setResult(outcome.text);
      setStatus("done");
    }
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-bmw-indigo/40 bg-gradient-to-br from-white to-[#F5F4FF] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <div className="flex items-center gap-2">
          <span className="h-8 w-8 rounded-lg bg-bmw-indigo/10 flex items-center justify-center shrink-0">
            <Sparkles size={16} className="text-bmw-indigo" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[14px] font-semibold text-ink">Root Cause Assist</h3>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-bmw-indigo/10 text-bmw-indigo uppercase tracking-wide">
                AI-generated
              </span>
            </div>
            <p className="text-[11.5px] text-slate-light">
              Reasons about {activeLabel}'s Defect × Station signals (above) automatically — one-shot analysis, not a chatbot.
            </p>
          </div>
        </div>
      </div>

      {hasSignals && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {signalRows.map((r) => {
            const tone = r.signal === "data-quality-concern" ? STATUS_RED : STATUS_AMBER;
            return (
              <span
                key={r.defect}
                className="inline-flex items-center gap-1 text-[10.5px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: tone.bg, color: tone.fg }}
              >
                <ShieldAlert size={9} /> {r.defect}
              </span>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-3 mb-3">
        <label className="text-[11px] text-slate">Model:</label>
        <input
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder={DEFAULT_MODEL}
          className="text-[11px] font-mono px-2 py-1 rounded-md border border-hairline bg-white w-32 focus:outline-none focus:border-bmw-blue"
        />
        <button
          onClick={handleGenerate}
          disabled={!hasSignals || status === "loading"}
          className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg bg-bmw-indigo text-white hover:bg-[#4A5AE0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {status === "loading" ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          {status === "done" ? "Regenerate" : "Generate analysis"}
        </button>
        {!hasSignals && (
          <span className="text-[11px] text-slate-light">
            No potential-escape or data-quality-concern signals in {activeLabel} — every defect shows high containment.
          </span>
        )}
      </div>

      {status === "error" && (
        <div
          className="flex items-start gap-2 rounded-lg text-[12px] px-3 py-2.5"
          style={{ background: STATUS_RED.bg, color: STATUS_RED.fg }}
        >
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            {errorMessage}
            <button
              onClick={handleGenerate}
              className="flex items-center gap-1 mt-1.5 font-medium hover:underline"
            >
              <RefreshCw size={11} /> Retry
            </button>
          </div>
        </div>
      )}

      {status === "done" && (
        <div className="rounded-lg bg-white border border-bmw-indigo/20 px-4 py-3">
          <p className="text-[13px] text-ink leading-relaxed whitespace-pre-wrap">{result}</p>
        </div>
      )}
    </div>
  );
}
