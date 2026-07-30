import type { Metadata, Viewport } from "next";
import "@fontsource-variable/archivo/wght.css";
import "@fontsource/dm-mono/400.css";
import "./globals.css";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { HydrationSignal } from "@/components/hydration-signal";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://rumboau.vercel.app",
  ),
  title: {
    default: "Rumbo AU · Estado comunitario de postulaciones",
    template: "%s · Rumbo AU",
  },
  description:
    "Tablero comunitario para ordenar fechas, estados, documentos declarados y consejos de postulaciones Working Holiday Australia.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
  applicationName: "Rumbo AU",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Rumbo AU",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  openGraph: {
    title: "Rumbo AU",
    description: "La espera, ordenada por la comunidad.",
    type: "website",
    locale: "es_CL",
    siteName: "Rumbo AU",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rumbo AU",
    description: "La espera, ordenada por la comunidad.",
  },
};

export const viewport: Viewport = {
  themeColor: "#14323B",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-CL" data-scroll-behavior="smooth">
      <body>
        <HydrationSignal />
        <a className="skip-link" href="#contenido">
          Saltar al contenido
        </a>
        <div className="site-shell">
          <SiteHeader />
          <main id="contenido" className="page-main">
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
