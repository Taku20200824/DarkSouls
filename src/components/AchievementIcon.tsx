"use client";
import clsx from "clsx";
import { Lock } from "lucide-react";
import { useState } from "react";
import { achievementIcon } from "@/lib/data/achievement-icons";

/**
 * Steam achievement art in a forged frame. Unlocked: full colour with an ember glow.
 * Locked / unknown: Steam's grey icon with a lock seal. Falls back to a rune if the CDN fails.
 */
export function AchievementIcon({
  name,
  unlocked,
  synced,
  size = 64,
  className,
}: {
  name: string;
  unlocked: boolean | null;
  /** Icons from the user's own Steam sync take priority over the bundled ones. */
  synced?: { icon?: string; iconGray?: string };
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = unlocked
    ? synced?.icon ?? achievementIcon(name, true)
    : synced?.iconGray ?? synced?.icon ?? achievementIcon(name, false);
  return (
    <div
      className={clsx("ach-icon", unlocked ? "ach-icon--on" : "ach-icon--off", className)}
      style={{ width: size, height: size }}
    >
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" width={size} height={size} loading="lazy" decoding="async" onError={() => setFailed(true)} />
      ) : (
        <span className="font-display text-gold-500" style={{ fontSize: size * 0.4 }} aria-hidden>
          ✦
        </span>
      )}
      {!unlocked && (
        <span className="ach-icon__seal" aria-hidden>
          <Lock size={Math.max(10, Math.round(size * 0.18))} strokeWidth={2.2} />
        </span>
      )}
    </div>
  );
}

/** Ember progress ring used for completion. */
export function ProgressRing({ value, total, size = 148, children }: { value: number; total: number; size?: number; children?: React.ReactNode }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(1, value / total) : 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
        <defs>
          <linearGradient id="ring-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffc07a" />
            <stop offset="0.55" stopColor="#f26a1b" />
            <stop offset="1" stopColor="#8f1414" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(168,137,79,0.14)" strokeWidth="5" />
        <circle cx="50" cy="50" r={r + 4.5} fill="none" stroke="rgba(207,177,115,0.25)" strokeWidth="0.4" strokeDasharray="1 2.2" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="url(#ring-g)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
          className="ring-arc"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}
