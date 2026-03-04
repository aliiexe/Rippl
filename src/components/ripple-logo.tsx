/**
 * Rippl logo: 2–3 concentric circles (ripple) only. No letter G or other character.
 */
export function RippleLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeOpacity="0.9"
    >
      <circle cx="16" cy="16" r="14" />
      <circle cx="16" cy="16" r="9" />
      <circle cx="16" cy="16" r="4" />
    </svg>
  );
}
