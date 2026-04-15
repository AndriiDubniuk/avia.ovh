"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export function PortalAccessRequest() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback("");

    try {
      const response = await fetch(`${apiBaseUrl}/v1/billing/portal/request-link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          data?.message ?? "Не вдалося надіслати magic link. Спробуйте пізніше.",
        );
      }

      setDone(true);
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Помилка запиту magic link.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="billing-shell min-h-screen">
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 py-10 lg:px-8">
        <header className="border-b border-black/10 pb-6">
          <p className="text-xs uppercase tracking-[0.28em] text-black/45">AVIA Billing Portal</p>
          <h1 className="display mt-3 text-4xl font-semibold sm:text-5xl">Мої підписки</h1>
          <p className="mt-4 text-sm leading-6 text-black/70">
            Введіть email, який використовували при оплаті. Ми надішлемо захищене посилання для доступу.
          </p>
        </header>

        <section className="py-10">
          <div className="rounded-[1.8rem] border border-black/10 bg-white/78 p-6">
            {done ? (
              <div className="grid gap-4">
                <p className="text-sm leading-6 text-black/75">
                  Якщо email знайдено, лист із magic link вже надіслано.
                </p>
                <p className="text-sm leading-6 text-black/62">
                  Відкрийте лист і перейдіть за посиланням, щоби побачити свої підписки.
                </p>
                <div>
                  <Link
                    href="/"
                    className="inline-flex rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold hover:-translate-y-0.5"
                  >
                    Повернутися до checkout
                  </Link>
                </div>
              </div>
            ) : (
              <form className="grid gap-4" onSubmit={onSubmit}>
                <label className="grid gap-2 text-sm font-medium">
                  <span>Email</span>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-black"
                    placeholder="name@company.com"
                  />
                </label>

                {feedback ? (
                  <div className="rounded-[1.2rem] border border-[var(--danger)]/18 bg-[var(--danger)]/6 px-4 py-3 text-sm text-[var(--danger)]">
                    {feedback}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-fit rounded-full bg-black px-6 py-4 text-sm font-semibold text-white hover:-translate-y-0.5 hover:bg-black/92 disabled:opacity-60"
                >
                  {isSubmitting ? "Надсилаємо..." : "Отримати magic link"}
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
