import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Vercel's free-tier image-optimization quota is finite, and at
    // demo scale (~thousands of seeded posts/events/business covers)
    // we've been blowing through it — `/_next/image` starts returning
    // HTTP 402 OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED, which renders
    // every <Image> as a broken thumbnail. Bypassing optimization
    // ships the source URLs straight through. We trade webp/avif +
    // responsive resizing for actually-rendering images, which is the
    // right call until the project is on a paid Vercel tier.
    unoptimized: true,
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
