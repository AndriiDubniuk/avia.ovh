"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { getResultStateUi, isCancelActionVisible, shouldStopPolling } from "@/components/result-state";

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

function parseRequestError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Не вдалося отримати статус checkout.";
  }

  const normalized = error.message.toLowerCase();

  if (normalized.includes("404") || normalized.includes("not found")) {
    return "Checkout не знайдено. Перевірте посилання або створіть новий checkout.";
  }

  if (normalized.includes("invalid") || normalized.includes("identifier")) {
    return "Некоректний ідентифікатор checkout. Відкрийте сторінку з валідним checkoutId.";
  }

  if (normalized.includes("network") || normalized.includes("fetch")) {
    return "Немає з'єднання з API. Перевірте, чи запущений backend, і спробуйте ще раз.";
  }

  return error.message;
}

export function SubscriptionStatus({ checkoutId }: { checkoutId: string }) {
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
      setFeedback("Не передано ідентифікатор checkout.");
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

        setFeedback(parseRequestError(error));
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

        setFeedback(parseRequestError(error));
        setIsPolling(false);
      });
    }, 6000);

    return () => {
      isMounted = false;

      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [checkoutId, fetchStatus, isPolling]);

  async function onRefresh() {
    setIsRefreshing(true);
    setFeedback("");

    try {
      await fetchStatus(true);
      setIsPolling(true);
    } catch (error) {
      setFeedback(parseRequestError(error));
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
            : "Не вдалося скасувати автопродовження.",
        );
      }

      setCheckout(data as CheckoutStatus);
      setIsPolling(false);
      setFeedback("Автопродовження скасовано. Нових списань більше не буде.");
    } catch (error) {
      setFeedback(parseRequestError(error));
    } finally {
      setIsCancelling(false);
    }
  }

  const statusUi = getResultStateUi(checkout?.status ?? "unknown");
  const cancelVisible = checkout
    ? isCancelActionVisible(checkout.status, checkout.canCancel)
    : false;

  return (
    <main className="billing-shell min-h-screen">
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-10 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-black/45">AVIA Billing</p>
            <h1 className="display mt-3 text-4xl font-semibold sm:text-5xl">Статус підписки</h1>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href="/"
              className="rounded-full border border-black/10 bg-white/70 px-5 py-3 hover:-translate-y-0.5"
            >
              Оформити ще одну
            </Link>
            <Link
              href={landingUrl}
              className="rounded-full border border-black/10 bg-white/70 px-5 py-3 hover:-translate-y-0.5"
            >
              На головну
            </Link>
          </div>
        </header>

        <section className="grid flex-1 gap-6 py-10">
          <div className="rounded-[2rem] border border-black/10 bg-[#151515] p-6 text-white shadow-[0_28px_90px_-60px_rgba(0,0,0,0.65)] sm:p-7">
            <p className="text-sm uppercase tracking-[0.24em] text-white/45">Поточний стан</p>
            <h2 className="display mt-4 text-4xl font-semibold">
              {checkout?.planName ?? "Завантажуємо checkout..."}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/72">{statusUi.description}</p>
          </div>

          {feedback ? (
            <div className="rounded-[1.4rem] border border-[var(--danger)]/18 bg-[var(--danger)]/6 px-5 py-4 text-sm text-[var(--danger)]">
              {feedback}
            </div>
          ) : null}

          {!checkout ? (
            <div className="rounded-[1.8rem] border border-black/10 bg-white/78 p-6 text-sm text-black/60">
              Завантажуємо стан checkout. Якщо дані не з&apos;являються, натисніть &quot;Оновити
              статус&quot;.
            </div>
          ) : null}

          {checkout ? (
            <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
              <div className="rounded-[1.8rem] border border-black/10 bg-white/78 p-6 shadow-[0_24px_70px_-55px_rgba(0,0,0,0.45)]">
                <p className="text-sm uppercase tracking-[0.22em] text-black/45">Технічна інформація</p>
                <div className="mt-5 grid gap-3">
                  {[
                    ["Статус checkout", checkout.status],
                    ["Статус у monobank", checkout.monobankStatus ?? "—"],
                    ["Старт підписки", formatDate(checkout.startDate ?? null)],
                    ["Наступне списання", formatDate(checkout.nextChargeDate ?? null)],
                    ["Кінець/скасування", formatDate(checkout.endDate ?? null)],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-[1.25rem] border border-black/8 bg-black/[0.03] px-4 py-4"
                    >
                      <p className="text-xs uppercase tracking-[0.2em] text-black/45">{label}</p>
                      <p className="mt-2 break-words text-base font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.8rem] border border-black/10 bg-[rgba(255,251,245,0.88)] p-6 shadow-[0_24px_70px_-55px_rgba(0,0,0,0.38)]">
                <p className="text-sm uppercase tracking-[0.22em] text-black/45">Дії</p>
                <div className="mt-5 grid gap-3">
                  <div className="rounded-[1.3rem] border border-black/8 bg-white/80 px-4 py-4 text-sm leading-6 text-black/70">
                    <p className="font-medium text-black">Рекомендовано для поточного стану</p>
                    <p className="mt-2">{statusUi.description}</p>
                  </div>

                  <div className="rounded-[1.3rem] border border-black/8 bg-white/80 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-black/45">Успішні списання</p>
                    <p className="mt-2 text-2xl font-semibold">{checkout.totalPaid ?? 0}</p>
                  </div>
                  <div className="rounded-[1.3rem] border border-black/8 bg-white/80 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-black/45">Невдалі списання</p>
                    <p className="mt-2 text-2xl font-semibold">{checkout.totalFailed ?? 0}</p>
                  </div>
                  <div className="rounded-[1.3rem] border border-black/8 bg-white/80 px-4 py-4 text-sm leading-6 text-black/68">
                    {checkout.cancellationDesc
                      ? checkout.cancellationDesc
                      : "Якщо підписка активна або очікує перший платіж, автопродовження можна скасувати тут."}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3" id="refresh">
                  {statusUi.ctaHref !== "#refresh" ? (
                    <Link
                      href={statusUi.ctaHref}
                      className={`w-full rounded-full px-6 py-4 text-center text-sm font-semibold sm:w-auto ${
                        statusUi.ctaVariant === "primary"
                          ? "bg-black text-white hover:-translate-y-0.5"
                          : "border border-black/10 bg-white hover:-translate-y-0.5"
                      }`}
                    >
                      {statusUi.ctaLabel}
                    </Link>
                  ) : null}

                  <button
                    type="button"
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="w-full rounded-full border border-black/10 bg-white px-6 py-4 text-sm font-semibold hover:-translate-y-0.5 disabled:opacity-60 sm:w-auto"
                  >
                    {isRefreshing ? "Оновлюємо..." : "Оновити статус"}
                  </button>

                  {cancelVisible ? (
                    <button
                      type="button"
                      onClick={onCancel}
                      disabled={isCancelling}
                      className="w-full rounded-full bg-black px-6 py-4 text-sm font-semibold text-white hover:-translate-y-0.5 hover:bg-black/92 disabled:cursor-not-allowed disabled:bg-black/45 sm:w-auto"
                    >
                      {isCancelling
                        ? "Скасовуємо..."
                        : checkout.status === "awaiting_payment"
                          ? "Скасувати checkout"
                          : "Скасувати автопродовження"}
                    </button>
                  ) : null}

                  {checkout.subscriptionId ? (
                    <Link
                      href={`/subscriptions/${encodeURIComponent(checkout.subscriptionId)}`}
                      className="w-full rounded-full border border-black/10 bg-white px-6 py-4 text-center text-sm font-semibold hover:-translate-y-0.5 sm:w-auto"
                    >
                      Перейти до підписки
                    </Link>
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
