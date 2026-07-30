import type { Metadata } from "next";
import "@fontsource-variable/archivo/wght.css";
import "@fontsource/dm-mono/400.css";
import "./globals.css";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { HydrationSignal } from "@/components/hydration-signal";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
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
  openGraph: {
    title: "Rumbo AU",
    description: "La espera, ordenada por la comunidad.",
    type: "website",
    locale: "es_CL",
    images: [
      {
        url: "/visuals/og-rumbo-au.webp",
        width: 1200,
        height: 630,
        alt: "Collage editorial de una ruta entre Chile y Australia",
      },
    ],
  },
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
