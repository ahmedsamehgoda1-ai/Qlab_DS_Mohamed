const ASSUMPTIONS: string[] = [
  "Time to Resolution and Root Cause Identified are blank on the same records — assumed still unresolved, not missing data. Used elapsed-days-so-far instead of leaving them out.",
  "The xlsx had columns the PDF never mentioned (Severity Category, Resolution Date, Rework Time) — assumed they were meant to be used, not decorative, and built them into the analysis.",
  "In the Defect × Station containment analysis, assumed the \"expected\" detection station(s) for each defect type based on manufacturing process logic — the dataset can say what happened, not what's structurally correct, so this had to be a stated assumption rather than something calculated from the data.",
];

const OBSERVATIONS: string[] = [
  "Heavy typo/name manipulation in defectName and station — 237/35 raw strings for what were really only 15/29 true values. Cleaned once at data-generation time.",
  "Every defect with no root cause identified is also unresolved — the two are blank on exactly the same rows.",
  "Rework time didn't line up with resolution time the way expected: most 100–200 min rework closes in under a day, but 61 records in that same rework band still take 15+ days (some 45–55). The fix itself isn't the bottleneck there — worth flagging as a quality engineer. All 61 fall past the IQR fence the Analysis tab already uses.",
];

const GRAPH_CHOICES: string[] = [
  "Top 5 defects (pie) — one chart, tells you the biggest problems immediately.",
  "Severity distribution — a sanity check more than deep analysis, keeps an eye on whether the mix looks normal.",
  "Defect rate by variant — general-purpose baseline coverage the brief asks for.",
  "Station Pareto — shows which stations carry the most volume; picked this format after seeing it explained (cumulative-% line, \"vital few vs. trivial many\").",
  "Time to resolution — the most time spent here. Goal: explain why a defect took longer than it should, not just flag that it did. Right-skewed, so IQR with only the upper fence. Wanted this broken out per defect type rather than pooled — didn't get to fully build that out.",
  "Defect × Station (process containment) — wanted to understand the factory's actual process: what stations should catch a defect before Final Quality. Some defects appeared to escape their expected station and only surface downstream.",
];

const NOT_BUILT: string[] = [
  "Model × Severity — turned up a few anomalies, not enough to justify a dedicated chart.",
  "Defects per month (trend line) — Dashboard already covers this in aggregate.",
  "Risk factor score — wanted to combine severity, frequency, and containment into one score; didn't have time to work out the method.",
];

const LIMITATIONS: string[] = [
  "No real knowledge of BMW's actual manufacturing stages — the \"expected station\" per defect in the Defect × Station analysis is my best guess from station names and general car-building knowledge, not a verified process map.",
  "Outlier detection on resolution time pools all defect types together (per month, per resolved/open status) — some defect types are naturally slower to fix than others, so a fast type could get flagged too easily and a slow type might not get flagged when it should. Same limitation as the \"wanted this per defect type\" note under Graph choices.",
  "Flagged items reset on page refresh — they only live in React state, nothing persists them.",
  "Resolved and unresolved resolution times are kept as two separate views rather than one combined chart, because unresolved records use \"days elapsed so far,\" which runs as high as 467 days for some records. Combining them would pull the mean from ~1.35 days (resolved only) to ~67 days — not a real resolution time, just distorting the chart.",
];

export function InfoView() {
  return (
    <div className="p-5 md:p-8 max-w-3xl space-y-6">
      <div className="rounded-xl p-6 text-white bg-[radial-gradient(120%_160%_at_100%_0%,#163B66_0%,#0A1626_50%,#060C16_100%)]">
        <div className="text-[11px] tracking-[0.15em] uppercase text-[#7C93AC] mb-2">
          Documentation
        </div>
        <p className="text-[14px] text-[#CBD9E8] leading-relaxed">
          Assumptions, what stood out in the data, and why each graph was chosen. Full write-up in{" "}
          <code className="text-[13px] bg-white/10 px-1 py-0.5 rounded">DOCUMENTATION.md</code>.
        </p>
      </div>

      <div className="bg-white border border-hairline rounded-xl p-6">
        <h3 className="text-[14px] font-semibold text-ink mb-3">Assumptions</h3>
        <ul className="space-y-2">
          {ASSUMPTIONS.map((item) => (
            <li key={item} className="flex gap-2 text-[13px] text-slate leading-relaxed">
              <span className="text-bmw-blue shrink-0">▸</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white border border-hairline rounded-xl p-6">
        <h3 className="text-[14px] font-semibold text-ink mb-3">Things that stood out</h3>
        <ul className="space-y-2">
          {OBSERVATIONS.map((item) => (
            <li key={item} className="flex gap-2 text-[13px] text-slate leading-relaxed">
              <span className="text-bmw-blue shrink-0">▸</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white border border-hairline rounded-xl p-6">
        <h3 className="text-[14px] font-semibold text-ink mb-3">Why each graph</h3>
        <ul className="space-y-2">
          {GRAPH_CHOICES.map((item) => (
            <li key={item} className="flex gap-2 text-[13px] text-slate leading-relaxed">
              <span className="text-bmw-blue shrink-0">▸</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white border border-hairline rounded-xl p-6">
        <h3 className="text-[14px] font-semibold text-ink mb-3">Considered, not built</h3>
        <ul className="space-y-2">
          {NOT_BUILT.map((item) => (
            <li key={item} className="flex gap-2 text-[13px] text-slate leading-relaxed">
              <span className="text-bmw-blue shrink-0">▸</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white border border-hairline rounded-xl p-6">
        <h3 className="text-[14px] font-semibold text-ink mb-2">Design</h3>
        <p className="text-[13px] text-slate leading-relaxed">
          Color palette pulled from BMW's own site — navy, blue, white, black. Defects tab is
          split from Dashboard/Analysis on purpose: a full spreadsheet next to a page of charts
          gets cluttered fast. Analysis groups everything investigative (outlier detection,
          containment, flagging, Root Cause Assist) separately from the Dashboard's at-a-glance
          overview.
        </p>
      </div>

      <div className="bg-white border border-hairline rounded-xl p-6">
        <h3 className="text-[14px] font-semibold text-ink mb-3">Limitations</h3>
        <ul className="space-y-2">
          {LIMITATIONS.map((item) => (
            <li key={item} className="flex gap-2 text-[13px] text-slate leading-relaxed">
              <span className="text-bmw-blue shrink-0">▸</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
