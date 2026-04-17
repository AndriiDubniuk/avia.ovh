"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

export function PortalVerify({
  token,
}: {
  token: string | null;
}) {
  const [state, setState] = useState<"loading" | "success" | "failed">("loading");
  const [message, setMessage] = useState("Перевіряємо magic link...");

  const normalizedToken = useMemo(() => token?.trim() ?? "", [token]);

  useEffect(() => {
    async function runVerification() {
      if (!normalizedToken) {
        setState("failed");
        setMessage("Magic link не містить token.");
        return;
      }

      try {
        const response = await fetch(
          `${apiBaseUrl}/v1/billing/portal/verify?token=${encodeURIComponent(normalizedToken)}`,
          {
            credentials: "include",
          },
        );
        const data = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;

        if (!response.ok) {
          throw new Error(data?.message ?? "Magic link недійсний або прострочений.");
        }

        setState("success");
        setMessage("Доступ підтверджено. Переходимо до ваших підписок...");
        window.location.href = "/portal/subscriptions";
      } catch (error) {
        setState("failed");
        setMessage(
          error instanceof Error ? error.message : "Не вдалося перевірити magic link.",
        );
      }
    }

    void runVerification();
  }, [normalizedToken]);

  return (
    <main className="billing-shell min-h-screen">
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-10 lg:px-8">
        <div className="rounded-[1.8rem] border border-black/10 bg-white/80 p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-black/45">Portal Verification</p>
          <h1 className="display mt-3 text-4xl font-semibold">
            {state === "loading" ? "Перевірка доступу..." : state === "success" ? "Успішно" : "Помилка доступу"}
          </h1>
          <p className="mt-4 text-sm leading-6 text-black/70">{message}</p>
          {state === "failed" ? (
            <div className="mt-6">
              <Link
                href="/portal"
                className="inline-flex rounded-full bg-black px-6 py-3 text-sm font-semibold text-white"
              >
                Запросити нове посилання
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
