import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Swords } from "lucide-react";

export function BossSpotlight({ onExplore, compact = false }: { onExplore?: () => void; compact?: boolean }) {
  const action = <><Swords size={16} /> Enter the encounter <ArrowUpRight size={16} /></>;
  return (
    <section className={`boss-spotlight ${compact ? "boss-spotlight-compact" : ""}`} aria-labelledby={compact ? "archive-encounter" : "featured-encounter"}>
      <Image src="/artwork/abysswalker.webp" alt="Fan illustration of Knight Artorias in a ruined moonlit arena" fill sizes="(max-width: 768px) 100vw, 1200px" className="encounter-art" />
      <div className="encounter-shade" />
      <div className="encounter-caption"><span className="status-spark" /> LEGENDS OF LORDRAN <span>01 / 26</span></div>
      <div className="encounter-copy">
        <p className="eyebrow">THE ABYSS HAS A CHAMPION.</p>
        <h2 id={compact ? "archive-encounter" : "featured-encounter"}>KNIGHT<br /><span>ARTORIAS.</span></h2>
        <p className="encounter-description">A fallen legend. An unbroken will.<br />Learn his patterns. Find your opening.</p>
        <div className="encounter-tags"><span>OOLACILE</span><span>ARTORIAS OF THE ABYSS</span></div>
        {onExplore ? <button className="btn encounter-cta" onClick={onExplore}>{action}</button> : <Link className="btn encounter-cta" href="/bosses/artorias">{action}</Link>}
      </div>
      <span className="encounter-credit">ORIGINAL AI FAN ART / UNOFFICIAL</span>
    </section>
  );
}
