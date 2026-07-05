import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Eardle — Music Ear Training",
    short_name: "Eardle",
    description: "Train your musical ear with interactive exercises in note identification, intervals, chords, progressions, and scales.",
    start_url: "/",
    display: "standalone",
    background_color: "#030712",
    theme_color: "#4f46e5",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png" },
      { src: "/icon-512", sizes: "512x512", type: "image/png" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
