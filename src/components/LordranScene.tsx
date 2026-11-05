import Image from "next/image";
import type { CSSProperties } from "react";

const SPARKS = Array.from({ length: 30 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  "--spark-delay": `${-(i * 1.73)}s`,
  "--spark-duration": `${9 + i % 9}s`,
  "--spark-drift": `${(i % 2 ? 1 : -1) * (35 + i * 3)}px`,
} as CSSProperties));

/** Optimized original key art, with independent light, mist and ember layers. */
export function LordranScene() {
  return (
    <div className="lordran-scene" aria-hidden="true">
      <Image src="/artwork/firelink-cinematic.webp" alt="" fill priority sizes="100vw" quality={90} className="cinematic-keyart" />
      <div className="fire-bloom" /><div className="cinematic-mist" />
      <div className="cinematic-sparks">{SPARKS.map((style, i) => <span key={i} style={style} />)}</div>
    </div>
  );
}
