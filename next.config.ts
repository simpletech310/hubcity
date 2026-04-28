import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Build-time perf ─────────────────────────────────────────
  // Compress responses on the Node server (Vercel handles this at
  // the edge anyway, but harmless on self-host).
  compress: true,
  // Strip all `console.*` calls from the production bundle except
  // errors + warnings — saves bytes + avoids leaking info.
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  // ── Runtime image-optimization config ───────────────────────
  // Re-enabled after the Vercel Pro upgrade. Free tier was 402-ing
  // /_next/image because of quota; Pro lifts the cap to 10k source
  // images / month with reasonable overage pricing. We get back:
  //  • avif/webp conversion (often 60-80% smaller than source JPGs)
  //  • srcset responsive sizing — phones request 384/640px instead
  //    of pulling the 1697px source for every tile
  //  • year-long edge cache so repeat hits don't re-bill
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31_536_000, // 1 year
    // Phone-first device sizes — slimmer than the Next default
    // (which goes up to 3840px). We rarely render images larger
    // than ~1200px outside hero art.
    deviceSizes: [320, 420, 640, 750, 828, 1080, 1200, 1600],
    imageSizes: [64, 96, 128, 200, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "image.mux.com",
      },
      {
        protocol: "https",
        hostname: "stream.mux.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "media.giphy.com",
      },
      {
        protocol: "https",
        hostname: "media0.giphy.com",
      },
      {
        protocol: "https",
        hostname: "media1.giphy.com",
      },
      {
        protocol: "https",
        hostname: "media2.giphy.com",
      },
      {
        protocol: "https",
        hostname: "media3.giphy.com",
      },
      {
        protocol: "https",
        hostname: "media4.giphy.com",
      },
      {
        protocol: "https",
        hostname: "i.giphy.com",
      },
      // Apple CDN — used for real album / podcast / movie / TV show
      // cover art fetched from the iTunes Search API. Hosts span
      // is1-ssl through is5-ssl across regions.
      {
        protocol: "https",
        hostname: "is1-ssl.mzstatic.com",
      },
      {
        protocol: "https",
        hostname: "is2-ssl.mzstatic.com",
      },
      {
        protocol: "https",
        hostname: "is3-ssl.mzstatic.com",
      },
      {
        protocol: "https",
        hostname: "is4-ssl.mzstatic.com",
      },
      {
        protocol: "https",
        hostname: "is5-ssl.mzstatic.com",
      },
      {
        protocol: "https",
        hostname: "a1.mzstatic.com",
      },
      {
        protocol: "https",
        hostname: "a2.mzstatic.com",
      },
      {
        protocol: "https",
        hostname: "a3.mzstatic.com",
      },
      {
        protocol: "https",
        hostname: "a4.mzstatic.com",
      },
      {
        protocol: "https",
        hostname: "a5.mzstatic.com",
      },
      // DiceBear — generates SVG initial-blob avatars, used as a
      // deterministic fallback for channels without an owner photo.
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
    ],
  },
};

export default nextConfig;
