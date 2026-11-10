"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import gsap from "gsap";
import { AREAS, CONNECTIONS, areaById, areaHasBonfire, connectionBetween, routeBetween, type Area, type ConnectionKind } from "@/lib/data/areas";
import { bossById, type Boss } from "@/lib/data/bosses";
import { useTracker } from "@/components/TrackerProvider";
import { AreaDetail } from "@/components/AreaDetail";
import { BossThumb } from "@/components/BossThumb";
import { PageTitle, Panel } from "@/components/ui";
import { bossStatus, computeObjectives, nextObjective } from "@/lib/guide/engine";

type PopupContent = { kind: "area"; area: Area } | { kind: "boss"; boss: Boss; state: string };
type Popup = PopupContent & { x: number; y: number };

const STATE_MN: Record<string, string> = { defeated: "Ялсан", alive: "Амьд", unknown: "Тодорхойгүй" };

const FULL = { x: 0, y: 0, w: 1160, h: 740 };
const FIRELINK = "firelink-shrine";
const EDGE_STYLE: Record<ConnectionKind, { color: string; dash?: string; label: string }> = {
  path: { color: "#ac9977", label: "Зам" },
  lift: { color: "#76c7ac", label: "Лифт" },
  shortcut: { color: "#81c6df", dash: "7 4", label: "Товч зам" },
  gate: { color: "#e5b757", dash: "4 5", label: "Нөхцөлтэй хаалга" },
  warp: { color: "#b498ec", dash: "3 5", label: "Warp" },
  drop: { color: "#df9173", dash: "5 4", label: "Үсэрч буух" },
};

function focusedView(area: Area) {
  const w = 540;
  const h = w * FULL.h / FULL.w;
  return {
    x: Math.max(0, Math.min(FULL.w - w, area.x - w / 2)),
    y: Math.max(0, Math.min(FULL.h - h, area.y - h / 2)),
    w, h,
  };
}

export default function MapPage() {
  return <Suspense><WorldMap /></Suspense>;
}

