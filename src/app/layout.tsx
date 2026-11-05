import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TrackerProvider } from "@/components/TrackerProvider";
import { Shell } from "@/components/Shell";
import { Embers } from "@/components/Embers";

export const metadata: Metadata = {
  title: "LORDRAN TRACKER — Your Journey Through Lordran, Tracked.",
  description: "Dark Souls Remastered companion: Steam achievements, save-file progress, bosses, upgrades and a 100% guide.",
};
export const viewport: Viewport = { themeColor: "#07070a", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn">
      <body className="antialiased">
        <Embers />
        <TrackerProvider>
          <Shell>{children}</Shell>
        </TrackerProvider>
      </body>
    </html>
  );
}
