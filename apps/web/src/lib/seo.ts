import type { Metadata } from "next";

import type { Lang } from "@/lib/i18n";
import { alternatesFor, OG_LOCALE, type Route } from "@/lib/routes";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://avia.ovh";

/** Заголовки й описи сторінок — по одному набору на мову. */
export const SEO_COPY = {
  ua: {
    siteName: "AVIA Digital",
    titleTemplate: "%s | AVIA Digital",
    home: {
      title: "AVIA Digital | Розробка сайтів, MVP та вебсервісів",
      ogTitle: "Одна команда — від ідеї до готового продукту",
      description:
        "Лендінги від 22 500 грн, сайти компаній від 120 000 грн, магазини від 200 000 грн, MVP від 280 000 грн. Стартові ціни відкриті, кошторис погоджуємо до оплати.",
      ogDescription:
        "Лендінги, сайти компаній, магазини, MVP та інтеграції. Стартові ціни від 22 500 грн.",
    },
    contact: {
      title: "Обговорити проєкт",
      description:
        "Опишіть задачу — повернемось з оцінкою, етапами та бюджетом. Умови до оплати, поширені питання та форма заявки AVIA Digital.",
    },
    offer: {
      title: "Публічна оферта",
      description:
        "Умови замовлення цифрових послуг AVIA Digital: предмет договору, порядок оплати, передача результату, повернення коштів.",
    },
    privacy: {
      title: "Політика конфіденційності",
      description:
        "Які дані ми збираємо через форму на сайті, навіщо їх використовуємо, де зберігаємо і як їх відкликати.",
    },
  },
  en: {
    siteName: "AVIA Digital",
    titleTemplate: "%s | AVIA Digital",
    home: {
      title: "AVIA Digital | Web, mobile and custom software development",
      ogTitle: "One team — from idea to finished product",
      description:
        "Websites from ₴22,500, company sites from ₴120,000, online stores from ₴200,000, MVPs from ₴280,000. Public starting prices, the quote is agreed before payment.",
      ogDescription:
        "Websites, company sites, online stores, MVPs and integrations. Starting prices from ₴22,500.",
    },
    contact: {
      title: "Start a project",
      description:
        "Describe the task — we come back with an estimate, stages and a budget. Terms before payment, FAQ and the request form of AVIA Digital.",
    },
    offer: {
      title: "Public offer",
      description:
        "Terms for ordering AVIA Digital services: subject matter, payment, delivery of the result and refunds.",
    },
    privacy: {
      title: "Privacy policy",
      description:
        "What data we collect through the site, why we need it, where we store it and how to withdraw it.",
    },
  },
} as const;

type PageKey = keyof (typeof SEO_COPY)["ua"] extends infer K
  ? K extends "siteName" | "titleTemplate"
    ? never
    : K
  : never;

const PATHS: Record<PageKey, Route> = {
  home: "/",
  contact: "/contact",
  offer: "/offer",
  privacy: "/privacy",
};

/**
 * Збирає метадані сторінки: власні title/description мовою сторінки,
 * самореферентний canonical, повний набір hreflang з `x-default`,
 * а також OG і Twitter, які раніше на всіх сторінках дублювали головну.
 */
export function pageMetadata(lang: Lang, key: PageKey): Metadata {
  const copy = SEO_COPY[lang];
  const page = copy[key];
  const path = PATHS[key];
  const isHome = key === "home";

  const ogTitle =
    "ogTitle" in page ? page.ogTitle : `${page.title} | ${copy.siteName}`;
  const ogDescription =
    "ogDescription" in page ? page.ogDescription : page.description;

  return {
    // Головна не задає власний title — його дає `title.default` у лейауті.
    // Інакше шаблон «%s | AVIA Digital» додав би бренд удруге.
    ...(isHome ? {} : { title: page.title }),
    description: page.description,
    alternates: alternatesFor(lang, path),
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: alternatesFor(lang, path).canonical,
      siteName: copy.siteName,
      locale: OG_LOCALE[lang],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
    },
  };
}
