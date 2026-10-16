import {
  BLOG_HUB,
  BLOG_SLUGS,
  getArticle,
  getArticles,
  plainText,
  type BlogSlug,
} from "@/lib/blog";
import { getLocalPage, LOCAL_PATH } from "@/lib/cities";
import { DICT, type Lang } from "@/lib/i18n";
import { legalEntity } from "@/lib/legal-entity";
import { localizeHref, LANG_TAG, type Route } from "@/lib/routes";
import {
  getService,
  getServices,
  SERVICE_SLUGS,
  SERVICES_HUB,
  type ServiceSlug,
} from "@/lib/services";
import { siteConfig } from "@/lib/site-data";

type Page =
  | "home"
  | "contact"
  | "offer"
  | "privacy"
  | "services"
  | "service"
  | "blog"
  | "article"
  | "local";

/**
 * Розмітка Schema.org. Рендериться на сервері тією мовою, якою віддається
 * сама сторінка: у кожної мовної версії власні URL, `inLanguage` і назви.
 *
 * Профіль бізнесу — агенція цифрових послуг, що працює дистанційно.
 * Тому `Organization` + `hasOfferCatalog`, а не `LocalBusiness`:
 * останній вимагає фізичної точки обслуговування клієнтів, якої немає.
 */
export function StructuredData({
  page,
  lang,
  service,
  article,
}: {
  page: Page;
  lang: Lang;
  /** Лише для page="service". */
  service?: ServiceSlug;
  /** Лише для page="article". */
  article?: BlogSlug;
}) {
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

  /** Хлібні крихти довільної глибини: Головна → … → сторінка. */
  function breadcrumbTrail(trail: { name: string; path: Route }[]) {
    const self = trail[trail.length - 1].path;
    return {
      "@type": "BreadcrumbList",
      "@id": `${abs(self)}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "AVIA Digital", item: abs("/") },
        ...trail.map((step, index) => ({
          "@type": "ListItem",
          position: index + 2,
          name: step.name,
          item: abs(step.path),
        })),
      ],
    };
  }

  const hub = SERVICES_HUB[lang];

  /**
   * Сторінка послуги: Service + FAQPage. Питання й відповіді беруться з тих
   * самих рядків, що й видимий FAQ, — розбіжності між розміткою й сторінкою
   * бути не може.
   */
  function serviceGraph(slug: ServiceSlug) {
    const item = getService(lang, slug);
    const path: Route = `/services/${slug}`;
    return [
      webPage(item.name, path, true),
      breadcrumbTrail([
        { name: hub.name, path: "/services" },
        { name: item.name, path },
      ]),
      {
        "@type": "Service",
        "@id": `${abs(path)}#service`,
        name: item.h1,
        serviceType: item.name,
        description: item.metaDescription,
        url: abs(path),
        provider: { "@id": `${url}/#organization` },
        ...(item.minPrice
          ? {
              offers: {
                "@type": "Offer",
                url: abs("/contact"),
                priceSpecification: {
                  "@type": "PriceSpecification",
                  minPrice: item.minPrice,
                  priceCurrency: "UAH",
                  valueAddedTaxIncluded: true,
                },
              },
            }
          : {}),
      },
      {
        "@type": "FAQPage",
        "@id": `${abs(path)}#faq`,
        inLanguage,
        mainEntity: item.faq.map((entry) => ({
          "@type": "Question",
          name: entry.question,
          acceptedAnswer: { "@type": "Answer", text: entry.answer },
        })),
      },
    ];
  }

  const blog = BLOG_HUB[lang];

  /**
   * Стаття: BlogPosting + FAQPage. Відповіді FAQ можуть містити посилання —
   * у розмітку йде чистий текст, той самий, що бачить читач.
   */
  function articleGraph(slug: BlogSlug) {
    const item = getArticle(lang, slug);
    const path: Route = `/blog/${slug}`;
    const self = abs(path);
    return [
      webPage(item.h1, path, true),
      breadcrumbTrail([
        { name: blog.name, path: "/blog" },
        { name: item.h1, path },
      ]),
      {
        "@type": "BlogPosting",
        "@id": `${self}#article`,
        headline: item.h1,
        description: item.metaDescription,
        url: self,
        inLanguage,
        datePublished: item.published,
        dateModified: item.published,
        mainEntityOfPage: { "@id": `${self}#webpage` },
        author: { "@id": `${url}/#organization` },
        publisher: { "@id": `${url}/#organization` },
      },
      {
        "@type": "FAQPage",
        "@id": `${self}#faq`,
        inLanguage,
        mainEntity: item.faq.map((entry) => ({
          "@type": "Question",
          name: entry.question,
          acceptedAnswer: { "@type": "Answer", text: plainText(entry.answer) },
        })),
      },
    ];
  }

  /**
   * Житомир і вся Україна: Service з areaServed (місто й країна). Не
   * LocalBusiness — у компанії немає фізичної точки для клієнтів, а
   * LocalBusiness Google очікує саме від неї.
   */
  function localGraph() {
    const item = getLocalPage(lang);
    const path: Route = LOCAL_PATH;
    const self = abs(path);
    return [
      webPage(item.name, path, true),
      breadcrumbTrail([
        { name: hub.name, path: "/services" },
        { name: item.name, path },
      ]),
      {
        "@type": "Service",
        "@id": `${self}#service`,
        name: item.h1,
        description: item.metaDescription,
        url: self,
        provider: { "@id": `${url}/#organization` },
        areaServed: [
          { "@type": "City", name: item.baseCity },
          { "@type": "Country", name: item.country },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${self}#faq`,
        inLanguage,
        mainEntity: item.faq.map((entry) => ({
          "@type": "Question",
          name: entry.question,
          acceptedAnswer: { "@type": "Answer", text: entry.answer },
        })),
      },
    ];
  }

  /** Хаб блогу: перелік статей. */
  function blogGraph() {
    const all = getArticles(lang);
    return [
      webPage(blog.name, "/blog", true),
      breadcrumbTrail([{ name: blog.name, path: "/blog" }]),
      {
        "@type": "ItemList",
        "@id": `${abs("/blog")}#list`,
        itemListElement: BLOG_SLUGS.map((slug, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: all[slug].h1,
          url: abs(`/blog/${slug}`),
        })),
      },
    ];
  }

  /** Хаб: перелік посадкових сторінок. */
  function hubGraph() {
    const all = getServices(lang);
    return [
      webPage(hub.name, "/services", true),
      breadcrumbTrail([{ name: hub.name, path: "/services" }]),
      {
        "@type": "ItemList",
        "@id": `${abs("/services")}#list`,
        itemListElement: SERVICE_SLUGS.map((slug, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: all[slug].name,
          url: abs(`/services/${slug}`),
        })),
      },
    ];
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
    page === "local"
      ? [...base, ...localGraph()]
      : page === "article" && article
      ? [...base, ...articleGraph(article)]
      : page === "blog"
        ? [...base, ...blogGraph()]
        : page === "service" && service
      ? [...base, ...serviceGraph(service)]
      : page === "services"
        ? [...base, ...hubGraph()]
        : page === "home"
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

/** «від ₴22,500» → «22500»: Schema.org приймає лише число. */
function digits(value: string) {
  return value.replace(/[^\d]/g, "");
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-zа-яіїєґ0-9]+/gi, "-").replace(/^-|-$/g, "");
}
