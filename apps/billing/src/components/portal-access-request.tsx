"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { BillingCrumb, BillingFooter, BillingTop } from "@/components/billing-chrome";
import { Cockpit } from "@/components/cockpit";
import { useHref, useLang } from "@/components/lang-provider";
import { userMessage } from "@/lib/errors";
import { Reveal } from "@/components/reveal";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

export function PortalAccessRequest() {
  const { t } = useLang();
  const href = useHref();
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
        throw new Error(data?.message ?? t.portal.errSend);
      }

      setDone(true);
    } catch (error) {
      setFeedback(userMessage(error, t.portal.errSendRetry));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Cockpit sky="climb" />
      <BillingTop />

      <main className="bpage">
        <BillingCrumb page={t.portal.crumb} />

        <Reveal>
          <div className="eyebrow">{t.portal.eyebrow}</div>
          <h1 className="huge">{t.portal.title}</h1>
          <p className="sub">{t.portal.sub}</p>
        </Reveal>

        <div className="split split-r">
          <Reveal>
            <div className="panel">
              {done ? (
                <>
                  <p className="ptag">{t.portal.sentTag}</p>
                  <h3>{t.portal.sentTitle}</h3>
                  <p className="alert alert-ok" style={{ marginTop: 16 }}>
                    {t.portal.sentAlert}
                  </p>
                  <p style={{ marginTop: 16 }}>{t.portal.sentBody}</p>
                  <div className="actions mt6">
                    <Link className="btn" href={href("/")}>
                      {t.common.toCheckout}
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="ptag">{t.portal.loginTag}</p>
                  <h3>{t.portal.loginTitle}</h3>
                  <p>{t.portal.loginBody}</p>

                  <form className="stack" style={{ marginTop: 28, gap: 20 }} onSubmit={onSubmit}>
                    <label className="field" style={{ display: "grid", gap: 10 }}>
                      <span>{t.common.email}</span>
                      <input
                        required
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="name@company.com"
                      />
                    </label>

                    {feedback ? <p className="alert">{feedback}</p> : null}

                    <button type="submit" className="cta" disabled={isSubmitting}>
                      {isSubmitting ? t.portal.submitting : t.portal.submit}
                    </button>
                  </form>
                </>
              )}
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="stack">
              {t.portal.checks.map((check) => (
                <p key={check} className="check">
                  {check}
                </p>
              ))}
            </div>

            <div className="grid2 mt6">
              <div className="kv">
                <p className="k">{t.portal.method}</p>
                <p className="v" style={{ fontFamily: "var(--mono)", fontSize: 13 }}>
                  {t.portal.methodValue}
                </p>
              </div>
              <div className="kv">
                <p className="k">{t.portal.passwords}</p>
                <p className="v" style={{ fontFamily: "var(--mono)", fontSize: 13 }}>
                  {t.portal.passwordsValue}
                </p>
              </div>
            </div>

            <p className="note mt6">
              {t.portal.hintBefore}
              <b>{t.portal.hintStrong}</b>
              {t.portal.hintAfter}
            </p>
          </Reveal>
        </div>
      </main>

      <BillingFooter />
    </>
  );
}
