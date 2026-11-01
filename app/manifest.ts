import type { MetadataRoute } from "next";

// Android/Chrome home-screen label. iOS uses appleWebApp.title in app/layout.tsx.
// Keep both set to the brand so the label never picks up a page title.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NextGenAchievers",
    short_name: "NextGenAchievers",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
