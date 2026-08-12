"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { BillingCrumb, BillingFooter, BillingTop } from "@/components/billing-chrome";
import { Cockpit } from "@/components/cockpit";
import { useHref, useLang } from "@/components/lang-provider";
import { userMessage } from "@/lib/errors";
import { Reveal } from "@/components/reveal";
import { DICT, type Dict } from "@/lib/i18n";

type SubscriptionSnapshot = {
  subscription_id: string;
  status: string;
  client_id: string;
  payment_method_id: string | null;
  amount_minor: number;
  currency: string;
  interval: string;
  next_charge_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  total_paid?: number;
  total_failed?: number;
  retry_count?: number;
  latest_checkout_url?: string | null;
  latest_checkout_expires_at?: string | null;
};

type PaymentAttemptItem = {
  payment_attempt_id: string;
  type: string;
  status: string;
  amount_minor: number;
  currency: string;
  billing_period_key: string;
  created_at: string;
  finalized_at: string | null;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

function createIdempotencyKey(prefix: string) {
  const randomPart =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${prefix}-${randomPart}`;
}

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

/** Словник необовʼязковий: без нього повертається українська — мова за замовчуванням. */
export function summarizeHistory(
  snapshot: SubscriptionSnapshot,
  t: Dict = DICT.ua,
): string[] {
  const summary: string[] = [];

  if (typeof snapshot.total_paid === "number") {
    summary.push(t.manage.paidCount(snapshot.total_paid));
  }

  if (typeof snapshot.total_failed === "number") {
    summary.push(t.manage.failedCount(snapshot.total_failed));
  }

  if (typeof snapshot.retry_count === "number") {
    summary.push(t.manage.retryCount(snapshot.retry_count));
  }

  return summary;
}

type SubscriptionManagementMode = "public" | "portal";

export function SubscriptionManagement({
  subscriptionId,
  mode = "public",
}: {
  subscriptionId: string;
  mode?: SubscriptionManagementMode;
}) {
  const { t } = useLang();
  const href = useHref();
  const [snapshot, setSnapshot] = useState<SubscriptionSnapshot | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isPaymentStarting, setIsPaymentStarting] = useState(false);
  const [expandedHistoryKind, setExpandedHistoryKind] = useState<"success" | "failed" | null>(null);
  const [paymentAttempts, setPaymentAttempts] = useState<PaymentAttemptItem[]>([]);

  const historySummary = useMemo(
    () => (snapshot ? summarizeHistory(snapshot, t) : []),
    [snapshot, t],
  );

  const canCancel = Boolean(
    snapshot &&
      snapshot.cancelled_at === null &&
      ["pending_initial_payment", "active", "past_due"].includes(snapshot.status),
  );
  const canStartPayment = snapshot?.status === "pending_initial_payment";

  const subscriptionPath =
    mode === "portal"
      ? `/v1/billing/portal/subscriptions/${encodeURIComponent(subscriptionId)}`
      : `/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`;
  const cancelPath =
    mode === "portal"
      ? `/v1/billing/portal/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`
      : `/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`;
  const paymentAttemptsPath =
    mode === "portal"
      ? `/v1/billing/portal/subscriptions/${encodeURIComponent(subscriptionId)}/payment-attempts`
      : `/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}/payment-attempts`;

  const loadSubscription = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}${subscriptionPath}`, {
        cache: "no-store",
        credentials: mode === "portal" ? "include" : "same-origin",
      });
      const data = (await response.json().catch(() => null)) as
        | SubscriptionSnapshot
        | { message?: string }
        | null;

      if (!response.ok || !data || !("subscription_id" in (data as object))) {
        throw new Error(
          data && "message" in data && data.message ? data.message : t.manage.errLoad,
        );
      }

      setSnapshot(data as SubscriptionSnapshot);
      setFeedback("");
    } catch (error) {
      setFeedback(userMessage(error, t.manage.errLoad));
    } finally {
      setIsLoading(false);
    }
  }, [mode, subscriptionPath, t]);

  const loadPaymentAttempts = useCallback(async () => {
    setIsHistoryLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}${paymentAttemptsPath}`, {
        cache: "no-store",
        credentials: mode === "portal" ? "include" : "same-origin",
      });
      const data = (await response.json().catch(() => null)) as
        | { items?: PaymentAttemptItem[]; message?: string }
        | null;

      if (!response.ok || !data || !Array.isArray(data.items)) {
        throw new Error(
          data && "message" in data && data.message ? data.message : t.manage.errHistory,
        );
      }

      setPaymentAttempts(data.items);
    } catch (error) {
      setFeedback(userMessage(error, t.manage.errHistory));
    } finally {
      setIsHistoryLoading(false);
    }
  }, [mode, paymentAttemptsPath, t]);

  useEffect(() => {
    if (snapshot?.status === "pending_initial_payment") {
      void loadPaymentAttempts();
    }
  }, [snapshot?.status, loadPaymentAttempts]);

  const successfulAttempts = useMemo(
    () => paymentAttempts.filter((attempt) => attempt.status === "success"),
    [paymentAttempts],
  );
  const failedAttempts = useMemo(
    () => paymentAttempts.filter((attempt) => attempt.status === "failed"),
    [paymentAttempts],
  );

  const isPendingCheckoutExpired = useMemo(() => {
    const expiresAt = snapshot?.latest_checkout_expires_at;
    if (!expiresAt) {
      return true;
    }
    const expiresAtMs = new Date(expiresAt).getTime();
    if (Number.isNaN(expiresAtMs)) {
      return true;
    }
    return Date.now() >= expiresAtMs;
  }, [snapshot?.latest_checkout_expires_at]);

  useEffect(() => {
    void loadSubscription();
  }, [loadSubscription]);

  async function onCancel() {
    if (!canCancel) {
      return;
    }

    setIsCancelling(true);
    setFeedback("");

    try {
      const response = await fetch(`${apiBaseUrl}${cancelPath}`, {
        method: "POST",
        headers: {
          "Idempotency-Key": createIdempotencyKey(`cancel-${subscriptionId}`),
        },
        credentials: mode === "portal" ? "include" : "same-origin",
      });
      const data = (await response.json().catch(() => null)) as
        | SubscriptionSnapshot
        | { message?: string }
        | null;

      if (!response.ok || !data || !("subscription_id" in (data as object))) {
        throw new Error(
          data && "message" in data && data.message ? data.message : t.manage.errCancel,
        );
      }

      setSnapshot(data as SubscriptionSnapshot);
      setFeedback(t.manage.cancelledMsg);
    } catch (error) {
      setFeedback(userMessage(error, t.manage.errCancelRetry));
    } finally {
      setIsCancelling(false);
    }
  }

  async function onToggleHistory(kind: "success" | "failed") {
    const next = expandedHistoryKind === kind ? null : kind;
    setExpandedHistoryKind(next);
    if (next && paymentAttempts.length === 0) {
      await loadPaymentAttempts();
    }
  }

  async function onStartPayment() {
    if (!canStartPayment) {
      return;
    }

    if (!snapshot?.latest_checkout_url || isPendingCheckoutExpired) {
      setFeedback(t.manage.checkoutExpired);
      return;
    }

    setIsPaymentStarting(true);
    setFeedback("");

    try {
      window.location.href = snapshot.latest_checkout_url;
    } catch (error) {
      setFeedback(userMessage(error, t.manage.errPay));
    } finally {
      setIsPaymentStarting(false);
    }
  }

  const tone =
    snapshot?.status === "active"
      ? "ok"
      : snapshot?.status === "cancelled"
        ? "off"
        : snapshot && ["past_due", "suspended", "failed"].includes(snapshot.status)
          ? "bad"
          : "wait";

  return (
    <>
      <Cockpit sky="climb" />
      <BillingTop>
        <Link
          href={href(mode === "portal" ? "/portal/subscriptions" : "/")}
          className="ghost"
        >
          {mode === "portal" ? t.manage.topLinkPortal : t.manage.topLinkPublic}
        </Link>
      </BillingTop>

      <main className="bpage">
        <BillingCrumb page={t.manage.crumb} />

        <Reveal>
          <div className="eyebrow">{t.manage.eyebrow}</div>
          <h1 className="huge">{t.manage.title}</h1>
          <p className="sub">{t.manage.sub}</p>
        </Reveal>

        <Reveal>
          <div className="panel mt6">
            <p className="ptag">{t.manage.idTag}</p>
            <p className="sid">{subscriptionId}</p>
          </div>
        </Reveal>

        {feedback ? <p className="alert mt6">{feedback}</p> : null}

        {isLoading ? <p className="note mt6">{t.manage.loading}</p> : null}

        {!isLoading && snapshot ? (
          <div className="split split-l">
            <Reveal>
              <div className="panel">
                <p className="ptag">{t.manage.stateTag}</p>
                <div className={`status ${tone}`} style={{ marginTop: 18 }}>
                  {snapshot.status}
                </div>
                <div className="stack" style={{ marginTop: 18 }}>
                  <div className="kv">
                    <p className="k">{t.common.amount}</p>
                    <p className="v" style={{ fontSize: 28, fontWeight: 800, color: "var(--signal)" }}>
                      {formatAmount(snapshot.amount_minor, snapshot.currency, t.locale)}
                    </p>
                  </div>
                  <div className="kv">
                    <p className="k">{t.common.interval}</p>
                    <p className="v" style={{ fontFamily: "var(--mono)", fontSize: 13 }}>
                      {snapshot.interval}
                    </p>
                  </div>
                  <div className="kv">
                    <p className="k">{t.common.nextCharge}</p>
                    <p className="v" style={{ fontFamily: "var(--mono)", fontSize: 13 }}>
                      {formatDate(snapshot.next_charge_at, t.locale)}
                    </p>
                  </div>
                  <div className="kv">
                    <p className="k">{t.common.cancelledAt}</p>
                    <p className="v" style={{ fontFamily: "var(--mono)", fontSize: 13 }}>
                      {formatDate(snapshot.cancelled_at, t.locale)}
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <div className="panel">
                <p className="ptag">{t.manage.historyTag}</p>

                {historySummary.length > 0 ? (
                  <>
                    <details
                      className="acc"
                      open={expandedHistoryKind === "success"}
                      onToggle={(event) => {
                        if ((event.currentTarget as HTMLDetailsElement).open) {
                          void onToggleHistory("success");
                        }
                      }}
                    >
                      <summary>
                        <span>{t.manage.paidCount(snapshot.total_paid ?? 0)}</span>
                        <span>{expandedHistoryKind === "success" ? "▾" : "▸"}</span>
                      </summary>
                      {isHistoryLoading ? (
                        <div className="att">{t.manage.historyLoading}</div>
                      ) : successfulAttempts.length > 0 ? (
                        successfulAttempts.map((attempt) => (
                          <div key={attempt.payment_attempt_id} className="att">
                            <b>
                              {attempt.type} · {attempt.status}
                            </b>
                            <br />
                            <span className="amt">
                              {formatAmount(attempt.amount_minor, attempt.currency, t.locale)}
                            </span>
                            <br />
                            {t.manage.created}: {formatDate(attempt.created_at, t.locale)}
                            <br />
                            {t.manage.finalized}: {formatDate(attempt.finalized_at, t.locale)}
                          </div>
                        ))
                      ) : (
                        <div className="att">{t.manage.noPaid}</div>
                      )}
                    </details>

                    <details
                      className="acc"
                      open={expandedHistoryKind === "failed"}
                      onToggle={(event) => {
                        if ((event.currentTarget as HTMLDetailsElement).open) {
                          void onToggleHistory("failed");
                        }
                      }}
                    >
                      <summary>
                        <span>{t.manage.failedCount(snapshot.total_failed ?? 0)}</span>
                        <span>{expandedHistoryKind === "failed" ? "▾" : "▸"}</span>
                      </summary>
                      {isHistoryLoading ? (
                        <div className="att">{t.manage.historyLoading}</div>
                      ) : failedAttempts.length > 0 ? (
                        failedAttempts.map((attempt) => (
                          <div key={attempt.payment_attempt_id} className="att">
                            <b>
                              {attempt.type} · <span className="fail">{attempt.status}</span>
                            </b>
                            <br />
                            <span className="fail">
                              {formatAmount(attempt.amount_minor, attempt.currency, t.locale)}
                            </span>
                            <br />
                            {t.manage.created}: {formatDate(attempt.created_at, t.locale)}
                            <br />
                            {t.manage.finalized}: {formatDate(attempt.finalized_at, t.locale)}
                          </div>
                        ))
                      ) : (
                        <div className="att">{t.manage.noFailed}</div>
                      )}
                    </details>

                    <div className="kv" style={{ marginTop: 16 }}>
                      <p className="k">{t.manage.retries}</p>
                      <p className="v" style={{ fontSize: 28, fontWeight: 800 }}>
                        {snapshot.retry_count ?? 0}
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="note" style={{ marginTop: 16 }}>
                    {t.manage.historyUnavailable}
                  </p>
                )}

                <div className="actions mt6">
                  <button type="button" className="btn" onClick={() => void loadSubscription()}>
                    {t.common.refresh}
                  </button>

                  {canStartPayment ? (
                    isPendingCheckoutExpired ? (
                      <p className="note">{t.manage.checkoutExpired}</p>
                    ) : (
                      <button
                        type="button"
                        className="cta"
                        onClick={() => void onStartPayment()}
                        disabled={isPaymentStarting}
                      >
                        {isPaymentStarting ? t.manage.payOpening : t.manage.payNow}
                      </button>
                    )
                  ) : null}

                  {canCancel ? (
                    <button
                      type="button"
                      className="btn"
                      onClick={onCancel}
                      disabled={isCancelling}
                    >
                      {isCancelling ? t.common.cancelling : t.common.cancelAuto}
                    </button>
                  ) : null}
                </div>
              </div>
            </Reveal>
          </div>
        ) : null}

        <section className="sec">
          <Reveal>
            <div className="panel panel-lit">
              <p className="ptag">{t.manage.aboutTag}</p>
              <h3>{t.manage.aboutTitle}</h3>
              <p>{t.manage.aboutBody}</p>
              <div className="stack mt6">
                {t.manage.aboutChecks.map((check) => (
                  <p key={check} className="check">
                    {check}
                  </p>
                ))}
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <BillingFooter />
    </>
  );
}
