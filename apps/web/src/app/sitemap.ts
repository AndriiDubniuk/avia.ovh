import type { MetadataRoute } from "next";

import { LANGS } from "@/lib/i18n";
import { localizeHref, ROUTES } from "@/lib/routes";

/** Пріоритет за типом сторінки — головна вище, юридичні нижче. */
const PRIORITY: Record<string, number> = {
  "/": 1,
  // Посадкові сторінки послуг — головні точки входу з пошуку після головної.
  "/services": 0.8,
  "/services/landing": 0.9,
  "/services/corporate-site": 0.9,
  "/services/mvp": 0.9,
  "/services/integrations": 0.9,
  "/rozrobka-sajtiv": 0.9,
  "/blog": 0.6,
  "/blog/skilky-koshtuye-rozrobka-mvp": 0.7,
  "/blog/lending-chy-sajt-kompanii": 0.7,
  "/blog/skilky-koshtuye-rozrobka-sajtu": 0.7,
  "/blog/shcho-take-mvp": 0.7,
  "/contact": 0.8,
  "/offer": 0.6,
  "/privacy": 0.6,
};

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://avia.ovh";

  /**
   * Дата фіксується один раз при збірці, а не на кожен запит. З `new Date()`
   * у рантаймі кожне звернення робота показувало `lastmod = зараз`: Google
   * бачить, що дата не корелює зі змінами, і перестає їй довіряти.
   */
  const lastModified = new Date(
    process.env.NEXT_PUBLIC_BUILD_TIME ?? "2026-08-05T00:00:00.000Z",
  );

  const abs = (lang: (typeof LANGS)[number], path: (typeof ROUTES)[number]) =>
    `${siteUrl}${localizeHref(lang, path)}`.replace(/\/$/, "");

  return ROUTES.flatMap((path) =>
    LANGS.map((lang) => ({
      url: abs(lang, path),
      lastModified,
      changeFrequency: (path === "/" ? "weekly" : "monthly") as
        | "weekly"
        | "monthly",
      priority: PRIORITY[path] ?? 0.5,
      /**
       * `alternates.languages` віддає для кожного URL повний набір
       * hreflang просто в sitemap — Google рекомендує дублювати їх тут,
       * бо так зв'язок мовних версій видно навіть без сканування <head>.
       */
      alternates: {
        languages: {
          uk: abs("ua", path),
          en: abs("en", path),
          "x-default": abs("ua", path),
        },
      },
    })),
  );
}
