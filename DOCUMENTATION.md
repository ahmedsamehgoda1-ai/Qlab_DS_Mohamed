# BMW QLab — Documentation & Walkthrough


## Assumptions

- Time to Resolution and Root Cause Identified are blank on the same records — assumed still unresolved, not missing data. Used elapsed-days-so-far instead of leaving them out or defaulting to 0.
- The xlsx had columns the PDF never mentioned (Severity Category, Resolution Date, Rework Time). Assumed they were meant to be used, not decorative — built them into the analysis.
- In the Defect × Station containment analysis, assumed the "expected" detection station(s) for each defect type based on manufacturing process logic (e.g. Loose Wiring → Wire Harness Installation, Electrical Test Checkpoint) rather than deriving them from the data itself — the dataset can say what happened, but not what's structurally correct, so this had to be a stated assumption rather than a calculated one.

## AI tools used

I used two different AI tools for two different parts of this project.
ChatGPT for exploring and understanding the dataset itself, before I'd
decided what to build. Claude for actually implementing the application —
the charts, the analysis logic, the UI — based on my own findings and
decisions.

First prompt I sent to ChatGPT, to start exploring the dataset:

> "I want you to do full and complete analysis on the dataset attached.
> Show the trends, correlations, Anomalies and a final review for it."

That initial pass is what pointed me toward things like the resolution-time
skew and some of the odd patterns I dug into further myself (the typo
noise in defect/station names, the rework-time observation). From there,
Claude was for building, turning those findings into the actual dashboard,
the outlier detection, and the containment analysis, based on decisions and the ideas I made along the way.

## Things that stood out

- Heavy typo/name manipulation in `defectName` and `station` — 237/35 raw strings for what were really only 15/29 true values. Cleaned once at data-generation time.
- Every defect with no root cause identified is also unresolved — blank on exactly the same rows.
- Rework time didn't line up with resolution time as expected: most 100–200 min rework closes in under a day, but 61 records in that same band still take 15+ days (some 45–55 days). The fix isn't the bottleneck there — exactly what a quality engineer would want flagged. All 61 fall past the IQR fence already used in Analysis.

## Graph choices

- **Top 5 defects (pie)** — no explanation needed, one chart tells you the biggest problems immediately.
- **Severity distribution** — sanity check more than analysis, keeps an eye on whether the mix looks normal.
- **Defect rate by variant** — general-purpose baseline coverage the brief asks for.
- **Station Pareto** — which stations carry the most volume; picked this format after seeing it explained.
- **Time to resolution** — most time spent here. Goal: explain *why* a defect took longer, not just flag that it did. Right-skewed data, so IQR with only the upper fence. Wanted this per defect type rather than pooled — didn't get to fully build that out.
- **Defect × Station (process containment)** — wanted to understand the factory's actual process: what stations should catch a defect before Final Quality. Some defects appeared to escape their expected station and only surface downstream.

