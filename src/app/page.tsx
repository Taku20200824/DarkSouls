"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type PointerEvent } from "react";
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { ArrowDown, ArrowUpRight, ChevronRight, Compass, Download, Flame, Hammer, Map as MapIcon, ScrollText, ShieldCheck, Swords } from "lucide-react";
import { useTracker } from "@/components/TrackerProvider";
import { BonfireMark } from "@/components/BonfireMark";
import { LordranScene } from "@/components/LordranScene";
import { RelicCard } from "@/components/RelicCard";
import { BossSpotlight } from "@/components/BossSpotlight";
import { DESKTOP_DOWNLOAD_PATH } from "@/lib/downloads";
import { useLatestDesktop } from "@/components/useLatestDesktop";

const FEATURES = [
  { n: "01", icon: MapIcon, en: "A WORLD, CONNECTED", t: "Lordran газрын зураг", d: "Бүсүүдийн бодит холболт, дараагийн бүс рүү хөдөлгөөнт маршрут.", href: "/map", name: "World map" },
  { n: "02", icon: Swords, en: "KNOW YOUR ENEMY", t: "Boss & 100% хөтөч", d: "Boss бүрийн стратеги, сүүл тасдах анхааруулга, дараагийн зорилт.", href: "/bosses", name: "Boss archive" },
  { n: "03", icon: Hammer, en: "FORGE YOUR LEGACY", t: "Зэвсэг сайжруулах", d: "Баталгаажсан жороор материал, ember, дарханг тооцоолно.", href: "/upgrades", name: "Upgrade planner" },
  { n: "04", icon: Flame, en: "EVERY VICTORY COUNTS", t: "Steam нэвтрэлт", d: "Steam OpenID-ээр аюулгүй нэвтэрч, 41 achievement-ээ синк хийнэ.", href: "/achievements", name: "Achievements" },
  { n: "05", icon: ScrollText, en: "YOUR STORY, PRESERVED", t: "Save файл уншигч", d: "DRAKS0005.sl2-ийг зөвхөн уншиж: түвшин, статистик, үхэл, bonfire, inventory.", href: "/characters", name: "Save reader" },
  { n: "06", icon: Compass, en: "NEVER WALK ALONE", t: "Windows Companion", d: "Тоглоом save хийх бүрт таны аяллыг автоматаар илгээнэ.", href: "/settings", name: "Companion setup" },
];
const reveal = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };

