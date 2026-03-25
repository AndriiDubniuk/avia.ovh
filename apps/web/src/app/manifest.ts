import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AVIA Digital",
    short_name: "AVIA",
    description: "Розробка сайтів, MVP, інтеграцій і кастомних вебпродуктів.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f3ea",
    theme_color: "#193728",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
