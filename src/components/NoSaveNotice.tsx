"use client";
import Link from "next/link";
import { useTracker } from "./TrackerProvider";
import { Empty } from "./ui";

/**
 * Windows app only: the app looked for DRAKS0005.sl2 on this computer and found none, so it
 * has nothing to track or send to the website. Without saying so, "connected — waiting for
 * the next save" reads as if everything worked.
 */
export function useSaveMissing(): boolean {
  const { state, demo } = useTracker();
  return !demo && state?.desktop === true && state.companion?.saveFound === false;
}

export const SAVE_MISSING_TITLE = "Энэ компьютерт save олдсонгүй";
export const SAVE_MISSING_TEXT =
  "Энэ компьютерийн Documents хавтсаас DARK SOULS: REMASTERED-ийн save (DRAKS0005.sl2) олдсонгүй, тиймээс App юу ч хянаж, вэб рүү илгээж чадахгүй. Тоглоом тоглодог компьютер дээрээ App-аа суулгаж, ижил Steam бүртгэлээр нэвтэрнэ үү.";

/** Empty state for tracker pages without character data. */
export function NoSaveData() {
  const missing = useSaveMissing();
  if (missing)
    return (
      <div role="status" className="panel border-warning-line/40 p-6 text-center">
        <h2 className="font-display text-lg text-warning">{SAVE_MISSING_TITLE}</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-ash-300">{SAVE_MISSING_TEXT}</p>
        <p className="mt-3 text-xs text-ash-500">Тоглоомыг нэг удаа хадгалсны дараа App автоматаар олно.</p>
      </div>
    );
  return (
    <Empty>
      Save өгөгдөл алга (<b>Waiting for save data</b>). <Link className="text-ember-300 underline" href="/characters">Save upload</Link> эсвэл <Link className="text-ember-300 underline" href="/settings">companion</Link> холбоно уу.
    </Empty>
  );
}