export default function Landing() {
  const { status, demo, setDemo } = useTracker();
  const desktop = useLatestDesktop();
  const router = useRouter();
  const reduced = useReducedMotion();
  const [effects, setEffects] = useState(true);
  const { scrollY, scrollYProgress } = useScroll();
  const sceneryY = useTransform(scrollY, [0, 1000], [0, 180]);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const artX = useSpring(pointerX, { stiffness: 65, damping: 25 });
  const artY = useSpring(pointerY, { stiffness: 65, damping: 25 });
  const resetPointer = () => { pointerX.set(0); pointerY.set(0); };
  const movePointer = (event: PointerEvent<HTMLElement>) => {
    if (reduced || !effects || event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set(((event.clientX - bounds.left) / bounds.width - .5) * -22);
    pointerY.set(((event.clientY - bounds.top) / bounds.height - .5) * -14);
  };
  const enter = (href: string) => {
    if (status !== "ready") setDemo(true);
    router.push(href);
  };
  return (
    <main id="main-content" className={`landing landing-immersive relative z-10 overflow-hidden ${effects ? "" : "effects-paused"}`}>
      <motion.div className="reading-progress" style={{ scaleX: scrollYProgress }} aria-hidden="true" />
      <header className="landing-nav">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Lordran Tracker home"><BonfireMark className="h-10 w-7" /><span className="font-display text-[13px] tracking-[.2em] text-gold-200">LORDRAN <span className="text-ash-400">/ TRACKER</span></span></Link>
        <nav aria-label="Main navigation" className="flex items-center gap-6 md:gap-9">
          <a href="#discover" className="landing-nav-link hidden sm:block">THE COMPANION</a><a href="#journey" className="landing-nav-link hidden md:block">YOUR JOURNEY</a>
          <button onClick={() => enter("/dashboard")} className="landing-nav-link flex items-center gap-2">{status === "ready" ? "DASHBOARD" : "EXPLORE DEMO"}<ArrowUpRight size={14} /></button>
        </nav>
      </header>
      <section className="landing-hero" aria-labelledby="hero-title" onPointerMove={movePointer} onPointerLeave={resetPointer}>
        <motion.div className="hero-art" style={{ y: reduced || !effects ? 0 : sceneryY }}><motion.div className="hero-art-depth" style={{ x: reduced || !effects ? 0 : artX, y: reduced || !effects ? 0 : artY }}><LordranScene paused={!effects} /></motion.div></motion.div><div className="hero-shade" /><div className="hero-frame" aria-hidden="true" />
        <motion.div className="hero-copy" initial="hidden" animate="visible" transition={{ staggerChildren: .12 }}>
          <motion.p variants={reveal} transition={{ duration: .7 }} className="eyebrow flex items-center gap-3"><span className="h-px w-8 bg-ember-400" /> A DARK SOULS REMASTERED COMPANION</motion.p>
          <motion.h1 variants={reveal} transition={{ duration: 1 }} id="hero-title" className="hero-title"><span className="title-lordran">LORDRAN</span><span className="title-tracker">T R A C K E R</span></motion.h1>
          <motion.p variants={reveal} transition={{ duration: .8 }} className="hero-mantra">DEATH IS NOT THE END.</motion.p>
          <motion.p variants={reveal} transition={{ duration: .7 }} className="hero-subtitle">It’s where your legend begins.</motion.p>
          <motion.p variants={reveal} transition={{ duration: .7 }} className="hero-description">Lordran дахь аяллын тань хамтрагч. Boss, achievement, зэвсэг, save — таны бүх явц нэг дор.</motion.p>
          <motion.div variants={reveal} transition={{ duration: .7 }} className="mt-8 flex flex-wrap gap-3">
            {status === "ready" && !demo ? <Link className="btn btn-ember hero-cta" href="/dashboard">Аяллаа үргэлжлүүлэх <ArrowUpRight size={17} /></Link> : <a className="btn btn-ember hero-cta" href="/api/auth/steam/login"><Flame size={17} /> Sign in through Steam <ArrowUpRight size={16} /></a>}
            <button className="btn hero-cta" onClick={() => { setDemo(true); router.push("/dashboard"); }}>Explore demo <ChevronRight size={16} /></button>
            <a className="btn hero-cta" href={DESKTOP_DOWNLOAD_PATH}><Download size={16} /> Windows-д татах{desktop ? ` v${desktop.version}` : ""}</a>
          </motion.div>
          <motion.div variants={reveal} transition={{ duration: .7 }} className="mt-6 flex items-center gap-2 text-[10px] tracking-wide text-ash-400"><ShieldCheck size={14} className="text-gold-500" /> Read-only saves. Secure Steam sign-in.</motion.div>
        </motion.div>
        <div className="hero-location"><span className="status-spark" /><span>REST AT THE BONFIRE</span><span className="text-ash-500">/ FIRELINK SHRINE</span></div>
        <a href="#discover" className="hero-scroll"><span>DESCEND INTO LORDRAN</span><ArrowDown size={15} /></a>
        <button className="atmosphere-toggle" aria-pressed={effects} onClick={() => { setEffects(!effects); resetPointer(); }}><span className={effects ? "status-spark" : ""} /> ATMOSPHERE {effects ? "ON" : "PAUSED"}</button>
      </section>
      <div className="legend-strip"><div><span>26</span><p>LEGENDARY BOSSES</p></div><span className="legend-divider" /><div><span>41</span><p>ACHIEVEMENTS TO CLAIM</p></div><span className="legend-divider" /><div><span>∞</span><p>REASONS TO RISE AGAIN</p></div><p className="legend-quote">“The flame fades.<br /><em>The journey remains.”</em></p></div>
      <div className="chronicle-strip" aria-label="Companion features"><span><Flame size={15} /> SAVE-BY-SAVE TRACKING</span><span><Swords size={15} /> BOSS STRATEGIES</span><span><Compass size={15} /> A PATH TO 100%</span><span><ShieldCheck size={15} /> YOUR SAVE, UNTOUCHED</span></div>
      <section id="discover" className="discovery-section">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: .3 }} variants={reveal} transition={{ duration: .7 }} className="discovery-heading">
          <div><p className="eyebrow">I / KNOW THE WORLD. DEFY YOUR FATE.</p><h2 className="section-title">Master the darkness.<br /><span>Write your own legend.</span></h2></div><p className="max-w-sm text-sm leading-7 text-ash-400">Хаашаа явах, юу цуглуулах, хэнийг ялах вэ?<br />Таны дараагийн алхам бүрт хэрэгтэй мэдээлэл.</p>
        </motion.div>
        <div className="feature-grid">{FEATURES.map((f, i) => (
          <RelicCard key={f.n} index={i} onClick={() => enter(f.href)} label={`Open ${f.name}${status === "ready" ? "" : " in demo mode"}`}>
            <div className="flex items-center justify-between"><f.icon size={25} strokeWidth={1.3} className="feature-icon" /><span className="font-display text-xs tracking-widest text-ash-500">{f.n} /</span></div>
            <p className="eyebrow mt-8 !text-[9px] !tracking-[.18em]">{f.en}</p><h3 className="mt-3 text-lg font-medium text-gold-200">{f.t}</h3><p className="mt-3 text-[13px] leading-6 text-ash-400">{f.d}</p><div className="feature-link"><span>{f.name}</span><ArrowUpRight size={17} /></div>
          </RelicCard>
        ))}</div>
      </section>
      <motion.div className="encounter-section" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: .15 }} transition={{ duration: 1 }}><BossSpotlight onExplore={() => enter("/bosses/artorias")} /></motion.div>
      <section id="journey" className="journey-section">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: .25 }} variants={reveal} transition={{ duration: .8 }} className="relative z-10">
          <p className="eyebrow">02 / YOUR NEXT CHAPTER</p><BonfireMark className="mx-auto my-8 h-24 w-16" /><h2 className="section-title">Don’t you dare<br /><span>go hollow.</span></h2><p className="mx-auto mt-5 max-w-md text-sm leading-7 text-ash-400">Хэдэн ч удаа үхсэн бай — гал хэзээ ч унтрахгүй.<br />Аяллаа үргэлжлүүл. Бид замыг тань санана.</p><button className="btn btn-ember mt-8 !px-7 !py-3.5" onClick={() => enter("/dashboard")}>Begin your journey <ArrowUpRight size={16} /></button>
        </motion.div><span className="journey-ring" aria-hidden="true" />
      </section>
      <footer className="landing-footer"><Link href="/" className="font-display text-xs tracking-[.22em] text-gold-400">LORDRAN TRACKER</Link><p>Fan-made & unofficial. DARK SOULS © Bandai Namco / FromSoftware.</p><a href="#main-content" className="flex items-center gap-2">BACK TO THE FLAME <ArrowUpRight size={13} /></a></footer>
    </main>
  );
}
