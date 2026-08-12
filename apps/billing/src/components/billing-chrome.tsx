"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { LangSwitch, useHref, useLang } from "@/components/lang-provider";
import type { Dict, Lang } from "@/lib/i18n";
import { localizeHref } from "@/lib/routes";

const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL ?? "http://localhost:3000";

/** Адреса на avia.ovh тією ж мовою, що й поточна сторінка білінгу. */
function landing(lang: Lang, path: string) {
  return `${landingUrl}${localizeHref(lang, path)}`;
}

/**
 * Наповнення навігації збігається з avia.ovh — той самий набір пунктів
 * і той самий порядок. Різниця лише в тому, що розділи головної ведуть
 * на неї абсолютними адресами тією ж мовою.
 */
function buildSections(t: Dict, lang: Lang) {
  return [
    { href: landing(lang, "/#s-av"), label: t.nav.services },
    { href: landing(lang, "/#s-log"), label: t.nav.cases },
    { href: landing(lang, "/#s-fares"), label: t.nav.prices },
    { href: landing(lang, "/#s-plan"), label: t.nav.process },
  ];
}

function buildPages(t: Dict, lang: Lang) {
  return [
    { href: landing(lang, "/contact"), label: t.nav.contact, internal: false },
    { href: landing(lang, "/offer"), label: t.nav.offer, internal: false },
    { href: landing(lang, "/privacy"), label: t.nav.privacy, internal: false },
    { href: localizeHref(lang, "/"), label: t.nav.billing, internal: true },
  ];
}

export function BillingTop({ children }: { children?: ReactNode }) {
  const { t, lang } = useLang();
  const href = useHref();
  // Поза роутером (статичний рендер, тести) хук повертає null.
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const sections = buildSections(t, lang);
  const pages = buildPages(t, lang);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    panelRef.current?.querySelector<HTMLElement>("a")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header>
      <a id="logo" href={landing(lang, "/")}>
        AVI<b>A</b>
      </a>

      <div id="topright">
        <nav className="navlinks" aria-label={t.nav.sections}>
          {sections.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <LangSwitch />

        {children ?? (
          <Link href={href("/portal")} className="book">
            {t.nav.mySubs}
          </Link>
        )}

        <button
          type="button"
          className="burger"
          aria-expanded={open}
          aria-controls="billing-menu"
          aria-label={open ? t.nav.close : t.nav.menu}
          onClick={() => setOpen((value) => !value)}
        >
          <i aria-hidden />
          <i aria-hidden />
        </button>
      </div>

      <div
        id="billing-menu"
        className="menupanel"
        data-open={open}
        ref={panelRef}
        aria-hidden={!open}
        inert={!open}
      >
        <p className="mtag">{t.nav.sections}</p>
        <nav aria-label={t.nav.sections}>
          {sections.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </a>
          ))}
        </nav>

        <p className="mtag">{t.nav.pages}</p>
        <nav aria-label={t.nav.pages}>
          {pages.map((item) =>
            item.internal ? (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ) : (
              <a key={item.href} href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </a>
            ),
          )}
          <Link
            href={href("/portal")}
            aria-current={pathname.startsWith("/portal") ? "page" : undefined}
            onClick={() => setOpen(false)}
          >
            {t.nav.mySubs}
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function BillingCrumb({ page }: { page: string }) {
  const { t, lang } = useLang();
  const href = useHref();

  return (
    <nav className="crumb" aria-label={t.nav.crumb}>
      <a href={landing(lang, "/")}>AVIA.OVH</a>
      <i>/</i>
      <Link href={href("/")}>{t.nav.billing}</Link>
      <i>/</i>
      <b>{page}</b>
    </nav>
  );
}

export function BillingFooter() {
  const { t, lang } = useLang();
  const pathname = usePathname() ?? "";

  return (
    <footer className="sitefoot">
      <div className="inner">
        <div className="brand">{t.nav.footBrand}</div>
        <nav aria-label={t.nav.pages}>
          {buildSections(t, lang).map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
          {buildPages(t, lang).map((item) =>
            item.internal ? (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                {item.label}
              </Link>
            ) : (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ),
          )}
        </nav>
      </div>
    </footer>
  );
}

export function Consent() {
  const { t, lang } = useLang();

  return (
    <p className="consent">
      {t.consent.before}
      <a href={landing(lang, "/offer")}>{t.consent.offer}</a>
      {t.consent.middle}
      <a href={landing(lang, "/privacy")}>{t.consent.privacy}</a>
      {t.consent.after}
    </p>
  );
}
