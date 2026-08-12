"use client";

import Link from "next/link";

import { BillingCrumb, BillingFooter, BillingTop } from "@/components/billing-chrome";
import { Cockpit } from "@/components/cockpit";
import { useHref, useLang } from "@/components/lang-provider";

const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL ?? "http://localhost:3000";

/**
 * Екран показується, коли публічний checkout вимкнено.
 * Користувачу потрібне тільки одне: як оплатити за персональним посиланням.
 * Пояснення про режим і службові індикатори стану тут зайві.
 */
export function BillingPrivateMode() {
  const { t } = useLang();
  const href = useHref();

  return (
    <>
      <Cockpit sky="climb" />
      <BillingTop />

      <main className="bpage">
        <BillingCrumb page={t.privateMode.crumb} />

        <h1 className="huge">{t.privateMode.title}</h1>

        <p className="sub">{t.privateMode.sub}</p>

        <div className="actions" style={{ marginTop: 38 }}>
          <Link className="cta" href={href("/portal")}>
            {t.common.mySubs} →
          </Link>
          <a className="btn" href={`${landingUrl}/contact`}>
            {t.privateMode.requestLink}
          </a>
        </div>

        <p className="note" style={{ marginTop: 28 }}>
          {t.privateMode.noteBefore}
          <a href={`${landingUrl}/contact`} style={{ color: "var(--haze)" }}>
            <b>{t.privateMode.noteLink}</b>
          </a>
          {t.privateMode.noteAfter}
        </p>
      </main>

      <BillingFooter />
    </>
  );
}
