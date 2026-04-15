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
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";
const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL ?? "http://localhost:3000";

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

  const historySummary = useMemo(
    () => (snapshot ? summarizeHistory(snapshot) : []),
    [snapshot],
  );

  const canCancel = Boolean(
    snapshot &&
      snapshot.cancelled_at === null &&
      ["active", "past_due"].includes(snapshot.status),
  );

  const subscriptionPath =
    mode === "portal"
      ? `/v1/billing/portal/subscriptions/${encodeURIComponent(subscriptionId)}`
      : `/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`;
  const cancelPath =
    mode === "portal"
      ? `/v1/billing/portal/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`
      : `/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`;

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
            <p className="mt-2 font-mono text-sm">{subscriptionId}</p>
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
                    {historySummary.map((item) => (
                      <div
                        key={item}
                        className="rounded-[1.3rem] border border-black/8 bg-white/80 px-4 py-4 text-sm text-black/75"
                      >
                        {item}
                      </div>
                    ))}
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
                    className="rounded-full border border-black/10 bg-white px-6 py-4 text-sm font-semibold hover:-translate-y-0.5"
                  >
                    Оновити
                  </button>

                  {canCancel ? (
                    <button
                      type="button"
                      onClick={onCancel}
                      disabled={isCancelling}
                      className="rounded-full bg-black px-6 py-4 text-sm font-semibold text-white hover:-translate-y-0.5 hover:bg-black/92 disabled:opacity-60"
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
