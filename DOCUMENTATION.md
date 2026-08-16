# BMW QLab — Documentation & Walkthrough

## Assumptions

- Time to Resolution and Root Cause Identified are blank on the same records — assumed still unresolved, not missing data. Used elapsed-days-so-far instead of leaving them out or defaulting to 0.
- The xlsx had columns the PDF never mentioned (Severity Category, Resolution Date, Rework Time). Assumed they were meant to be used, not decorative — built them into the analysis.
- In the Defect × Station containment analysis, assumed the "expected" detection station(s) for each defect type based on manufacturing process logic (e.g. Loose Wiring → Wire Harness Installation, Electrical Test Checkpoint) rather than deriving them from the data itself — the dataset can say what happened, but not what's structurally correct, so this had to be a stated assumption rather than a calculated one.

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

## Task 6 — causal inference (documentation only, not built into the app)

When I first read this task, my instinct was to just check if resolution
time and severity were correlated and call it done. But then I thought
about the actual order these things happen in, and realized the question
has a problem before I even get to the statistics.

Severity Rating and Defect Category get assigned the moment someone finds
the defect — before anyone starts fixing it. Resolution time only exists
after that. So resolution time can't be *causing* severity, because
severity was already decided before the resolution clock even started. If
anything is causing anything here, it would have to run the other way
(severity maybe affecting how fast something gets worked on), not what the
task describes. I think it's worth saying that plainly instead of quietly
building a model that pretends the direction makes sense.

Even so, I still wanted to check if there's at least a correlation, in
case the task really just meant "is there a relationship" loosely rather
than strict causation. So I ran a few tests on the 6,790 resolved records:

- **Spearman correlation** between resolution days and severity rating,
  since severity is ordinal (1 to 6), not a normal numeric scale. Got
  ρ = −0.009, p = 0.47. Basically zero, and nowhere near significant.
- I also wanted to check Defect Category, but Category doesn't have an
  order — Electrical, Cosmetic, Safety aren't "higher" or "lower" than
  each other — so Spearman doesn't really apply there. I looked into what
  the right test would be and found **Cramér's V**, used for two
  categorical variables. To use it I had to first turn resolution time
  into a categorical thing myself, by splitting it into quartiles
  (fastest 25%, next 25%, and so on). Got V = 0.031, p = 0.18 — again,
  basically nothing.
- Just to double-check my Spearman result wasn't hiding something because
  of the ordinal assumption, I ran Cramér's V on severity too (treating it
  as if it had no order), and got V = 0.026, p = 0.53. Same story again.

So three different tests, from three different angles, and none of them
found anything. Going in, I actually expected at least a small
relationship — I assumed maybe more severe defects take longer to fix
because they're harder, or shorter because they're more urgent. The data
just doesn't back either version up.

For the "how would reducing resolution time by X% affect severity" part —
since there isn't an actual relationship, it didn't feel honest to
simulate "cut time by X% → severity shifts by Y%," because that would
basically be inventing a relationship that isn't there. So I reframed it
into something I could actually check: if the SLA (the acceptable
resolution time) got tightened by X%, which defects would suddenly count
as late? I used 0.98 days as the baseline — the same outlier threshold the
Analysis tab already uses — and tried tightening it by 10%, 25%, and 50%.

| SLA tightened by | New target | Records that would now be late | Of those, high-severity | Of those, critical/safety |
|---|---|---|---|---|
| 10% | 0.88 days | 696 (10.3%) | 8.6% | 1.0% |
| 25% | 0.74 days | 830 (12.2%) | 9.0% | 1.0% |
| 50% | 0.49 days | 1,718 (25.3%) | 8.5% | 1.1% |

No matter how much I tightened the threshold, the share of "late" defects
that were high-severity or critical/safety barely moved — it stayed around
8.5–9% and 1% every time. For comparison, the currently-open defects sit
at 8.2% and 0.5%, basically the same.

I think that's actually a more interesting finding than I expected going
in. It suggests resolution speed isn't really being prioritized by
severity right now — a critical safety issue takes about as long to fix as
a minor cosmetic one. That could be totally fine if the process is
automated and doesn't need manual triage, but it's also the kind of thing
I'd want to flag to whoever manages quality, since you'd usually expect
the more serious stuff to get handled first.
