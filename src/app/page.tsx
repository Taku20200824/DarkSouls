"use client";
import Link from "next/link";
import { motion } from "motion/react";
import { useTracker } from "@/components/TrackerProvider";

const FEATURES = [
  ["Steam нэвтрэлт", "Steam OpenID-ээр аюулгүй нэвтэрч, 41 achievement-ээ синк хийнэ."],
  ["Save файл уншигч", "DRAKS0005.sl2-ийг зөвхөн уншиж, түвшин, статистик, үхэл, bonfire, inventory-г гаргана."],
  ["Windows Companion", "Тоглоом save хийх бүрт таны явцыг автоматаар илгээнэ."],
  ["Lordran газрын зураг", "Бүсүүдийн бодит холболт, маршрутын хөдөлгөөнт анимэйшн."],
  ["Boss & 100% хөтөч", "Boss бүрийн стратеги, сүүл тасдах анхааруулга, дараагийн зорилт."],
  ["Зэвсэг сайжруулах", "Баталгаажсан жороор материал, ember, дархныг тооцоолно."],
];

export default function Landing() {
  const { status, setDemo } = useTracker();
  return (
    <div className="relative z-10 min-h-screen">
      <section className="flex min-h-[86vh] flex-col items-center justify-center px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.6 }}>
          <svg viewBox="0 0 120 160" className="bonfire-flicker mx-auto mb-6 h-28 w-24" aria-hidden>
            <path d="M60 10 C70 40 95 55 85 95 C80 115 65 125 60 125 C55 125 40 115 35 95 C25 55 50 40 60 10Z" fill="url(#fl)" />
            <path d="M58 40 L62 40 L64 150 L56 150Z" fill="#6b675f" />
            <path d="M20 150 L100 150 L90 140 L30 140Z" fill="#2a2830" />
            <defs>
              <linearGradient id="fl" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#c2470e" />
                <stop offset="60%" stopColor="#ff8a3d" />
                <stop offset="100%" stopColor="#ffe2b0" />
              </linearGradient>
            </defs>
          </svg>
          <h1 className="font-display gold-text text-5xl font-bold tracking-[0.25em] md:text-7xl">LORDRAN TRACKER</h1>
          <p className="font-display mt-4 text-lg tracking-[0.3em] text-ash-300 md:text-xl">Your Journey Through Lordran, Tracked.</p>
          <p className="mx-auto mt-6 max-w-2xl text-sm text-ash-400">
            Dark Souls Remastered-ийн таны аяллыг Steam achievement болон save файлаас найдвартай түвшинд хянана. Мэдэгдэхгүй утгыг хэзээ ч зохиохгүй — бүх тоо эх сурвалжтай.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {status === "ready" ? (
              <Link className="btn btn-ember" href="/dashboard">Аяллаа үргэлжлүүлэх</Link>
            ) : (
              <a className="btn btn-ember" href="/api/auth/steam/login">Sign in through Steam</a>
            )}
            <button className="btn" onClick={() => { setDemo(true); window.location.href = "/dashboard"; }}>Demo Mode</button>
          </div>
          <p className="mt-3 text-[11px] text-ash-500">Steam-ийн нууц үгийг бид хэзээ ч асуухгүй — нэвтрэлт steamcommunity.com дээр явагдана.</p>
        </motion.div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-20 md:grid-cols-3">
        {FEATURES.map(([t, d], i) => (
          <motion.div key={t} className="panel p-5" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
            <h3 className="font-display text-xl text-gold-300">{t}</h3>
            <p className="mt-2 text-sm text-ash-400">{d}</p>
          </motion.div>
        ))}
      </section>
      <footer className="pb-8 text-center text-[11px] text-ash-500">
        Fan-made, unofficial. DARK SOULS is a trademark of Bandai Namco / FromSoftware. Энэ сайт тэдэнтэй холбоогүй.
      </footer>
    </div>
  );
}
