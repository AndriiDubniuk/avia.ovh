"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { BillingCrumb, BillingFooter, BillingTop } from "@/components/billing-chrome";
import { Cockpit } from "@/components/cockpit";
import { useHref, useLang } from "@/components/lang-provider";
import { userMessage } from "@/lib/errors";
import { Reveal } from "@/components/reveal";

type PortalSubscriptionItem = {
  subscription_id: string;
  status: string;
  amount_minor: number;
  currency: string;
  interval: string;
  next_charge_at: string | null;
  cancelled_at: string | null;
  created_at: string;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

function formatDate(value: string | null, locale: string) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatAmount(minor: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(minor / 100);
}

function statusTone(status: string) {
  if (status === "active") return "ok";
  if (status === "cancelled") return "off";
  if (["past_due", "suspended", "failed"].includes(status)) return "bad";
  return "wait";
}

export function PortalSubscriptions() {
  const { t } = useLang();
  const href = useHref();
  const [items, setItems] = useState<PortalSubscriptionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setFeedback("");

    try {
      const response = await fetch(`${apiBaseUrl}/v1/billing/portal/subscriptions`, {
        cache: "no-store",
        credentials: "include",
      });
      const data = (await response.json().catch(() => null)) as
        | { items?: PortalSubscriptionItem[]; message?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.message ?? t.subs.errLoad);
      }

      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (error) {
      setFeedback(userMessage(error, t.subs.errLoadRetry));
    } finally {
      setIsLoading(false);
    }
    // Список тягнеться заново при зміні мови — це звичайний GET,
    // зате запасне повідомлення завжди мовою інтерфейсу.
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeCount = items.filter((item) => item.status === "active").length;

  return (
    <>
      <Cockpit sky="climb" />
      <BillingTop />

      <main className="bpage">
        <BillingCrumb page={t.subs.crumb} />

        <Reveal>
          <div className="eyebrow">{t.subs.eyebrow}</div>
          <h1 className="huge">{t.subs.title}</h1>
          <p className="sub">{t.subs.sub}</p>

          <div className="actions" style={{ marginTop: 20 }}>
            <button type="button" className="btn" onClick={() => void load()}>
              {t.common.refresh}
            </button>
            <Link href={href("/portal")} className="btn">
              {t.subs.otherEmail}
            </Link>
          </div>
        </Reveal>

        {!isLoading && items.length > 0 ? (
          <Reveal>
            <div className="grid2 mt8">
              <div className="kv">
                <p className="k">{t.subs.active}</p>
                <p className="v" style={{ fontSize: 30, fontWeight: 800, color: "var(--signal)" }}>
                  {activeCount}
                </p>
              </div>
              <div className="kv">
                <p className="k">{t.subs.total}</p>
                <p className="v" style={{ fontSize: 30, fontWeight: 800 }}>
                  {items.length}
                </p>
              </div>
            </div>
          </Reveal>
        ) : null}

        {feedback ? <p className="alert mt6">{feedback}</p> : null}

        {isLoading ? <p className="note mt6">{t.subs.loading}</p> : null}

        {!isLoading && !feedback && items.length === 0 ? (
          <p className="empty">{t.subs.empty}</p>
        ) : null}

        {!isLoading && items.length > 0
          ? items.map((item, index) => (
              <Reveal key={item.subscription_id} delay={index * 50}>
                <article className="sub-card">
                  <div className="head">
                    <div>
                      <p className="ptag">{t.subs.card}</p>
                      <p className="sid">{item.subscription_id}</p>
                    </div>
                    <div className={`status ${statusTone(item.status)}`}>{item.status}</div>
                  </div>

                  <div className="grid4" style={{ marginTop: 22 }}>
                    <div className="kv">
                      <p className="k">{t.common.amount}</p>
                      <p className="v">
                        {formatAmount(item.amount_minor, item.currency, t.locale)}
                      </p>
                    </div>
                    <div className="kv">
                      <p className="k">{t.common.interval}</p>
                      <p className="v" style={{ fontFamily: "var(--mono)", fontSize: 13 }}>
                        {item.interval}
                      </p>
                    </div>
                    <div className="kv">
                      <p className="k">{t.common.nextCharge}</p>
                      <p className="v" style={{ fontFamily: "var(--mono)", fontSize: 13 }}>
                        {formatDate(item.next_charge_at, t.locale)}
                      </p>
                    </div>
                    <div className="kv">
                      <p className="k">{t.common.cancelledAt}</p>
                      <p className="v" style={{ fontFamily: "var(--mono)", fontSize: 13 }}>
                        {formatDate(item.cancelled_at, t.locale)}
                      </p>
                    </div>
                  </div>

                  <div className="actions" style={{ marginTop: 24 }}>
                    <Link
                      href={href(`/portal/subscriptions/${encodeURIComponent(item.subscription_id)}`)}
                      className="cta"
                    >
                      {t.subs.open}
                    </Link>
                  </div>
                </article>
              </Reveal>
            ))
          : null}
      </main>

      <BillingFooter />
    </>
  );
}
