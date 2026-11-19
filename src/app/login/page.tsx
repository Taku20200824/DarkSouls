"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import clsx from "clsx";
import { DEFAULT_GAME, GAMES, gameById } from "@/lib/games";
import { BonfireMark } from "@/components/BonfireMark";
import { IS_DESKTOP_BUILD } from "@/lib/downloads";

const REASONS: Record<string, string> = {
  cancelled: "Steam нэвтрэлтийг цуцалсан.",
  state_mismatch: "Нэвтрэлтийн хүсэлт хүчингүй болсон (state). Дахин оролдоно уу.",
  invalid_signature: "Steam хариуг баталгаажуулж чадсангүй.",
  bad_return_to: "Нэвтрэлтийн холбоос хүчингүй байна. Дахин оролдоно уу.",
  cloud_unavailable: "Синкийн сервертэй холбогдож чадсангүй. Интернэт холболтоо шалгаад дахин оролдоно уу.",
  steam_unreachable: "Steam-тэй холбогдож чадсангүй. Дараа дахин оролдоно уу.",
  stale_nonce: "Нэвтрэлтийн хугацаа дууссан.",
  replayed_nonce: "Энэ нэвтрэлтийн хариу аль хэдийн ашиглагдсан.",
  store_unavailable: "Өгөгдлийн сан тохируулаагүй байна (Firebase).",
};

function readGame() {
  try {
    return gameById(window.localStorage.getItem("lt_game"))?.id ?? DEFAULT_GAME;
  } catch {
    return DEFAULT_GAME;
  }
}

/** Pick the game first; after Steam sign-in the tracker opens on it and checks ownership. */
function GamePicker() {
  const [game, setGame] = useState(DEFAULT_GAME);
  useEffect(() => setGame(readGame()), []);
  const pick = (id: string) => {
    setGame(id);
    try {
      window.localStorage.setItem("lt_game", id);
    } catch {
      /* storage unavailable: the default game opens */
    }
  };
  return (
    <fieldset className="mt-6 text-left">
      <legend className="font-display mb-2 text-micro uppercase tracking-eyebrow text-ember-300/90">1 · Тоглоомоо сонго</legend>
      <div className="grid grid-cols-2 gap-1.5">
        {GAMES.map((g) => (
          <button
            key={g.id}
            type="button"
            aria-pressed={game === g.id}
            onClick={() => pick(g.id)}
            className={clsx(
              "border px-2.5 py-2 text-left transition",
              game === g.id ? "border-ember-500/70 bg-ember-500/10" : "border-gold-600/20 bg-black/30 hover:border-gold-500/50",
            )}
          >
            <span className={clsx("font-display block text-label font-semibold tracking-caps", game === g.id ? "text-gold-200" : "text-gold-400")}>{g.short}</span>
            <span className="block text-micro text-ash-400">{g.tagline}</span>
            <span className="block text-micro text-ash-500">{g.year} · {g.tracker === "full" ? "Save + Steam" : "Steam"}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Inner() {
  const err = useSearchParams().get("error");
  return (
    <main id="main-content" className="relative z-10 flex min-h-screen items-center justify-center p-4">
      <div className="panel w-full max-w-md p-8 text-center">
        <BonfireMark className="mx-auto mb-4 h-24 w-16" />
        <h1 className="font-display shimmer-title text-3xl font-bold tracking-label">НЭВТРЭХ</h1>
        <div className="ornament my-4" />
        <p className="text-sm text-ash-400">Steam-ийн албан ёсны хуудсанд шилжиж нэвтэрнэ. Tracker таны нууц үгийг харахгүй. <a href="/privacy" className="text-ember-300 underline">Ямар өгөгдөл ашигладаг вэ?</a></p>
        {IS_DESKTOP_BUILD && <p className="mt-3 text-sm text-ash-400">Нэвтэрсний дараа App таны save ахицыг Firebase-д автоматаар хадгална. Ижил Steam бүртгэлээр вэб дээр ахицаа харна уу.</p>}
        {err && <p className="mt-4 rounded border border-blood-500/60 bg-blood-500/10 p-2 text-sm text-danger">{REASONS[err] ?? `Алдаа: ${err}`}</p>}
        <GamePicker />
        <p className="font-display mt-5 mb-2 text-left text-micro uppercase tracking-eyebrow text-ember-300/90">2 · Steam-ээр нэвтэр</p>
        <a href="/api/auth/steam/login" className="btn btn-ember w-full justify-center">Sign in through Steam</a>
        <p className="mt-3 text-label text-ash-500">Нэвтэрсний дараа таны Steam бүртгэлд байгаа тоглоомуудыг шалгаж (verify), дээд талын самбарт харуулна.</p>
        <p className="mt-4 text-label text-ash-500">Achievement-ийг харуулахын тулд Steam профайлын &ldquo;Game details&rdquo; нь Public байх шаардлагатай.</p>
      </div>
    </main>
  );
}
export default function Login() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
