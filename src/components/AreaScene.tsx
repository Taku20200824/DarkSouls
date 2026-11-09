import Image from "next/image";

const HAS_ART = new Set(["firelink-shrine", "undead-burg", "blighttown", "anor-londo", "sens-fortress", "darkroot-garden"]);

/** Original atmospheric scene illustration for an area; omitted where no art exists yet. */
export function AreaScene({ areaId, name }: { areaId: string; name: string }) {
  if (!HAS_ART.has(areaId)) return null;
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-black">
      <Image src={`/artwork/areas/${areaId}.webp`} alt={`Atmospheric illustration of ${name}`} fill sizes="(min-width: 1024px) 380px, 100vw" className="object-cover" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
    </div>
  );
}
