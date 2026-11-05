"use client";
import Link from "next/link";
import { motion } from "motion/react";
import { Compass, Flame, Hammer, Map as MapIcon, ScrollText, Swords } from "lucide-react";
import { useTracker } from "@/components/TrackerProvider";
import { BonfireMark } from "@/components/BonfireMark";

const FEATURES = [
  { n: "I", icon: Flame, t: "Steam нэвтрэлт", d: "Steam OpenID-ээр аюулгүй нэвтэрч, 41 achievement-ээ синк хийнэ." },
  { n: "II", icon: ScrollText, t: "Save файл уншигч", d: "DRAKS0005.sl2-ийг зөвхөн уншиж: түвшин, статистик, үхэл, bonfire, inventory." },
  { n: "III", icon: Compass, t: "Windows Companion", d: "Тоглоом save хийх бүрт таны аяллыг автоматаар илгээнэ." },
  { n: "IV", icon: MapIcon, t: "Lordran газрын зураг", d: "Бүсүүдийн бодит холболт, дараагийн бүс рүү хөдөлгөөнт маршрут." },
  { n: "V", icon: Swords, t: "Boss & 100% хөтөч", d: "Boss бүрийн стратеги, сүүл тасдах анхааруулга, дараагийн зорилт." },
  { n: "VI", icon: Hammer, t: "Зэвсэг сайжруулах", d: "Баталгаажсан жороор материал, ember, дарханг тооцоолно." },
];

/** Original silhouette of a distant gothic citadel. */
function Citadel() {
  return (
    <svg viewBox="0 0 1440 320" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 bottom-0 h-[42vh] w-full" aria-hidden>
      <defs>
        <linearGradient id="cit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2430" />
          <stop offset="1" stopColor="#050506" />
        </linearGradient>
        <linearGradient id="cit2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0e0d10" />
          <stop offset="1" stopColor="#050506" />
        </linearGradient>
      </defs>
      <path fill="url(#cit)" opacity="0.95" d="M0 260 L120 250 L160 200 L175 200 L180 150 L186 120 L192 150 L198 200 L240 205 L300 230 L380 220 L420 170 L432 170 L436 110 L444 60 L452 110 L456 170 L470 170 L500 210 L560 200 L600 150 L608 150 L612 90 L620 40 L628 90 L632 150 L640 150 L660 120 L668 120 L672 70 L680 20 L688 70 L692 120 L700 120 L720 150 L760 160 L790 120 L796 120 L800 80 L806 50 L812 80 L816 120 L822 120 L860 180 L940 190 L980 160 L986 160 L990 120 L996 95 L1002 120 L1006 160 L1040 200 L1120 210 L1180 230 L1260 220 L1320 240 L1440 245 L1440 320 L0 320Z" />
      <path fill="url(#cit2)" d="M0 290 L200 280 L320 290 L460 270 L620 285 L760 272 L900 288 L1060 276 L1220 290 L1440 280 L1440 320 L0 320Z" />
    </svg>
  );
}

export default function Landing() {
  const { status, setDemo } = useTracker();
  return (
    <div className="relative z-10 min-h-screen overflow-hidden">
      <section className="relative flex min-h-screen flex-col items-center justify-center px-4 pb-24 text-center">
        <div className="pointer-events-none absolute left-1/2 top-[38%] h-[70vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(242,106,27,0.28)_0%,rgba(242,106,27,0.06)_40%,transparent_70%)] glow-pulse" />
        <Citadel />
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 2.2, ease: "easeOut" }} className="relative">
          <BonfireMark className="mx-auto h-40 w-28 md:h-52 md:w-36" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, letterSpacing: "0.6em", filter: "blur(8px)" }}
          animate={{ opacity: 1, letterSpacing: "0.22em", filter: "blur(0px)" }}
          transition={{ duration: 2.4, delay: 0.4, ease: "easeOut" }}
          className="font-display shimmer-title relative mt-6 text-[2.6rem] font-bold leading-none sm:text-6xl md:text-8xl"
        >
          LORDRAN
        </motion.h1>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4, duration: 1.4 }} className="relative mt-3 flex items-center gap-4">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-gold-400 md:w-24" />
          <span className="font-display text-sm font-semibold tracking-[0.8em] text-gold-400 md:text-lg">TRACKER</span>
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-gold-400 md:w-24" />
        </motion.div>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.9, duration: 1.2 }} className="font-serif relative mt-8 text-xl italic text-ash-300 md:text-2xl">
          Your Journey Through Lordran, Tracked.
        </motion.p>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.3, duration: 1.2 }} className="relative mx-auto mt-4 max-w-xl text-sm leading-relaxed text-ash-400">
          Steam achievement болон save файлаас таны аяллыг найдвартай хянана. Мэдэгдэхгүй утгыг хэзээ ч зохиохгүй — бүх тоо эх сурвалжтай.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.7, duration: 1 }} className="relative mt-10 flex flex-wrap justify-center gap-4">
          {status === "ready" ? (
            <Link className="btn btn-ember !px-8 !py-3.5 !text-sm" href="/dashboard">Аяллаа үргэлжлүүлэх</Link>
          ) : (
            <a className="btn btn-ember !px-8 !py-3.5 !text-sm" href="/api/auth/steam/login">Sign in through Steam</a>
          )}
          <button className="btn !px-8 !py-3.5 !text-sm" onClick={() => { setDemo(true); window.location.href = "/dashboard"; }}>Demo Mode</button>
        </motion.div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.2 }} className="relative mt-4 text-[11px] text-ash-500">
          Steam-ийн нууц үгийг бид хэзээ ч асуухгүй — нэвтрэлт steamcommunity.com дээр явагдана.
        </motion.p>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ delay: 4, duration: 2.6, repeat: Infinity }} className="font-display absolute bottom-8 text-[10px] tracking-[0.5em] text-ash-500">
          ▼ SCROLL
        </motion.div>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 py-24">
        <div className="mb-14 text-center">
          <h2 className="font-display gold-text text-3xl font-bold tracking-[0.2em] md:text-4xl">THE PATH OF THE UNDEAD</h2>
          <div className="ornament mx-auto mt-5 max-w-md" />
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div key={f.n} className="panel panel-hover group p-7" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ delay: (i % 3) * 0.12, duration: 0.7 }}>
              <div className="flex items-center justify-between">
                <f.icon className="h-7 w-7 text-gold-500 transition group-hover:text-ember-300 group-hover:drop-shadow-[0_0_10px_#ff9142]" strokeWidth={1.3} />
                <span className="font-display text-3xl font-bold text-gold-600/40 transition group-hover:text-gold-500/70">{f.n}</span>
              </div>
              <h3 className="font-display mt-6 text-lg font-semibold tracking-[0.08em] text-gold-200">{f.t}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ash-400">{f.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-4xl px-4 pb-28 text-center">
        <p className="font-serif text-2xl italic leading-relaxed text-ash-300 md:text-3xl">&ldquo;Хэдэн ч удаа үхсэн бай — гал хэзээ ч унтрахгүй.&rdquo;</p>
        <div className="ornament mx-auto mt-10 max-w-xs" />
      </section>

      <footer className="relative pb-10 text-center text-[11px] text-ash-500">
        Fan-made, unofficial. DARK SOULS is a trademark of Bandai Namco / FromSoftware. Энэ сайт тэдэнтэй холбоогүй.
      </footer>
    </div>
  );
}
