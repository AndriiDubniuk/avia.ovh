"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";

import { BillingFooter, BillingTop } from "@/components/billing-chrome";
import { Cockpit } from "@/components/cockpit";
import { LangProvider, useHref, useLang } from "@/components/lang-provider";
import type { Lang } from "@/lib/i18n";
import { HTML_LANG } from "@/lib/routes";

const subscribe = () => () => {};
const readLang = (): Lang =>
  window.location.pathname.startsWith("/en") ? "en" : "ua";
const serverLang = (): Lang => "ua";

/**
 * 404 білінгу. Мову беремо з адреси так само, як на avia.ovh: серверний
 * знімок дає українську, після гідрації `useSyncExternalStore` штатно
 * перемикається на клієнтський і читає шлях.
 */
export function BillingNotFound() {
  const lang = useSyncExternalStore(subscribe, readLang, serverLang);

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[lang];
  }, [lang]);

  return (
    <LangProvider lang={lang}>
      <NotFoundBody />
    </LangProvider>
  );
}

function NotFoundBody() {
  const { t } = useLang();
  const href = useHref();

  return (
    <>
      <Cockpit sky="climb" />
      <BillingTop />

      <main className="page">
        <p className="eyebrow">404</p>
        <h1 className="huge">{t.home.title[0]}</h1>
        <p className="sub">{t.home.sub}</p>

        <div className="actions mt-7">
          <Link href={href("/")} className="cta">
            {t.nav.billing}
          </Link>
          <Link href={href("/portal")} className="btn">
            {t.nav.mySubs}
          </Link>
        </div>
      </main>

      <BillingFooter />
    </>
  );
}
