"use client";

import { useEffect, useState } from "react";

import {
  BillingCrumb,
  BillingFooter,
  BillingTop,
  Consent,
} from "@/components/billing-chrome";
import { Cockpit } from "@/components/cockpit";
import { useLang } from "@/components/lang-provider";
import { userMessage } from "@/lib/errors";
import { Reveal } from "@/components/reveal";

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

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

export function BillingHome() {
  const { t } = useLang();
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
          throw new Error(t.home.errPlans);
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

        setFeedback(userMessage(error, t.home.errPage));
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
  }, [t]);

  const selectedPlan =
    plans.find((plan) => plan.code === selectedPlanCode) ?? plans[0];

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedPlanCode) {
      setFeedback(t.home.errPick);
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
        throw new Error(data?.message ?? t.home.errCheckout);
      }

      window.location.href = data.paymentUrl;
    } catch (error) {
      setFeedback(userMessage(error, t.home.errCheckoutFallback));
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Cockpit sky="climb" />
      <BillingTop />

      <main className="bpage bpage-wide">
        <BillingCrumb page={t.home.crumb} />

        <Reveal>
          <div className="bhero">
            <div>
              <div className="eyebrow">{t.home.eyebrow}</div>
              <h1 className="huge">
                {t.home.title[0]}
                <br />
                {t.home.title[1]}
              </h1>
              <p className="sub">{t.home.sub}</p>
            </div>
            <p className="clr">
              {t.home.clr[0]}
              <br />
              {t.home.clr[1]}
              <br />
              <b>{t.home.clr[2]}</b>
            </p>
          </div>
        </Reveal>

        <Reveal>
          <div className="chips">
            {t.home.chips.map((chip) => (
              <div key={chip} className="chip">
                {chip}
              </div>
            ))}
          </div>
        </Reveal>

        <div className="split split-r">
          <div>
            <Reveal>
              <div className="sec-head" style={{ marginBottom: 26 }}>
                <h2 className="mid">
                  {t.home.plansTitle[0]}
                  <br />
                  {t.home.plansTitle[1]}
                </h2>
                <span className="tag">
                  {isLoading ? t.home.plansLoadingTag : t.home.plansTag(plans.length)}
                </span>
              </div>
            </Reveal>

            {isLoading ? (
              <p className="note">{t.home.plansLoading}</p>
            ) : (
              plans.map((plan, index) => (
                <Reveal key={plan.code} delay={index * 50}>
                  <button
                    type="button"
                    className="plan-opt"
                    data-on={plan.code === selectedPlanCode}
                    onClick={() => setSelectedPlanCode(plan.code)}
                  >
                    <span className="top">
                      <span>
                        <span className="badge">{plan.badge}</span>
                        <h3>{plan.name}</h3>
                        <span className="pdesc">{plan.description}</span>
                      </span>
                      <span className="price">{plan.priceLabel}</span>
                    </span>
                    <span className="feat">
                      {plan.features.map((feature) => (
                        <div key={feature}>{feature}</div>
                      ))}
                    </span>
                  </button>
                </Reveal>
              ))
            )}
          </div>

          <Reveal delay={80}>
            <div className="panel">
              <p className="ptag">{t.home.formTag}</p>
              <h3>{t.home.formTitle}</h3>
              <p>{t.home.formBody}</p>

              {selectedPlan ? (
                <div
                  className="kv"
                  style={{
                    marginTop: 24,
                    borderColor: "rgba(121,227,196,.3)",
                    background: "rgba(121,227,196,.05)",
                  }}
                >
                  <p className="k">{t.home.chosen}</p>
                  <p
                    className="v"
                    style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}
                  >
                    <span>{selectedPlan.name}</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 14, color: "var(--signal)" }}>
                      {selectedPlan.priceLabel}
                    </span>
                  </p>
                </div>
              ) : null}

              {selectedPlan?.note ? (
                <p className="note" style={{ marginTop: 14 }}>
                  {selectedPlan.note}
                </p>
              ) : null}

              <form className="stack" style={{ marginTop: 28, gap: 20 }} onSubmit={onSubmit}>
                <label className="field" style={{ display: "grid", gap: 10 }}>
                  <span>{t.common.name}</span>
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
                    placeholder={t.common.namePlaceholder}
                  />
                </label>

                <label className="field" style={{ display: "grid", gap: 10 }}>
                  <span>{t.common.email}</span>
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
                    placeholder="name@company.com"
                  />
                </label>

                <label className="field" style={{ display: "grid", gap: 10 }}>
                  <span>{t.common.company}</span>
                  <input
                    value={formState.companyName}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        companyName: event.target.value,
                      }))
                    }
                    placeholder={t.common.optional}
                  />
                </label>

                {feedback ? <p className="alert">{feedback}</p> : null}

                <button type="submit" className="cta" disabled={isSubmitting || !selectedPlanCode}>
                  {isSubmitting ? t.common.preparingPayment : t.common.toPayment}
                </button>

                <Consent />
              </form>
            </div>
          </Reveal>
        </div>
      </main>

      <BillingFooter />
    </>
  );
}
