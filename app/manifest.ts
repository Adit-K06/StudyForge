import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "StudyForge - AI Study Planner",
    short_name: "StudyForge",
    description: "AI-driven curriculum ingestion, dynamic daily study planner, and active recall system.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#091712",
    theme_color: "#2d7658",
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
  };
}
