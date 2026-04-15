"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type BillingPlan = {
  code: string;
  name: string;
  description: string;
  amount: number;
  ccy: number;
  interval: string;
  intervalLabel: string;
  priceLabel: string;
  badge: string;
  features: string[];
  note: string;
};

type PlansResponse = {
  plans: BillingPlan[];
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";
const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL ?? "http://localhost:3000";

export function BillingHome() {
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [selectedPlanCode, setSelectedPlanCode] = useState("");
  const [formState, setFormState] = useState({
    customerName: "",
    customerEmail: "",
    companyName: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadPlans() {
      try {
        const response = await fetch(`${apiBaseUrl}/v1/billing/plans`, {
          cache: "no-store",
        });
        const data = (await response.json()) as PlansResponse;

        if (!response.ok) {
          throw new Error("Не вдалося завантажити доступні підписки.");
        }

        if (!isMounted) {
          return;
        }

        setPlans(data.plans);
        setSelectedPlanCode((current) => current || data.plans[0]?.code || "");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setFeedback(
          error instanceof Error
            ? error.message
            : "Не вдалося завантажити платіжну сторінку.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadPlans();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedPlan =
    plans.find((plan) => plan.code === selectedPlanCode) ?? plans[0];

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedPlanCode) {
      setFeedback("Оберіть підписку перед переходом до оплати.");
      return;
    }

    setFeedback("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/v1/billing/checkouts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planCode: selectedPlanCode,
          ...formState,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { paymentUrl?: string; message?: string }
        | null;

      if (!response.ok || !data?.paymentUrl) {
        throw new Error(
          data?.message ??
            "Не вдалося створити checkout. Спробуйте ще раз трохи пізніше.",
        );
      }

      window.location.href = data.paymentUrl;
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Сталася помилка під час оплати.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <main className="billing-shell min-h-screen">
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-10 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-black/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-black/55">
              AVIA Billing
            </p>
            <h1 className="display mt-3 text-4xl font-semibold sm:text-5xl">
              Оформіть підписку на Avia.
            </h1>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href={landingUrl}
              className="rounded-full border border-black/10 bg-white/70 px-5 py-3 hover:-translate-y-0.5"
            >
              Повернутися на avia.ovh
            </Link>
            <Link
              href={`${landingUrl}/offer`}
              className="rounded-full border border-black/10 bg-white/70 px-5 py-3 hover:-translate-y-0.5"
            >
              Оферта
            </Link>
            <Link
              href={`${landingUrl}/privacy`}
              className="rounded-full border border-black/10 bg-white/70 px-5 py-3 hover:-translate-y-0.5"
            >
              Конфіденційність
            </Link>
            <Link
              href="/portal"
              className="rounded-full border border-black/10 bg-white/70 px-5 py-3 hover:-translate-y-0.5"
            >
              Мої підписки
            </Link>
          </div>
        </header>

        <section className="grid flex-1 gap-8 py-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-black/10 bg-[#141414] p-7 text-white shadow-[0_28px_90px_-60px_rgba(0,0,0,0.65)]">
              <p className="text-sm uppercase tracking-[0.24em] text-white/45">
                Платіжний сценарій
              </p>
              <h2 className="display mt-4 text-4xl font-semibold">
                Проста оплата. Автоматичне продовження.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-white/70">
                Оберіть зручний план, перейдіть до оплати через monobank і отримайте доступ одразу після першого платежу.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  "Оплата карткою, Apple Pay або Google Pay",
                  "Щорічне автосписання через monobank",
                  "Скасування без повернення в сапорт",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-4 text-sm leading-6 text-white/82"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-black/45">
                    Доступні підписки
                  </p>
                  <h2 className="display mt-2 text-3xl font-semibold">
                    Обери свій тариф.
                  </h2>
                </div>
              </div>

              {isLoading ? (
                <div className="rounded-[1.8rem] border border-black/10 bg-white/70 p-6 text-sm text-black/55">
                  Завантажуємо підписки...
                </div>
              ) : (
                <div className="grid gap-4">
                  {plans.map((plan) => {
                    const isSelected = plan.code === selectedPlanCode;

                    return (
                      <button
                        key={plan.code}
                        type="button"
                        onClick={() => setSelectedPlanCode(plan.code)}
                        className={`rounded-[1.8rem] border p-6 text-left ${
                          isSelected
                            ? "border-black bg-[#fff8ef] shadow-[0_22px_70px_-55px_rgba(0,0,0,0.45)]"
                            : "border-black/10 bg-white/72 hover:-translate-y-0.5"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="inline-flex rounded-full bg-black px-3 py-1 text-xs font-medium tracking-[0.18em] text-white">
                              {plan.badge}
                            </div>
                            <h3 className="display mt-4 text-3xl font-semibold">
                              {plan.name}
                            </h3>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-black/70">
                              {plan.description}
                            </p>
                          </div>
                          <div className="rounded-[1.4rem] border border-black/10 bg-black px-5 py-4 text-right text-white">
                            <p className="text-xs uppercase tracking-[0.24em] text-white/50">
                              Ціна
                            </p>
                            <p className="mt-2 text-2xl font-semibold">{plan.priceLabel}</p>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-2 md:grid-cols-2">
                          {plan.features.map((feature) => (
                            <div
                              key={feature}
                              className="rounded-[1.2rem] border border-black/8 bg-black/[0.03] px-4 py-3 text-sm leading-6 text-black/75"
                            >
                              {feature}
                            </div>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/10 bg-[rgba(255,251,245,0.85)] p-6 shadow-[0_32px_90px_-60px_rgba(0,0,0,0.38)] sm:p-8">
            <p className="text-sm uppercase tracking-[0.24em] text-black/45">
              Оформлення
            </p>
            <h2 className="display mt-3 text-4xl font-semibold">
             Оформлення підписки
            </h2>
            <p className="mt-4 text-base leading-7 text-black/70">
              Після переходу в monobank ви підтвердите перший річний платіж. Далі
              сторінка результату покаже статус, дату наступного списання й кнопку
              скасування автоподовження.
            </p>

            {selectedPlan ? (
              <div className="mt-6 rounded-[1.7rem] border border-black/10 bg-white/80 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.22em] text-black/45">
                      Обрано
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold">{selectedPlan.name}</h3>
                  </div>
                  <p className="text-lg font-semibold">{selectedPlan.priceLabel}</p>
                </div>
                <p className="mt-4 text-sm leading-6 text-black/68">
                  {selectedPlan.note}
                </p>
              </div>
            ) : null}

            <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
              <label className="grid gap-2 text-sm font-medium">
                <span>Ім&apos;я або контактна особа</span>
                <input
                  required
                  minLength={2}
                  value={formState.customerName}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      customerName: event.target.value,
                    }))
                  }
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-black"
                  placeholder="Наприклад, Андрій"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium">
                <span>Email</span>
                <input
                  required
                  type="email"
                  value={formState.customerEmail}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      customerEmail: event.target.value,
                    }))
                  }
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-black"
                  placeholder="name@company.com"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium">
                <span>Компанія</span>
                <input
                  value={formState.companyName}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      companyName: event.target.value,
                    }))
                  }
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-black"
                  placeholder="Необов'язково"
                />
              </label>


              {feedback ? (
                <div className="rounded-[1.2rem] border border-[var(--danger)]/18 bg-[var(--danger)]/6 px-4 py-3 text-sm text-[var(--danger)]">
                  {feedback}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting || !selectedPlanCode}
                className="rounded-full bg-black px-6 py-4 text-sm font-semibold text-white hover:-translate-y-0.5 hover:bg-black/92 disabled:cursor-not-allowed disabled:bg-black/50"
              >
                {isSubmitting
                  ? "Створюємо checkout..."
                  : "Перейти до оплати підписки"}
              </button>
            </form>

            <div className="mt-5 text-sm leading-6 text-black/55">
              Натискаючи кнопку, ви підтверджуєте згоду з{" "}
              <Link href={`${landingUrl}/offer`} className="underline">
                публічною офертою
              </Link>{" "}
              та{" "}
              <Link href={`${landingUrl}/privacy`} className="underline">
                політикою конфіденційності
              </Link>
              .
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
