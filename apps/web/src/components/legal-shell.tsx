"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { Cockpit } from "@/components/cockpit";
import { useHref, useLang } from "@/components/lang-provider";
import { Reveal } from "@/components/reveal";
import { SiteFooter, SiteHeader } from "@/components/site-nav";
import type { Dict } from "@/lib/i18n";

type LegalDoc = Dict["offer"] | Dict["privacy"];

export function LegalShell({
  doc,
  ctaHref,
  ghostHref,
  children,
}: {
  doc: LegalDoc;
  ctaHref: string;
  ghostHref: string;
  children?: ReactNode;
}) {
  const href = useHref();

  return (
    <>
      <Cockpit sky="climb" />
      <SiteHeader />

      <main className="page">
        <nav className="crumb">
          <Link href={href("/")}>AVIA.OVH</Link>
          <i>/</i>
          <b>{doc.crumb}</b>
        </nav>

        <Reveal>
          {/* Заголовок на всю ширину: у половинній колонці довге слово
              «конфіденційності» не вміщалось і налазило на сусідній блок. */}
          <p className="eyebrow">{doc.eyebrow}</p>
          <h1 className="huge">
            {doc.title.map((line, index) => (
              <span key={line}>
                {index > 0 ? <br /> : null}
                {line}
              </span>
            ))}
          </h1>

          <div className="herorow mt-6">
            <p className="sub">{doc.description}</p>

            <p className="clr">
              {doc.clr.map((line, index) => (
                <span key={line}>
                  {index > 0 ? <br /> : null}
                  {line}
                </span>
              ))}
            </p>
          </div>

          {/* Плитки meta винесені з `herorow` на всю ширину: у правій колонці
              вони стискались у вузький стовпчик, а ліва половина під описом
              лишалась порожньою. Три колонки дають широкі горизонтальні
              картки й прибирають дірку в макеті. */}
          <div className="kvgrid grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {doc.meta.map((item) => (
              <div key={item.label} className="kv">
                <p className="k">{item.label}</p>
                <p className="v">{item.value}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Зміст і статті — окремий смисловий блок після шапки з реквізитами,
            тому відступ більший за типовий міжблоковий. */}
        <div className="mt-16 grid gap-14 lg:grid-cols-[230px_1fr] lg:items-start">
          <nav className="toc" aria-label="Зміст документа">
            {doc.toc.map((item, index) => (
              <a key={item} href={`#art-${index + 1}`}>
                {item}
              </a>
            ))}
          </nav>

          <div className="doc">
            {doc.sections.map((section, index) => (
              <Reveal key={section.title} delay={index * 40}>
                <article className="art" id={`art-${index + 1}`}>
                  <p className="num">{String(index + 1).padStart(2, "0")}</p>
                  <div>
                    <h2>{section.title}</h2>
                    {section.content.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>

        {children}

        <section className="sec">
          <Reveal>
            <div className="panel panel-lit">
              <p className="ptag">{doc.closing.tag}</p>
              <h3>{doc.closing.title}</h3>
              <p>{doc.closing.body}</p>
              <div className="actions mt-7">
                <Link href={ctaHref} className="cta">
                  {doc.closing.cta}
                </Link>
                <Link href={ghostHref} className="ghost">
                  {doc.closing.ghost}
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

export function OfferView() {
  const { t } = useLang();
  const href = useHref();
  return (
    <LegalShell
      doc={t.offer}
      ctaHref={href("/contact")}
      ghostHref={href("/privacy")}
    />
  );
}

export function PrivacyView() {
  const { t } = useLang();
  const href = useHref();

  return (
    <LegalShell doc={t.privacy} ctaHref={href("/contact")} ghostHref={href("/offer")}>
      <section className="sec">
        <Reveal>
          <div className="sec-head">
            <h2 className="mid">
              {t.privacy.fieldsTitle[0]}
              <br />
              {t.privacy.fieldsTitle[1]}
            </h2>
            <span className="tag">{t.privacy.fieldsTag}</span>
          </div>
        </Reveal>

        <div className="rowpair mt-7">
          {t.privacy.fields.map((field) => (
            <div key={field.title}>
              <div>
                <p className="ttl">{field.title}</p>
                <p className="cat">{field.purpose}</p>
              </div>
              <span className="val">{field.required}</span>
            </div>
          ))}
        </div>

        <Reveal>
          <p className="note mt-6">{t.privacy.fieldsNote}</p>
        </Reveal>
      </section>
    </LegalShell>
  );
}
