# BMW QLab — Documentation & Walkthrough

## Assumptions

- Time to Resolution and Root Cause Identified are blank on the same records — assumed still unresolved, not missing data. Used elapsed-days-so-far instead of leaving them out or defaulting to 0.
- The xlsx had columns the PDF never mentioned (Severity Category, Resolution Date, Rework Time). Assumed they were meant to be used, not decorative — built them into the analysis.

## Things that stood out

- Heavy typo/name manipulation in `defectName` and `station` — 237/35 raw strings for what were really only 15/29 true values. Cleaned once at data-generation time.
- Every defect with no root cause identified is also unresolved — blank on exactly the same rows.
- Rework time didn't line up with resolution time as expected: most 100–200 min rework closes in under a day, but 61 records in that same band still take 15+ days (some 45–55 days). The fix isn't the bottleneck there — exactly what a quality engineer would want flagged. All 61 fall past the IQR fence already used in Analysis.

## Graph choices

- **Top 5 defects (pie)** — no explanation needed, one chart tells you the biggest problems immediately.
- **Severity distribution** — sanity check more than analysis, keeps an eye on whether the mix looks normal.
- **Defect rate by variant** — general-purpose baseline coverage the brief asks for.
- **Station Pareto** — which stations carry the most volume; picked this format after seeing it explained (cumulative-% line, "vital few vs. trivial many").
- **Time to resolution** — most time spent here. Goal: explain *why* a defect took longer, not just flag that it did. Right-skewed data, so IQR with only the upper fence. Wanted this per defect type rather than pooled — didn't get to fully build that out.
- **Defect × Station (process containment)** — wanted to understand the factory's actual process: what stations should catch a defect before Final Quality. Some defects appeared to escape their expected station and only surface downstream.

**Considered, not built**: Model × Severity (a few anomalies, not enough to justify a chart), defects-per-month trend (Dashboard covers this in aggregate already), a risk factor score (wanted to combine severity/frequency/containment into one number, didn't have time to work out the method).

## Design

Color palette pulled from BMW's own site — navy, blue, white, black. Defects tab is split from Dashboard/Analysis on purpose: a full spreadsheet next to a page of charts gets cluttered fast. Analysis groups everything investigative (outlier detection, containment, flagging, Root Cause Assist) separately from the Dashboard's at-a-glance overview.

---

**Task 5 (Root Cause Assist)**: local LLM via Ollama, called directly from the browser — no backend, no key to leak. Scans the Defect × Station table for escape/data-quality signals and generates an explanation for each, fresh every run — shares the same Month/All-time scope as the table above it, so it never reasons about a different slice of data than what's on screen. Setup in the README.

## Task 6 — causal inference (documentation-only, not in the app)

**The question, as posed**: does resolution time affect Severity Rating and
Defect Category, and how would an X% reduction in resolution time change
them?

**Why that question needs care before it can be answered**: Severity
Rating and Defect Category are both assigned the moment a defect is
*discovered* — before any resolution work has started. Resolution time is
measured afterward. An effect can't happen before its cause: it isn't
physically possible for how long a defect takes to fix to reach back and
change what severity it was already classified as, or what kind of defect
it already was. If a causal relationship exists here at all, it almost
certainly runs the other way — severity/category might influence how fast
something gets resolved (via prioritization), not the reverse. Worth
saying directly, rather than quietly building a model that implies the
wrong direction.

**Testing for any relationship at all, regardless of direction** — three
independent methods, run against the full 6,790 resolved records:

| Method | What it tests | Result |
|---|---|---|
| Spearman rank correlation | resolution days vs. severity rating (ordinal 1–6) | ρ = −0.009, p = 0.47 |
| Cramér's V | resolution-time quartile bucket vs. Defect Category (nominal, no order) | V = 0.031, p = 0.18 |
| Cramér's V | resolution-time quartile bucket vs. severity, treated as nominal (robustness check on Spearman's ordinal assumption) | V = 0.026, p = 0.53 |

Cramér's V needed resolution time binned into quartiles first (fastest 25%
→ slowest 25%) so both sides of the comparison are categorical — it's a
chi-square-based association strength on a 0–1 scale, where 0 means no
association and 1 means perfect association. Both values here are close
enough to 0 to call negligible. All three methods agree, from genuinely
different angles (a rank correlation, a categorical-association test, and
a repeat of that test with the ordinal assumption removed): **resolution
time and severity/category are statistically independent** in this
dataset. Combined with the temporal-ordering problem above, the honest
answer to "does resolution time affect severity/category" is that it
can't, and empirically, it doesn't correlate with them either.

**Reframing "X% reduction" as a decision-support question.** Since there's
no relationship to project through, simulating "if resolution time
dropped by X%, severity would shift by Y" would manufacture a causal claim
the data doesn't support. What *can* legitimately be asked instead: if the
plant tightened its resolution-time SLA, which kinds of defects would that
newly flag as non-compliant? Using the same IQR upper fence the Analysis
tab uses (0.98 days) as the baseline "acceptable" resolution time:

| SLA tightened by | New target | Resolved records that would breach it | Of those, high-severity (rating 1–2) | Of those, critical/safety category |
|---|---|---|---|---|
| 10% | 0.88 days | 696 (10.3% of resolved) | 8.6% | 1.0% |
| 25% | 0.74 days | 830 (12.2%) | 9.0% | 1.0% |
| 50% | 0.49 days | 1,718 (25.3%) | 8.5% | 1.1% |

For comparison, of the 2,210 currently-open defects: 8.2% are
high-severity, 0.5% are critical/safety — nearly identical to every breach
tier above, at every tightness level tested.

**Why this matters for a decision**: the severity/category mix of "slow"
defects stays essentially constant no matter how aggressively the SLA is
tightened — the data-side confirmation of the statistical null result
above. That's also an operationally interesting finding in its own right:
resolution speed does not currently appear to be prioritized by severity
at all. A critical/safety-category defect is resolved on roughly the same
timeline as a cosmetic one. Whether that's intentional (an automated or
parallelized process where severity doesn't affect queue position) or a
genuine gap worth fixing (should critical defects be fast-tracked?) is a
real question for quality leadership — one this analysis surfaces cleanly,
which a naively-built "resolution time causes severity" model would have
obscured rather than revealed.
