"use client";
import type { PointerEvent, ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";

/** Small, spring-driven tilt that never changes keyboard or touch behavior. */
export function RelicCard({ children, index, label, onClick }: { children: ReactNode; index: number; label: string; onClick(): void }) {
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(x, { stiffness: 180, damping: 24 });
  const rotateY = useSpring(y, { stiffness: 180, damping: 24 });
  const reset = () => { x.set(0); y.set(0); };
  const move = (event: PointerEvent<HTMLButtonElement>) => {
    if (reduced || event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    x.set((.5 - (event.clientY - bounds.top) / bounds.height) * 5);
    y.set(((event.clientX - bounds.left) / bounds.width - .5) * 5);
  };
  return <motion.button onClick={onClick} aria-label={label} className="feature-card group" onPointerMove={move} onPointerLeave={reset} onBlur={reset} style={{ rotateX, rotateY, transformPerspective: 900 }} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: .12 }} transition={{ duration: .65, delay: (index % 3) * .08 }}>{children}</motion.button>;
}
