# BMW QLab — Total Vehicle Quality Dashboard

## Documentation & Design Rationale

This document explains every significant decision behind the dashboard —
what each chart is for, why each technique was chosen over the alternatives,
and what assumptions were made along the way. It's organized by app section,
in roughly the order the case study's tasks introduced them.

---

## 1. The dataset, and a data-quality discovery

**Source**: `Quality_Notional_Data_v2_resolution_variation_final.xlsx` — 9,000
synthetic defect records, 18 columns, spanning May 2025 – May 2026 (13 months).

A few things in the actual data diverge from the case study PDF's description
of it, worth stating as explicit assumptions:

- **Severity Rating is inverted**: 1 is the *most* extreme severity
  ("Extreme – safety/legal/inoperable", only 141 records), 6 is the *least*
  severe ("Medium – next service visit", 1,213 records) — the opposite of
  the intuitive reading. It maps 1:1 to Severity Category, so it's
  deterministic, not independent information.
- The PDF describes a 1–10 severity scale, 3 design packages, 3 production
  shifts, and 3 defect categories. The actual data has a 1–6 scale, 4
  packages (there's an `Eco` package not mentioned), 2 shifts (no `Night`
  shift exists), and 6 defect categories (`Electrical`, `Cosmetic`,
  `Functional`, `Safety`, `Critical`, `Structural`).
- **~24.6% of records (2,210) are unresolved** — `Time to Resolution`,
  `Root Cause Identified`, and `Resolution Date` are null together on exactly
  those rows. This is what the app's "Open" status and censored-time logic
  are built on (see §3).

### The `defectName` / `station` pollution

Before building anything, I checked cardinality on every column. Every
categorical field had a sane number of distinct values (5 car models, 3
motor types, 6 defect categories, etc.) — except two free-text fields:

- `defectName`: **237 distinct raw strings**
- `station`: **35 distinct raw strings**

These weren't 237 real defect types — they were ~7–8 real defect types
(plus several already-clean ones) fragmented by random capitalization and
character-transposition typos: `"Loose Wiring"`, `"LOOSE WiRING"`,
`"Loos eWiring"`, `"LOosE wIrIng"`, etc. — 73 variants of the same defect.

**Method used to clean it**: every raw string was reduced to a *letter
signature* — lowercase, strip whitespace, sort the characters alphabetically.
Pure capitalization noise and letter-order typos don't change which letters
a string contains, so `"Loose Wiring"` and `"LOOSeW iRiNG"` collapse to the
identical signature and cluster together, while genuinely different defect
names never collide. Within each cluster, the most frequent raw variant was
picked as canonical and lowercased.

