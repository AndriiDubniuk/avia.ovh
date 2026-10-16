"use client";

import Link from "next/link";

import { Cockpit } from "@/components/cockpit";
import { useHref, useLang } from "@/components/lang-provider";
import { Reveal } from "@/components/reveal";
import { SiteFooter, SiteHeader } from "@/components/site-nav";
import { ARTICLES_FOR_SERVICE, BLOG_HUB, getArticles } from "@/lib/blog";
import { getLocalPage, LOCAL_PATH } from "@/lib/cities";
import {
  getService,
  getServices,
  SERVICE_SLUGS,
  SERVICES_HUB,
  type ServiceSlug,
} from "@/lib/services";

/**
 * Обгортка внутрішньої сторінки — та сама, що на контактах і в документах:
 * небо, skip-link, шапка, <main id="main">, хлібні крихти, підвал.
 */
export function Shell({
  crumbs,
  children,
}: {
  crumbs: { label: string; href?: string }[];
  children: React.ReactNode;
}) {
  const { t } = useLang();
  const href = useHref();

  return (
    <>
      <Cockpit sky="climb" />
      <a href="#main" className="skip">
        {t.nav.skip}
      </a>
      <SiteHeader />

      <main id="main" tabIndex={-1} className="page">
        {/* Видимі крихти збігаються з BreadcrumbList у JSON-LD. */}
        <nav className="crumb" aria-label="breadcrumb">
          <Link href={href("/")}>AVIA.OVH</Link>
          {crumbs.map((crumb) => (
            <span key={crumb.label}>
              <i>/</i>
              {crumb.href ? (
                <Link href={crumb.href}>{crumb.label}</Link>
              ) : (
                <b aria-current="page">{crumb.label}</b>
              )}
            </span>
          ))}
        </nav>

        {children}
      </main>

      <SiteFooter />
    </>
  );
}

export function ServiceView({ slug }: { slug: ServiceSlug }) {
  const { lang } = useLang();
  const href = useHref();
  const hub = SERVICES_HUB[lang];
  const service = getService(lang, slug);
  const all = getServices(lang);
  const contact = href("/contact");
  const articles = getArticles(lang);
  const useful = ARTICLES_FOR_SERVICE[slug];

  return (
    <Shell crumbs={[{ label: hub.name, href: href("/services") }, { label: service.name }]}>
      <section>
        <Reveal>
          <div className="eyebrow">{hub.eyebrow}</div>
          <h1 className="mid">{service.h1}</h1>
          <p className="sub">{service.intro}</p>
          <div className="actions mt-7">
            <Link href={contact} className="cta">
              {service.cta}
            </Link>
          </div>
        </Reveal>
      </section>

      <section className="sec">
        <Reveal>
          <h2 className="mid">{service.when.title}</h2>
          <p className="sub">{service.when.text}</p>
        </Reveal>
      </section>

      <section className="sec">
        <Reveal>
          <h2 className="mid">{service.includes.title}</h2>
        </Reveal>
        {/* Справжній список: Reveal обгортає його цілком, бо <div> усередині
            <ul> — невалідна розмітка. */}
        <Reveal>
          <ul className="tcards mt-8">
            {service.includes.items.map((item) => (
              <li key={item} className="tcard">
                <p>{item}</p>
              </li>
            ))}
          </ul>
        </Reveal>
        {service.includes.note ? (
          <Reveal>
            <p className="note mt-7">{service.includes.note}</p>
          </Reveal>
        ) : null}
      </section>

      <section className="sec">
        <Reveal>
          <h2 className="mid">{service.process.title}</h2>
          {service.process.text ? <p className="sub">{service.process.text}</p> : null}
        </Reveal>
        {service.process.steps ? (
          <Reveal>
            <ol className="steps mt-8">
              {service.process.steps.map((step, index) => {
                // «Бриф — уточнюємо …»: назва етапу й пояснення окремо.
                const [title, ...rest] = step.split(" — ");
                return (
                  <li key={step} className="step">
                    <p className="step-no">{String(index + 1).padStart(2, "0")}</p>
                    <div>
                      <h3>{title}</h3>
                      {rest.length ? <p className="step-text">{rest.join(" — ")}</p> : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          </Reveal>
        ) : null}
      </section>

      <section className="sec">
        <Reveal>
          <h2 className="mid">{service.cost.title}</h2>
          <p className="sub">{service.cost.text}</p>
          <div className="actions mt-7">
            <Link href={contact} className="cta">
              {service.cta}
            </Link>
            <a href={`${href("/")}#s-fares`} className="ghost">
              {hub.fares}
            </a>
          </div>
        </Reveal>
      </section>

      <section className="sec" id="faq">
        <Reveal>
          <h2 className="mid">{hub.faqTitle}</h2>
        </Reveal>
        <div className="qa mt-7">
          {service.faq.map((item, index) => (
            <Reveal key={item.question} delay={index * 40}>
              <article>
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Зворотна перелінковка: статті блогу, що відповідають на питання саме
          про цю послугу. Для інтеграцій статей поки немає — блок не показується. */}
      {useful.length ? (
        <section className="sec">
          <Reveal>
            <h2 className="mid">{BLOG_HUB[lang].useful}</h2>
          </Reveal>
          <Reveal>
            <ul className="tcards mt-8">
              {useful.map((articleSlug) => (
                <li key={articleSlug} className="tcard">
                  <h3>
                    <Link href={href(`/blog/${articleSlug}`)}>{articles[articleSlug].h1}</Link>
                  </h3>
                  <p>{articles[articleSlug].metaDescription}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>
      ) : null}

      <section className="sec">
        <Reveal>
          <h2 className="mid">{hub.related}</h2>
        </Reveal>
        <Reveal>
          <ul className="tcards mt-8">
            {service.related.map((item) => (
              <li key={item} className="tcard">
                <h3>
                  <Link href={href(`/services/${item}`)}>{all[item].name}</Link>
                </h3>
                <p>{all[item].h1}</p>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal>
          <div className="actions mt-8">
            <Link href={contact} className="cta">
              {service.cta}
            </Link>
          </div>
        </Reveal>
      </section>
    </Shell>
  );
}

export function ServicesHubView() {
  const { lang } = useLang();
  const href = useHref();
  const hub = SERVICES_HUB[lang];
  const all = getServices(lang);
  const local = getLocalPage(lang);

  return (
    <Shell crumbs={[{ label: hub.name }]}>
      <section>
        <Reveal>
          <div className="eyebrow">{hub.eyebrow}</div>
          <h1 className="mid">{hub.title}</h1>
          <p className="sub">{hub.sub}</p>
        </Reveal>
        <Reveal>
          <ul className="tcards mt-8">
            {SERVICE_SLUGS.map((slug) => (
              <li key={slug} className="tcard">
                <h3>
                  <Link href={href(`/services/${slug}`)}>{all[slug].name}</Link>
                </h3>
                <p>{all[slug].intro}</p>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal>
          <div className="actions mt-8">
            <a href={`${href("/")}#s-fares`} className="ghost">
              {hub.fares}
            </a>
          </div>
        </Reveal>
      </section>

      {/* Вхід зі структури сайту на сторінку «Житомир і вся Україна» — без
          нього вона була б «сиротою», доступною лише через sitemap. */}
      <section className="sec">
        <Reveal>
          <ul className="tcards">
            <li className="tcard">
              <h3>
                <Link href={href(LOCAL_PATH)}>{local.name}</Link>
              </h3>
              <p>{local.metaDescription}</p>
            </li>
          </ul>
        </Reveal>
      </section>
    </Shell>
  );
}
