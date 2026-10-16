"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { LangSwitch, useHref, useLang } from "@/components/lang-provider";
import { localizeHref } from "@/lib/routes";
import { BLOG_HUB } from "@/lib/blog";
import { getServices, SERVICE_SLUGS, SERVICES_HUB } from "@/lib/services";

const BILLING_URL =
  process.env.NEXT_PUBLIC_BILLING_URL ?? "https://billing.avia.ovh";

/**
 * Єдина навігація для всіх сторінок.
 *
 * На головній якорі ведуть на сцени польоту, на внутрішніх сторінках — туди ж
 * через "/#…", тож набір пунктів однаковий скрізь.
 */
function useNavLinks() {
  const { t, lang } = useLang();
  const href = useHref();
  const pathname = usePathname();
  const home = localizeHref(lang, "/");
  const onHome = pathname === home;
  // Якорі головної: на самій головній — голий «#…», з інших сторінок —
  // повна адреса головної тією ж мовою, інакше EN-сторінка кинула б на UA.
  const prefix = onHome ? "" : home;

  const services = getServices(lang);

  return {
    onHome,
    /** Хаб послуг — окремий пункт: на відміну від якорів, це сторінка. */
    servicesHub: { href: href("/services"), label: SERVICES_HUB[lang].name },
    /** Той самий хаб у списку поруч із підзаголовком «Послуги». */
    servicesAll: { href: href("/services"), label: SERVICES_HUB[lang].all },
    services: SERVICE_SLUGS.map((slug) => ({
      href: href(`/services/${slug}`),
      label: services[slug].name,
    })),
    sections: [
      // Колишній якір «Послуги» (#s-av) замінено на окрему сторінку /services —
      // інакше в меню стояло б два пункти з однаковою назвою.
      { href: `${prefix}#s-fares`, label: t.nav.fares },
      { href: `${prefix}#s-plan`, label: t.nav.plan },
    ],
    blog: { href: href("/blog"), label: BLOG_HUB[lang].name },
    pages: [
      // Блог — першим серед сторінок: так він потрапляє і в мобільне меню,
      // і в підвал без окремої розмітки.
      { href: href("/blog"), label: BLOG_HUB[lang].name, external: false },
      { href: href("/contact"), label: t.homeFooter.contact, external: false },
      { href: href("/offer"), label: t.homeFooter.offer, external: false },
      { href: href("/privacy"), label: t.homeFooter.privacy, external: false },
      { href: BILLING_URL, label: t.homeFooter.billing, external: true },
    ],
  };
}

export function SiteHeader() {
  const { t } = useLang();
  const href = useHref();
  const pathname = usePathname();
  const { sections, pages, services, servicesHub, servicesAll, blog } = useNavLinks();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Меню закривається на Esc і при зміні сторінки.
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    panelRef.current?.querySelector<HTMLElement>("a,button")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header>
      <Link id="logo" href={href("/")}>
        AVI<b>A</b>
      </Link>

      <div id="topright">
        <nav className="navlinks" aria-label={t.nav.sections}>
          <Link
            href={servicesHub.href}
            aria-current={pathname === servicesHub.href ? "page" : undefined}
          >
            {servicesHub.label}
          </Link>
          <Link href={blog.href} aria-current={pathname === blog.href ? "page" : undefined}>
            {blog.label}
          </Link>
          {sections.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <LangSwitch />

        <Link href={href("/contact")} className="book">
          {t.nav.book}
        </Link>

        <button
          type="button"
          className="burger"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? t.nav.close : t.nav.menu}
          onClick={() => setOpen((value) => !value)}
        >
          <i aria-hidden />
          <i aria-hidden />
        </button>
      </div>

      <div
        id="mobile-menu"
        className="menupanel"
        data-open={open}
        ref={panelRef}
        aria-hidden={!open}
        // Закрита панель не має ловити фокус клавіатурою.
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

        <p className="mtag">{servicesHub.label}</p>
        <nav aria-label={servicesHub.label}>
          {[servicesAll, ...services].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <p className="mtag">{t.nav.pages}</p>
        <nav aria-label={t.nav.pages}>
          {pages.map((item) =>
            item.external ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { t } = useLang();
  const pathname = usePathname();
  const { sections, pages, onHome, services, servicesAll } = useNavLinks();

  return (
    // На головній підвал лягає поверх фіксованих сцен — йому потрібен щільний фон.
    <footer className={onHome ? "sitefoot overflight" : "sitefoot"}>
      <div className="inner">
        <div className="brand">{t.homeFooter.rights}</div>
        <nav aria-label={t.nav.pages}>
          {[servicesAll, ...services].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
          {sections.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
          {pages.map((item) =>
            item.external ? (
              <a key={item.href} href={item.href} target="_blank" rel="noreferrer">
                {item.label}
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>
      </div>
    </footer>
  );
}
