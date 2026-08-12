import type { Metadata } from "next";

import { LangProvider } from "@/components/lang-provider";
import { HTML_LANG } from "@/lib/routes";
import "../globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://billing.avia.ovh";

/** Кореневий лейаут англійської гілки — див. коментар у `(uk)/layout.tsx`. */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AVIA Billing | Subscriptions",
    template: "%s | AVIA Billing",
  },
  description:
    "Set up and manage AVIA subscriptions. Pay by card, Apple Pay or Google Pay via monobank.",
  applicationName: "AVIA Billing",
  robots: { index: false, follow: false },
  openGraph: {
    title: "AVIA Billing | Subscriptions",
    description:
      "Set up and manage AVIA subscriptions on a separate billing subdomain.",
    url: `${siteUrl}/en`,
    siteName: "AVIA Billing",
    locale: "en_GB",
    type: "website",
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
