"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useMemo, type ReactNode } from "react";

import { DICT, type Dict, type Lang } from "@/lib/i18n";
import { localizeHref, otherLangHref } from "@/lib/routes";

/* ---- мова приходить із сервера, з сегмента URL ----
 *
 * Раніше вона жила в localStorage: сервер завжди віддавав українську, а
 * клієнт після гідрації перемальовував інтерфейс. Для пошуку англійської
 * версії просто не існувало — вона не мала власної адреси. Тепер мову
 * визначає URL (`/` — українська, `/en` — англійська), тому розмітка
 * приходить уже потрібною мовою і не потребує клієнтського перемальовування.
 */

type LangContextValue = {
  lang: Lang;
  t: Dict;
};

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const value = useMemo(() => ({ lang, t: DICT[lang] }), [lang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const value = useContext(LangContext);
  if (!value) {
    throw new Error("useLang must be used inside <LangProvider>");
  }
  return value;
}

/**
 * Внутрішні посилання мусять лишатися в межах поточної мови, інакше
 * англійська сторінка веде на українську і губить користувача та вагу.
 */
export function useHref() {
  const { lang } = useLang();
  return (path: string) => localizeHref(lang, path);
}

export function LangSwitch() {
  const { lang } = useLang();
  const raw = usePathname() ?? "/";

  /**
   * На глобальній 404 `usePathname()` віддає внутрішню назву маршруту
   * (`/_not-found`), а не адресу, яку набрав користувач. Перемикати мову
   * там нема на чому — ведемо на головну відповідної мови.
   */
  const pathname = raw.includes("_not-found") ? "/" : raw;

  return (
    <>
      <Link
        href={lang === "ua" ? pathname : otherLangHref("ua", pathname)}
        className="langbtn"
        data-on={lang === "ua"}
        hrefLang="uk"
        aria-current={lang === "ua" ? "true" : undefined}
      >
        UA
      </Link>
      <span className="sep" aria-hidden>
        /
      </span>
      <Link
        href={lang === "en" ? pathname : otherLangHref("en", pathname)}
        className="langbtn"
        data-on={lang === "en"}
        hrefLang="en"
        aria-current={lang === "en" ? "true" : undefined}
      >
        EN
      </Link>
    </>
  );
}
