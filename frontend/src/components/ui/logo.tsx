export function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="17" stroke="var(--accent)" strokeWidth="2.5" />
      <path d="M20 3V37" stroke="var(--accent)" strokeWidth="2.5" />
      <path d="M3 20H37" stroke="var(--accent)" strokeWidth="2.5" />
      <path d="M6.5 9C11 14 11 26 6.5 31" stroke="var(--accent)" strokeWidth="2.5" />
      <path d="M33.5 9C29 14 29 26 33.5 31" stroke="var(--accent)" strokeWidth="2.5" />
    </svg>
  );
}
