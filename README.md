# BMW QLab — Total Vehicle Quality Dashboard

A quality-monitoring dashboard for the BMW iX0 production line, built for the
QLab Skills Interview Case Study (Software Engineering — Total Vehicle Quality).

## Stack
- React 18 + TypeScript
- Vite
- Tailwind CSS
- lucide-react (icons)
- recharts (charts — wired up in Task 1/2)

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
    layout/      Sidebar, Topbar, status chip, brand mark
    dashboard/    KPI cards, chart panels, Dashboard tab
    defects/      Defects table/search/filter tab
    info/         Reference info tab
  data/           Parsed/prepped defect dataset (added in Task 1)
  types/          Shared TypeScript types for defect records
  styles/         Tailwind entry stylesheet
  App.tsx         Sidebar navigation + view routing
  main.tsx        React entry point
```

## Status

This is the GUI shell (sidebar navigation across Dashboard / Defects / Info,
BMW navy/blue/teal palette). Data ingestion, outlier detection, the flagging
workflow, the Gen-AI panel, and causal inference all land on top of this in
the tasks that follow — see the case study PDF for the full task breakdown.

## Data

The source dataset (`Quality_Notional_Data_v2_resolution_variation_final.xlsx`,
9,000 defect records) is not yet wired in — see `src/data/` once Task 1 lands.
