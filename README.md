# BMW QLab — Total Vehicle Quality Dashboard

A quality-monitoring dashboard for the BMW iX0 production line, built for the
QLab Skills Interview Case Study (Software Engineering — Total Vehicle Quality).

See **`DOCUMENTATION.md`** for the full technical write-up — why each chart
exists, why each statistical method was chosen over the alternatives, the
data-cleaning discovery, and Task 6's causal inference analysis.

See **`DELIVERABLE_MAP.md`** for exactly where each of the case study's
6 required tasks lives in this codebase.

## Stack
- React 18 + TypeScript + Vite
- Tailwind CSS
- lucide-react (icons)
- recharts (Dashboard tab charts)
- Custom SVG (Analysis tab's outlier chart — recharts doesn't support this
  directly; see DOCUMENTATION.md)

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (defaults to http://localhost:5173).

To build for production:

```bash
npm run build
npm run preview
```

## Project structure

```
src/
  components/
    layout/       Sidebar, Topbar, status chip
    dashboard/     KPI cards, Top 5 pie, severity chart, defect-rate breakdown,
                   station Pareto — Dashboard tab
    analysis/      Resolution-time outlier chart, Defect × Station process
                   containment analysis, flagging workflow, Tracking
                   Dashboard (with CSV export), Process Containment Insight — Analysis tab
    defects/       Sortable/searchable defect spreadsheet — Defects tab
    info/          Assumptions, methods, limitations — Documentation tab
    shared/        ChartCard, chart/status color tokens shared across tabs
  data/            defects.json (cleaned dataset) + loadDefects.ts (enrichment)
  utils/           stats.ts (IQR), defectMetrics.ts (chart aggregations,
                   process-containment analysis), processContainmentInsightPrompt.ts +
                   ollamaClient.ts (Task 5), csvExport.ts (Task 4)
  types/           Shared TypeScript types
  App.tsx          Sidebar navigation + view routing
  main.tsx         React entry point
DOCUMENTATION.md   Full rationale for every chart, method, and design decision
DELIVERABLE_MAP.md Task-by-task pointer into this codebase, for submission
```

## Task 5 — Process Containment Insight (local LLM via Ollama)

The Analysis tab's "Process Containment Insight" panel calls a **local Ollama**
instance directly from the browser (no backend, no API key — Ollama's local
server has none). To use it:

```bash
# 1. Install Ollama: https://ollama.com
# 2. Pull a model (llama3.2 is the default the app expects, but the
#    model-name field in the panel can be changed to whatever you've pulled)
ollama pull llama3.2

# 3. Start the server
ollama serve
```

If requests are blocked by CORS, restart Ollama with this app's origin
allowed:

```bash
OLLAMA_ORIGINS=http://localhost:5173 ollama serve
```

The panel is disabled when no defect shows a `potential-escape` or
`data-quality-concern` signal in the Defect × Station table above it — it
reasons about that table's own numbers, not raw data alone, and folds in
any engineer-flagged items (Task 3) for the same defects when present.
Calling the LLM directly from the browser is a demo-only trade-off
(documented in `DOCUMENTATION.md`) — fine here since Ollama has no secret
to leak, but not how you'd wire up a hosted API key in production.

## Status

All 6 tasks are complete, including Task 4's required feature (CSV export
on the Tracking Dashboard — see `DELIVERABLE_MAP.md`). Task 6 (causal
inference) is documentation-only per direction — see `DOCUMENTATION.md`,
not an in-app feature.

## Data

`src/data/defects.json` is generated from
`Quality_Notional_Data_v2_resolution_variation_final.xlsx` via a Python
script (pandas/openpyxl) that also canonicalizes the `defectName` and
`station` fields — see `DOCUMENTATION.md` for why that's necessary (the
raw data has 237/35 distinct strings for what are really only 15/29 true
values, due to deliberately injected typo noise).
