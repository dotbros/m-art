import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Testy E2E budują do osobnego katalogu (.next-e2e), żeby nie nadpisać pamięci podręcznej `next dev`
  // (wspólny katalog powodował pętlę przeładowań strony: „HMR hash mismatch”).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // PGlite ładuje pliki .wasm/.data z node_modules — nie może być pakowany przez bundler.
  serverExternalPackages: ["@electric-sql/pglite", "ffmpeg-static"],
  // Tryb deweloperski: pozwala testować na telefonie w tej samej sieci Wi-Fi (np. http://192.168.1.96:3200).
  // Bez tego Next.js blokuje skrypty dla adresów innych niż localhost i przyciski na telefonie nie działają.
  // Dodatkowe adresy: zmienna DEV_ALLOWED_ORIGINS (oddzielone przecinkami). Nie wpływa na wersję produkcyjną.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.16.*.*", "*.local", ...(process.env.DEV_ALLOWED_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean) ?? [])],
  experimental: {
    // Upload zdjęć produktów (max 5 MB) przechodzi przez Server Actions.
    serverActions: { bodySizeLimit: "6mb" },
    // Trwała pamięć podręczna `next dev` (domyślnie włączona w Next 16) po zmianach kodu przy wyłączonym serwerze
    // robiła się nieaktualna → „HMR hash mismatch” → pętla przeładowań strony (zwłaszcza Safari na iPhonie).
    // Wyłączona: start serwera trwa kilka sekund dłużej, ale zawsze z aktualnym kodem.
    turbopackFileSystemCacheForDev: false,
  },
  poweredByHeader: false,
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    }];
  },
};

export default nextConfig;
