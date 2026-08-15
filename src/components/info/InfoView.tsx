const FACTS: [string, string][] = [
  ["Vehicle", "BMW iX0 — luxury electric SUV"],
  ["Variants", "Base, IX0M, Long, Alpina, Pick-Up"],
  ["Motor types", "Standard, Long Range, High Performance"],
  ["Design packages", "Offroad, Race, Luxury, Eco"],
  ["Production rate", "300 units / day"],
  ["Dataset size", "9,000 defect records — May 2025 to May 2026"],
];

const BUILT: string[] = [
  "Dashboard — KPIs, Top 5 defects, severity distribution, defect rate by variant, station Pareto chart",
  "Analysis — IQR-based outlier detection on resolution time (resolved/unresolved, per month, zoom, search), click-to-flag with comments, Tracking Dashboard, Defect × Station chi-square anomaly matrix",
  "Defects — full spreadsheet, sortable on every column, search across all fields including part number",
  "Info — this reference and reflection section",
];

export function InfoView() {
  return (
    <div className="p-5 md:p-8 max-w-3xl space-y-6">
      <div className="rounded-xl p-6 text-white bg-[radial-gradient(120%_160%_at_100%_0%,#163B66_0%,#0A1626_50%,#060C16_100%)]">
        <div className="text-[11px] tracking-[0.15em] uppercase text-[#7C93AC] mb-2">
          About this system
        </div>
        <p className="text-[14px] text-[#CBD9E8] leading-relaxed">
          This dashboard gives quality engineers a single place to monitor iX0 production
          defects, flag outliers as they emerge, and track them through resolution — built for
          the QLab Total Vehicle Quality case study.
        </p>
      </div>

      <div className="bg-white border border-hairline rounded-xl p-6">
        <h3 className="text-[14px] font-semibold text-ink mb-4">Vehicle & data reference</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          {FACTS.map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-[#F0F3F7] pb-2">
              <dt className="text-[13px] text-slate">{k}</dt>
              <dd className="text-[13px] font-medium text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="bg-white border border-hairline rounded-xl p-6">
        <h3 className="text-[14px] font-semibold text-ink mb-2">Data quality note</h3>
        <p className="text-[13px] text-slate leading-relaxed">
          The raw <code className="text-[12px] bg-paper px-1 py-0.5 rounded">defectName</code> and{" "}
          <code className="text-[12px] bg-paper px-1 py-0.5 rounded">station</code> fields contained
          237 and 35 distinct strings respectively — almost entirely random-case and
          letter-transposition typos of a much smaller set of real values (e.g. "Loose Wiring"
          appeared as 73 different-looking variants). These were canonicalized to 15 true defect
          types and 29 true stations by clustering on letter content, then lowercased — done once
          at data-generation time so every chart and table in this app reads clean, correctly
          grouped data automatically. Full method in <code className="text-[12px] bg-paper px-1 py-0.5 rounded">DOCUMENTATION.md</code>.
        </p>
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
