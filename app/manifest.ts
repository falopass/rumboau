import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rumbo AU",
    short_name: "Rumbo AU",
    description:
      "Registro comunitario de postulaciones Working Holiday Australia desde Chile.",
    start_url: "/",
    display: "standalone",
    background_color: "#F2EBDD",
    theme_color: "#14323B",
    lang: "es-CL",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/android-chrome-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/android-chrome-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/maskable-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
