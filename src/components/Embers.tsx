"use client";
import { useEffect, useRef } from "react";

/** Canvas ember field: glowing sparks drifting up with sway and flicker. */
export function Embers({ density = 1 }: { density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const ctx = c.getContext("2d");
    if (!ctx) return;
    let w = 0, h = 0, raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    type P = { x: number; y: number; r: number; vy: number; vx: number; life: number; max: number; ph: number; hue: number };
    let ps: P[] = [];
    const spawn = (initial = false): P => ({
      x: Math.random() * w,
      y: initial ? Math.random() * h : h + 10,
      r: 0.6 + Math.random() * 1.8,
      vy: 0.25 + Math.random() * 0.9,
      vx: (Math.random() - 0.5) * 0.3,
      life: 0,
      max: 400 + Math.random() * 700,
      ph: Math.random() * Math.PI * 2,
      hue: 18 + Math.random() * 22,
    });
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      c.width = w * dpr;
      c.height = h * dpr;
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(90, (w * h) / 18000) * density);
      ps = Array.from({ length: n }, () => spawn(true));
    };
    resize();
    window.addEventListener("resize", resize);
    let previous = 0;
    const tick = (time: number) => {
      const step = previous ? Math.min((time - previous) / (1000 / 60), 2) : 1;
      previous = time;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        p.life += step;
        p.ph += 0.02 * step;
        p.x += (p.vx + Math.sin(p.ph) * 0.35) * step;
        p.y -= p.vy * step;
        const t = p.life / p.max;
        const a = Math.max(0, Math.min(1, t * 6) * (1 - t)) * (0.6 + 0.4 * Math.sin(p.ph * 3));
        if (t >= 1 || p.y < -20) {
          ps[i] = spawn();
          continue;
        }
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
        g.addColorStop(0, `hsla(${p.hue + 15},100%,78%,${a})`);
        g.addColorStop(0.25, `hsla(${p.hue},100%,58%,${a * 0.6})`);
        g.addColorStop(1, `hsla(${p.hue},100%,40%,0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    const vis = () => {
      cancelAnimationFrame(raf);
      previous = 0;
      if (!preference.matches && document.visibilityState === "visible") raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, w, h);
    };
    vis();
    preference.addEventListener("change", vis);
    document.addEventListener("visibilitychange", vis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      preference.removeEventListener("change", vis);
      document.removeEventListener("visibilitychange", vis);
    };
  }, [density]);
  return (
    <>
      <div className="fog" aria-hidden />
      <canvas ref={ref} className="pointer-events-none fixed inset-0 z-0" aria-hidden />
    </>
  );
}
