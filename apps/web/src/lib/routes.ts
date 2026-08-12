import type { Lang } from "@/lib/i18n";

/**
 * Єдине джерело правди про адреси мовних версій.
 *
 * Українська живе в корені (`/`, `/contact`), англійська — під префіксом
 * `/en`. Корінь навмисно лишено без префікса: він уже проіндексований, і
 * редирект `/` → `/uk` коштував би зайвого стрибка на найважливішій адресі.
 */

/** Сегмент URL для мови. Для української — порожній. */
export const LANG_PREFIX: Record<Lang, string> = { ua: "", en: "/en" };

/** Код мови за BCP 47 — для `hreflang`, `lang` і `og:locale`. */
export const LANG_TAG: Record<Lang, string> = { ua: "uk-UA", en: "en" };
export const HTML_LANG: Record<Lang, string> = { ua: "uk", en: "en" };
export const OG_LOCALE: Record<Lang, string> = { ua: "uk_UA", en: "en_GB" };

/** Шляхи без мовного префікса — базис і для роутів, і для sitemap. */
export const ROUTES = ["/", "/contact", "/offer", "/privacy"] as const;
export type Route = (typeof ROUTES)[number];

/**
 * Додає мовний префікс до внутрішнього шляху.
 * Підтримує і звичайні шляхи (`/contact`), і якорі (`/#contact`).
 */
export function localizeHref(lang: Lang, path: string) {
  const prefix = LANG_PREFIX[lang];
  if (!prefix) return path;

  if (path === "/") return prefix;
  // «/#contact» → «/en#contact»: інакше вийшло б «/en/#contact» із зайвим слешем.
  if (path.startsWith("/#")) return `${prefix}${path.slice(1)}`;
  return `${prefix}${path}`;
}

/** Прибирає мовний префікс — дає «канонічний» шлях без мови. */
export function stripLang(pathname: string): string {
  if (pathname === "/en") return "/";
  if (pathname.startsWith("/en/")) return pathname.slice(3);
  return pathname;
}

/** Адреса поточної сторінки іншою мовою — для перемикача. */
export function otherLangHref(target: Lang, pathname: string) {
  return localizeHref(target, stripLang(pathname));
}

/**
 * `alternates` для Metadata API: пара мов плюс `x-default`.
 * За рекомендацією Google x-default вказує на версію для користувачів,
 * чия мова не збігається з жодною наявною — тут це українська головна.
 */
export function alternatesFor(lang: Lang, path: Route) {
  const uk = localizeHref("ua", path) || "/";
  const en = localizeHref("en", path);

  return {
    // Канонікал завжди самореферентний: англійська сторінка вказує на себе,
    // інакше вона просто випала б з індексу на користь української.
    canonical: lang === "en" ? en : uk,
    languages: {
      uk,
      en,
      "x-default": uk,
    },
  };
}
