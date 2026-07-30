import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rumbo AU",
    short_name: "Rumbo AU",
    description:
      "Registro comunitario de postulaciones Working Holiday Australia desde Chile.",
    id: SITE_URL,
    start_url: SITE_URL,
    scope: `${SITE_URL}/`,
    display: "standalone",
    background_color: "#F2EBDD",
    theme_color: "#14323B",
    lang: "es-CL",
    orientation: "portrait-primary",
    icons: [
      {
        src: `${SITE_URL}/icons/android-chrome-192.png`,
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: `${SITE_URL}/icons/android-chrome-512.png`,
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: `${SITE_URL}/icons/maskable-icon-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
