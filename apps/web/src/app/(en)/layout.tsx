import type { Metadata } from "next";

import { LangProvider } from "@/components/lang-provider";
import { HTML_LANG } from "@/lib/routes";
import { pageMetadata, SEO_COPY, SITE_URL } from "@/lib/seo";
import "../globals.css";

/** Кореневий лейаут англійської гілки — див. коментар у `(uk)/layout.tsx`. */
export const metadata: Metadata = {
  ...pageMetadata("en", "home"),
  metadataBase: new URL(SITE_URL),
  applicationName: "AVIA Digital",
  // Об'єкт title мусить стояти ПІСЛЯ спреду: інакше він перетирався б,
  // і внутрішні сторінки лишались без шаблону «%s | AVIA Digital».
  title: {
    default: SEO_COPY.en.home.title,
    template: SEO_COPY.en.titleTemplate,
  },
};

export default function EnRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={HTML_LANG.en} className="h-full antialiased">
      <body>
        <LangProvider lang="en">{children}</LangProvider>
      </body>
    </html>
  );
}
