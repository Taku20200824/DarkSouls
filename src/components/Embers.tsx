"use client";
import { useEffect, useState } from "react";

export function Embers({ count = 22 }: { count?: number }) {
  const [items, setItems] = useState<{ left: number; dur: number; delay: number; dx: number }[]>([]);
  useEffect(() => {
    setItems(Array.from({ length: count }, () => ({ left: Math.random() * 100, dur: 9 + Math.random() * 12, delay: Math.random() * 12, dx: (Math.random() - 0.5) * 120 })));
  }, [count]);
  return (
    <>
      <div className="fog" />
      <div className="embers" aria-hidden>
        {items.map((e, i) => (
          <span key={i} style={{ left: `${e.left}%`, animationDuration: `${e.dur}s`, animationDelay: `${e.delay}s`, ["--dx" as string]: `${e.dx}px` }} />
        ))}
      </div>
    </>
  );
}
