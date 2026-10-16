import type { Lang } from "@/lib/i18n";
import { startPrice } from "@/lib/services";

/**
 * Сторінка «розробка сайтів у Житомирі та по всій Україні».
 *
 * Одна сторінка, а не окрема під кожне місто: набір однакових сторінок, де
 * змінюється лише назва міста, Google вважає дорвеями (порушення правил щодо
 * спаму). Ця сторінка чесна для обох запитів: команда справді з Житомира й
 * справді працює з клієнтами з інших міст онлайн.
 * Для показу в інших містах правильний інструмент — зони обслуговування в
 * Google Business Profile, а не нові сторінки.
 *
 * Ціни — з тарифів через `startPrice`.
 */

export const LOCAL_PATH = "/rozrobka-sajtiv" as const;

export type LocalPage = {
  name: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  faq: { question: string; answer: string }[];
  /** Для Schema.org areaServed: базове місто й країна. */
  baseCity: string;
  country: string;
};

function build(lang: Lang): LocalPage {
  const landing = startPrice(lang, "landing");
  const site = startPrice(lang, "corporate-site");
  const mvp = startPrice(lang, "mvp");
  const landingPlain = startPrice(lang, "landing", false);

  if (lang === "ua") {
    return {
      name: "Розробка сайтів у Житомирі та по Україні",
      metaTitle: "Розробка сайтів у Житомирі та по Україні | AVIA Digital",
      metaDescription: `Розробка сайтів під ключ: лендінги від ${landingPlain}, сайти компаній, MVP та інтеграції. Команда з Житомира, працюємо з бізнесом по всій Україні.`,
      h1: "Розробка сайтів у Житомирі та по всій Україні",
      intro:
        "AVIA Digital — команда з Житомира. Робимо лендінги, сайти компаній, MVP та інтеграції для житомирського бізнесу й для компаній з усієї України: бриф, погодження етапів і здача проходять онлайн, тож місто клієнта не впливає ні на темп, ні на результат.",
      faq: [
        {
          question: "Ви справді з Житомира?",
          answer: "Так, команда зареєстрована й працює в Житомирі. Реквізити — на сторінці контактів.",
        },
        {
          question: "Чи працюєте з бізнесом з інших міст?",
          answer:
            "Так, по всій Україні. Бриф, погодження етапів, демо, оплата й здача проходять онлайн, тож місто клієнта на роботу не впливає.",
        },
        {
          question: "Скільки коштує розробка сайту?",
          answer: `Ціни однакові для будь-якого міста: лендінг від ${landing}, сайт компанії від ${site}, MVP від ${mvp}. Точний кошторис — після брифу, до оплати.`,
        },
      ],
      baseCity: "Житомир",
      country: "Україна",
    };
  }

  return {
    name: "Website development in Zhytomyr and across Ukraine",
    metaTitle: "Website development in Zhytomyr and Ukraine | AVIA Digital",
    metaDescription: `Turnkey websites: landing pages from ${landingPlain}, company websites, MVPs and integrations. A Zhytomyr team working with businesses across Ukraine.`,
    h1: "Website development in Zhytomyr and across Ukraine",
    intro:
      "AVIA Digital is a team from Zhytomyr. We build landing pages, company websites, MVPs and integrations for Zhytomyr businesses and for companies all over Ukraine: the brief, stage sign-offs and handover all happen online, so the client's city affects neither pace nor results.",
    faq: [
      {
        question: "Are you really based in Zhytomyr?",
        answer: "Yes, the team is registered and works in Zhytomyr. Company details are on the contacts page.",
      },
      {
        question: "Do you work with businesses from other cities?",
        answer:
          "Yes, across Ukraine. The brief, stage sign-offs, demos, payment and handover all happen online, so the client's city makes no difference to the work.",
      },
      {
        question: "How much does website development cost?",
        answer: `Prices are the same for any city: a landing page from ${landing}, a company website from ${site}, an MVP from ${mvp}. Exact quote after the brief, before payment.`,
      },
    ],
    baseCity: "Zhytomyr",
    country: "Ukraine",
  };
}

const CACHE: Partial<Record<Lang, LocalPage>> = {};

export function getLocalPage(lang: Lang) {
  return (CACHE[lang] ??= build(lang));
}


export const LOCAL_COPY = {
  ua: {
    eyebrow: "Розробка сайтів",
    services: "Що ми робимо",
    from: "від",
    faqTitle: "Часті питання",
    cta: "Обговорити проєкт",
  },
  en: {
    eyebrow: "Website development",
    services: "What we do",
    from: "from",
    faqTitle: "FAQ",
    cta: "Discuss a project",
  },
} as const;
