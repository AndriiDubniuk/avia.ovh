"use client";

import { useEffect, useSyncExternalStore } from "react";

import { LangProvider } from "@/components/lang-provider";
import { NotFoundView } from "@/components/not-found-view";
import type { Lang } from "@/lib/i18n";
import { HTML_LANG } from "@/lib/routes";

/** Після завантаження адреса вже не змінюється — підписка порожня. */
const subscribe = () => () => {};

/** Мову беремо з адреси: `/en/...` → англійська, решта → українська. */
const readLang = (): Lang =>
  window.location.pathname.startsWith("/en") ? "en" : "ua";

/** На сервері адреса невідома: глобальна 404 пререндериться один раз на всі URL. */
const serverLang = (): Lang => "ua";

/**
 * Обгортка глобальної 404.
 *
 * Групові `not-found.tsx` ловлять лише `notFound()`, кинутий усередині свого
 * сегмента; невідомі адреси завжди потрапляють у глобальну сторінку, яка
 * лежить поза мовними гілками й не має власного `LangProvider`.
 *
 * `useSyncExternalStore` — саме той примітив, що потрібен: серверний знімок
 * дає українську (нею сторінка й пререндериться), а після гідрації React
 * штатно перемикається на клієнтський і читає адресу. Це не помилка
 * гідратації, а документована поведінка хука.
 */
export function NotFoundShell() {
  const lang = useSyncExternalStore(subscribe, readLang, serverLang);

  // Пререндер зафіксував lang="uk" у розмітці — після визначення мови
  // атрибут треба привести у відповідність, інакше читач екрана озвучить
  // англійський текст українською вимовою.
  useEffect(() => {
    document.documentElement.lang = HTML_LANG[lang];
  }, [lang]);

  return (
    <LangProvider lang={lang}>
      <NotFoundView />
    </LangProvider>
  );
}
