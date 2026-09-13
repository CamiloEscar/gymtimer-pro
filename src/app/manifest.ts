import type { MetadataRoute } from "next";

const ICON_SRC = "/images/display.png";

// ponytail: single 67KB source PNG reused at 192/512/maskable. Browsers
// scale; ideal would be 3 dedicated exports at exact sizes — when we want
// proper hi-DPI icons, drop a Sharp build step.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GymTimer Pro",
    short_name: "GymTimer",
    description: "Temporizador de entrenamientos para gimnasio, sin backend.",
    start_url: "/",
    display: "standalone",
    orientation: "landscape",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    categories: ["fitness", "health", "productivity"],
    icons: [
      { src: ICON_SRC, sizes: "192x192", type: "image/png" },
      { src: ICON_SRC, sizes: "512x512", type: "image/png" },
      {
        src: ICON_SRC,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
