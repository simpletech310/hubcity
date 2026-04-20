import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, DM_Serif_Display } from "next/font/google";
import PWARegister from "@/components/PWARegister";
import "./globals.css";

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

export const metadata: Metadata = {
  metadataBase: new URL("https://hubcity.4everforward.net"),
  title: {
    default: "Culture — Your City, Curated",
    template: "%s · Culture",
  },
  description:
    "The editorial field guide to your city. Discover local businesses, events, creators, and the culture that moves your neighborhood.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Culture",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
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
      className={`${spaceGrotesk.variable} ${inter.variable} ${dmSerifDisplay.variable}`}
    >
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="font-body antialiased">
        {children}
        <PWARegister />
      </body>
    </html>
  );
}
