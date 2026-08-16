# Deliverable Package — task-to-code mapping

This is a single React + TypeScript application (per Task 1's tech
requirement), not separate notebooks — this file maps the submission's
required task titles to exactly where each one lives in the codebase.

**Output Task 1 – Data Ingestion & Display**
`src/components/defects/` (sortable, searchable spreadsheet) and
`src/components/dashboard/` (Top 5 defects, severity distribution, defect
rate by variant, station Pareto). Data loading/cleaning in
`src/data/loadDefects.ts` and the xlsx→json export script referenced in
`DOCUMENTATION.md`.

**Output Task 2 – Dynamic Outlier Detection**
`src/components/analysis/charts/ResolutionTimeChart.tsx`, backed by
`src/utils/stats.ts` (IQR fence math) and `src/utils/defectMetrics.ts`
(`resolutionOutlierAnalysis`).

**Output Task 3 – Interactive Quality Workflow**
Flagging + comment popover in `ResolutionTimeChart.tsx`; Tracking
Dashboard in `src/components/analysis/TrackingDashboard.tsx`.

**Output Task 4 – Reflection & Innovation Section**
Reflection: `DOCUMENTATION.md` ("Limitations" section) and the in-app
Documentation tab (`src/components/info/InfoView.tsx`). Feature: CSV
export on the Tracking Dashboard (`src/components/analysis/TrackingDashboard.tsx`,
`src/utils/csvExport.ts`) — built directly against the "flags reset on
refresh" limitation.

**Output Task 5 – Gen AI**
`src/components/analysis/ProcessContainmentInsight.tsx`, prompt logic in
`src/utils/processContainmentInsightPrompt.ts`, Ollama client in `src/utils/ollamaClient.ts`.

**Output Task 6 – Causal Inference**
`DOCUMENTATION.md` only, per direction — not an in-app feature.
