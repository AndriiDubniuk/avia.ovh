import type { Metadata } from "next";

import type { Lang } from "@/lib/i18n";
import { alternatesFor, OG_LOCALE, type Route } from "@/lib/routes";
import { BLOG_HUB, getArticle, type BlogSlug } from "@/lib/blog";
import { getLocalPage, LOCAL_PATH } from "@/lib/cities";
import {
  getService,
  SERVICES_HUB,
  type ServiceSlug,
} from "@/lib/services";

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
      title: "Обговорити проєкт: оцінка, етапи і бюджет",
      description:
        "Опишіть задачу — повернемось з оцінкою, етапами та бюджетом. Умови до оплати, поширені питання та форма заявки AVIA Digital.",
    },
    offer: {
      title: "Публічна оферта на цифрові послуги",
      description:
        "Умови замовлення цифрових послуг AVIA Digital: предмет договору, порядок оплати, передача результату, повернення коштів.",
    },
    privacy: {
      title: "Політика конфіденційності й персональні дані",
      description:
        "Які персональні дані AVIA Digital збирає через форму на сайті, навіщо, де і як довго їх зберігає, які cookie використовує та як відкликати згоду.",
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
      title: "Start a project: estimate, stages and budget",
      description:
        "Describe the task — we come back with an estimate, stages and a budget. Terms before payment, FAQ and the request form of AVIA Digital.",
    },
    offer: {
      title: "Public offer for digital services",
      description:
        "Terms for ordering AVIA Digital services: subject matter, prices and payment, delivery of the result, refunds, liability and how disputes are resolved.",
    },
    privacy: {
      title: "Privacy policy and personal data",
      description:
        "What personal data AVIA Digital collects through the site form, why, where and how long it is stored, which cookies we use and how to withdraw consent.",
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

/**
 * Метадані посадкових сторінок послуг і хабу.
 *
 * `title.absolute`: заголовки з копірайту вже закінчуються на
 * «| AVIA Digital», тож шаблон лейауту додав би бренд удруге.
 */
function servicesMetadata(
  lang: Lang,
  path: Route,
  title: string,
  description: string,
): Metadata {
  const alternates = alternatesFor(lang, path);

  return {
    title: { absolute: title },
    description,
    alternates,
    openGraph: {
      title,
      description,
      url: alternates.canonical,
      siteName: SEO_COPY[lang].siteName,
      locale: OG_LOCALE[lang],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export function serviceMetadata(lang: Lang, slug: ServiceSlug): Metadata {
  const service = getService(lang, slug);
  return servicesMetadata(
    lang,
    `/services/${slug}`,
    service.metaTitle,
    service.metaDescription,
  );
}

export function servicesHubMetadata(lang: Lang): Metadata {
  const hub = SERVICES_HUB[lang];
  return servicesMetadata(lang, "/services", hub.metaTitle, hub.metaDescription);
}

export function blogHubMetadata(lang: Lang): Metadata {
  const hub = BLOG_HUB[lang];
  return servicesMetadata(lang, "/blog", hub.metaTitle, hub.metaDescription);
}

/**
 * Стаття: той самий набір, плюс `og:type=article` і дата публікації —
 * соцмережі й пошуковики показують її в прев'ю.
 */
export function articleMetadata(lang: Lang, slug: BlogSlug): Metadata {
  const article = getArticle(lang, slug);
  const base = servicesMetadata(
    lang,
    `/blog/${slug}`,
    article.metaTitle,
    article.metaDescription,
  );

  return {
    ...base,
    openGraph: {
      title: article.metaTitle,
      description: article.metaDescription,
      url: alternatesFor(lang, `/blog/${slug}`).canonical,
      siteName: SEO_COPY[lang].siteName,
      locale: OG_LOCALE[lang],
      type: "article",
      publishedTime: article.published,
      authors: [BLOG_HUB[lang].authorName],
    },
  };
}

/** Сторінка «розробка сайтів у Житомирі та по Україні». */
export function localMetadata(lang: Lang): Metadata {
  const page = getLocalPage(lang);
  return servicesMetadata(lang, LOCAL_PATH, page.metaTitle, page.metaDescription);
}
