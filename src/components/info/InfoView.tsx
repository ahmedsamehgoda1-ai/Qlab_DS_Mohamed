const ASSUMPTIONS: string[] = [
  "Severity Rating (1–6) is an inverted scale in the source data — 1 is the most extreme severity (\"Extreme – safety/legal/inoperable\"), 6 is the least severe (\"Medium – next service visit\"). Every chart that touches severity states this explicitly rather than assuming higher = worse.",
  "The PDF describes a 1–10 severity scale, 3 design packages, 3 shifts, and 3 defect categories. The actual data has a 1–6 scale, 4 packages (an extra \"Eco\" package), 2 shifts (no \"Night\" shift), and 6 defect categories. Built against the real data, not the PDF's description of it.",
  "~24.6% of records (2,210) are unresolved — Time to Resolution, Root Cause Identified, and Resolution Date are null together on exactly those rows. Treated as censored data (a true minimum, not a missing value) throughout — see \"Statistical methods\" below.",
  "For still-open defects, \"days elapsed so far\" is computed against the later of today's date or the dataset's own max date, not assumed to be 0 or excluded.",
  "The raw defectName/station fields were not treated as ground truth as-is — see the Data quality section below for why, and how they were cleaned before any analysis ran.",
  "Average resolution time (Dashboard KPI) is computed over resolved records only. Averaging in open records' elapsed-so-far time would bias it downward, since those durations aren't finished accumulating.",
];

const BUILT: string[] = [
  "Dashboard — KPIs, Top 5 defects, severity distribution, defect rate by variant, station Pareto chart",
  "Analysis — IQR-based outlier detection on resolution time (resolved/unresolved, per month, zoom, search), click-to-flag with comments, Tracking Dashboard, Defect × Station chi-square anomaly matrix, Root Cause Assist (local LLM)",
  "Defects — full spreadsheet, sortable on every column, search across all fields including part number",
  "Documentation — this page. Causal inference analysis (Task 6) lives in DOCUMENTATION.md, not in the app, per direction.",
];

