import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        // X-Content-Type-Options, X-Frame-Options, and Referrer-Policy are
        // already set upstream (nginx/Cloudflare) — confirmed via a live
        // response from eardle.com showing them duplicated, with
        // X-Frame-Options conflicting (DENY here vs. SAMEORIGIN upstream).
        // Only set what isn't already covered, to avoid re-introducing that.
        headers: [
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