function WorldMap() {
  const { tracker } = useTracker();
  const focus = useSearchParams().get("focus");
  const svgRef = useRef<SVGSVGElement>(null);
  const markerRef = useRef<SVGCircleElement>(null);
  const animation = useRef<gsap.core.Animation | null>(null);
  const view = useRef({ ...FULL });
  const [selected, setSelected] = useState(() => (focus && areaById(focus)?.id) || FIRELINK);
  const [route, setRoute] = useState<string[]>([]);
  const [includeAlternates, setIncludeAlternates] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [notice, setNotice] = useState("");
  const [popup, setPopup] = useState<Popup | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const next = nextObjective(computeObjectives(tracker));
  const area = areaById(selected)!;

  function showPopup(e: React.MouseEvent, content: PopupContent) {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPopup({ ...content, x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  function applyView() {
    const { x, y, w, h } = view.current;
    svgRef.current?.setAttribute("viewBox", `${x} ${y} ${w} ${h}`);
  }

  function moveTo(nextView: typeof FULL) {
    animation.current?.kill();
    markerRef.current?.setAttribute("opacity", "0");
    setAnimating(false);
    setRoute([]);
    setNotice("");
    animation.current = gsap.to(view.current, { ...nextView, duration: 0.55, onUpdate: applyView });
  }

  function selectArea(id: string) {
    const destination = areaById(id);
    if (!destination) return;
    setSelected(id);
    moveTo(focusedView(destination));
  }

  useEffect(() => {
    const destination = focus && areaById(focus);
    if (destination) selectArea(destination.id);
    else {
      setSelected(FIRELINK);
      moveTo(FULL);
    }
    return () => { animation.current?.kill(); };
    // The camera follows changes to the URL, including client-side navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus]);

  function goNext() {
    if (!next || animating) return;
    const marker = markerRef.current;
    if (!marker) return;
    const path = routeBetween(selected, next.area, includeAlternates);
    setRoute(path);
    if (path.length < 2) {
      setNotice(path.length ? "Сонгосон бүс дараагийн зорилтын байршил мөн." : "Энэ чиглэлд тохирох маршрут олдсонгүй.");
      return;
    }

    const destination = areaById(next.area)!;
    animation.current?.kill();
    setNotice("");
    setAnimating(true);
    gsap.set(marker, { attr: { cx: area.x, cy: area.y, opacity: 1 } });
    const timeline = gsap.timeline({
      onComplete: () => {
        setSelected(destination.id);
        setAnimating(false);
      },
    });
    animation.current = timeline;
    timeline.to(view.current, { ...FULL, duration: 0.55, onUpdate: applyView });
    path.slice(1).forEach((to, index) => {
      const edge = connectionBetween(path[index], to)!;
      const line = svgRef.current?.querySelector<SVGPathElement>(`[data-edge="${edge.from}:${edge.to}"]`);
      if (!line) return;
      const length = line.getTotalLength();
      const progress = { value: edge.to === to ? 0 : length };
      timeline.to(progress, {
        value: edge.to === to ? length : 0,
        duration: 0.55,
        ease: "none",
        onUpdate: () => {
          const point = line.getPointAtLength(progress.value);
          gsap.set(marker, { attr: { cx: point.x, cy: point.y } });
        },
      });
    });
    timeline.to(view.current, { ...focusedView(destination), duration: 0.55, onUpdate: applyView });
  }

  const steps = route.slice(1).map((id, index) => connectionBetween(route[index], id));
  const routeEdges = new Set(steps);

  return (
    <>
      <PageTitle title="Lordran World Map" sub="Lordran ба Artorias of the Abyss-ийн бүс, зам, нэвтрэх нөхцөл. Байрлал, зайг тоймлон дүрсэлсэн." />
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-ash-400">
          Бүс хайх / маршрутын эхлэл
          <select className="btn max-w-full bg-[#14110d]" value={selected} onChange={(e) => selectArea(e.target.value)}>
            {AREAS.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
          </select>
        </label>
        <button className="btn btn-ember" onClick={goNext} disabled={!next || animating}>
          Go to Next Area{next && ` → ${areaById(next.area)?.name}`}
        </button>
        <button className="btn" onClick={() => { setSelected(FIRELINK); moveTo(FULL); }}>Бүтэн зураг</button>
        <a className="btn" href="https://dsmap.link/en/#/ds1" target="_blank" rel="noreferrer">3D · DS Map ↗</a>
        <label className="flex min-h-9 items-center gap-2 px-2 text-xs text-ash-300">
          <input type="checkbox" checked={includeAlternates} onChange={(e) => { moveTo(FULL); setIncludeAlternates(e.target.checked); }} />
          Товч замыг тооцох
        </label>
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="relative" ref={wrapRef} onMouseLeave={() => setPopup(null)}>
        <div className="panel overflow-hidden p-0">
          <svg ref={svgRef} viewBox={`0 0 ${FULL.w} ${FULL.h}`} className="h-auto w-full select-none bg-[radial-gradient(ellipse_at_center,#241a10_0%,#0b0907_78%)]" role="group" aria-label="Lordran map">
            <defs>
              <pattern id="map-grid" width="48" height="30" patternUnits="userSpaceOnUse">
                <path d="M0 15 L24 0 L48 15 L24 30 Z" fill="none" stroke="#9f8253" opacity=".15" />
              </pattern>
              <marker id="map-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" markerUnits="userSpaceOnUse" orient="auto">
                <path d="M0 0 L8 4 L0 8 Z" fill="context-stroke" />
              </marker>
              <filter id="map-glow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <rect width={FULL.w} height={FULL.h} fill="url(#map-grid)" />
            {[false, true].flatMap((active) => CONNECTIONS.filter((c) => routeEdges.has(c) === active).map((c) => {
              const from = areaById(c.from)!;
              const to = areaById(c.to)!;
              const dx = to.x - from.x;
              const dy = to.y - from.y;
              const length = Math.hypot(dx, dy);
              const x1 = from.x + dx * 13 / length;
              const y1 = from.y + dy * 13 / length;
              const x2 = to.x - dx * 17 / length;
              const y2 = to.y - dy * 17 / length;
              const offset = c.oneWay && c.kind === "warp" ? 32 : c.oneWay && c.kind === "drop" ? 14 : 0;
              const controlX = (x1 + x2) / 2 - dy * offset / length;
              const controlY = (y1 + y2) / 2 + dx * offset / length;
              const style = EDGE_STYLE[c.kind ?? "path"];
              return (
                <path key={`${c.from}:${c.to}`} data-edge={`${c.from}:${c.to}`}
                  d={`M${x1} ${y1} Q${controlX} ${controlY} ${x2} ${y2}`}
                  fill="none" stroke={active ? "#ff9f56" : style.color} strokeWidth={active ? 4 : 2}
                  strokeDasharray={active ? undefined : style.dash} opacity={active ? 1 : 0.72}
                  markerEnd={c.oneWay ? "url(#map-arrow)" : undefined}
                >
                  <title>{`${from.name} ${c.oneWay ? "→" : "↔"} ${to.name} · ${c.requires ?? style.label}`}</title>
                </path>
              );
            }))}
            {AREAS.map((entry) => {
              const lit = tracker.character?.bonfires.value?.some((b) => areaHasBonfire(entry, b.id, b.area));
              const active = selected === entry.id;
              return (
                <g key={entry.id} transform={`translate(${entry.x},${entry.y})`} role="button" tabIndex={0}
                  aria-label={entry.name} aria-pressed={active} className="group cursor-pointer outline-none"
                  onClick={() => selectArea(entry.id)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectArea(entry.id); } }}
                  onMouseMove={(e) => showPopup(e, { kind: "area", area: entry })}
                  onMouseLeave={() => setPopup(null)}
                >
                  <circle r="22" fill="transparent" />
                  <circle r="14" fill="none" stroke="#ffb76e" opacity={active ? 1 : 0} className="group-focus-visible:opacity-100" />
                  <circle r="9" fill={entry.dlc ? "#2a2037" : "#19120b"} stroke={active ? "#ffae66" : "#e0c184"} strokeWidth="2" />
                  {lit && <path d="M0 -6 C3 -2 5 0 3 5 C2 7 -2 7 -3 5 C-5 0 -3 -2 0 -6Z" fill="#ff8a3d" />}
                  {entry.bosses.map((id, index) => {
                    const boss = bossById(id)!;
                    const { state } = bossStatus(boss, tracker);
                    const color = state === "defeated" ? "#e0c184" : state === "alive" ? "#ee6d60" : "#928895";
                    return (
                      <g key={id} transform={`translate(${15 + index * 11},-12)`} aria-label={`${boss.name} · ${STATE_MN[state]}`}
                        onMouseMove={(e) => { e.stopPropagation(); showPopup(e, { kind: "boss", boss, state }); }}
                      >
                        <circle r="6" fill="#17100b" stroke={color} strokeWidth="1.5" />
                        <path d="M-2 0 L0 -2 L2 0 L0 2 Z" fill={color} />
                      </g>
                    );
                  })}
                  <text y="29" textAnchor="middle" fontSize="17" fill={active ? "#ffbd81" : entry.dlc ? "#dac9f5" : "#edd5a1"}
                    stroke="#120e09" strokeWidth="4" strokeLinejoin="round" fontFamily="Cinzel, Georgia, serif" fontWeight="600"
                    style={{ paintOrder: "stroke" }}
                  >{entry.shortName ?? entry.name}</text>
                </g>
              );
            })}
            <circle ref={markerRef} r="5" fill="#fff0c8" filter="url(#map-glow)" opacity="0" pointerEvents="none" />
          </svg>
          <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-gold-600/20 px-4 py-3 text-xs text-ash-300">
            {Object.entries(EDGE_STYLE).map(([kind, style]) => (
              <span key={kind} className="inline-flex items-center gap-1.5">
                <svg width="22" height="6" aria-hidden="true"><path d="M0 3 H22" stroke={style.color} strokeWidth="2" strokeDasharray={style.dash} /></svg>
                {style.label}
              </span>
            ))}
            <span>→ Нэг чиглэл</span>
            <span className="text-ember-300">◆ Сонгосон маршрут</span>
            <span>🔥 Bonfire олсон (save)</span>
            <span><span className="text-gold-300">●</span> Ялсан · <span className="text-danger-strong">●</span> Амьд · <span className="text-ash-400">●</span> Тодорхойгүй</span>
          </div>
        </div>
        {popup && (
          <div
            className="pointer-events-none absolute z-20 w-64 -translate-y-full rounded-sm border border-gold-600/40 bg-[#0b0a0df2] p-3 shadow-[0_12px_30px_-8px_rgba(0,0,0,0.9)]"
            style={{ left: Math.max(4, Math.min(popup.x + 14, (wrapRef.current?.clientWidth ?? 9999) - 262)), top: Math.max(popup.y - 10, 120) }}
          >
            {popup.kind === "boss" ? (
              <div className="flex items-center gap-3">
                <BossThumb boss={popup.boss} defeated={popup.state === "defeated"} size={56} />
                <div className="min-w-0">
                  <div className="text-micro font-semibold uppercase tracking-label text-ember-300">Boss</div>
                  <div className="font-display text-sm font-semibold text-gold-100">{popup.boss.name}</div>
                  <div className={`text-xs ${popup.state === "defeated" ? "text-success" : popup.state === "alive" ? "text-danger" : "text-ash-400"}`}>{STATE_MN[popup.state]}</div>
                </div>
              </div>
            ) : (
              <>
                <div className="text-micro font-semibold uppercase tracking-label text-gold-400">Бүс{popup.area.dlc ? " · DLC" : ""}</div>
                <div className="font-display text-sm font-semibold text-gold-100">{popup.area.name}</div>
                <div className="mt-0.5 text-xs leading-snug text-ash-400">{popup.area.mn}</div>
                {popup.area.bosses.length > 0 && (
                  <div className="mt-2 flex gap-1.5">
                    {popup.area.bosses.map((id) => {
                      const b = bossById(id)!;
                      return <BossThumb key={id} boss={b} defeated={bossStatus(b, tracker).state === "defeated"} size={40} />;
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
        </div>
        <Panel className="xl:max-h-[75vh] xl:overflow-y-auto">
          <div aria-live="polite">{notice && <p className="mb-3 text-sm text-ash-300">{notice}</p>}</div>
          {route.length > 1 && (
            <div className="mb-4 border-b border-gold-600/20 pb-3 text-sm">
              <h2 className="text-xs uppercase tracking-widest text-ember-300">Маршрут</h2>
              <p className="my-1 text-xs text-ash-400">Замын нөхцөлийг өөрийн явцтай тулгаж шалгана уу.</p>
              <ol className="list-decimal space-y-1 pl-5">
                {route.map((id, index) => (
                  <li key={id}>
                    {areaById(id)?.name}
                    {steps[index - 1]?.requires && <p className="text-xs text-ash-400">{steps[index - 1]?.requires}</p>}
                  </li>
                ))}
              </ol>
            </div>
          )}
          <AreaDetail area={area} compact />
        </Panel>
      </div>
    </>
  );
}
