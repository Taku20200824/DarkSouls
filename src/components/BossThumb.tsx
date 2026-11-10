import Image from "next/image";
import clsx from "clsx";
import type { Boss } from "@/lib/data/bosses";

/** Small square crop of a boss's original portrait, for lists and popups. */
export function BossThumb({ boss, defeated, size = 36, className }: { boss: Boss; defeated?: boolean; size?: number; className?: string }) {
  return (
    <span className={clsx("relative inline-block shrink-0 overflow-hidden rounded-sm border border-gold-600/30 bg-black", className)} style={{ width: size, height: size }}>
      <Image src={`/artwork/bosses/${boss.id}.webp`} alt="" fill sizes={`${size}px`} className={clsx("object-cover", !defeated && "brightness-75 saturate-50")} />
    </span>
  );
}
