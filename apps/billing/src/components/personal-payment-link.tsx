"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { BillingCrumb, BillingFooter, BillingTop } from "@/components/billing-chrome";
import { Cockpit } from "@/components/cockpit";
import { useHref, useLang } from "@/components/lang-provider";
import { userMessage } from "@/lib/errors";
import { Reveal } from "@/components/reveal";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

type OfferPayload = {
  link_state: string;
  expires_at: string | null;
  offer: {
    plan_code: string;
    plan_name: string;
    amount_minor: number;
    currency: string;
    interval: string;
    price_label: string;
    note: string;
  };
  customer: {
    name: string | null;
    email: string | null;
    company_name: string | null;
  };
};

function formatDate(value: string | null, locale: string) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function PersonalPaymentLink({ token }: { token: string }) {
  const { t } = useLang();
  const href = useHref();
  const [offer, setOffer] = useState<OfferPayload | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadOffer() {
      try {
        const response = await fetch(
          `${apiBaseUrl}/v1/billing/personal-links/${encodeURIComponent(token)}`,
          { cache: "no-store" },
        );
        const data = (await response.json().catch(() => null)) as
          | OfferPayload
          | { message?: string }
          | null;

        if (!response.ok || !data || !("offer" in (data as object))) {
          throw new Error(
            data && "message" in data && data.message
              ? data.message
              : t.personal.errOffer,
          );
        }

        if (!isMounted) {
          return;
        }

        const resolvedOffer = data as OfferPayload;
        setOffer(resolvedOffer);
        setCustomerName(resolvedOffer.customer.name ?? "");
        setCustomerEmail(resolvedOffer.customer.email ?? "");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setFeedback(userMessage(error, t.personal.errOpen));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadOffer();

    return () => {
      isMounted = false;
    };
  }, [token, t]);

  async function onPay() {
    setIsSubmitting(true);
    setFeedback("");

    try {
      const response = await fetch(
        `${apiBaseUrl}/v1/billing/personal-links/${encodeURIComponent(token)}/checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerName,
            customerEmail,
          }),
        },
      );
      const data = (await response.json().catch(() => null)) as
        | { paymentUrl?: string; message?: string }
        | null;

      if (!response.ok || !data?.paymentUrl) {
        throw new Error(data?.message ?? t.personal.errPay);
      }

      window.location.href = data.paymentUrl;
    } catch (error) {
      setFeedback(userMessage(error, t.personal.errCheckout));
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Cockpit sky="climb" />
      <BillingTop />

      <main className="bpage">
        <BillingCrumb page={t.personal.crumb} />

        <Reveal>
          <div className="bhero">
            <div>
              <div className="eyebrow">{t.personal.eyebrow}</div>
              <h1 className="huge">{t.personal.title}</h1>
              <p className="sub">{t.personal.sub}</p>
            </div>
            {offer ? <div className="status ok">{t.personal.linkActive}</div> : null}
          </div>
        </Reveal>

        {isLoading ? <p className="note mt6">{t.personal.loading}</p> : null}

        {feedback ? <p className="alert mt6">{feedback}</p> : null}

        {!isLoading && offer ? (
          <div className="split split-l">
            <Reveal>
              <div className="paycard">
                <div className="stub">
                  <div className="tk">{t.personal.plan}</div>
                  <div className="tv">{offer.offer.plan_name}</div>
                </div>
                <div className="stub">
                  <div className="tk">{t.common.amount}</div>
                  <div className="tv big">{offer.offer.price_label}</div>
                </div>
                <div className="stub">
                  <div className="tk">{t.common.interval}</div>
                  <div className="tv">{offer.offer.interval}</div>
                </div>
                <div className="stub">
                  <div className="tk">{t.personal.validUntil}</div>
                  <div className="tv">{formatDate(offer.expires_at, t.locale)}</div>
                </div>
                <div className="stub">
                  <div className="tk">{t.personal.token}</div>
                  <div className="tv mono">{token}</div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <div className="panel">
                <p className="ptag">{t.personal.confirmTag}</p>
                <h3>{t.personal.confirmTitle}</h3>
                <p>{t.personal.confirmBody}</p>

                <form
                  className="stack"
                  style={{ marginTop: 28, gap: 20 }}
                  onSubmit={(event) => {
                    event.preventDefault();
                    void onPay();
                  }}
                >
                  <label className="field" style={{ display: "grid", gap: 10 }}>
                    <span>{t.common.name}</span>
                    <input
                      required
                      minLength={2}
                      value={customerName}
                      onChange={(event) => setCustomerName(event.target.value)}
                      placeholder={t.common.namePlaceholder}
                    />
                  </label>

                  <label className="field" style={{ display: "grid", gap: 10 }}>
                    <span>{t.common.email}</span>
                    <input
                      required
                      type="email"
                      value={customerEmail}
                      onChange={(event) => setCustomerEmail(event.target.value)}
                      placeholder="name@company.com"
                    />
                  </label>

                  {offer.offer.note ? (
                    <p className="alert alert-ok">{offer.offer.note}</p>
                  ) : null}

                  <div className="actions">
                    <button type="submit" className="cta" disabled={isSubmitting}>
                      {isSubmitting ? t.common.preparingPayment : t.common.toPayment}
                    </button>
                    <Link href={href("/portal")} className="btn">
                      {t.common.mySubs}
                    </Link>
                  </div>
                </form>
              </div>

              <div className="grid2 mt6">
                <div className="kv">
                  <p className="k">{t.common.provider}</p>
                  <p className="v" style={{ fontFamily: "var(--mono)", fontSize: 14 }}>
                    monobank
                  </p>
                </div>
                <div className="kv">
                  <p className="k">{t.common.currency}</p>
                  <p className="v" style={{ fontFamily: "var(--mono)", fontSize: 14 }}>
                    {offer.offer.currency}
                  </p>
                </div>
              </div>

              <p className="note mt6">
                {t.personal.noteBefore}
                <b>{t.personal.noteStrong}</b>
                {t.personal.noteAfter}
              </p>
            </Reveal>
          </div>
        ) : null}
      </main>

      <BillingFooter />
    </>
  );
}
