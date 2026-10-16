"use client";

import Link from "next/link";

import { useHref, useLang } from "@/components/lang-provider";
import { Reveal } from "@/components/reveal";
import { Shell } from "@/components/service-view";
import { getLocalPage, LOCAL_COPY } from "@/lib/cities";
import { getServices, SERVICE_SLUGS, SERVICES_HUB, startPrice } from "@/lib/services";

/** «Розробка сайтів у Житомирі та по всій Україні» — одна сторінка на всі міста. */
export function LocalView() {
  const { lang } = useLang();
  const href = useHref();
  const copy = LOCAL_COPY[lang];
  const page = getLocalPage(lang);
  const services = getServices(lang);
  const contact = href("/contact");

  return (
    <Shell
      crumbs={[
        { label: SERVICES_HUB[lang].name, href: href("/services") },
        { label: page.name },
      ]}
    >
      <section>
        <Reveal>
          <div className="eyebrow">{copy.eyebrow}</div>
          <h1 className="mid">{page.h1}</h1>
          <p className="sub">{page.intro}</p>
          <div className="actions mt-7">
            <Link href={contact} className="cta">
              {copy.cta}
            </Link>
          </div>
        </Reveal>
      </section>

      <section className="sec">
        <Reveal>
          <h2 className="mid">{copy.services}</h2>
        </Reveal>
        <Reveal>
          <ul className="tcards mt-8">
            {SERVICE_SLUGS.map((slug) => {
              const price = startPrice(lang, slug);
              return (
                <li key={slug} className="tcard">
                  <h3>
                    <Link href={href(`/services/${slug}`)}>{services[slug].name}</Link>
                  </h3>
                  <p>{services[slug].h1}</p>
                  {price ? (
                    <p>
                      {copy.from} {price}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Reveal>
      </section>


      <section className="sec" id="faq">
        <Reveal>
          <h2 className="mid">{copy.faqTitle}</h2>
        </Reveal>
        <div className="qa mt-7">
          {page.faq.map((item, index) => (
            <Reveal key={item.question} delay={index * 40}>
              <article>
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <div className="actions mt-8">
            <Link href={contact} className="cta">
              {copy.cta}
            </Link>
          </div>
        </Reveal>
      </section>
    </Shell>
  );
}
