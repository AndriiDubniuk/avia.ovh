import type { Metadata } from "next";

import { LangProvider } from "@/components/lang-provider";
import { HTML_LANG } from "@/lib/routes";
import { pageMetadata, SEO_COPY, SITE_URL } from "@/lib/seo";
import "../globals.css";

/**
 * Кореневий лейаут української гілки.
 *
 * Мов дві, а атрибут `lang` у `<html>` може бути лише один на дерево, тому
 * гілки розведені групами роутів: `(uk)` віддає `/`, `(en)` — `/en`. Це
 * документований у Next.js спосіб мати кілька кореневих лейаутів, і він
 * дозволяє лишити українську в корені без редиректу `/` → `/uk`.
 */
export const metadata: Metadata = {
  ...pageMetadata("ua", "home"),
  metadataBase: new URL(SITE_URL),
  applicationName: "AVIA Digital",
  // Об'єкт title мусить стояти ПІСЛЯ спреду: інакше він перетирався б,
  // і внутрішні сторінки лишались без шаблону «%s | AVIA Digital».
  title: {
    default: SEO_COPY.ua.home.title,
    template: SEO_COPY.ua.titleTemplate,
  },
};

export default function UkRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={HTML_LANG.ua} className="h-full antialiased">
      {/* body не flex: інакше flex-shrink стискає #track (940vh) до нуля */}
      <body>
        <LangProvider lang="ua">{children}</LangProvider>
      </body>
    </html>
  );
}
