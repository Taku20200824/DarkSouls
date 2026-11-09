"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import gsap from "gsap";
import clsx from "clsx";
import { AREAS, CONNECTIONS, areaById, routeBetween } from "@/lib/data/areas";
import { BOSSES } from "@/lib/data/bosses";
import { useTracker } from "@/components/TrackerProvider";
import { AreaDetail } from "@/components/AreaDetail";
import { Badge, PageTitle, Panel } from "@/components/ui";
import { bossStatus, computeObjectives, estimateArea } from "@/lib/guide/engine";

const FULL = { x: 0, y: 0, w: 1000, h: 700 };

export default function MapPage() {
  return (
    <Suspense>
      <WorldMap />
    </Suspense>
  );
}

function WorldMap() {
  const { tracker } = useTracker();
  const focusParam = useSearchParams().get("focus");
  const svgRef = useRef<SVGSVGElement>(null);
  const markerRef = useRef<SVGCircleElement>(null);
  const vb = useRef({ ...FULL });
  const [selected, setSelected] = useState<string | null>(focusParam ?? "firelink-shrine");
  const [route, setRoute] = useState<string[]>([]);
  const [animating, setAnimating] = useState(false);

  const current = estimateArea(tracker).areaId;
  const nextObjective = computeObjectives(tracker).find((o) => !o.done);
  const foundAreas = useMemo(() => new Set((tracker.character?.bonfires.value ?? []).map((b) => b.area)), [tracker.character]);

  const applyVb = () => svgRef.current?.setAttribute("viewBox", `${vb.current.x} ${vb.current.y} ${vb.current.w} ${vb.current.h}`);
  const zoomTo = (x: number, y: number, w: number, duration = 1.2) => {
    const h = w * 0.7;
    return gsap.to(vb.current, { x: Math.max(-100, x - w / 2), y: Math.max(-80, y - h / 2), w, h, duration, ease: "power2.inOut", onUpdate: applyVb });
  };

  useEffect(() => {
    if (focusParam) {
      const a = areaById(focusParam);
      if (a) zoomTo(a.x, a.y, 520, 1.4);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusParam]);

  function selectArea(id: string) {
    setSelected(id);
    const a = areaById(id)!;
    zoomTo(a.x, a.y, 560, 0.9);
  }

  function goNext() {
    if (!nextObjective || animating) return;
    const path = routeBetween(current ?? "firelink-shrine", nextObjective.area);
    const pts = path.map((id) => areaById(id)!);
    if (!pts.length) return;
    setRoute(path);
    setAnimating(true);
    const m = markerRef.current!;
    gsap.set(m, { attr: { cx: pts[0].x, cy: pts[0].y }, opacity: 1 });
    const tl = gsap.timeline({ onComplete: () => { setAnimating(false); setSelected(nextObjective.area); } });
    tl.add(gsap.to(vb.current, { ...FULL, duration: 1.0, ease: "power2.inOut", onUpdate: applyVb }));
    for (let i = 1; i < pts.length; i++) {
      tl.to(m, { attr: { cx: pts[i].x, cy: pts[i].y }, duration: 0.8, ease: "sine.inOut" });
    }
    const dest = pts[pts.length - 1];
    tl.add(gsap.to(vb.current, { x: dest.x - 280, y: dest.y - 196, w: 560, h: 392, duration: 1.2, ease: "power2.inOut", onUpdate: applyVb }));
  }

  function reset() {
    setRoute([]);
    setSelected("firelink-shrine");
    gsap.to(vb.current, { ...FULL, duration: 0.9, ease: "power2.inOut", onUpdate: applyVb });
  }

  const routeEdges = new Set(route.slice(1).map((id, i) => [route[i], id].sort().join("|")));
  const sel = selected ? areaById(selected) : null;

  return (
    <>
      <PageTitle title="Lordran World Map" sub="Interactive map — бүсүүдийн холболт бодит тоглоомынх; байрлал нь чимэглэлийн (illustrative), координат биш." />
      <p className="mb-3 text-xs text-ash-500">💡 Доорх зангилааг (бүс) дээр дарж дэлгэрэнгүйг баруун талд харна уу. Шугам = холбогдсон зам, тасархай шугам = нөхцөлтэй (түлхүүр/boss шаардана), улбар өнгийн гэрэлтсэн зам = &ldquo;Go to Next Area&rdquo;-ийн маршрут.</p>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button className="btn btn-ember" onClick={goNext} disabled={!nextObjective || animating}>Go to Next Area{nextObjective ? ` → ${areaById(nextObjective.area)?.name}` : ""}</button>
        <button className="btn" onClick={reset}>Бүтэн зураг</button>
        <span className="text-xs text-ash-500">Одоогийн (тооцоолсон): {current ? areaById(current)?.name : "Unknown"} <Badge kind="inference" /></span>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="panel overflow-hidden p-0">
          <svg ref={svgRef} viewBox="0 0 1000 700" className="h-[62vh] w-full touch-none select-none bg-[radial-gradient(ellipse_at_center,#1c1b21_0%,#07070a_75%)]" role="img" aria-label="Lordran map">
            <defs>
              <filter id="glow"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              <pattern id="parch" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M0 40 L40 0" stroke="rgba(184,153,90,0.04)" /></pattern>
            </defs>
            <rect x="-200" y="-200" width="1400" height="1100" fill="url(#parch)" />
            <text x="40" y="690" fill="rgba(184,153,90,0.35)" fontSize="12" fontFamily="Cormorant Garamond">Illustrative map — verified connections</text>
            {CONNECTIONS.map((c) => {
              const a = areaById(c.from)!;
              const b = areaById(c.to)!;
              const onRoute = routeEdges.has([c.from, c.to].sort().join("|"));
              return (
                <line key={`${c.from}-${c.to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={onRoute ? "#ff8a3d" : c.requires ? "rgba(184,153,90,0.28)" : "rgba(184,153,90,0.45)"} strokeWidth={onRoute ? 4 : 1.5} strokeDasharray={c.requires && !onRoute ? "5 5" : undefined} filter={onRoute ? "url(#glow)" : undefined}>
                  <title>{c.requires ?? "Нээлттэй зам"}</title>
                </line>
              );
            })}
            {AREAS.map((a) => {
              const lit = a.bonfireArea && foundAreas.has(a.bonfireArea);
              const isCur = a.id === current;
              const bosses = a.bosses.map((id) => BOSSES.find((b) => b.id === id)!);
              const bossStates = bosses.map((b) => bossStatus(b, tracker).state);
              const label = a.shortName ?? (a.name.length > 26 ? a.name.slice(0, 24) + "…" : a.name);
              return (
                <g key={a.id} transform={`translate(${a.x},${a.y})`} className="cursor-pointer" onClick={() => selectArea(a.id)}>
                  <title>{a.name}{a.dlc ? " (DLC)" : ""} — {a.mn}</title>
                  {isCur && <circle r="22" fill="none" stroke="#ff8a3d" strokeWidth="1.5" className="animate-pulse" />}
                  <circle r={selected === a.id ? 12 : 9} fill={a.dlc ? "#2a1f3a" : "#15151a"} stroke={selected === a.id ? "#ffb36b" : "#d4b97a"} strokeWidth="1.5" />
                  {lit && <path d="M0 -6 C3 -2 5 0 3 5 C2 7 -2 7 -3 5 C-5 0 -3 -2 0 -6Z" fill="#ff8a3d" className="bonfire-flicker" />}
                  {bosses.map((b, i) => (
                    <rect key={b.id} x={12 + i * 9} y={-14} width="7" height="7" transform={`rotate(45 ${15.5 + i * 9} -10.5)`} fill={bossStates[i] === "defeated" ? "#d4b97a" : bossStates[i] === "alive" ? "#9b1c1c" : "#3a3640"} stroke="#07070a"><title>{b.name}: {bossStates[i] === "defeated" ? "ялсан" : bossStates[i] === "alive" ? "амьд" : "тодорхойгүй"}</title></rect>
                  ))}
                  <text y="26" textAnchor="middle" fontSize="11" fill={lit ? "#e9d7a5" : "#b8b2a4"} stroke="#07070a" strokeWidth="3" strokeLinejoin="round" fontFamily="Cormorant Garamond, serif" fontWeight="600" style={{ paintOrder: "stroke" }}>{label}</text>
                </g>
              );
            })}
            <circle ref={markerRef} r="7" fill="#ffe2b0" filter="url(#glow)" opacity="0" />
          </svg>
          <div className="flex flex-wrap gap-4 border-t border-gold-600/10 px-4 py-2 text-[11px] text-ash-500">
            <span><span className="text-ember-400">🔥</span> Bonfire олсон (save)</span>
            <span><span className="inline-block h-2 w-2 rotate-45 bg-gold-400" /> Boss ялсан</span>
            <span><span className="inline-block h-2 w-2 rotate-45 bg-blood-500" /> Boss амьд (verified flag)</span>
            <span><span className="inline-block h-2 w-2 rotate-45 bg-stone-700" /> Тодорхойгүй</span>
            <span>- - - нөхцөлтэй зам</span>
          </div>
        </div>
        <Panel className={clsx("max-h-[70vh] overflow-y-auto")}>
          {sel ? <AreaDetail area={sel} compact /> : <p className="text-sm text-ash-400">Газрын зураг дээрх бүсийг дарж дэлгэрэнгүйг харна уу. &ldquo;Go to Next Area&rdquo; нь таны явцад тулгуурласан маршрутыг анимэйшнээр харуулна.</p>}
          {route.length > 1 && (
            <div className="mt-4 border-t border-gold-600/20 pt-3 text-sm">
              <div className="text-xs uppercase tracking-widest text-ash-500">Маршрут</div>
              <ol className="mt-1 list-decimal pl-5">{route.map((r) => <li key={r}>{areaById(r)?.name}</li>)}</ol>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