export function InfoView() {
  return (
    <div className="p-5 md:p-8 max-w-3xl space-y-6">
      <div className="rounded-xl p-6 text-white bg-[radial-gradient(120%_160%_at_100%_0%,#163B66_0%,#0A1626_50%,#060C16_100%)]">
        <div className="text-[11px] tracking-[0.15em] uppercase text-[#7C93AC] mb-2">
          Documentation
        </div>
        <p className="text-[14px] text-[#CBD9E8] leading-relaxed">
          This page documents how this dashboard was built — the assumptions made, the
          statistical methods used and why, what's implemented, and known limitations. It's the
          in-app counterpart to <code className="text-[13px] bg-white/10 px-1 py-0.5 rounded">DOCUMENTATION.md</code>{" "}
          in the repository, which goes into full detail chart-by-chart.
        </p>
      </div>

      <div className="bg-white border border-hairline rounded-xl p-6">
        <h3 className="text-[14px] font-semibold text-ink mb-3">Assumptions</h3>
        <ul className="space-y-2.5">
          {ASSUMPTIONS.map((item) => (
            <li key={item} className="flex gap-2 text-[13px] text-slate leading-relaxed">
              <span className="text-bmw-blue shrink-0">▸</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white border border-hairline rounded-xl p-6">
        <h3 className="text-[14px] font-semibold text-ink mb-2">Data quality</h3>
        <p className="text-[13px] text-slate leading-relaxed">
          The raw <code className="text-[12px] bg-paper px-1 py-0.5 rounded">defectName</code> and{" "}
          <code className="text-[12px] bg-paper px-1 py-0.5 rounded">station</code> fields contained
          237 and 35 distinct strings respectively — almost entirely random-case and
          letter-transposition typos of a much smaller set of real values (e.g. "Loose Wiring"
          appeared as 73 different-looking variants). These were canonicalized to 15 true defect
          types and 29 true stations by clustering on letter content (lowercase, strip spaces,
          sort the letters — typos preserve the letter multiset), then lowercased. Done once at
          data-generation time so every chart and table reads clean, correctly grouped data
          automatically.
        </p>
      </div>

      <div className="bg-white border border-hairline rounded-xl p-6">
        <h3 className="text-[14px] font-semibold text-ink mb-2">Statistical methods used</h3>
        <div className="space-y-3 text-[13px] text-slate leading-relaxed">
          <p>
            <strong className="text-ink">IQR outlier detection (Analysis tab):</strong> Q1/median/Q3
            via linear-interpolation percentiles, upper fence = Q3 + 1.5×IQR. One-sided only —
            resolving fast isn't a quality problem, so the lower fence a standard box plot would
            add is deliberately omitted. Chosen over mean ± k·std-dev because resolution time is
            heavily right-skewed, which drags a mean-based threshold upward and under-flags real
            outliers.
          </p>
          <p>
            <strong className="text-ink">Chi-square residual analysis (Defect × Station matrix):</strong>{" "}
            Expected(i,j) = (defect total × station total) / grand total, under an independence
            assumption. Standardized Residual (SR) and the more rigorous Adjusted Residual (AR,
            Haberman's correction for fixed row/column totals) are both exposed via toggle. Cells
            with Expected &lt; 5 are flagged as low-sample, since a residual computed on that few
            expected occurrences is numerically unstable.
          </p>
          <p>
            <strong className="text-ink">Spearman correlation & Kruskal–Wallis (Task 6, documentation-only):</strong>{" "}
            used instead of Pearson correlation / ANOVA because severity is ordinal and resolution
            time is skewed — both are non-parametric, making no assumption of a linear relationship
            or normally-distributed residuals.
          </p>
        </div>
      </div>

      <div className="bg-white border border-hairline rounded-xl p-6">
        <h3 className="text-[14px] font-semibold text-ink mb-3">What's built</h3>
        <ul className="space-y-2">
          {BUILT.map((item) => (
            <li key={item} className="flex gap-2 text-[13px] text-slate leading-relaxed">
              <span className="text-bmw-blue shrink-0">▸</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white border border-hairline rounded-xl p-6">
        <h3 className="text-[14px] font-semibold text-ink mb-2">Reflection & limitations</h3>
        <p className="text-[13px] text-slate leading-relaxed mb-3">
          <strong className="text-ink">Limitations:</strong> the dataset is bundled as a static
          JSON import rather than served from a real API with pagination — fine for this case
          study, not for production. The flagged-item store lives only in React memory, so it
          resets on refresh and isn't shared across users. Only 5 distinct reporters exist in the
          whole dataset, which is why a by-reporter breakdown was removed rather than kept as a
          misleadingly precise chart on a near-meaningless sample. At month-level granularity, the
          Defect × Station residual analysis gets statistically thin for rarer combinations —
          visually flagged (hatched cells), but not solved.
        </p>
        <p className="text-[13px] text-slate leading-relaxed mb-3">
          <strong className="text-ink">Robustness:</strong> the pipeline is strongly typed
          end-to-end, the IQR and chi-square logic live in small, pure, independently reusable
          utility functions used identically across every resolved/unresolved/month-filtered view
          so results can't silently diverge between charts, and censored (open) data is handled
          explicitly rather than being dropped or averaged in as if it were complete.
        </p>
        <p className="text-[13px] text-slate leading-relaxed">
          <strong className="text-ink">If deployed in production</strong>, priorities would be:
          persisting flags and comments to a real backend with an audit trail of who flagged what;
          replacing the bundled JSON with a paginated API so the app scales past 9,000 records;
          formalizing the data-cleanup step into a logged, auditable pipeline rather than a one-off
          script; and adding user accounts for attribution.
        </p>
      </div>
    </div>
  );
}
