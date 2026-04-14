"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type CheckoutStatus = {
  checkoutId: string;
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

function describeStatus(status: string) {
  switch (status) {
    case "active":
      return "Підписка активна. Наступне списання відбудеться автоматично.";
    case "awaiting_payment":
      return "Очікуємо підтвердження першого платежу в monobank.";
    case "cancelled":
      return "Автоподовження зупинено. Нових списань більше не буде.";
    case "expired":
      return "Checkout або підписка втратили чинність.";
    case "failed":
      return "Не вдалося активувати підписку. Можна повторити оформлення.";
    default:
      return "Оновлюємо статус підписки...";
  }
}

export function SubscriptionStatus({ checkoutId }: { checkoutId: string }) {
  const [checkout, setCheckout] = useState<CheckoutStatus | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isPolling, setIsPolling] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!checkoutId) {
      setFeedback("Не передано ідентифікатор checkout.");
      setIsPolling(false);
      return;
    }

    let isMounted = true;

    async function fetchStatus(refresh: boolean) {
      try {
        const response = await fetch(
          `${apiBaseUrl}/billing/checkouts/${checkoutId}?refresh=${refresh}`,
          {
            cache: "no-store",
          },
        );
        const data = (await response.json()) as CheckoutStatus | { message?: string };

        if (!response.ok) {
          throw new Error(
            "message" in data && data.message
              ? data.message
              : "Не вдалося отримати статус підписки.",
          );
        }

        if (!isMounted) {
          return;
        }

        setCheckout(data as CheckoutStatus);
        setFeedback("");

        if (["active", "cancelled", "expired", "failed"].includes((data as CheckoutStatus).status)) {
          setIsPolling(false);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setFeedback(
          error instanceof Error ? error.message : "Не вдалося отримати статус.",
        );
        setIsPolling(false);
      }
    }

    void fetchStatus(true);
    intervalRef.current = window.setInterval(() => {
      if (isPolling) {
        void fetchStatus(true);
      }
    }, 6000);

    return () => {
      isMounted = false;

      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [checkoutId, isPolling]);

  async function onCancel() {
    if (!checkout?.canCancel) {
      return;
    }

    setIsCancelling(true);
    setFeedback("");

    try {
      const response = await fetch(
        `${apiBaseUrl}/billing/checkouts/${checkout.checkoutId}/cancel`,
        {
          method: "POST",
        },
      );
      const data = (await response.json().catch(() => null)) as
        | CheckoutStatus
        | { message?: string }
        | null;

      if (!response.ok || !data || "status" in data === false) {
        throw new Error(
          data && "message" in data && data.message
            ? data.message
            : "Не вдалося скасувати автоподовження.",
        );
      }

      setCheckout(data as CheckoutStatus);
      setIsPolling(false);
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Сталася помилка під час скасування.",
      );
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <main className="billing-shell min-h-screen">
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-10 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-black/45">
              AVIA Billing
            </p>
            <h1 className="display mt-3 text-4xl font-semibold sm:text-5xl">
              Статус підписки
            </h1>
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
              На лендінг
            </Link>
          </div>
        </header>

        <section className="grid flex-1 gap-6 py-10">
          <div className="rounded-[2rem] border border-black/10 bg-[#151515] p-7 text-white shadow-[0_28px_90px_-60px_rgba(0,0,0,0.65)]">
            <p className="text-sm uppercase tracking-[0.24em] text-white/45">
              Поточний стан
            </p>
            <h2 className="display mt-4 text-4xl font-semibold">
              {checkout?.planName ?? "Завантажуємо checkout..."}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/72">
              {checkout ? describeStatus(checkout.status) : "Підтягуємо інформацію з API і синхронізуємося з monobank."}
            </p>
          </div>

          {feedback ? (
            <div className="rounded-[1.4rem] border border-[var(--danger)]/18 bg-[var(--danger)]/6 px-5 py-4 text-sm text-[var(--danger)]">
              {feedback}
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="rounded-[1.8rem] border border-black/10 bg-white/78 p-6 shadow-[0_24px_70px_-55px_rgba(0,0,0,0.45)]">
              <p className="text-sm uppercase tracking-[0.22em] text-black/45">
                Технічна інформація
              </p>
              <div className="mt-5 grid gap-3">
                {[
                  ["Статус checkout", checkout?.status ?? "—"],
                  ["Статус у monobank", checkout?.monobankStatus ?? "—"],
                  ["Старт підписки", formatDate(checkout?.startDate ?? null)],
                  ["Наступне списання", formatDate(checkout?.nextChargeDate ?? null)],
                  ["Кінець/скасування", formatDate(checkout?.endDate ?? null)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-[1.25rem] border border-black/8 bg-black/[0.03] px-4 py-4"
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-black/45">
                      {label}
                    </p>
                    <p className="mt-2 text-base font-medium">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-black/10 bg-[rgba(255,251,245,0.88)] p-6 shadow-[0_24px_70px_-55px_rgba(0,0,0,0.38)]">
              <p className="text-sm uppercase tracking-[0.22em] text-black/45">
                Керування
              </p>
              <div className="mt-5 grid gap-3">
                <div className="rounded-[1.3rem] border border-black/8 bg-white/80 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-black/45">
                    Успішні списання
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{checkout?.totalPaid ?? 0}</p>
                </div>
                <div className="rounded-[1.3rem] border border-black/8 bg-white/80 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-black/45">
                    Невдалі списання
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{checkout?.totalFailed ?? 0}</p>
                </div>
                <div className="rounded-[1.3rem] border border-black/8 bg-white/80 px-4 py-4 text-sm leading-6 text-black/68">
                  {checkout?.cancellationDesc
                    ? checkout.cancellationDesc
                    : "Якщо підписка активна, тут можна зупинити автоподовження без окремого звернення в сапорт."}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={!checkout?.canCancel || isCancelling}
                  className="rounded-full bg-black px-6 py-4 text-sm font-semibold text-white hover:-translate-y-0.5 hover:bg-black/92 disabled:cursor-not-allowed disabled:bg-black/45"
                >
                  {isCancelling
                    ? "Скасовуємо..."
                    : checkout?.status === "awaiting_payment"
                      ? "Прибрати checkout"
                      : "Скасувати автоподовження"}
                </button>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="rounded-full border border-black/10 bg-white px-6 py-4 text-sm font-semibold hover:-translate-y-0.5"
                >
                  Оновити статус
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
