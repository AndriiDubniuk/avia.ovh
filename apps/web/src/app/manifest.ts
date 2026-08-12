import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AVIA Digital",
    short_name: "AVIA",
    description: "Цифрові продукти: сайти, вебсервіси, MVP, кабінети, інтеграції.",
    start_url: "/",
    display: "standalone",
    background_color: "#04050A",
    theme_color: "#04050A",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
