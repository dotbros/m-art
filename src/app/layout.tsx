import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource/cormorant/400.css";
import "@fontsource/cormorant/500.css";
import "@fontsource/cormorant/400-italic.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/italianno/400.css";
import "./globals.css";
import "./luxe.css"; // złote przyciski i nagłówki (nadpisuje styl wzoru)

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "M.art — Z natury wyjątkowa | Pracownia Biżuterii",
  description: "Ręcznie tworzona biżuteria z naturalnych kamieni i pereł. Odkryj subtelne naszyjniki, kolczyki, bransoletki i pierścionki M.art. Małe dzieła, wielkie emocje.",
  openGraph: { title: "M.art — Z natury wyjątkowa", description: "Biżuteria z naturalnych kamieni. Ręcznie tworzona z miłości do detalu.", locale: "pl_PL", type: "website" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fbf9f5",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="pl"><body>{children}</body></html>;
}
