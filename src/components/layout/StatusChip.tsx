export function StatusChip() {
  return (
    <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-navy-800 to-navy-700 border border-bmw-sky/30 px-3 py-1.5 shadow-[0_0_0_1px_rgba(79,168,232,0.08)]">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bmw-teal opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-bmw-teal" />
      </span>
      <span className="text-[11px] font-medium tracking-wide text-[#CBD9E8] uppercase">
        Live · Plant Debrecen
      </span>
    </div>
  );
}
