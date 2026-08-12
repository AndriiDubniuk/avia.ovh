"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useMemo, type ReactNode } from "react";

import { DICT, type Dict, type Lang } from "@/lib/i18n";
import { localizeHref, otherLangHref } from "@/lib/routes";

/* ---- мова приходить із сервера, з сегмента URL ----
 *
 * Та сама архітектура, що й на avia.ovh: `/` — українська, `/en` —
 * англійська. Замість `localStorage` мову визначає адреса, тому сторінку
 * оплати можна надіслати клієнту одразу потрібною мовою, а розмітка
 * приходить із сервера без клієнтського перемальовування.
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

/**
 * Поза провайдером (статичний рендер у тестах) повертає українську —
 * так компонент можна рендерити окремо, без обгортки.
 */
export function useLang(): LangContextValue {
  return useContext(LangContext) ?? { lang: "ua", t: DICT.ua };
}

/** Внутрішні посилання лишаються в межах поточної мови. */
export function useHref() {
  const { lang } = useLang();
  return (path: string) => localizeHref(lang, path);
}

export function LangSwitch() {
  const { lang } = useLang();
  const raw = usePathname() ?? "/";

  // Той самий запобіжник, що й на avia.ovh: на сторінці 404 `usePathname()`
  // віддає внутрішню назву маршруту, а не реальну адресу.
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
