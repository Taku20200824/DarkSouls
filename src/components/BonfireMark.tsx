/** Coiled-sword-in-bonfire mark (original drawing). */
export function BonfireMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 84" className={className} style={{ overflow: "visible" }} aria-hidden>
      <defs>
        <linearGradient id="bm-fl" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#b8450c" />
          <stop offset="0.45" stopColor="#ff9142" />
          <stop offset="1" stopColor="#fff1cf" />
        </linearGradient>
        <linearGradient id="bm-st" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5d5a55" />
          <stop offset="0.5" stopColor="#c9c3b6" />
          <stop offset="1" stopColor="#5d5a55" />
        </linearGradient>
      </defs>
      <g className="bonfire-flicker">
        <path d="M30 6 C36 22 50 30 45 50 C42 62 35 68 30 68 C25 68 17 62 15 50 C11 32 24 24 30 6Z" fill="url(#bm-fl)" opacity="0.95" />
        <path d="M30 26 C33 36 40 40 37 52 C35 59 32 62 30 62 C28 62 24 59 23 52 C21 42 27 37 30 26Z" fill="#fff1cf" opacity="0.65" />
      </g>
      <path d="M28.6 4 L31.4 4 L31.6 64 L28.4 64Z" fill="url(#bm-st)" />
      <path d="M28 18 C34 22 34 26 28 30 C22 34 22 38 28 42 C34 46 34 50 28 54" fill="none" stroke="#8f8778" strokeWidth="1.6" />
      <rect x="23" y="62" width="14" height="3" fill="#8f8778" />
      <path d="M8 80 L52 80 L46 70 L14 70Z" fill="#1d1b21" stroke="#3a3640" />
      <path d="M12 72 L22 66 L30 70 L40 65 L48 72" fill="none" stroke="#2c2930" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
