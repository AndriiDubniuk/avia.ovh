import { DICT, type Lang } from "@/lib/i18n";
import { legalEntity } from "@/lib/legal-entity";
import { localizeHref, LANG_TAG, type Route } from "@/lib/routes";
import { siteConfig } from "@/lib/site-data";

type Page = "home" | "contact" | "offer" | "privacy";

/**
 * Розмітка Schema.org. Рендериться на сервері тією мовою, якою віддається
 * сама сторінка: у кожної мовної версії власні URL, `inLanguage` і назви.
 *
 * Профіль бізнесу — агенція цифрових послуг, що працює дистанційно.
 * Тому `Organization` + `hasOfferCatalog`, а не `LocalBusiness`:
 * останній вимагає фізичної точки обслуговування клієнтів, якої немає.
 */
export function StructuredData({ page, lang }: { page: Page; lang: Lang }) {
  const t = DICT[lang];
  const url = siteConfig.siteUrl;
  const inLanguage = LANG_TAG[lang];
  /**
   * Абсолютна адреса сторінки з урахуванням мовного префікса.
   * Кінцевий слеш прибираємо, щоб `@id` збігався з canonical, який
   * Metadata API віддає без нього.
   */
  const abs = (path: Route) =>
    `${url}${localizeHref(lang, path)}`.replace(/\/$/, "");

  /** Напрямки послуг — те, за чим компанію шукають у пошуку. */
  const serviceLines =
    lang === "ua"
      ? [
          "Розробка сайтів",
          "Розробка вебзастосунків",
          "Мобільні застосунки",
          "Кастомне програмне забезпечення",
          "AI-інтеграції",
          "UI/UX та продуктовий дизайн",
          "Брендинг",
          "SEO",
          "Google Ads",
          "Meta Ads",
          "Автоматизація бізнес-процесів",
        ]
      : [
          "Website development",
          "Web application development",
          "Mobile app development",
          "Custom software development",
          "AI integration",
          "UI/UX and product design",
          "Branding",
          "SEO",
          "Google Ads",
          "Meta Ads",
          "Business process automation",
        ];

  const organization = {
    "@type": "Organization",
    "@id": `${url}/#organization`,
    name: siteConfig.name,
    alternateName: "AVIA",
    url,
    description: t.homeFooter.lead,
    slogan: t.hero.title.join(" "),
    /**
     * Логотип беремо зі `public/icon.svg`, а не з файлового маршруту
     * `app/icon.svg`: Next додає до останнього хеш вмісту
     * (`/icon-35zmp1.svg`), тому стабільної адреси для Schema.org у нього
     * немає — посилання на `/icon.svg` віддавало б 404, і Google не зміг би
     * підтягнути лого.
     */
    logo: {
      "@type": "ImageObject",
      "@id": `${url}/#logo`,
      url: `${url}/icon.svg`,
      contentUrl: `${url}/icon.svg`,
    },
    image: `${url}/icon.svg`,
    email: legalEntity.contactEmail,
    areaServed: t.departure.markets.map((name) => ({
      "@type": "AdministrativeArea",
      name,
    })),
    knowsAbout: serviceLines,
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "sales",
        email: legalEntity.contactEmail,
        url: abs("/contact"),
        availableLanguage: ["uk", "en"],
      },
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: legalEntity.contactEmail,
        availableLanguage: ["uk", "en"],
      },
    ],
    /** Каталог напрямків: дає пошуку явний перелік того, що компанія продає. */
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name:
        lang === "ua" ? "Цифрові послуги AVIA Digital" : "AVIA Digital services",
      itemListElement: serviceLines.map((name) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name,
          serviceType: name,
          provider: { "@id": `${url}/#organization` },
        },
      })),
    },
    sameAs: [siteConfig.portfolioUrl],
  };

  const websiteId = `${url}/#website-${lang}`;
  const website = {
    "@type": "WebSite",
    "@id": websiteId,
    url: abs("/"),
    name: siteConfig.name,
    inLanguage,
    publisher: { "@id": `${url}/#organization` },
  };

  const services = t.fares.packs.map((pack) => ({
    "@type": "Service",
    "@id": `${url}/#service-${lang}-${slug(pack.title)}`,
    name: pack.title,
    serviceType: pack.title,
    description: pack.summary,
    provider: { "@id": `${url}/#organization` },
    areaServed: t.departure.markets,
    offers: {
      "@type": "Offer",
      priceCurrency: "UAH",
      price: digits(pack.price),
      priceSpecification: {
        "@type": "PriceSpecification",
        minPrice: digits(pack.price),
        priceCurrency: "UAH",
        valueAddedTaxIncluded: true,
      },
      availability: "https://schema.org/InStock",
      url: abs("/contact"),
    },
  }));

  const faq = {
    "@type": "FAQPage",
    "@id": `${abs("/contact")}#faq`,
    inLanguage,
    mainEntity: t.contactPage.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  /** Хлібні крихти — на всіх сторінках, крім головної. */
  function breadcrumb(name: string, path: Route) {
    return {
      "@type": "BreadcrumbList",
      "@id": `${abs(path)}#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "AVIA Digital",
          item: abs("/"),
        },
        { "@type": "ListItem", position: 2, name, item: abs(path) },
      ],
    };
  }

  /** Вузол сторінки прив'язує решту графа до конкретної адреси. */
  function webPage(name: string, path: Route, hasBreadcrumb: boolean) {
    const self = abs(path);
    return {
      "@type": "WebPage",
      "@id": `${self}#webpage`,
      url: self,
      name,
      inLanguage,
      isPartOf: { "@id": websiteId },
      about: { "@id": `${url}/#organization` },
      // `primaryImageOfPage` прибрано: єдина картинка сторінки — згенерований
      // OG-образ, адреса якого містить хеш збірки й тут недоступна. Соцмережі
      // й Google беруть її з `og:image`, який Next проставляє сам.
      ...(hasBreadcrumb
        ? { breadcrumb: { "@id": `${abs(path)}#breadcrumb` } }
        : {}),
    };
  }

  const base = [organization, website];

  const graph =
    page === "home"
      ? [...base, webPage(siteConfig.name, "/", false), ...services]
      : page === "contact"
        ? [
            ...base,
            webPage(t.contactPage.crumb, "/contact", true),
            breadcrumb(t.contactPage.crumb, "/contact"),
            faq,
          ]
        : page === "offer"
          ? [
              ...base,
              webPage(t.offer.crumb, "/offer", true),
              breadcrumb(t.offer.crumb, "/offer"),
            ]
          : [
              ...base,
              webPage(t.privacy.crumb, "/privacy", true),
              breadcrumb(t.privacy.crumb, "/privacy"),
            ];

  return (
    <script
      type="application/ld+json"
      // Дані статичні й не містять вводу користувача.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }),
      }}
    />
  );
}

/** «від ₴45,000» → «45000»: Schema.org приймає лише число. */
function digits(value: string) {
  return value.replace(/[^\d]/g, "");
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-zа-яіїєґ0-9]+/gi, "-").replace(/^-|-$/g, "");
}
