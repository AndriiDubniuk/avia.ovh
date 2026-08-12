"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { BillingCrumb, BillingFooter, BillingTop } from "@/components/billing-chrome";
import { Cockpit } from "@/components/cockpit";
import { useHref, useLang } from "@/components/lang-provider";
import type { Dict } from "@/lib/i18n";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

/**
 * Повідомлення зберігається ключем, а не готовим рядком: інакше зміна мови
 * не перекладала б уже показаний текст, а перевірка одноразового токена
 * не повинна запускатись повторно лише через перемикання мови.
 * Текст від сервера лишається як є — його не перекласти на клієнті.
 */
type Note =
  | { kind: "key"; key: "checking" | "incomplete" | "expired" | "ready" | "failedGeneric" }
  | { kind: "text"; text: string };

function noteText(note: Note, t: Dict) {
  return note.kind === "text" ? note.text : t.verify[note.key];
}

export function PortalVerify({ token }: { token: string | null }) {
  const { t } = useLang();
  const href = useHref();
  const [state, setState] = useState<"loading" | "success" | "failed">("loading");
  const [note, setNote] = useState<Note>({ kind: "key", key: "checking" });

  const normalizedToken = useMemo(() => token?.trim() ?? "", [token]);

  useEffect(() => {
    async function runVerification() {
      if (!normalizedToken) {
        setState("failed");
        setNote({ kind: "key", key: "incomplete" });
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
          throw new Error(data?.message ?? "");
        }

        setState("success");
        setNote({ kind: "key", key: "ready" });
        window.location.href = "/portal/subscriptions";
      } catch (error) {
        setState("failed");
        const message = error instanceof Error ? error.message.trim() : "";
        setNote(
          message
            ? { kind: "text", text: message }
            : { kind: "key", key: "expired" },
        );
      }
    }

    void runVerification();
  }, [normalizedToken]);

  const heading =
    state === "loading"
      ? t.verify.headingLoading
      : state === "success"
        ? t.verify.headingSuccess
        : t.verify.headingFailed;

  const tone = state === "loading" ? "wait" : state === "success" ? "ok" : "bad";
  const label =
    state === "loading"
      ? t.verify.labelLoading
      : state === "success"
        ? t.verify.labelSuccess
        : t.verify.labelFailed;

  return (
    <>
      <Cockpit sky="climb" />
      <BillingTop />

      <main className="bpage bpage-narrow bcenter">
        <BillingCrumb page={t.verify.crumb} />

        <div className="eyebrow">{t.verify.eyebrow}</div>
        <div className={`status ${tone}`}>{label}</div>

        <h1 className="huge" style={{ marginTop: 24 }}>
          {heading.map((line, index) => (
            <span key={line}>
              {index > 0 ? <br /> : null}
              {line}
            </span>
          ))}
        </h1>

        <p className="sub">{noteText(note, t)}</p>

        {state === "failed" ? (
          <div className="actions" style={{ marginTop: 32 }}>
            <Link href={href("/portal")} className="cta">
              {t.verify.newLink}
            </Link>
            <Link href={href("/")} className="btn">
              {t.common.toCheckout}
            </Link>
          </div>
        ) : null}

        {state === "success" ? (
          <div className="actions" style={{ marginTop: 32 }}>
            <Link href={href("/portal/subscriptions")} className="cta">
              {t.common.mySubs} →
            </Link>
          </div>
        ) : null}
      </main>

      <BillingFooter />
    </>
  );
}
