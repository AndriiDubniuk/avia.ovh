"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

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
    name: string;
    email: string;
    company_name: string | null;
  };
};

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("uk-UA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function PersonalPaymentLink({ token }: { token: string }) {
  const [offer, setOffer] = useState<OfferPayload | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
              : "Посилання не знайдено або вже не активне.",
          );
        }

        if (!isMounted) {
          return;
        }

        setOffer(data as OfferPayload);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setFeedback(
          error instanceof Error ? error.message : "Не вдалося завантажити пропозицію.",
        );
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
  }, [token]);

  async function onPay() {
    setIsSubmitting(true);
    setFeedback("");

    try {
      const response = await fetch(
        `${apiBaseUrl}/v1/billing/personal-links/${encodeURIComponent(token)}/checkout`,
        { method: "POST" },
      );
      const data = (await response.json().catch(() => null)) as
        | { paymentUrl?: string; message?: string }
        | null;

      if (!response.ok || !data?.paymentUrl) {
        throw new Error(data?.message ?? "Не вдалося створити checkout.");
      }

      window.location.href = data.paymentUrl;
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Помилка оплати.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="billing-shell min-h-screen">
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-10 lg:px-8">
        <header className="border-b border-black/10 pb-6">
          <p className="text-xs uppercase tracking-[0.28em] text-black/45">AVIA Billing</p>
          <h1 className="display mt-3 text-4xl font-semibold sm:text-5xl">Персональна оплата</h1>
          <p className="mt-4 text-sm leading-6 text-black/70">
            Це персональне посилання з фіксованою пропозицією. Змінювати тариф тут не можна.
          </p>
        </header>

        <section className="grid gap-6 py-10">
          {isLoading ? (
            <div className="rounded-[1.8rem] border border-black/10 bg-white/78 p-6 text-sm text-black/60">
              Завантажуємо персональну пропозицію...
            </div>
          ) : null}

          {feedback ? (
            <div className="rounded-[1.4rem] border border-[var(--danger)]/18 bg-[var(--danger)]/6 px-5 py-4 text-sm text-[var(--danger)]">
              {feedback}
            </div>
          ) : null}

          {!isLoading && offer ? (
            <div className="rounded-[1.8rem] border border-black/10 bg-white/78 p-6 shadow-[0_24px_70px_-55px_rgba(0,0,0,0.45)]">
              <div className="grid gap-3">
                <StatItem label="Клієнт" value={offer.customer.name} />
                <StatItem label="Email" value={offer.customer.email} />
                <StatItem label="План" value={offer.offer.plan_name} />
                <StatItem label="Ціна" value={offer.offer.price_label} />
                <StatItem label="Інтервал" value={offer.offer.interval} />
                <StatItem label="Дійсне до" value={formatDate(offer.expires_at)} />
              </div>

              <p className="mt-4 text-sm leading-6 text-black/70">{offer.offer.note}</p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onPay}
                  disabled={isSubmitting}
                  className="rounded-full bg-black px-6 py-4 text-sm font-semibold text-white hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {isSubmitting ? "Створюємо checkout..." : "Перейти до оплати"}
                </button>
                <Link
                  href="/portal"
                  className="rounded-full border border-black/10 bg-white px-6 py-4 text-sm font-semibold hover:-translate-y-0.5"
                >
                  Мої підписки
                </Link>
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
    <div className="rounded-[1.2rem] border border-black/8 bg-black/[0.03] px-4 py-4">
      <p className="text-xs uppercase tracking-[0.2em] text-black/45">{label}</p>
      <p className="mt-2 text-base font-medium">{value}</p>
    </div>
  );
}
