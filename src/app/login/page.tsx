"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { BonfireMark } from "@/components/BonfireMark";

const REASONS: Record<string, string> = {
  cancelled: "Steam нэвтрэлтийг цуцалсан.",
  state_mismatch: "Нэвтрэлтийн хүсэлт хүчингүй болсон (state). Дахин оролдоно уу.",
  invalid_signature: "Steam хариуг баталгаажуулж чадсангүй.",
  steam_unreachable: "Steam-тэй холбогдож чадсангүй. Дараа дахин оролдоно уу.",
  stale_nonce: "Нэвтрэлтийн хугацаа дууссан.",
  replayed_nonce: "Энэ нэвтрэлтийн хариу аль хэдийн ашиглагдсан.",
  store_unavailable: "Өгөгдлийн сан тохируулаагүй байна (Firebase).",
};

function Inner() {
  const err = useSearchParams().get("error");
  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
      <div className="panel w-full max-w-md p-8 text-center">
        <BonfireMark className="mx-auto mb-4 h-24 w-16" />
        <h1 className="font-display shimmer-title text-3xl font-bold tracking-[0.2em]">НЭВТРЭХ</h1>
        <div className="ornament my-4" />
        <p className="text-sm text-ash-400">Steam-ийн албан ёсны хуудсанд шилжиж нэвтэрнэ. Энэ сайт таны нууц үгийг хэзээ ч харахгүй. Зөвхөн SteamID64, нэр, avatar-ыг хадгална.</p>
        {err && <p className="mt-4 rounded border border-blood-500/60 bg-blood-500/10 p-2 text-sm text-red-300">{REASONS[err] ?? `Алдаа: ${err}`}</p>}
        <a href="/api/auth/steam/login" className="btn btn-ember mt-6">Sign in through Steam</a>
        <p className="mt-4 text-[11px] text-ash-500">Achievement-ийг харуулахын тулд Steam профайлын &ldquo;Game details&rdquo; нь Public байх шаардлагатай.</p>
      </div>
    </div>
  );
}
export default function Login() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
