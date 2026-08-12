import type { Lang } from "@/lib/i18n";

/**
 * Те саме джерело правди про мовні адреси, що й на avia.ovh: українська
 * в корені, англійська під `/en`.
 *
 * Раніше billing тримав мову в `localStorage`. На SEO це не впливало —
 * увесь піддомен під `noindex`, — але давало дві різні архітектури
 * локалізації в одному репозиторії й одну практичну ваду: посилання на
 * оплату не можна було надіслати клієнту одразу потрібною мовою.
 */

export const LANG_PREFIX: Record<Lang, string> = { ua: "", en: "/en" };
export const HTML_LANG: Record<Lang, string> = { ua: "uk", en: "en" };

export function localizeHref(lang: Lang, path: string) {
  const prefix = LANG_PREFIX[lang];
  if (!prefix) return path;

  if (path === "/") return prefix;
  if (path.startsWith("/#")) return `${prefix}${path.slice(1)}`;
  return `${prefix}${path}`;
}

/** Прибирає мовний префікс — дає шлях без мови. */
export function stripLang(pathname: string): string {
  if (pathname === "/en") return "/";
  if (pathname.startsWith("/en/")) return pathname.slice(3);
  return pathname;
}

/** Адреса поточної сторінки іншою мовою — для перемикача. */
export function otherLangHref(target: Lang, pathname: string) {
  return localizeHref(target, stripLang(pathname));
}
