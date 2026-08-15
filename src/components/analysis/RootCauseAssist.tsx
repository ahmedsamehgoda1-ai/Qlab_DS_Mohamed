import { useState } from "react";
import { Sparkles, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { DefectRecord, FlaggedOutlier } from "@/types";
import { buildRootCausePrompt } from "@/utils/rootCausePrompt";
import { generateWithOllama } from "@/utils/ollamaClient";

const DEFAULT_MODEL = "llama3.2";

interface RootCauseAssistProps {
  flaggedItems: FlaggedOutlier[];
  monthDefects: DefectRecord[];
  monthLabel: string;
}

type Status = "idle" | "loading" | "done" | "error";

/**
 * Task 5 — Gen AI. Deliberately NOT a chatbot: a single "generate" action
 * over a fixed, structured prompt (see rootCausePrompt.ts), not an open
 * conversation. Styled distinctly from the deterministic charts (dashed
 * indigo border, "AI-generated" badge) so it's unmistakably a different
 * kind of output — a synthesis, not a measurement.
 */
export function RootCauseAssist({ flaggedItems, monthDefects, monthLabel }: RootCauseAssistProps) {
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const hasFlags = flaggedItems.length > 0;

  async function handleGenerate() {
    setStatus("loading");
    setErrorMessage("");
    const prompt = buildRootCausePrompt(flaggedItems, monthDefects);
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
              Synthesizes {monthLabel}'s flagged items against the anomaly matrix — one-shot analysis, not a chatbot.
            </p>
          </div>
        </div>
      </div>

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
          disabled={!hasFlags || status === "loading"}
          className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg bg-bmw-indigo text-white hover:bg-[#4A5AE0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {status === "loading" ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          {status === "done" ? "Regenerate" : "Generate analysis"}
        </button>
        {!hasFlags && (
          <span className="text-[11px] text-slate-light">Flag at least one outlier above to enable this.</span>
        )}
      </div>

      {status === "error" && (
        <div className="flex items-start gap-2 rounded-lg bg-[#FDECEC] text-[#C4342E] text-[12px] px-3 py-2.5">
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
