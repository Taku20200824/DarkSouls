import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle, Panel } from "@/components/ui";
import { DESKTOP_DOWNLOAD_PATH, latestDesktopRelease } from "@/lib/downloads";

export const metadata: Metadata = {
  title: "Download & Code signing policy — LORDRAN TRACKER",
  description: "Download LORDRAN TRACKER for Windows, verify the installer, and read the project's code signing policy.",
};
export const revalidate = 300;

const REPO = "https://github.com/Taku20200824/DarkSouls";
const OWNER = { name: "Taku20200824", url: "https://github.com/Taku20200824" };

/**
 * Download page + code signing policy, written to the SignPath Foundation terms
 * (https://signpath.org/terms): attribution, team roles, privacy statement, uninstall
 * instructions. Keep "Code signing policy" linked from the home and download pages.
 */
export default async function CodeSigning() {
  const release = await latestDesktopRelease();
  const version = release.version || null;
  return (
    <>
      <PageTitle title="Download & Code signing policy" sub="LORDRAN TRACKER for Windows — Windows-д зориулсан хувилбарыг татах, шалгах, гарын үсгийн бодлого." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <Panel title="Download">
          <p className="text-sm text-ash-300">
            {version ? <>Latest version: <b className="text-gold-300">v{version}</b>. </> : null}
            Installer for Windows 10/11 (x64). The app checks GitHub Releases on launch and offers updates.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a className="btn btn-ember" href={DESKTOP_DOWNLOAD_PATH}>Download for Windows{version ? ` (v${version})` : ""}</a>
            <a className="btn" href={`${REPO}/releases`} target="_blank" rel="noreferrer">All releases on GitHub</a>
          </div>
          <p className="mt-3 text-xs text-ash-400">
            Verify a download: every release lists the SHA-256 of each file on its GitHub page, and <code>latest.yml</code> carries the SHA-512 the
            app checks before installing an update. In PowerShell: <code>Get-FileHash .\Lordran-Tracker-Setup-&lt;version&gt;.exe</code>.
          </p>
        </Panel>

        <Panel title="Code signing policy">
          <p className="text-sm text-ash-300">
            Windows releases are to be signed with free code signing provided by{" "}
            <a className="text-ember-300 underline" href="https://about.signpath.io" target="_blank" rel="noreferrer">SignPath.io</a>,{" "}
            certificate by{" "}
            <a className="text-ember-300 underline" href="https://signpath.org" target="_blank" rel="noreferrer">SignPath Foundation</a>.
          </p>
          <p className="mt-2 text-sm text-warning">
            Status: application to SignPath Foundation pending. Releases up to and including v0.1.12 are <b>not</b> code-signed, so Windows SmartScreen may
            warn on first run («More info» → «Run anyway»).
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ash-300">
            <li>Only binaries built from this project&apos;s own source are signed. Installers are built from a clean checkout by the GitHub Actions workflow <code>.github/workflows/build.yml</code>.</li>
            <li>Every signing request is approved manually by an approver listed below.</li>
            <li>Product name «Lordran Tracker» and the version are set in the installer and executable metadata on every build.</li>
          </ul>
        </Panel>

        <Panel title="Team roles">
          <ul className="space-y-1.5 text-sm text-ash-300">
            <li><b className="text-gold-300">Committers and reviewers:</b> <a className="text-ember-300 underline" href={OWNER.url} target="_blank" rel="noreferrer">{OWNER.name}</a></li>
            <li><b className="text-gold-300">Approvers:</b> <a className="text-ember-300 underline" href={OWNER.url} target="_blank" rel="noreferrer">{OWNER.name}</a></li>
          </ul>
          <p className="mt-2 text-xs text-ash-400">All team members use multi-factor authentication on GitHub. Changes from outside contributors are reviewed before they are merged.</p>
        </Panel>

        <Panel title="Privacy">
          <p className="text-sm text-ash-300">
            Full details: <Link className="text-ember-300 underline" href="/privacy">Privacy &amp; security</Link> (Нууцлал ба аюулгүй байдал). The Windows app connects to:
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-ash-300">
            <li><b className="text-gold-300">GitHub</b> — on launch, to check for a newer version (no personal data). <a className="text-ember-300 underline" href="https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noreferrer">GitHub privacy</a></li>
            <li><b className="text-gold-300">Steam</b> — only when you choose «Sign in through Steam» (Steam OpenID; your password is entered on steamcommunity.com, never in the app). <a className="text-ember-300 underline" href="https://store.steampowered.com/privacy_agreement/" target="_blank" rel="noreferrer">Steam privacy</a></li>
            <li><b className="text-gold-300">darksouls-five.vercel.app</b> (Vercel, Google Firebase) — only after you sign in: the parsed progress of that Steam account&apos;s save (never the .sl2 file) so the website can show it. Turn it off with «Холболт салгах» in Settings; delete stored data with «Өгөгдлөө устгах». <a className="text-ember-300 underline" href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer">Vercel privacy</a> · <a className="text-ember-300 underline" href="https://firebase.google.com/support/privacy" target="_blank" rel="noreferrer">Firebase privacy</a></li>
          </ul>
          <p className="mt-2 text-xs text-ash-400">No ads, analytics or trackers. Without signing in, the app sends nothing except the update check.</p>
        </Panel>

        <Panel title="Uninstall" className="lg:col-span-2">
          <p className="text-sm text-ash-300">
            Windows Settings → Apps → Installed apps → <b className="text-gold-300">Lordran Tracker</b> → Uninstall (or run «Uninstall Lordran Tracker.exe» in{" "}
            <code>%LOCALAPPDATA%\Programs\lordran-tracker-shell</code>). Local data in <code>%APPDATA%\lordran-tracker-shell</code> is kept so a reinstall
            keeps your progress; delete that folder to remove it. Data stored on the website is deleted from the website&apos;s Settings → «Өгөгдлөө устгах».
          </p>
          <p className="mt-2 text-xs text-ash-400">
            Source code: <a className="text-ember-300 underline" href={REPO} target="_blank" rel="noreferrer">{REPO.replace("https://", "")}</a> (MIT License). Unofficial fan project, not affiliated with Bandai Namco or FromSoftware.
          </p>
        </Panel>
      </div>
    </>
  );
}
