import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle, Panel } from "@/components/ui";

export const metadata: Metadata = {
  title: "Нууцлал ба аюулгүй байдал — LORDRAN TRACKER",
  description: "LORDRAN TRACKER ямар өгөгдөл цуглуулж, хаана хадгалж, юуг огт цуглуулдаггүй тухай.",
};

const REPO = "https://github.com/Taku20200824/DarkSouls";

/**
 * Public privacy & security page. Every statement here is backed by the code — keep it in
 * sync when what we store changes:
 *  - Steam OpenID login: src/lib/steam/openid.ts, src/app/api/auth/steam/*
 *  - Stored profile fields: src/lib/server/steam-profile.ts
 *  - Synced save fields: src/lib/save/schema.ts (CharacterSchema)
 *  - Firestore paths: src/lib/server/progress.ts, src/app/api/state/route.ts
 *  - Session cookie: src/lib/server/session.ts (30 days, HttpOnly, Secure)
 *  - Security headers: next.config.ts
 */
export default function Privacy() {
  return (
    <>
      <PageTitle title="Нууцлал ба аюулгүй байдал" sub="Энэ сайт ямар өгөгдөл ашигладаг, хаана хадгалдаг, юуг огт авдаггүйг энд товч бичив." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <Panel title="Товчхондоо">
          <ul className="list-disc space-y-2 pl-5 text-sm text-ash-300">
            <li>Таны <b className="text-gold-300">Steam нууц үгийг хэзээ ч хүлээж авахгүй</b> — нэвтрэлт Steam-ийн өөрийн хуудсанд явагдана.</li>
            <li>Цуглуулдаг зүйл нь Steam-ийн <b className="text-gold-300">нийтэд харагдах профайл</b> болон <b className="text-gold-300">тоглоомын ахиц</b> л.</li>
            <li>Зар сурталчилгаа, analytics, tracker огт байхгүй. Өгөгдлийг гуравдагч этгээдэд зарахгүй, дамжуулахгүй.</li>
            <li>Save файл (.sl2) таны компьютероос гарахгүй — зөвхөн задалсан ахицын утгууд илгээгдэнэ.</li>
            <li>Эх код бүхэлдээ нээлттэй: <a className="text-ember-300 underline" href={REPO} target="_blank" rel="noreferrer">GitHub</a>.</li>
          </ul>
        </Panel>

        <Panel title="Steam-ээр нэвтрэх">
          <p className="text-sm text-ash-300">
            «Sign in through Steam» дарахад та <b className="text-gold-300">steamcommunity.com</b> (Steam-ийн албан ёсны хуудас) руу шилжиж, нууц үгээ тэнд оруулна. Steam зөвхөн
            «энэ хэрэглэгч хэн бэ» (SteamID)-г буцаана. Сайт тэр хариуг Steam-ээс шууд дахин асууж (OpenID <code>check_authentication</code>) жинхэнэ эсэхийг шалгана.
          </p>
          <p className="mt-2 text-sm text-ash-400">
            Нэвтэрсний дараа зөвхөн нэвтрэлтийг санах cookie хадгалагдана: 30 хоног хүчинтэй, JavaScript-ээс уншигдахгүй (<code>HttpOnly</code>), зөвхөн HTTPS-ээр илгээгдэнэ (<code>Secure</code>).
          </p>
        </Panel>

        <Panel title="Цуглуулдаг өгөгдөл" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-micro uppercase tracking-caps text-ash-500">
                <tr><th className="py-2 pr-4">Юу</th><th className="py-2 pr-4">Хаанаас</th><th className="py-2">Юунд</th></tr>
              </thead>
              <tbody className="divide-y divide-gold-600/10 text-ash-300">
                <tr><td className="py-2 pr-4">SteamID, нэр, профайл зураг, профайлын холбоос</td><td className="py-2 pr-4">Steam Web API (нийтэд харагдах мэдээлэл)</td><td className="py-2">Таныг таньж, нүүрэн дээр харуулах</td></tr>
                <tr><td className="py-2 pr-4">Dark Souls-ийн тоглосон хугацаа, тоглоом эзэмшдэг эсэх</td><td className="py-2 pr-4">Steam Web API</td><td className="py-2">Хянах самбарт харуулах</td></tr>
                <tr><td className="py-2 pr-4">Steam achievement-ийн жагсаалт</td><td className="py-2 pr-4">Steam Web API</td><td className="py-2">100% хөтөч, achievement хуудас</td></tr>
                <tr><td className="py-2 pr-4">Тоглоомын ахиц: дүрийн нэр, анги, түвшин, stat, souls, үхлийн тоо, тоглосон хугацаа, bonfire, ялсан boss, эд зүйлс</td><td className="py-2 pr-4">Windows App эсвэл хөтөч дээр задалсан save</td><td className="py-2">Ахиц, boss, үхлийн статистик</td></tr>
                <tr><td className="py-2 pr-4">Гараар тэмдэглэсэн boss / achievement / quest</td><td className="py-2 pr-4">Таны өөрийн оруулсан</td><td className="py-2">Save-д байхгүй мэдээллийг нөхөх</td></tr>
                <tr><td className="py-2 pr-4">Companion төхөөрөмжийн нэр, хувилбар, сүүлийн синкийн цаг</td><td className="py-2 pr-4">Windows App / Companion</td><td className="py-2">Синкийн төлөвийг харуулах</td></tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-ash-400">Хадгалах газар: Google Firebase (Firestore), таны SteamID-ийн доор. Firebase-ийн удирдах түлхүүр зөвхөн сервер талд байдаг; хөтөч болон App түүнийг агуулдаггүй.</p>
        </Panel>

        <Panel title="Огт цуглуулдаггүй">
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-ash-300">
            <li>Steam-ийн нууц үг, Steam Guard код</li>
            <li>И-мэйл, утас, бодит нэр, хаяг</li>
            <li>Төлбөрийн мэдээлэл</li>
            <li>Байршил, камер, микрофон (хөтчийн тохиргоогоор хаалттай)</li>
            <li>Save файлын (.sl2) эх файл</li>
            <li>Зар сурталчилгааны / analytics-ийн cookie, tracker</li>
          </ul>
        </Panel>

        <Panel title="Save файл ба Windows App">
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-ash-300">
            <li>Save файлыг <b className="text-gold-300">зөвхөн уншина</b> — хэзээ ч өөрчлөхгүй, бичихгүй.</li>
            <li>Хөтөч дээр save upload хийхэд файл таны хөтөч дотор задлагдаж, зөвхөн ахицын утгууд илгээгдэнэ.</li>
            <li>Windows App нь нэвтэрсэн Steam бүртгэлийн save-ийг ~10 секунд тутам шалгаж, өөрчлөгдсөн бол задалсан ахицыг л илгээнэ. Өөр бүртгэлийн save илгээгдэхгүй.</li>
            <li>App-ийн локал өгөгдөл: <code>%APPDATA%\lordran-tracker-shell</code>.</li>
          </ul>
        </Panel>

        <Panel title="Windows App (.exe)-ийн тухай">
          <p className="text-sm text-ash-300">
            Installer нь <b className="text-gold-300">дижитал гарын үсэггүй</b> (code signing certificate нь жилд төлбөртэй). Тиймээс анх ажиллуулахад Windows «Windows protected your PC» гэж анхааруулна —
            энэ нь «нийтлэгч тодорхойгүй» гэсэн утгатай бөгөөд хортой гэсэн үг биш. «More info» → «Run anyway».
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-ash-400">
            <li>Installer-ийг зөвхөн <a className="text-ember-300 underline" href={`${REPO}/releases`} target="_blank" rel="noreferrer">GitHub Releases</a>-ээс түгээдэг.</li>
            <li>Release бүрийн <code>latest.yml</code> дотор SHA-512 hash байдаг; App шинэчлэлт татахдаа үүнийг шалгаж, таарахгүй бол суулгахгүй.</li>
            <li>Хүсвэл файлыг <a className="text-ember-300 underline" href="https://www.virustotal.com/" target="_blank" rel="noreferrer">VirusTotal</a>-д өөрөө шалгуулж болно.</li>
          </ul>
        </Panel>

        <Panel title="Сайтын хамгаалалт">
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-ash-300">
            <li>Бүх холболт HTTPS (HSTS идэвхтэй).</li>
            <li>Өөр сайт энэ сайтыг frame-д оруулж чадахгүй (<code>X-Frame-Options: DENY</code>).</li>
            <li>Хэрэглэгч бүр зөвхөн өөрийн SteamID-ийн өгөгдлийг харна; API бүр нэвтрэлт шалгана.</li>
            <li>Vercel дээр байрладаг; Vercel Web Analytics идэвхгүй.</li>
          </ul>
        </Panel>

        <Panel title="Өгөгдлөө удирдах">
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-ash-300">
            <li><b className="text-gold-300">Гарах</b>: нэвтрэлтийн cookie устна.</li>
            <li><b className="text-gold-300">Синкийг зогсоох</b>: Windows App → Settings → «Холболт салгах», эсвэл вэбийн Settings → «Бүх companion-ий эрхийг цуцлах».</li>
            <li>
              <b className="text-gold-300">Хадгалсан өгөгдлөө бүрэн устгуулах</b>: одоогоор өөрөө устгах товч байхгүй.{" "}
              <a className="text-ember-300 underline" href={`${REPO}/issues/new`} target="_blank" rel="noreferrer">GitHub Issue</a>-ээр хүсэлт илгээнэ үү (SteamID-гаа бичнэ; нууц үг бүү бич).
            </li>
          </ul>
        </Panel>
      </div>

      <p className="mt-6 text-center text-xs text-ash-500">
        Фэнүүдийн хийсэн албан бус төсөл. DARK SOULS © Bandai Namco / FromSoftware. ·{" "}
        <Link href="/" className="underline hover:text-ember-300">Нүүр хуудас</Link>
      </p>
    </>
  );
}
