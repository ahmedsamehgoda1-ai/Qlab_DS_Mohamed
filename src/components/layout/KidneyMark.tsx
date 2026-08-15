export function KidneyMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect x="2" y="2" width="10" height="24" rx="5" stroke="#4FA8E8" strokeWidth="2" />
      <rect x="16" y="2" width="10" height="24" rx="5" stroke="#16B8A6" strokeWidth="2" />
    </svg>
  );
}
