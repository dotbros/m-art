import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ładuje pliki .wasm/.data z node_modules — nie może być pakowany przez bundler.
  serverExternalPackages: ["@electric-sql/pglite", "ffmpeg-static"],
  // Tryb deweloperski: pozwala testować na telefonie w tej samej sieci Wi-Fi (np. http://192.168.1.96:3200).
  // Bez tego Next.js blokuje skrypty dla adresów innych niż localhost i przyciski na telefonie nie działają.
  // Dodatkowe adresy: zmienna DEV_ALLOWED_ORIGINS (oddzielone przecinkami). Nie wpływa na wersję produkcyjną.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.16.*.*", "*.local", ...(process.env.DEV_ALLOWED_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean) ?? [])],
  experimental: {
    // Upload zdjęć produktów (max 5 MB) przechodzi przez Server Actions.
    serverActions: { bodySizeLimit: "6mb" },
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
