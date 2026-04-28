import type { Metadata, Viewport } from "next";
import {
  Space_Grotesk,
  Inter,
  DM_Serif_Display,
  Anton,
  Archivo,
  Archivo_Narrow,
  Fraunces,
  DM_Mono,
} from "next/font/google";
import PWARegister from "@/components/PWARegister";
import "./globals.css";

// Legacy type stack — still used by un-migrated screens.
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
const dmSerifDisplay = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

// Culture blockprint type stack — used by .culture-surface and c-* utilities.
const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});
const archivo = Archivo({
  weight: ["400", "600", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});
const archivoNarrow = Archivo_Narrow({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-archivo-narrow",
  display: "swap",
});
const fraunces = Fraunces({
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});
const dmMono = DM_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://hubcity.4everforward.net"),
  title: {
    default: "Culture — Your City, Curated",
    template: "%s · Culture",
  },
  description:
    "The editorial field guide to your scene. Discover independents, events, creators, and the culture that moves your community.",
  // ── Default Open Graph + Twitter cards ─────────────────────
  // Platform-wide defaults that show up when a page doesn't generate
  // its own metadata. Per-entity pages (`/events/[id]`, `/business/
  // [id]`, etc.) override via `generateMetadata()` + the buildOg
  // helper. Any page without its own image falls through to
  // /api/og — a programmatic 1200x630 branded card — so shared
  // links never unfurl blank.
  openGraph: {
    type: "website",
    siteName: "Culture",
    locale: "en_US",
    url: "https://hubcity.4everforward.net",
    title: "Culture — Your City, Curated",
    description:
      "The editorial field guide to your scene. Discover independents, events, creators, and the culture that moves your community.",
    images: [
      {
        url: "/api/og?title=Culture&kicker=Your%20City%2C%20Curated",
        width: 1200,
        height: 630,
        alt: "Culture — Your City, Curated",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Culture — Your City, Curated",
    description:
      "Discover independents, events, creators, and the culture that moves your community.",
    images: ["/api/og?title=Culture&kicker=Your%20City%2C%20Curated"],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Culture",
  },
};

export const viewport: Viewport = {
  themeColor: "#EDE6D6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={[
        spaceGrotesk.variable,
        inter.variable,
        dmSerifDisplay.variable,
        anton.variable,
        archivo.variable,
        archivoNarrow.variable,
        fraunces.variable,
        dmMono.variable,
      ].join(" ")}
    >
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        {/* Preconnect to the third-party origins we hit on every
            page so the browser can finish DNS + TCP + TLS while
            React hydrates. Saves 100-300ms on first image / video
            depending on RTT. */}
        <link
          rel="preconnect"
          href="https://fahqtnwwikvocpvvfgqi.supabase.co"
          crossOrigin=""
        />
        <link
          rel="dns-prefetch"
          href="https://fahqtnwwikvocpvvfgqi.supabase.co"
        />
        <link rel="preconnect" href="https://image.mux.com" crossOrigin="" />
        <link rel="preconnect" href="https://stream.mux.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://image.mux.com" />
      </head>
      <body className="font-body antialiased">
        {children}
        <PWARegister />
      </body>
    </html>
  );
}
