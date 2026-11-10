"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Flame, MapPin, Route } from "lucide-react";
import { AREAS, CONNECTIONS, areaById, routeBetween } from "@/lib/data/areas";
import styles from "./BonfireAtlas.module.css";

const FIRELINK = "firelink-shrine";
const destinations = [FIRELINK, "undead-burg", "darkroot-garden", "blighttown", "sens-fortress", "anor-londo"].map((id) => areaById(id)!);
const edges = CONNECTIONS.map(({ from, to }) => ({ from: areaById(from)!, to: areaById(to)! }));

export function BonfireAtlas({ animated }: { animated: boolean }) {
  const [selected, setSelected] = useState(0);
  const area = destinations[selected];
  const path = routeBetween(FIRELINK, area.id, false).map((id) => areaById(id)!);
  const points = path.map(({ x, y }) => `${x},${y}`).join(" ");

  return (
    <section id="bonfire-atlas" aria-labelledby="atlas-title" className={styles.section} data-animated={animated}>
      <header className={styles.heading}>
        <div>
          <p className="eyebrow">I / THE BONFIRE ATLAS</p>
          <h2 id="atlas-title" className="section-title">Follow the <span>embers.</span></h2>
        </div>
        <p className={styles.intro}>Зургаан бүсээс сонгоод Firelink Shrine-ээс хүрэх замаа үзээрэй.</p>
      </header>

      <div className={styles.frame}>
        <div id="atlas-destination" className={styles.scene}>
          <div key={area.id} className={styles.art}>
            <Image src={`/artwork/areas/${area.id}.webp`} alt="" fill sizes="(min-width: 960px) 55vw, 100vw" />
          </div>
          <div className={styles.sceneLabel}><Flame size={15} aria-hidden="true" /> BONFIRE / {String(selected + 1).padStart(2, "0")}</div>
          <div className={styles.sceneCopy}>
            <div aria-live="polite" aria-atomic="true">
              <h3>{area.name}</h3>
              <p>{area.mn}</p>
            </div>
            <Link className="btn btn-ember" href={`/map?focus=${area.id}`}>
              Газрын зураг дээр нээх <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className={styles.console}>
          <div className={styles.consoleLabel}><MapPin size={15} aria-hidden="true" /> SELECT A DESTINATION</div>
          <div className={styles.map}>
            <svg viewBox="0 0 1160 740" aria-hidden="true">
              <circle cx="425" cy="378" r="94" className={styles.orbit} />
              <circle cx="425" cy="378" r="179" className={styles.orbit} />
              {edges.map(({ from, to }) => (
                <line key={`${from.id}:${to.id}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} className={styles.edge} />
              ))}
              {AREAS.map(({ id, x, y }) => <circle key={id} cx={x} cy={y} r="6" className={styles.node} />)}
              {path.length > 1 && <polyline key={area.id} points={points} pathLength="1" className={styles.route} />}
              {path.map(({ id, x, y }) => <circle key={id} cx={x} cy={y} r="8" className={styles.waypoint} />)}
              <circle cx={area.x} cy={area.y} r="23" className={styles.beacon} />
              <circle cx={area.x} cy={area.y} r="10" className={styles.destination} />
            </svg>
            <span className={styles.mapStamp}>LORDRAN / SCHEMATIC</span>
          </div>

          <div className={styles.destinations} role="group" aria-label="Бүс сонгох">
            {destinations.map((entry, index) => (
              <button key={entry.id} type="button" aria-pressed={index === selected} aria-controls="atlas-destination atlas-route" onClick={() => setSelected(index)}>
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                {entry.name}
              </button>
            ))}
          </div>
          <div id="atlas-route" className={styles.routeSummary}>
            <div className={styles.consoleLabel}><Route size={15} aria-hidden="true" /> FROM FIRELINK</div>
            {path.length > 1 ? (
              <ol aria-label="Маршрутын бүсүүд">
                {path.map((stop) => <li key={stop.id}>{stop.shortName ?? stop.name}</li>)}
              </ol>
            ) : <p>Аяллын эхлэл · Firelink Shrine</p>}
            <p className={styles.routeNote}>Жишиг маршрут. Нэвтрэх нөхцөлийг бүтэн газрын зургаас харна уу.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
