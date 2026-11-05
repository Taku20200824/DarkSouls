import Image from "next/image";
import { Sigil } from "@/components/ui";
import type { Boss } from "@/lib/data/bosses";

/** Original fan illustration of a boss; dimmed until the boss is defeated. */
export function BossPortrait({ boss, defeated, sizes }: { boss: Boss; defeated: boolean; sizes: string }) {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-black">
      <Image
        src={`/artwork/bosses/${boss.id}.webp`}
        alt={`Fan illustration of ${boss.name}`}
        fill
        sizes={sizes}
        className={`object-cover ${defeated ? "" : "brightness-75 saturate-50"}`}
      />
      <div className="absolute bottom-2 left-2"><Sigil text={boss.sigil} defeated={defeated} size={40} /></div>
    </div>
  );
}
