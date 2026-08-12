"use client";

import Link from "next/link";

import { Cockpit } from "@/components/cockpit";
import { useHref, useLang } from "@/components/lang-provider";
import { Reveal } from "@/components/reveal";
import { SiteFooter, SiteHeader } from "@/components/site-nav";

/**
 * Сторінка 404 у фірмовому оформленні: те саме небо, шапка й підвал, що й
 * на решті сторінок. Дефолтна сторінка Next віддавала голий чорний текст
 * на білому тлі й не давала жодного виходу, крім кнопки «назад».
 *
 * Головне тут — навігація: користувач, що потрапив на неіснуючу адресу,
 * має піти далі по сайту, а не закрити вкладку.
 */
export function NotFoundView() {
  const { t } = useLang();
  const href = useHref();
  const n = t.notFound;

  const exits = [
    { href: href("/"), label: t.nav.avionics, hint: t.homeFooter.lead },
    { href: href("/contact"), label: t.homeFooter.contact, hint: t.contactPage.sub },
    { href: href("/offer"), label: t.homeFooter.offer, hint: t.offer.description },
    { href: href("/privacy"), label: t.homeFooter.privacy, hint: t.privacy.description },
  ];

  return (
    <>
      <Cockpit sky="climb" />
      <SiteHeader />

      <main className="page notfound">
        <Reveal>
          <p className="eyebrow">{n.eyebrow}</p>
          <h1 className="huge">
            {n.title[0]}
            <br />
            {n.title[1]}
          </h1>
          <p className="sub">{n.sub}</p>

          <div className="actions mt-8">
            <Link href={href("/")} className="cta">
              {n.cta}
            </Link>
            <Link href={href("/contact")} className="ghost">
              {n.ghost}
            </Link>
          </div>
        </Reveal>

        <section className="sec">
          <Reveal>
            <div className="sec-head">
              <h2 className="mid">{n.links}</h2>
            </div>
          </Reveal>

          <div className="tcards mt-8">
            {exits.map((exit, index) => (
              <Reveal key={exit.href} delay={index * 40}>
                <Link href={exit.href} className="tcard exit">
                  <h3>{exit.label}</h3>
                  <p>{exit.hint}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
