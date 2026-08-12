"use client";

import Link from "next/link";

import { BillingCrumb, BillingFooter, BillingTop } from "@/components/billing-chrome";
import { Cockpit } from "@/components/cockpit";
import { useHref, useLang } from "@/components/lang-provider";

/** Екран /result без checkoutId у запиті. */
export function ResultMissingId() {
  const { t } = useLang();
  const href = useHref();

  return (
    <>
      <Cockpit sky="climb" />
      <BillingTop />

      <main className="bpage bpage-narrow bcenter">
        <BillingCrumb page={t.result.crumb} />

        <div className="status bad">{t.result.badge}</div>

        <h1 className="huge" style={{ marginTop: 26 }}>
          {t.result.title[0]}
          <br />
          <span style={{ color: "var(--rose)" }}>{t.result.title[1]}</span>
        </h1>

        <p className="sub">{t.result.sub}</p>

        <div className="code" style={{ marginTop: 30 }}>
          {`GET /result?checkoutId=
expected :: uuid v4
received :: null`}
        </div>

        <p className="clr">
          {t.result.clr[0]}
          <br />
          {t.result.clr[1]}
          <br />
          <b>{t.result.clr[2]}</b>
        </p>

        <div className="actions" style={{ marginTop: 32 }}>
          <Link href={href("/")} className="cta">
            {t.result.startPayment}
          </Link>
          <Link href={href("/portal")} className="btn">
            {t.common.mySubs}
          </Link>
        </div>

        <p className="note" style={{ marginTop: 24 }}>
          {t.result.noteBefore}
          <b>{t.result.noteStrong}</b>
          {t.result.noteAfter}
        </p>
      </main>

      <BillingFooter />
    </>
  );
}