**Considered, not built**: Model × Severity (a few anomalies, not enough to justify a chart), defects-per-month trend (Dashboard covers this in aggregate already), a risk factor score (wanted to combine severity/frequency/containment into one number, didn't have time to work out the method).

## Time to resolution — going deeper into the statistics

This is the part I spent the most time on, so I want to actually walk
through the numbers instead of just saying "IQR" and moving on.

First thing I noticed was how skewed the distribution actually is. Across
the 6,790 resolved records, the median resolution time is 0.32 days but
the mean is 1.35 days — over 4x higher. That gap between mean and median
is basically the signature of a right-skewed distribution: most defects
get resolved quickly, but a long tail of slow ones drags the average way
up. The slowest one in the whole dataset took 55.79 days.

That's exactly why I didn't use mean ± 2 standard deviations to find
outliers, which was my first instinct. With a mean already dragged up to
1.35 days by the slow tail, and a standard deviation that would be even
more distorted by the same handful of extreme values, a mean-based
threshold ends up chasing the very outliers it's supposed to catch —
either the threshold gets pulled so high that real outliers hide under it,
or it flags a huge chunk of totally normal fast resolutions as "unusual"
just because the whole distribution is lopsided.

IQR doesn't have that problem, because it's built from the median and
quartiles instead of the mean:

- Q1 (25th percentile) = 0.18 days
- Q3 (75th percentile) = 0.50 days
- IQR = Q3 − Q1 = 0.32 days
- Upper fence = Q3 + 1.5 × IQR = 0.98 days

Anything above 0.98 days gets flagged. That's about 680 records, or 10% of
all resolved defects — which felt like a believable "this is genuinely
unusual" cutoff rather than something arbitrary I picked myself; it fell
out of the actual shape of the data.

The one-sided part was a deliberate choice, not something I got from a
textbook. A normal two-sided box plot would also flag anything below
Q1 − 1.5×IQR as an outlier — but a defect resolved *unusually fast* was
never something worth investigating here. Resolution time can't go below
zero anyway, and "someone fixed it quickly" isn't a quality problem. So I
only kept the upper fence and dropped the lower one entirely.

I also split resolved and unresolved defects into separate views for this
same reason — mentioned under Limitations, but worth repeating here since
it directly affects these numbers: mixing in the "elapsed so far" values
for still-open defects (which run as high as 467 days) would have wrecked
this whole calculation, dragging the fence out to somewhere meaningless.

## Defect × Station — going deeper into the containment math

The other place I want to actually show the numbers instead of just
describing the idea.

For each defect type, I split its cases into three buckets:

- **Process Containment %** — cases caught at the station(s) I mapped as
  that defect's own expected process step(s).
- **Final Quality %** — cases caught only at the shared downstream
  checkpoint, instead of wherever they were supposed to be caught.
- **Other %** — cases caught somewhere with no domain connection to that
  defect at all.

Those three always add up to 100% of that defect's cases. The formulas are
simple — containment % is just (cases at expected stations ÷ total cases
for that defect) × 100, same idea for Final Quality % — but which stations
count as "expected" isn't something I calculated, it's something I mapped
in myself from what I know about how a car actually gets built (see
Assumptions and Limitations for why that had to be a guess rather than
something derived from the data).

I picked two thresholds to turn these percentages into a signal worth
looking at, both just reasonable numbers I chose, not anything
statistically derived:

- **Potential escape**: Final Quality % ≥ 25%. If a quarter or more of a
  defect's cases only get caught at the very end, that's worth asking
  about, even though it's a soft flag — some defects genuinely can't be
  caught until the vehicle's fully assembled.
- **Data-quality concern**: Other % ≥ 40%. If less than 60% of a defect's
  cases show up anywhere near where I'd expect them to, that's a bigger
  problem than a normal escape — it usually means either my mapping is
  wrong, or the defect is being logged inconsistently, more than it means
  something's actually wrong on the line.

Brake Malfunction is the clearest example of why I wanted that second
threshold: only 29.2% of its cases land at a brake/wheel/underbody-related
station, and the rest are scattered across stations that have nothing to
do with brakes mechanically. That's not really a containment problem, it's
a sign the label itself might not be trustworthy — which is a different
kind of issue than "the process is letting defects slip through," and I
wanted the two to look different on the page instead of blurring together
under one generic "anomaly" flag.

## Design

Color palette pulled from BMW's own site — navy, blue, white, black. Defects tab is split from Dashboard/Analysis on purpose: a full spreadsheet next to a page of charts gets cluttered fast. Analysis groups everything investigative (outlier detection, containment, flagging, Root Cause Assist) separately from the Dashboard's at-a-glance overview.

## Limitations

I don't actually know BMW's real manufacturing process — I don't have any
documentation on what stages a car actually goes through before it's
finished. So for the Defect × Station analysis, the "expected station" for
each defect is my best guess based on the station names themselves and
general knowledge of how a car gets built, not something I could verify
against a real process map. If I actually had that documentation, I think
the mapping would be more accurate than what I came up with on my own.

For the outlier detection on resolution time, I'm using one IQR fence
across all defect types pooled together (per month, per resolved/open
status). But some defect types are just naturally slower to fix than
others — not because anything's wrong, just because of what the defect is
— so pooling everything together isn't fully fair to either side. A defect
type that's normally fast could get flagged too easily, and one that's
normally slow might not get flagged even when it's genuinely unusual for
its own type. I'd want to compute this per defect type if I had more time
— I mentioned this same thing under Graph choices, since it's really the
same limitation showing up twice.

Flagged items reset every time the page refreshes — they only live in
React state right now, with nothing persisting them.

I split resolved and unresolved resolution times into two separate views
instead of pooling them into one chart, because unresolved records use
"days elapsed so far," and some of those numbers get huge since a record
can have been open a long time. If I combined them, the mean resolution
time would jump from about 1.35 days (resolved only) to almost 67 days,
because the elapsed-so-far values for open records run as high as 467
days. That's not a real resolution time, it's just how long something's
been sitting open — mixing it in would skew everything incredibly far
right and make the whole chart harder to read and less honest about what
it's actually showing.

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
since there's no actual relationship to begin with, trying out different
percentage changes wouldn't tell me anything new. Whatever percentage I
picked, the honest answer would just be "no meaningful change," because
I'd be simulating an effect on top of a relationship that doesn't exist in
the data. It felt more honest to stop at "there's no relationship" than to
manufacture percentage numbers that don't actually mean anything.