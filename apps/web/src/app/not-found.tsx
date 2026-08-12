import type { Metadata } from "next";

import { NotFoundShell } from "@/components/not-found-shell";
import { DICT } from "@/lib/i18n";
import { HTML_LANG } from "@/lib/routes";
import "./globals.css";

/**
 * Глобальна 404 — для будь-якої адреси, що не збіглася з жодним маршрутом.
 *
 * Лежить поза групами `(uk)` та `(en)`, тому кореневого лейаута над нею
 * немає: `<html>` і `<body>` доводиться рендерити тут самій. Мову визначає
 * клієнтська обгортка за адресою.
 */
export const metadata: Metadata = {
  title: DICT.ua.notFound.metaTitle,
  description: DICT.ua.notFound.sub,
  // `robots` тут не задаємо: Next сам додає `noindex` на сторінку 404, і
  // власне правило дало б другий тег `<meta name="robots">` на сторінці.
};

export default function GlobalNotFound() {
  return (
    <html lang={HTML_LANG.ua} className="h-full antialiased">
      <body>
        <NotFoundShell />
      </body>
    </html>
  );
}
