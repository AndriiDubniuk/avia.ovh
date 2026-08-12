import type { Metadata } from "next";

import { LangProvider } from "@/components/lang-provider";
import { HTML_LANG } from "@/lib/routes";
import "../globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://billing.avia.ovh";

/**
 * Кореневий лейаут української гілки.
 *
 * Атрибут `lang` у `<html>` може бути лише один на дерево, тому мовні гілки
 * розведені групами роутів — так само, як на avia.ovh: `(uk)` віддає `/`,
 * `(en)` — `/en`. Українська лишається в корені без редиректу, тож усі
 * посилання на оплату, які вже розіслані клієнтам, працюють без змін.
 *
 * `noindex` лишається на місці: піддомен не призначений для пошуку.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AVIA Billing | Підписки",
    template: "%s | AVIA Billing",
  },
  description:
    "Оформлення та керування підписками AVIA. Оплата карткою, Apple Pay або Google Pay через monobank.",
  applicationName: "AVIA Billing",
  robots: { index: false, follow: false },
  openGraph: {
    title: "AVIA Billing | Підписки",
    description:
      "Оформлення та керування підписками AVIA через окремий billing-піддомен.",
    url: siteUrl,
    siteName: "AVIA Billing",
    locale: "uk_UA",
    type: "website",
  },
};

export default function UkRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={HTML_LANG.ua} className="h-full antialiased">
      <body>
        <LangProvider lang="ua">{children}</LangProvider>
      </body>
    </html>
  );
}
