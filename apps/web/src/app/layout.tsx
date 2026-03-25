import type { Metadata } from "next";
import { Cormorant_Garamond, Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin", "latin-ext"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://avia.ovh";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AVIA Digital | Розробка сайтів, MVP та вебсервісів",
    template: "%s | AVIA Digital",
  },
  description:
    "Україномовний сайт AVIA Digital: розробка лендінгів, корпоративних сайтів, MVP, інтеграцій і вебсервісів зі стартовими цінами, формою заявки, офертою та політикою конфіденційності.",
  applicationName: "AVIA Digital",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "AVIA Digital | Розробка сайтів, MVP та вебсервісів",
    description:
      "Digital-студія: лендінги, корпоративні сайти, MVP, особисті кабінети, інтеграції та запуск вебпродуктів під бізнес-задачу.",
    url: siteUrl,
    siteName: "AVIA Digital",
    locale: "uk_UA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AVIA Digital",
    description:
      "Розробка сайтів, MVP, інтеграцій і кастомних вебпродуктів.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="uk"
      className={`${sora.variable} ${cormorant.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
