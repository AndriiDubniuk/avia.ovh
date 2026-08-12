"use client";

import Link from "next/link";

import { Cockpit } from "@/components/cockpit";
import { ContactForm } from "@/components/contact-form";
import { useHref, useLang } from "@/components/lang-provider";
import { Reveal } from "@/components/reveal";
import { SiteFooter, SiteHeader } from "@/components/site-nav";

const BILLING_URL =
  process.env.NEXT_PUBLIC_BILLING_URL ?? "https://billing.avia.ovh";

export function ContactView() {
  const { t } = useLang();
  const c = t.contactPage;
  const href = useHref();

  return (
    <>
      <Cockpit sky="climb" />
      <SiteHeader />

      <main className="page">
        <nav className="crumb">
          <Link href={href("/")}>AVIA.OVH</Link>
          <i>/</i>
          <b>{c.crumb}</b>
        </nav>

        <section id="contact">
          {/* Шапка на всю ширину: у вузькій колонці заголовок ламався на 4 рядки */}
          <Reveal>
            <div className="eyebrow">{c.eyebrow}</div>
            <h1 className="huge">
              {c.title[0]}
              <br />
              {c.title[1]}
            </h1>
            <p className="sub">{c.sub}</p>
          </Reveal>

          <div className="contactgrid mt-8 grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <Reveal>
              {/* Реквізитів стало більше (ст. 7 ЗУ «Про електронну комерцію»),
                  тому на широких екранах розкладаємо їх у дві колонки — інакше
                  блок витягується вдвічі довше за форму поруч. */}
              <div className="kvgrid grid gap-3 sm:grid-cols-2">
                {/* Незаповнені реквізити (РНОКПП, адреса) досі містять шаблон
                    у квадратних дужках — показувати «[0000000000]» гірше, ніж
                    не показувати нічого. Плитка зʼявиться, щойно у
                    `legal-entity.ts` буде реальне значення. */}
                {c.facts
                  .filter((fact) => !fact.value.includes("["))
                  .map((fact) => (
                    <div key={fact.label} className="kv">
                      <p className="k">{fact.label}</p>
                      <p className="v">{fact.value}</p>
                    </div>
                  ))}
              </div>
            </Reveal>

            <Reveal delay={80}>
              <ContactForm />
            </Reveal>
          </div>
        </section>

        {/* Етапи переїхали з вузької лівої колонки під форму: там вони
            конкурували з реквізитами за увагу, а тут читаються як
            послідовність і працюють на продаж процесу. */}
        <section className="sec" id="route">
          <Reveal>
            <div className="sec-head">
              <div>
                <div className="eyebrow">{c.afterTag}</div>
                <h2 className="mid">
                  {c.afterTitle[0]}
                  <br />
                  {c.afterTitle[1]}
                </h2>
              </div>
            </div>
          </Reveal>

          <div className="steps mt-8">
            {c.after.map((step, index) => (
              <Reveal key={step.no} delay={index * 60}>
                {/* Дві колонки сітки — два прямі нащадки: номер і контент.
                    Без обгортки текст падав у вузьку колонку номера. */}
                <article className="step">
                  <p className="step-no">{step.no}</p>
                  <div>
                    <h3>{step.title}</h3>
                    <p className="step-text">{step.text}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <p className="note mt-7">{c.afterNote}</p>
          </Reveal>
        </section>

        <section className="sec" id="terms">
          <Reveal>
            <div className="sec-head">
              <div>
                <div className="eyebrow">{c.termsEyebrow}</div>
                <h2 className="mid">
                  {c.termsTitle[0]}
                  <br />
                  {c.termsTitle[1]}
                </h2>
              </div>
              <span className="tag">{c.termsTag}</span>
            </div>
          </Reveal>

          {/* Був плаский список однорядкових тверджень — юзер не розумів,
              що з ним робити. Стало: заголовок з відповіддю + пояснення,
              так блок сканується за кілька секунд. */}
          <div className="tcards mt-8">
            {c.terms.map((item, index) => (
              <Reveal key={item.title} delay={index * 40}>
                <article className="tcard">
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="actions mt-7">
              <Link href={href("/offer")} className="ghost">
                {c.offer}
              </Link>
              <Link href={href("/privacy")} className="ghost">
                {c.privacy}
              </Link>
              <a className="ghost" href={BILLING_URL} target="_blank" rel="noreferrer">
                {c.billing}
              </a>
            </div>
          </Reveal>
        </section>

        <section className="sec" id="faq">
          <Reveal>
            <div className="sec-head">
              <div>
                <div className="eyebrow">{c.faqEyebrow}</div>
                <h2 className="mid">
                  {c.faqTitle[0]}
                  <br />
                  {c.faqTitle[1]}
                </h2>
              </div>
              <span className="tag">{c.faqTag}</span>
            </div>
          </Reveal>

          <div className="qa mt-7">
            {c.faq.map((item, index) => (
              <Reveal key={item.question} delay={index * 40}>
                <article>
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
