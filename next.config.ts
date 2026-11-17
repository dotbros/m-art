import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ładuje pliki .wasm/.data z node_modules — nie może być pakowany przez bundler.
  serverExternalPackages: ["@electric-sql/pglite"],
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
