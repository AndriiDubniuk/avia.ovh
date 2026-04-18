"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

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
const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL ?? "http://localhost:3000";

function createIdempotencyKey(prefix: string) {
  const randomPart =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${prefix}-${randomPart}`;
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("uk-UA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatAmount(minor: number, currency: string) {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(minor / 100);
}

export function summarizeHistory(snapshot: SubscriptionSnapshot): string[] {
  const summary: string[] = [];

  if (typeof snapshot.total_paid === "number") {
    summary.push(`Успішних списань: ${snapshot.total_paid}`);
  }

  if (typeof snapshot.total_failed === "number") {
    summary.push(`Невдалих списань: ${snapshot.total_failed}`);
  }

  if (typeof snapshot.retry_count === "number") {
    summary.push(`Поточний retry_count: ${snapshot.retry_count}`);
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
  const [snapshot, setSnapshot] = useState<SubscriptionSnapshot | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isPaymentStarting, setIsPaymentStarting] = useState(false);
  const [expandedHistoryKind, setExpandedHistoryKind] = useState<"success" | "failed" | null>(null);
  const [paymentAttempts, setPaymentAttempts] = useState<PaymentAttemptItem[]>([]);

  const historySummary = useMemo(
    () => (snapshot ? summarizeHistory(snapshot) : []),
    [snapshot],
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
          data && "message" in data && data.message
            ? data.message
            : `Не вдалося отримати підписку (${response.status}).`,
        );
      }

      setSnapshot(data as SubscriptionSnapshot);
      setFeedback("");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Помилка завантаження підписки.");
    } finally {
      setIsLoading(false);
    }
  }, [mode, subscriptionPath]);

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
          data && "message" in data && data.message
            ? data.message
            : `Не вдалося отримати платіжні операції (${response.status}).`,
        );
      }

      setPaymentAttempts(data.items);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Помилка завантаження операцій.");
    } finally {
      setIsHistoryLoading(false);
    }
  }, [mode, paymentAttemptsPath]);

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
          data && "message" in data && data.message
            ? data.message
            : "Не вдалося скасувати підписку.",
        );
      }

      setSnapshot(data as SubscriptionSnapshot);
      setFeedback("Автопродовження скасовано.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Помилка скасування.");
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
      setFeedback(
        "Час на оплату сплив. Будь ласка, зверніться до менеджера за новим персональним посиланням.",
      );
      return;
    }

    setIsPaymentStarting(true);
    setFeedback("");

    try {
      window.location.href = snapshot.latest_checkout_url;
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Помилка запуску оплати.");
    } finally {
      setIsPaymentStarting(false);
    }
  }

  return (
    <main className="billing-shell min-h-screen">
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-10 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-black/45">AVIA Billing</p>
            <h1 className="display mt-3 text-4xl font-semibold sm:text-5xl">Керування підпискою</h1>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href="/"
              className="rounded-full border border-black/10 bg-white/70 px-5 py-3 hover:-translate-y-0.5"
            >
              До checkout
            </Link>
            <Link
              href={mode === "portal" ? "/portal/subscriptions" : landingUrl}
              className="rounded-full border border-black/10 bg-white/70 px-5 py-3 hover:-translate-y-0.5"
            >
              {mode === "portal" ? "Мої підписки" : "На головну"}
            </Link>
          </div>
        </header>

        <section className="grid flex-1 gap-6 py-10">
          <div className="rounded-[1.8rem] border border-black/10 bg-white/78 p-6 shadow-[0_24px_70px_-55px_rgba(0,0,0,0.45)]">
            <p className="text-sm uppercase tracking-[0.22em] text-black/45">Subscription ID</p>
            <p className="mt-2 break-all font-mono text-sm">{subscriptionId}</p>
          </div>

          {feedback ? (
            <div className="rounded-[1.4rem] border border-[var(--danger)]/18 bg-[var(--danger)]/6 px-5 py-4 text-sm text-[var(--danger)]">
              {feedback}
            </div>
          ) : null}

          {isLoading ? (
            <div className="rounded-[1.8rem] border border-black/10 bg-white/78 p-6 text-sm text-black/60">
              Завантажуємо дані підписки...
            </div>
          ) : null}

          {!isLoading && snapshot ? (
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[1.8rem] border border-black/10 bg-white/78 p-6">
                <p className="text-sm uppercase tracking-[0.22em] text-black/45">Поточний стан</p>
                <div className="mt-4 grid gap-3">
                  <StatItem label="Статус" value={snapshot.status} />
                  <StatItem
                    label="Сума"
                    value={formatAmount(snapshot.amount_minor, snapshot.currency)}
                  />
                  <StatItem label="Інтервал" value={snapshot.interval} />
                  <StatItem
                    label="Наступне списання"
                    value={formatDate(snapshot.next_charge_at)}
                  />
                  <StatItem
                    label="Скасовано"
                    value={formatDate(snapshot.cancelled_at)}
                  />
                </div>
              </div>

              <div className="rounded-[1.8rem] border border-black/10 bg-[rgba(255,251,245,0.88)] p-6">
                <p className="text-sm uppercase tracking-[0.22em] text-black/45">
                  Платіжна історія (summary)
                </p>

                {historySummary.length > 0 ? (
                  <div className="mt-4 grid gap-3">
                    <button
                      type="button"
                      onClick={() => void onToggleHistory("success")}
                      className="rounded-[1.3rem] border border-black/8 bg-white/80 px-4 py-4 text-left text-sm text-black/75"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span>Успішних списань: {snapshot.total_paid ?? 0}</span>
                        <span>{expandedHistoryKind === "success" ? "▾" : "▸"}</span>
                      </div>
                    </button>

                    {expandedHistoryKind === "success" ? (
                      <div className="grid gap-3">
                        {isHistoryLoading ? (
                          <div className="rounded-[1.2rem] border border-black/8 bg-white/75 px-4 py-3 text-sm text-black/60">
                            Завантажуємо операції...
                          </div>
                        ) : successfulAttempts.length > 0 ? (
                          successfulAttempts.map((attempt) => (
                            <div
                              key={attempt.payment_attempt_id}
                              className="rounded-[1.2rem] border border-black/8 bg-white/75 px-4 py-3 text-sm text-black/70"
                            >
                              <p>{attempt.type} · {attempt.status}</p>
                              <p>{formatAmount(attempt.amount_minor, attempt.currency)}</p>
                              <p>Створено: {formatDate(attempt.created_at)}</p>
                              <p>Завершено: {formatDate(attempt.finalized_at)}</p>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-[1.2rem] border border-black/8 bg-white/75 px-4 py-3 text-sm text-black/60">
                            Успішних операцій ще немає.
                          </div>
                        )}
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => void onToggleHistory("failed")}
                      className="rounded-[1.3rem] border border-black/8 bg-white/80 px-4 py-4 text-left text-sm text-black/75"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span>Невдалих списань: {snapshot.total_failed ?? 0}</span>
                        <span>{expandedHistoryKind === "failed" ? "▾" : "▸"}</span>
                      </div>
                    </button>

                    {expandedHistoryKind === "failed" ? (
                      <div className="grid gap-3">
                        {isHistoryLoading ? (
                          <div className="rounded-[1.2rem] border border-black/8 bg-white/75 px-4 py-3 text-sm text-black/60">
                            Завантажуємо операції...
                          </div>
                        ) : failedAttempts.length > 0 ? (
                          failedAttempts.map((attempt) => (
                            <div
                              key={attempt.payment_attempt_id}
                              className="rounded-[1.2rem] border border-black/8 bg-white/75 px-4 py-3 text-sm text-black/70"
                            >
                              <p>{attempt.type} · {attempt.status}</p>
                              <p>{formatAmount(attempt.amount_minor, attempt.currency)}</p>
                              <p>Створено: {formatDate(attempt.created_at)}</p>
                              <p>Завершено: {formatDate(attempt.finalized_at)}</p>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-[1.2rem] border border-black/8 bg-white/75 px-4 py-3 text-sm text-black/60">
                            Невдалих операцій немає.
                          </div>
                        )}
                      </div>
                    ) : null}

                    <div className="rounded-[1.3rem] border border-black/8 bg-white/80 px-4 py-4 text-sm text-black/75">
                      Поточний retry_count: {snapshot.retry_count ?? 0}
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-black/60">
                    Summary ще недоступний у поточній відповіді API.
                  </p>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void loadSubscription()}
                    className="w-full rounded-full border border-black/10 bg-white px-6 py-4 text-sm font-semibold hover:-translate-y-0.5 sm:w-auto"
                  >
                    Оновити
                  </button>

                  {canStartPayment ? (
                    isPendingCheckoutExpired ? (
                      <div className="w-full rounded-[1.2rem] border border-black/10 bg-white/80 px-4 py-3 text-sm text-black/70 sm:w-auto">
                        Час на оплату сплив. Будь ласка, зверніться до менеджера за новим персональним посиланням.
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void onStartPayment()}
                        disabled={isPaymentStarting}
                        className="w-full rounded-full bg-black px-6 py-4 text-sm font-semibold text-white hover:-translate-y-0.5 hover:bg-black/92 disabled:opacity-60 sm:w-auto"
                      >
                        {isPaymentStarting ? "Переходимо..." : "Сплатити зараз"}
                      </button>
                    )
                  ) : null}

                  {canCancel ? (
                    <button
                      type="button"
                      onClick={onCancel}
                      disabled={isCancelling}
                      className="w-full rounded-full bg-black px-6 py-4 text-sm font-semibold text-white hover:-translate-y-0.5 hover:bg-black/92 disabled:opacity-60 sm:w-auto"
                    >
                      {isCancelling ? "Скасовуємо..." : "Скасувати автопродовження"}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-black/8 bg-black/[0.03] px-4 py-4">
      <p className="text-xs uppercase tracking-[0.2em] text-black/45">{label}</p>
      <p className="mt-2 text-base font-medium">{value}</p>
    </div>
  );
}
