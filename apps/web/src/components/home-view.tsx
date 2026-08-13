"use client";

import Link from "next/link";
import { useMemo } from "react";

import { AvionicsMap } from "@/components/avionics-map";
import { Cockpit } from "@/components/cockpit";
import { FlightDeck, type Scene } from "@/components/flight-deck";
import { PlanFlow } from "@/components/plan-flow";
import { useHref, useLang } from "@/components/lang-provider";
import { SiteFooter, SiteHeader } from "@/components/site-nav";

const PORTFOLIO_URL = "https://monibex.com";

export function HomeView() {
  const { t, lang } = useLang();
  const href = useHref();

  const scenes = useMemo<Scene[]>(
    () => [
      {
        // Ліва межа зсунута за нуль: інакше на самому верху сцена має
        // нульову прозорість і герой не читається до першої прокрутки.
        id: "s-hero",
        from: -0.12,
        to: 0.0824,
        center: true,
        content: (
          <>
            <div className="eyebrow">{t.hero.eyebrow}</div>
            <h1 className="huge">
              {t.hero.title[0]}
              <br />
              {t.hero.title[1]}
            </h1>
            <p className="sub">{t.hero.sub}</p>
          </>
        ),
      },
      {
        id: "s-rotate",
        from: 0.0604,
        to: 0.2253,
        content: (
          <>
            <div className="eyebrow">{t.rotate.eyebrow}</div>
            <h2 className="huge">
              {t.rotate.title[0]}
              <br />
              {t.rotate.title[1]}
            </h2>
            <p className="clr">
              {t.rotate.clr.map((line, i) => (
                <span key={line}>
                  {i > 0 ? <br /> : null}
                  {i === 2 ? <b>{line}</b> : line}
                </span>
              ))}
            </p>
          </>
        ),
      },
      {
        id: "s-man",
        from: 0.2033,
        to: 0.3681,
        // Три короткі рядки: притиснуті вгору, вони лишали порожньою більшу
        // частину екрана, особливо на високих телефонах.
        center: true,
        content: (
          <div>
            {t.manifesto.map((line) => (
              <div key={line.text} className="manline" data-manline data-lit="false">
                {line.text}
                {line.accent ? <em>{line.accent}</em> : null}
              </div>
            ))}
          </div>
        ),
      },
      {
        id: "s-av",
        from: 0.3461,
        to: 0.511,
        center: true,
        content: (
          <div id="avionics">
            <div className="eyebrow" style={{ justifyContent: "center" }}>
              {t.avionics.eyebrow}
            </div>
            <h2 className="mid">
              {t.avionics.title[0]}
              <br />
              {t.avionics.title[1]}
            </h2>
            <AvionicsMap />
          </div>
        ),
      },
      {
        id: "s-log",
        from: 0.489,
        to: 0.6539,
        content: (
          <>
            <div className="eyebrow">{t.log.eyebrow}</div>
            <h2 className="mid">
              {t.log.title[0]}
              <br />
              {t.log.title[1]}
            </h2>
            <div className="log">
              {t.log.legs.map((leg) =>
                leg.dest === "MONIBEX" ? (
                  <a
                    key={leg.dest}
                    className="leg"
                    href={PORTFOLIO_URL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="no">{leg.no}</span>
                    <div>
                      <div className="dest">{leg.dest}</div>
                      <div className="cat">{leg.cat}</div>
                    </div>
                    <span className="val">{leg.val}</span>
                  </a>
                ) : (
                  <div key={leg.dest} className="leg">
                    <span className="no">{leg.no}</span>
                    <div>
                      <div className="dest">{leg.dest}</div>
                      <div className="cat">{leg.cat}</div>
                    </div>
                    <span className="val">{leg.val}</span>
                  </div>
                ),
              )}
            </div>
          </>
        ),
      },
      {
        id: "s-plan",
        from: 0.6319,
        to: 0.7967,
        content: (
          <>
            <div className="eyebrow">{t.plan.eyebrow}</div>
            <h2 className="mid">
              {t.plan.title[0]}
              <br />
              {t.plan.title[1]}
            </h2>
            <PlanFlow />
          </>
        ),
      },
      {
        id: "s-fares",
        from: 0.7747,
        to: 0.9396,
        content: (
          <>
            <div className="eyebrow">{t.fares.eyebrow}</div>
            <h2 className="mid">
              {t.fares.title[0]}
              <br />
              {t.fares.title[1]}
            </h2>
            <div className="fares">
              {t.fares.packs.map((pack) => (
                <div key={pack.title} className="fare">
                  <span className="fn">{pack.title}</span>
                  <span className="ff">{pack.price}</span>
                  <span className="fm">{pack.timeline}</span>
                  <span className="fi">{pack.summary}</span>
                </div>
              ))}
            </div>
            <p className="fare-note">{t.fares.note}</p>
          </>
        ),
      },
      {
        id: "s-cta",
        /**
         * Останній екран сайту: під ним більше нічого не прокручується.
         * Вікно навмисно виходить за кінець треку, щоб сцена лишалась
         * повністю видимою аж до останнього пікселя прокрутки, а не гасла
         * разом із футером, який вкладений у неї.
         */
        from: 0.9176,
        to: 1.14,
        center: true,
        // Підвал прикріплений до низу цього ж екрана: він зʼявляється разом
        // з ним і не додає сторінці прокрутки, як раніше, коли лежав під треком.
        footer: <SiteFooter />,
        content: (
          <>
            <div className="eyebrow" style={{ justifyContent: "center" }}>
              {t.departure.eyebrow}
            </div>
            <h2 className="huge">
              {t.departure.title[0]}
              <br />
              {t.departure.title[1]}
            </h2>
            <p className="markets">
              {t.departure.markets.map((market, i) => (
                <span key={market}>
                  {i > 0 ? " · " : ""}
                  <b>{market}</b>
                </span>
              ))}
            </p>
            <div style={{ marginTop: 14 }}>
              <Link className="cta" href={href("/contact")}>
                {t.departure.cta}
              </Link>
              <a className="ghost" href="#s-log">
                {t.departure.ghost}
              </a>
            </div>
            <p className="record">{t.departure.record}</p>
          </>
        ),
      },
    ],
    [t, href],
  );

  return (
    <>
      {/* Опис сторінки для читачів екрана. Не заголовок: інакше H2 стояв би перед H1. */}
      <p className="sr-only">{t.hero.sub}</p>

      <a href="#s-hero" className="skip">
        {t.nav.skip}
      </a>

      <Cockpit sky="flight" scrollCue={t.hero.cue} trackSelector="#track" />

      <SiteHeader />

      <main>
        <FlightDeck key={lang} scenes={scenes} />
      </main>

    </>
  );
}
