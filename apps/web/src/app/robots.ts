import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://avia.ovh";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Службовий JSON-ендпоїнт для health-check. Віддає 200 і без заборони
      // потрапляє в індекс як «тонка» сторінка без контенту й метаданих.
      disallow: ["/health"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
