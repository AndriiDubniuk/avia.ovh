import type { Metadata } from "next";

import { BillingNotFound } from "@/components/billing-not-found";
import { HTML_LANG } from "@/lib/routes";
import "./globals.css";

/**
 * Глобальна 404 білінгу.
 *
 * Мовних гілок дві, тому кореневого лейаута над цією сторінкою немає —
 * `<html>` і `<body>` рендеряться тут. Без цього файлу Next підставляв свій
 * внутрішній DefaultLayout, який віддає `<html>` без `lang` і класів, і на
 * гідрації React лаявся на розбіжність атрибутів кореневого елемента.
 */
export const metadata: Metadata = {
  title: "Сторінку не знайдено",
};

export default function GlobalNotFound() {
  return (
    <html lang={HTML_LANG.ua} className="h-full antialiased">
      <body>
        <BillingNotFound />
      </body>
    </html>
  );
}
