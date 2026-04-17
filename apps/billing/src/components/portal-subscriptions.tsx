"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

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

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

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

export function PortalSubscriptions() {
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
        throw new Error(data?.message ?? "Не вдалося отримати список підписок.");
      }

      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Помилка завантаження списку підписок.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="billing-shell min-h-screen">
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-10 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-black/45">AVIA Billing Portal</p>
            <h1 className="display mt-3 text-4xl font-semibold sm:text-5xl">Мої підписки</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold hover:-translate-y-0.5"
            >
              Оновити
            </button>
            <Link
              href="/portal"
              className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold hover:-translate-y-0.5"
            >
              Інший email
            </Link>
          </div>
        </header>

        <section className="grid gap-4 py-10">
          {feedback ? (
            <div className="rounded-[1.4rem] border border-[var(--danger)]/18 bg-[var(--danger)]/6 px-5 py-4 text-sm text-[var(--danger)]">
              {feedback}
            </div>
          ) : null}

          {isLoading ? (
            <div className="rounded-[1.8rem] border border-black/10 bg-white/78 p-6 text-sm text-black/60">
              Завантажуємо підписки...
            </div>
          ) : null}

          {!isLoading && !feedback && items.length === 0 ? (
            <div className="rounded-[1.8rem] border border-black/10 bg-white/78 p-6 text-sm text-black/68">
              Для цього email ще немає активних або історичних підписок.
            </div>
          ) : null}

          {!isLoading && items.length > 0
            ? items.map((item) => (
                <article
                  key={item.subscription_id}
                  className="rounded-[1.8rem] border border-black/10 bg-white/78 p-6 shadow-[0_24px_70px_-55px_rgba(0,0,0,0.45)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.22em] text-black/45">Subscription</p>
                      <p className="mt-2 break-all font-mono text-sm">{item.subscription_id}</p>
                    </div>
                    <div className="rounded-full border border-black/10 bg-black/[0.03] px-4 py-2 text-sm font-medium">
                      {item.status}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <StatItem label="Сума" value={formatAmount(item.amount_minor, item.currency)} />
                    <StatItem label="Інтервал" value={item.interval} />
                    <StatItem label="Наступне списання" value={formatDate(item.next_charge_at)} />
                    <StatItem label="Скасовано" value={formatDate(item.cancelled_at)} />
                  </div>

                  <div className="mt-5">
                    <Link
                      href={`/portal/subscriptions/${encodeURIComponent(item.subscription_id)}`}
                      className="inline-flex w-full justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:-translate-y-0.5 sm:w-auto"
                    >
                      Відкрити деталі
                    </Link>
                  </div>
                </article>
              ))
            : null}
        </section>
      </div>
    </main>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-black/8 bg-black/[0.03] px-4 py-4">
      <p className="text-xs uppercase tracking-[0.2em] text-black/45">{label}</p>
      <p className="mt-2 text-base font-medium">{value}</p>
    </div>
  );
}
