"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { BillingCrumb, BillingFooter, BillingTop } from "@/components/billing-chrome";
import { Cockpit } from "@/components/cockpit";
import { useHref, useLang } from "@/components/lang-provider";
import { userMessage } from "@/lib/errors";
import { Reveal } from "@/components/reveal";
import type { Dict } from "@/lib/i18n";
import {
  getResultStateUi,
  isCancelActionVisible,
  shouldStopPolling,
} from "@/components/result-state";

type CheckoutStatus = {
  checkoutId: string;
  subscriptionId?: string;
  planName: string;
  amount: number;
  ccy: number;
  status: string;
  monobankStatus: string | null;
  nextChargeDate: string | null;
  startDate: string | null;
  endDate: string | null;
  cancellationDesc: string | null;
  totalPaid: number;
  totalFailed: number;
  canCancel: boolean;
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

/** Тон індикатора для кожного стану. */
function statusTone(status: string) {
  if (status === "active") return "ok";
  if (status === "awaiting_payment") return "wait";
  if (status === "cancelled") return "off";
  if (["past_due", "suspended", "failed", "failed_initial_payment", "expired"].includes(status)) {
    return "bad";
  }
  return "";
}

function parseRequestError(error: unknown, t: Dict): string {
  if (!(error instanceof Error)) {
    return t.status.errStatus;
  }

  const normalized = error.message.toLowerCase();

  if (normalized.includes("404") || normalized.includes("not found")) {
    return t.status.errNotFound;
  }

  if (normalized.includes("invalid") || normalized.includes("identifier")) {
    return t.status.errIncomplete;
  }

  if (normalized.includes("network") || normalized.includes("fetch")) {
    return t.status.errNetwork;
  }

  // Усе інше може бути технічним текстом бібліотеки — фільтруємо.
  return userMessage(error, t.status.errStatus);
}

export function SubscriptionStatus({ checkoutId }: { checkoutId: string }) {
  const { t } = useLang();
  const href = useHref();
  const [checkout, setCheckout] = useState<CheckoutStatus | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isPolling, setIsPolling] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const fetchStatus = useCallback(
    async (refresh: boolean) => {
      const response = await fetch(
        `${apiBaseUrl}/v1/billing/checkouts/${checkoutId}?refresh=${refresh}`,
        {
          cache: "no-store",
        },
      );

      const data = (await response.json().catch(() => null)) as
        | CheckoutStatus
        | { message?: string }
        | null;

      if (!response.ok || !data || typeof data !== "object" || !("status" in data)) {
        throw new Error(
          data && "message" in data && data.message
            ? data.message
            : `Checkout status request failed (${response.status}).`,
        );
      }

      setCheckout(data as CheckoutStatus);
      setFeedback("");

      if (shouldStopPolling((data as CheckoutStatus).status)) {
        setIsPolling(false);
      }
    },
    [checkoutId],
  );

  useEffect(() => {
    if (!checkoutId) {
      setFeedback(t.status.errIncomplete);
      setIsPolling(false);
      return;
    }

    let isMounted = true;

    async function loadInitial() {
      try {
        await fetchStatus(true);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setFeedback(parseRequestError(error, t));
        setIsPolling(false);
      }
    }

    void loadInitial();

    intervalRef.current = window.setInterval(() => {
      if (!isPolling || !isMounted) {
        return;
      }

      void fetchStatus(true).catch((error: unknown) => {
        if (!isMounted) {
          return;
        }

        setFeedback(parseRequestError(error, t));
        setIsPolling(false);
      });
    }, 6000);

    return () => {
      isMounted = false;

      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [checkoutId, fetchStatus, isPolling, t]);

  async function onRefresh() {
    setIsRefreshing(true);
    setFeedback("");

    try {
      await fetchStatus(true);
      setIsPolling(true);
    } catch (error) {
      setFeedback(parseRequestError(error, t));
    } finally {
      setIsRefreshing(false);
    }
  }

  async function onCancel() {
    if (!checkout || !isCancelActionVisible(checkout.status, checkout.canCancel)) {
      return;
    }

    setIsCancelling(true);
    setFeedback("");

    try {
      const response = await fetch(
        `${apiBaseUrl}/v1/billing/checkouts/${checkout.checkoutId}/cancel`,
        {
          method: "POST",
        },
      );
      const data = (await response.json().catch(() => null)) as
        | CheckoutStatus
        | { message?: string }
        | null;

      if (!response.ok || !data || !("status" in (data as object))) {
        throw new Error(
          data && "message" in data && data.message
            ? data.message
            : t.status.errCancel,
        );
      }

      setCheckout(data as CheckoutStatus);
      setIsPolling(false);
      setFeedback(t.status.cancelled);
    } catch (error) {
      setFeedback(parseRequestError(error, t));
    } finally {
      setIsCancelling(false);
    }
  }

  const statusUi = getResultStateUi(checkout?.status ?? "unknown", t);
  const cancelVisible = checkout
    ? isCancelActionVisible(checkout.status, checkout.canCancel)
    : false;

  return (
    <>
      <Cockpit sky="climb" />
      <BillingTop />

      <main className="bpage">
        <BillingCrumb page={t.status.crumb} />

        <Reveal>
          <div className="eyebrow">{t.status.eyebrow}</div>
          <h1 className="huge">{t.status.title}</h1>
        </Reveal>

        <Reveal>
          <div className="panel mt6">
            <p className="ptag">{t.status.currentTag}</p>
            <h3 style={{ fontSize: "clamp(26px,3.4vw,46px)" }}>
              {checkout?.planName ?? t.status.loadingPlan}
            </h3>
            {checkout ? (
              <div
                className={`status ${statusTone(checkout.status)}`}
                style={{ marginBottom: 16 }}
              >
                {checkout.status}
              </div>
            ) : null}
            <p style={{ fontSize: 16, maxWidth: 760 }}>{statusUi.description}</p>
          </div>
        </Reveal>

        {feedback ? <p className="alert mt6">{feedback}</p> : null}

        {!checkout ? <p className="note mt6">{t.status.loadingHint}</p> : null}

        {checkout ? (
          <div className="split split-l">
            <Reveal>
              <div className="panel">
                <p className="ptag">{t.status.detailsTag}</p>
                <div className="stack" style={{ marginTop: 20 }}>
                  {[
                    [t.common.status, checkout.status],
                    [t.status.monoStatus, checkout.monobankStatus ?? "—"],
                    [t.status.start, formatDate(checkout.startDate ?? null, t.locale)],
                    [
                      t.common.nextCharge,
                      formatDate(checkout.nextChargeDate ?? null, t.locale),
                    ],
                    [t.status.end, formatDate(checkout.endDate ?? null, t.locale)],
                  ].map(([label, value]) => (
                    <div key={label} className="kv">
                      <p className="k">{label}</p>
                      <p
                        className="v"
                        style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 400 }}
                      >
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <div className="panel">
                <p className="ptag">{t.status.actionsTag}</p>

                <div className="grid2" style={{ marginTop: 20 }}>
                  <div className="kv">
                    <p className="k">{t.status.paid}</p>
                    <p
                      className="v"
                      style={{ fontSize: 30, fontWeight: 800, color: "var(--signal)" }}
                    >
                      {checkout.totalPaid ?? 0}
                    </p>
                  </div>
                  <div className="kv">
                    <p className="k">{t.status.failed}</p>
                    <p className="v" style={{ fontSize: 30, fontWeight: 800 }}>
                      {checkout.totalFailed ?? 0}
                    </p>
                  </div>
                </div>

                <p
                  className={`alert ${statusTone(checkout.status) === "ok" ? "alert-ok" : ""}`}
                  style={{ marginTop: 20 }}
                >
                  {checkout.cancellationDesc
                    ? checkout.cancellationDesc
                    : t.status.cancelHint}
                </p>

                <div className="actions mt6" id="refresh">
                  {statusUi.ctaHref !== "#refresh" ? (
                    <Link
                      href={statusUi.ctaHref}
                      className={statusUi.ctaVariant === "primary" ? "cta" : "btn"}
                    >
                      {statusUi.ctaLabel}
                    </Link>
                  ) : null}

                  <button
                    type="button"
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="btn"
                  >
                    {isRefreshing ? t.status.refreshing : t.status.refresh}
                  </button>

                  {cancelVisible ? (
                    <button
                      type="button"
                      onClick={onCancel}
                      disabled={isCancelling}
                      className="btn"
                    >
                      {isCancelling
                        ? t.common.cancelling
                        : checkout.status === "awaiting_payment"
                          ? t.status.cancelPayment
                          : t.common.cancelAuto}
                    </button>
                  ) : null}

                  {checkout.subscriptionId ? (
                    <Link
                      href={href(`/subscriptions/${encodeURIComponent(checkout.subscriptionId)}`)}
                      className="ghost"
                    >
                      {t.status.manage}
                    </Link>
                  ) : null}
                </div>
              </div>
            </Reveal>
          </div>
        ) : null}

        <section className="sec">
          <Reveal>
            <div className="sec-head">
              <h2 className="mid">
                {t.status.lifecycleTitle[0]}
                <br />
                {t.status.lifecycleTitle[1]}
              </h2>
              <span className="tag">{t.status.lifecycleTag}</span>
            </div>
          </Reveal>
          <Reveal>
            <div className="plan" style={{ width: "100%" }}>
              {t.status.lifecycle.map((phase) => (
                <div key={phase.ph} className="phase">
                  <div className="ph">{phase.ph}</div>
                  <h3>{phase.title}</h3>
                  <p>{phase.text}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </section>
      </main>

      <BillingFooter />
    </>
  );
}
