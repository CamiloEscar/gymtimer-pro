import type { MetadataRoute } from "next";

// ponytail: dedicated exports at exact sizes, generated from src/app/icon.svg
// by the Sharp build step in scripts/generate-icons.mjs - rerun it after any
// logo tweak to refresh these assets.
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
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
