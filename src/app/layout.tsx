import type { Metadata, Viewport } from "next";
import "@fontsource/cinzel/500.css";
import "@fontsource/cinzel/600.css";
import "@fontsource/cinzel/700.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/700.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import "@fontsource/noto-sans/400.css";
import "@fontsource/noto-sans/500.css";
import "@fontsource/noto-sans/600.css";
import "./globals.css";
import { TrackerProvider } from "@/components/TrackerProvider";
import { Shell } from "@/components/Shell";
import { Embers } from "@/components/Embers";
import { MotionProvider } from "@/components/MotionProvider";

export const metadata: Metadata = {
  title: "LORDRAN TRACKER — Your Journey Through Lordran, Tracked.",
  description: "Dark Souls Remastered companion: Steam achievements, save-file progress, bosses, upgrades and a 100% guide.",
};
export const viewport: Viewport = { themeColor: "#07070a", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn">
      <body className="antialiased">
        <a href="#main-content" className="skip-link">Skip to content</a>
        <MotionProvider>
          <Embers />
          <TrackerProvider>
            <Shell>{children}</Shell>
          </TrackerProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
