/** The profile banner: Wall blue scattered with confetti shapes. */
export function Cover({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1000 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="1000" height="240" fill="#2f5bea" />
      <circle cx="880" cy="-30" r="190" fill="#3d68f2" />
      <circle cx="90" cy="280" r="150" fill="#2650d6" />

      {/* squiggles */}
      <path d="M120 60 q20 -24 40 0 t40 0 t40 0" fill="none" stroke="#ffcf3f" strokeWidth="9" strokeLinecap="round" />
      <path d="M640 190 q16 -20 32 0 t32 0 t32 0" fill="none" stroke="#2cc6a0" strokeWidth="8" strokeLinecap="round" />
      <path d="M820 120 q14 -18 28 0 t28 0" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" opacity="0.85" />

      {/* rings and dots */}
      <circle cx="340" cy="70" r="20" fill="none" stroke="#ff6b5b" strokeWidth="9" />
      <circle cx="930" cy="200" r="16" fill="none" stroke="#ffcf3f" strokeWidth="8" />
      <circle cx="470" cy="180" r="9" fill="#fff" opacity="0.9" />
      <circle cx="560" cy="48" r="12" fill="#ffcf3f" />
      <circle cx="250" cy="170" r="7" fill="#2cc6a0" />
      <circle cx="740" cy="60" r="6" fill="#fff" opacity="0.8" />

      {/* triangles */}
      <path d="M420 92 l24 -40 l20 44 z" fill="#2cc6a0" />
      <path d="M760 210 l18 -30 l16 32 z" fill="#ff6b5b" />
      <path d="M40 120 l20 -32 l16 36 z" fill="#fff" opacity="0.85" />

      {/* sparkles */}
      <path
        d="M680 100 l6 -18 l6 18 l18 6 l-18 6 l-6 18 l-6 -18 l-18 -6 z"
        fill="#ffcf3f"
      />
      <path d="M200 110 l4 -12 l4 12 l12 4 l-12 4 l-4 12 l-4 -12 l-12 -4 z" fill="#fff" />
      <path d="M520 130 l4 -12 l4 12 l12 4 l-12 4 l-4 12 l-4 -12 l-12 -4 z" fill="#ff6b5b" />

      {/* rounded bars */}
      <rect x="880" y="40" width="54" height="14" rx="7" fill="#ff6b5b" transform="rotate(-24 907 47)" />
      <rect x="300" y="200" width="44" height="12" rx="6" fill="#ffcf3f" transform="rotate(18 322 206)" />
    </svg>
  );
}
