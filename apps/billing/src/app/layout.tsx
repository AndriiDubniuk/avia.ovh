import type { Metadata } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";
import "./globals.css";

const grotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin", "latin-ext"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://billing.avia.ovh";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AVIA Billing | Річні підписки",
    template: "%s | AVIA Billing",
  },
  description:
    "Окрема платіжна зона AVIA для щорічних підписок через monobank acquiring.",
  applicationName: "AVIA Billing",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "AVIA Billing | Щорічні підписки",
    description:
      "Оформлення та керування підписками AVIA через окремий billing-піддомен.",
    url: siteUrl,
    siteName: "AVIA Billing",
    locale: "uk_UA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AVIA Billing",
    description: "Платіжна зона для підписок і автоподовжень AVIA.",
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
      className={`${grotesk.variable} ${fraunces.variable} h-full scroll-smooth antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