Result: **237 raw strings → 15 true defect types** (counts sum to exactly
9,000 — verified), **35 raw strings → 29 true stations**. This was clearly
deliberately injected noise (the PDF explicitly warns "you may need to prep
the data"), isolated entirely to these two free-text fields — everything
else in the dataset is clean.

This cleaning happens **once, at data-generation time** (in the Python
export script that turns the xlsx into `src/data/defects.json`), not
re-computed at runtime in the app. That means every chart and table
downstream — the Top 5 pie, the Station Pareto chart, Defects-tab search,
the Defect × Station matrix — automatically operates on correct, deduplicated
data with zero extra code, and there's a single source of truth for what
"clean" means.

---

## 2. Dashboard tab

**KPI cards** (total defects, avg. resolution time, root-cause-identified
rate, open count): the four numbers a quality lead would want at a glance.
Average resolution time is computed over *resolved* records only —
including open (censored) records in a plain average would silently bias it
downward, since those defects haven't finished accumulating time yet.

**Top 5 Defects (pie, + "Others")**: directly satisfies the brief's
"identify the top 5 most common defects" requirement. Everything outside
the top 5 is grouped into a single "Others" slice rather than left
uncategorized, so the long tail doesn't clutter the chart or get silently
dropped.

**Severity distribution ("bell curve")**: bars + a smoothed line over the
1–6 rating. The counts (141 / 623 / 2,038 / 2,635 / 2,350 / 1,213) already
form a natural bell shape peaking at 3–4, so no artificial smoothing was
needed — just an honest bar+line rendering of the real distribution. The
inverted-scale finding (§1) is surfaced directly in the chart's info tooltip
so it can't be misread.

**Defect rate by variant (Model / Motor / Package, switchable)**: satisfies
the brief's explicit "analyze overall defect rates across car models, motor
types, and design packages." Built as one chart with a dimension toggle
rather than three separate charts, since it's the same underlying question
("where do defects concentrate?") asked along three different axes — a
toggle keeps the answer directly comparable without triple the chart real
estate.

**Station Pareto chart**: my own addition to satisfy "be creative, add ≥3
more visualizations." A classic quality-engineering tool — stations ranked
by defect count with a cumulative-% line, so you can see which stations
account for 80% of the problem (the "vital few" vs. the "trivial many").
Raw counts alone don't tell you where to focus first; this does.

---

## 3. Analysis tab — outlier detection (Task 2)

**Shared month navigator**: both the resolution chart and the Defect ×
Station matrix use the same selected month rather than each having its own
picker. This keeps them describing the same slice of data, and keeps sample
sizes for the statistics below reasonable — pooling all 13 months into one
set of quartiles would blur seasonal effects and one genuinely bad month
into an "average" that describes no real month well.

**Resolved / Unresolved toggle**: resolved and open defects have
fundamentally different distributions. An open defect's `effectiveResolutionDays`
is *days elapsed since reported, so far* — a censored lower bound, not a true
resolution time (it can only go up from here). Pooling the two into one set
of quartiles would be statistically wrong, so each view computes its own
independent Q1/median/Q3/fence.

**IQR (Tukey's method) instead of mean ± k·std-dev**: resolution time is
heavily right-skewed (median 0.32 days, mean 1.35 days, max ~56 days). A
mean/std-dev threshold gets dragged upward by the same extreme values it's
supposed to flag, which inflates the threshold and under-flags real
outliers. IQR uses the median and quartiles, which are robust to skew and
extreme values — a much better fit for this kind of data.

**One-sided fence only** (`Q3 + 1.5×IQR`, no lower fence): a defect resolved
unusually *fast* isn't a quality problem worth investigating — only unusually
*slow* resolutions are actionable. A standard two-sided box plot would also
flag fast outliers below `Q1 - 1.5×IQR`, which would just be noise here
(and resolution time can't go below 0 anyway). This was a deliberate,
documented departure from the textbook two-sided box plot.

**Log-scale x-axis**: the data spans ~0.02 to 56 days. A linear scale would
crush ~90% of records into a sliver near zero while the tail stretches off
the chart — log scale keeps the whole distribution readable.

**Aggregated bubbles for normal points, individual dots for outliers**: with
thousands of "normal" points, plotting one dot per record would overplot
into an unreadable smear, and they're not individually actionable anyway.
Outliers are far fewer and are exactly what an engineer needs to click into
— so they're rendered individually and are clickable, while the bulk is
binned (log-scale bins) into size-coded bubbles.

**No box-plot rectangle rendered**: originally the chart drew the box +
whiskers explicitly; removed per your direction, since the fence line
already communicates the threshold and the bubble density visually conveys
the same "where's the bulk of the data" information without an extra shape
competing for attention. The underlying IQR math is unchanged — just the
box/whisker visual was dropped.

**No pulsing animation**: outlier/flagged dots originally used looping SVG
`<animate>` elements (a radar-ping effect). With a few hundred outliers
animating simultaneously, this measurably lagged the page — replaced with
static colored dots, no functional loss.

**Drag-to-zoom**: lets you inspect a dense cluster of outliers up close
without losing the ability to return to the whole-month view (reset-zoom
button appears once zoomed).

**Search** (defect name, station, or part number) — both here and in the
Defects tab, using the same fields, so "did we already know about this
part" gives a consistent answer wherever you're looking from.

---

## 4. Analysis tab — flagging workflow & Tracking Dashboard (Task 3)

Clicking a yellow outlier opens a small popover (defect name, station,
days, date) with a comment box. Confirming turns the dot red ("Flagged for
review") and adds it to the **Tracking Dashboard** below — a sortable,
searchable table of every flagged item, with the comment editable inline
and an Unflag button per row. This directly implements the brief's
"Flagging & Annotation" and "Tracking Dashboard" requirements: click to
flag → prompted for a note → dedicated panel that updates live as items are
flagged or unflagged, filterable and sortable.

The flagged-item store currently lives in React state at the `AnalysisView`
level (shared between the chart and the tracking table via props) — see
§6's limitations for what this means in production.

---

## 5. Analysis tab — Defect × Station matrix

**Motivation**: the Station Pareto chart answers *which* station has the
most defects, but not *what kind*. This matrix answers both at once, and
more importantly, answers a subtler question: raw counts are misleading
because busier stations naturally rack up higher counts for everything.
Worked example: Station A with 300/1,000 defects being "Loose Wiring" (30%)
looks less concerning than Station B with 200/300 (66.7%) — even though A's
raw count is higher, B's *profile* is far more skewed toward that one
defect, which is the more actionable signal.

**Method — chi-square residual analysis**:
- `Expected(i,j) = (defect_i total × station_j total) / grand total` — what
  you'd see if defect type and station were independent.
- `Standardized Residual (SR) = (Observed - Expected) / √Expected` — how many
  "standard deviations" the actual count is from what independence would
  predict.
- `Adjusted Residual (AR) = (Observed - Expected) / √(Expected × (1 - rowTotal/N) × (1 - colTotal/N))`
  — Haberman's correction, which accounts for the fact that row/column
  totals are fixed rather than free, giving more trustworthy significance
  than plain SR when totals vary a lot across defects/stations (they do
  here — some defect types are 50× more common than others). Both are
  exposed via a toggle, rather than picking one silently, since the
  trade-off between "simpler" and "more rigorous" is worth being able to
  see directly.

**Low-sample flagging**: at month-level granularity, many defect/station
combinations have small expected counts, and a residual computed on
`Expected < 5` is numerically unstable — one lucky or unlucky occurrence can
produce a huge SR/AR that doesn't reflect a real pattern. Rather than hide
this, cells with `E < 5` are visually hatched in both residual modes, so the
chart doesn't overstate confidence it doesn't actually have — a direct,
visible acknowledgment of the method's limits at this level of filtering.

**Three view modes** (Count / % of station / Anomaly) map to the three
tables worked out in discussion before any code was written: raw counts
answer "how many," percentage-of-station answers "what does this station
tend to produce," and the residual answers "is this combination actually
unusual" — which is the one most useful for anomaly detection, and the
default view.

---

## 6. Design decisions

- **Color palette**: BMW navy/blue/white/black as specified, widened with
  a teal accent borrowed from BMW's **i / eDrive** electrified sub-brand
  (fitting, since the iX0 is electric) and an indigo accent for chart
  variety — all within the BMW brand family, none of it arbitrary.
- **Nav order** (Dashboard → Analysis → Defects → Info): mirrors the natural
  investigation flow — quick health check, then deep statistical
  investigation, then raw record access, then reference info.
- **Data cleaned once, at the source**: rather than normalizing strings
  redundantly inside every component that touches them, cleaning happens
  once in the JSON-generation step, so there's a single source of truth and
  no risk of two components disagreeing about what "clean" means.

---

## 7. Reflection & limitations (Task 4)

**Limitations of the current approach**: the dataset is bundled as a static
4.2MB JSON import rather than served from a real API with pagination — fine
for a case study, not for production. The flagged-item store lives only in
React memory, so it resets on page refresh and isn't shared across users —
there's no persistence layer yet. Only 5 distinct reporters exist in the
whole dataset, which is why a by-reporter breakdown (originally built) was
removed rather than kept as a misleadingly precise chart on a near-meaningless
sample. At month-level granularity, the Defect × Station residual analysis
gets statistically thin for rarer combinations — visually flagged, but not
solved.

**How robustness was addressed**: the pipeline is strongly typed end-to-end
(raw JSON → validated `DefectRecord` shape), the IQR and chi-square logic
live in small, pure, independently reusable utility functions used
identically across the resolved/unresolved/month-filtered views (so results
can't silently diverge between charts), and censored (open) data is handled
explicitly rather than being dropped or averaged in as if it were complete.

**If this were deployed in production**, the top priorities would be: (1)
persist flags and comments to a real backend so they survive refresh and
are shared across the quality team, with an audit trail of who flagged what
and when; (2) replace the bundled JSON with a paginated/streamed API so the
app scales past 9,000 records; (3) formalize the letter-signature cleanup
into a logged, auditable data-quality pipeline rather than a one-off script,
so future dirty-data injections get caught automatically; (4) add user
accounts so flagging and comments are attributable.

*(Word count: ~230)*

---

## 8. Outstanding — the Task 4 "additional feature"

The brief also requires implementing one new feature in the app, directly
motivated by the limitations above. That hasn't been built yet — worth
deciding together what it should be (a few candidates: exporting the
Tracking Dashboard to CSV/PDF for sharing outside the app, a "data quality"
audit panel surfacing the cleanup stats from §1, or a lightweight
localStorage persistence layer for flags so they survive a refresh).

---

## 9. Task 6 — Causal inference: resolution time vs. severity & defect category

*(Per direction, this analysis lives here in the documentation rather than as
an in-app feature.)*

**The brief asks**: does resolution time affect Severity Rating and Defect
Category, and how would an X% reduction in resolution time affect them?

**A temporal problem with the question as posed**: Severity Rating and
Defect Category are both assigned when a defect is *discovered* — before
resolution work has even started. Resolution time is measured *after* that.
An effect cannot precede its cause: it is not physically possible for how
long a defect takes to fix to retroactively change the severity it was
already classified as, or what kind of defect it already was. If there's a
causal relationship here at all, it almost certainly runs the *other way*
— severity/category might influence how quickly something gets resolved
(via prioritization), not the reverse. This is worth stating plainly rather
than silently building a model that implies the wrong direction.

**Testing for any relationship at all, in either direction** (using the
6,790 resolved records — computed with Python/scipy against the full
cleaned dataset):

| Test | Statistic | p-value | Result |
|---|---|---|---|
| Spearman correlation, resolution days vs. severity rating | ρ = −0.009 | 0.467 | No significant association |
| Kruskal–Wallis, resolution time across the 6 Defect Categories | H = 4.72 | 0.451 | No significant difference |
| Kruskal–Wallis, resolution time across the 6 Severity Ratings | H = 3.95 | 0.557 | No significant difference |

Median resolution time is essentially flat regardless of severity (0.31–0.33
days across all 6 ratings) or category (0.28–0.39 days across all 6
categories). **There is no meaningful statistical relationship in either
direction** — not just no causal one. Combined with the temporal-ordering
issue above, that means the honest answer to "does resolution time affect
severity/category" is: it can't, and empirically, it doesn't correlate with
them either.

### Reframing "X% reduction" as a decision-support question

Since there's no relationship to project through, simulating "if resolution
time dropped by X%, severity would shift by Y" would be manufacturing a
causal claim the data doesn't support. What *can* legitimately be asked
instead: **if the organization tightened its resolution-time SLA, which
kinds of defects would that newly flag as non-compliant?** That's a real
resource-planning question, answerable from the data as-is. Using the
current upper-fence threshold (0.98 days, from the same IQR method used in
the Analysis tab) as a baseline "acceptable" resolution time:

| SLA tightened by | New target | Historically-resolved records that would now breach it | Of those, high-severity (rating 1–2) | Of those, critical/safety category |
|---|---|---|---|---|
| 10% | 0.88 days | 696 (10.3% of all resolved) | 8.6% | 1.0% |
| 25% | 0.74 days | 830 (12.2%) | 9.0% | 1.0% |
| 50% | 0.49 days | 1,718 (25.3%) | 8.5% | 1.1% |

For comparison, of the 2,210 currently-open defects, 8.2% are high-severity
and 0.5% are critical/safety — almost identical proportions to the breach
groups above at every tightness level.

**Why this matters for a decision**: the severity/category mix of "slow"
defects stays essentially constant no matter how aggressively the SLA is
tightened. That's the data-side confirmation of the null result above —
and it's actually an operationally interesting finding in its own right:
**resolution speed does not currently appear to be prioritized by
severity**. A critical/safety-category defect is resolved on roughly the
same timeline as a cosmetic one. Whether that's intentional (e.g., an
automated or parallelized fix process where severity doesn't affect queue
position) or a process gap worth addressing (should critical/safety
defects actually be fast-tracked?) is a question for quality leadership —
but it's the kind of question this analysis surfaces cleanly, which a
naively-built "resolution time causes severity" model would have obscured
rather than revealed.

---

## 10. Task 5 — Gen AI: Root Cause Assist

**Where an LLM actually adds value here, and where it wouldn't**: everything
else in this app is deterministic — IQR fences, chi-square residuals,
sortable tables. That's the right tool for "is this number unusual." None
of it can read **unstructured human judgment** — the free-text comments an
engineer types when flagging something (Task 3). That's exactly what an
LLM is suited for and code isn't, so that's where this feature is aimed,
rather than at re-explaining a chart in prose (which would be decoration,
not analysis).

**What it does**: takes the current month's flagged items — defect name,
station, days to resolve, and the engineer's comment (Task 3's output) —
cross-references each one against the Defect × Station anomaly matrix
(Task 2/§5's adjusted residual for that exact defect/station combination),
and asks the model to synthesize whether two or more flagged items share a
likely common cause. This chains three separate analyses together
(outlier detection → human annotation → chi-square anomaly matrix → LLM
synthesis) rather than operating on raw data alone — the "1-2 steps
further down the problem-solving process" the brief asks for.

**Why this isn't a chatbot**: it's a single "Generate" action over one
fixed, structured prompt built entirely from app state — there's no
conversation history, no follow-up turns, no free-form user input reaching
the model at all. The prompt explicitly instructs the model to skip
pleasantries/disclaimers and stay under 100 words, and the panel is
visually distinct from every other chart (dashed indigo border, "AI-generated"
badge) so it's never mistaken for a measured result.

**Model / API**: Ollama, running locally, called directly from the browser
— per direction, no backend proxy. This is safe specifically *because*
Ollama has no API key to leak; it would be the wrong call for any hosted
API (OpenAI, Anthropic, etc.), where the key would end up shipped in the
browser bundle. Documented in the README as a demo-only architecture choice.
