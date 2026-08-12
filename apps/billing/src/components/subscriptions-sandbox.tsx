"use client";

import { useMemo, useState } from "react";

import { BillingCrumb, BillingFooter, BillingTop } from "@/components/billing-chrome";
import { Cockpit } from "@/components/cockpit";

const defaultPayload = {
  client: {
    external_ref: "sandbox-client-001",
    name: "Sandbox Client",
    email: "sandbox@example.com",
    phone: "+380000000000",
  },
  plan: {
    amount_minor: 29900,
    currency: "UAH",
    interval: "yearly",
  },
  timezone: "Europe/Kyiv",
  start_mode: "immediate",
};

const defaultCheckoutPayload = {
  return_url: "https://example.com/billing/return",
  tokenization_requested: true,
};

const defaultIdempotencyKey = `sandbox-${Date.now()}`;
const defaultApiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3003";

type RequestLog = {
  title: string;
  status: number | null;
  ok: boolean;
  body: unknown;
};

type SubscriptionSnapshot = {
  subscription_id: string;
  status: string;
  client_id: string;
  payment_method_id: string | null;
  amount_minor: number;
  currency: string;
  interval: string;
  next_charge_at: string | null;
  cancelled_at: string | null;
  created_at: string;
};

type CheckoutSessionSnapshot = {
  checkout_session_id: string;
  provider_invoice_id: string;
  checkout_url: string;
  expires_at: string;
  status: string;
};

function pretty(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isSubscriptionSnapshot(value: unknown): value is SubscriptionSnapshot {
  return isRecord(value) && typeof value.subscription_id === "string";
}

function isCheckoutSessionSnapshot(value: unknown): value is CheckoutSessionSnapshot {
  return (
    isRecord(value) &&
    typeof value.checkout_session_id === "string" &&
    typeof value.provider_invoice_id === "string" &&
    typeof value.checkout_url === "string" &&
    typeof value.expires_at === "string" &&
    typeof value.status === "string"
  );
}

export function SubscriptionsSandbox() {
  const [apiBase, setApiBase] = useState(defaultApiBase);
  const [idempotencyKey, setIdempotencyKey] = useState(defaultIdempotencyKey);
  const [subscriptionId, setSubscriptionId] = useState("");
  const [payloadText, setPayloadText] = useState(pretty(defaultPayload));
  const [checkoutPayloadText, setCheckoutPayloadText] = useState(
    pretty(defaultCheckoutPayload),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [log, setLog] = useState<RequestLog | null>(null);
  const [subscriptionSnapshot, setSubscriptionSnapshot] =
    useState<SubscriptionSnapshot | null>(null);
  const [checkoutSnapshot, setCheckoutSnapshot] =
    useState<CheckoutSessionSnapshot | null>(null);

  const subscriptionsBaseUrl = useMemo(
    () => `${apiBase.replace(/\/+$/, "")}/v1/billing/subscriptions`,
    [apiBase],
  );

  const internalWebhooksBaseUrl = useMemo(
    () => `${apiBase.replace(/\/+$/, "")}/v1/internal/billing/webhooks`,
    [apiBase],
  );
  const hasCheckoutSession = checkoutSnapshot !== null;

  async function fetchSubscriptionSnapshot(
    id: string,
    options?: { logTitle?: string; skipLog?: boolean },
  ) {
    const response = await fetch(`${subscriptionsBaseUrl}/${encodeURIComponent(id)}`);
    const body = await response.json().catch(() => ({ message: "No JSON body." }));

    if (isSubscriptionSnapshot(body)) {
      setSubscriptionSnapshot(body);
    }

    if (!options?.skipLog) {
      setLog({
        title: options?.logTitle ?? "GET /v1/billing/subscriptions/:id",
        status: response.status,
        ok: response.ok,
        body,
      });
    }

    return { response, body };
  }

  async function runCreateSubscription() {
    let parsedPayload: unknown;

    try {
      parsedPayload = JSON.parse(payloadText);
    } catch {
      setLog({
        title: "POST /v1/billing/subscriptions",
        status: null,
        ok: false,
        body: { message: "Payload is not valid JSON." },
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(subscriptionsBaseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(parsedPayload),
      });
      const body = await response.json().catch(() => ({ message: "No JSON body." }));

      if (isSubscriptionSnapshot(body)) {
        setSubscriptionId(body.subscription_id);
        setSubscriptionSnapshot(body);
      }

      setLog({
        title: "POST /v1/billing/subscriptions",
        status: response.status,
        ok: response.ok,
        body,
      });
    } catch (error) {
      setLog({
        title: "POST /v1/billing/subscriptions",
        status: null,
        ok: false,
        body: {
          message: error instanceof Error ? error.message : "Unknown network error.",
        },
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function runGetSubscription() {
    const id = subscriptionId.trim();

    if (!id) {
      setLog({
        title: "GET /v1/billing/subscriptions/:id",
        status: null,
        ok: false,
        body: { message: "Enter subscription id first." },
      });
      return;
    }

    setIsLoading(true);

    try {
      await fetchSubscriptionSnapshot(id);
    } catch (error) {
      setLog({
        title: "GET /v1/billing/subscriptions/:id",
        status: null,
        ok: false,
        body: {
          message: error instanceof Error ? error.message : "Unknown network error.",
        },
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function runCreateCheckoutSession() {
    const id = subscriptionId.trim();
    if (!id) {
      setLog({
        title: "POST /v1/billing/subscriptions/:id/checkout-session",
        status: null,
        ok: false,
        body: { message: "Create or paste subscription id first." },
      });
      return;
    }

    let parsedPayload: unknown;
    try {
      parsedPayload = JSON.parse(checkoutPayloadText);
    } catch {
      setLog({
        title: "POST /v1/billing/subscriptions/:id/checkout-session",
        status: null,
        ok: false,
        body: { message: "Checkout payload is not valid JSON." },
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${subscriptionsBaseUrl}/${encodeURIComponent(id)}/checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": idempotencyKey,
          },
          body: JSON.stringify(parsedPayload),
        },
      );
      const body = await response.json().catch(() => ({ message: "No JSON body." }));

      if (isCheckoutSessionSnapshot(body)) {
        setCheckoutSnapshot(body);
      }

      const checkoutResult =
        response.status >= 500
          ? {
              ...((isRecord(body) ? body : { message: "Internal server error" }) as Record<
                string,
                unknown
              >),
              hint:
                "Checkout session creation calls Monobank. For Phase 1C local run, set a real MONOBANK_TOKEN in apps/api/.env or use mocked checkout flow.",
            }
          : body;

      const refreshed = await fetchSubscriptionSnapshot(id, { skipLog: true });

      setLog({
        title: "POST /v1/billing/subscriptions/:id/checkout-session",
        status: response.status,
        ok: response.ok,
        body: {
          checkout: checkoutResult,
          refreshed_subscription: refreshed.body,
        },
      });
    } catch (error) {
      setLog({
        title: "POST /v1/billing/subscriptions/:id/checkout-session",
        status: null,
        ok: false,
        body: {
          message: error instanceof Error ? error.message : "Unknown network error.",
        },
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function runMockWebhook(mode: "success" | "expired") {
    const id = subscriptionId.trim();
    if (!id) {
      setLog({
        title: "POST /v1/internal/billing/webhooks/mock/...",
        status: null,
        ok: false,
        body: { message: "Create or paste subscription id first." },
      });
      return;
    }

    setIsLoading(true);

    try {
      const path =
        mode === "success"
          ? `/mock/subscriptions/${encodeURIComponent(id)}/success`
          : `/mock/subscriptions/${encodeURIComponent(id)}/failure-expiry?status=expired`;

      const response = await fetch(`${internalWebhooksBaseUrl}${path}`, {
        method: "POST",
      });
      const body = await response.json().catch(() => ({ message: "No JSON body." }));

      const refreshed = await fetchSubscriptionSnapshot(id, { skipLog: true });

      setLog({
        title:
          mode === "success"
            ? "POST /v1/internal/billing/webhooks/mock/.../success"
            : "POST /v1/internal/billing/webhooks/mock/.../failure-expiry",
        status: response.status,
        ok: response.ok,
        body: {
          webhook: body,
          refreshed_subscription: refreshed.body,
        },
      });
    } catch (error) {
      setLog({
        title: "POST /v1/internal/billing/webhooks/mock/...",
        status: null,
        ok: false,
        body: {
          message: error instanceof Error ? error.message : "Unknown network error.",
        },
      });
    } finally {
      setIsLoading(false);
    }
  }

  function resetPayload() {
    setPayloadText(pretty(defaultPayload));
  }

  function resetCheckoutPayload() {
    setCheckoutPayloadText(pretty(defaultCheckoutPayload));
  }

  function refreshIdempotencyKey() {
    setIdempotencyKey(`sandbox-${Date.now()}`);
  }

  return (
    <>
      <Cockpit sky="climb" />
      <BillingTop />

      <main className="bpage bpage-wide">
        <BillingCrumb page="Sandbox" />
        <header>
          <p className="devmark">Sandbox — internal · not for production</p>
          <h1 className="huge" style={{ marginTop: 24 }}>
            Subscriptions
            <br />
            API tester.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 sbx-muted">
            Minimal UI for Phase 1C flow: create subscription, create checkout session,
            trigger mock webhook, and verify subscription state.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="panel">
            <label className="grid gap-2 text-sm">
              <span className="font-medium">API Base URL</span>
              <input
                value={apiBase}
                onChange={(event) => setApiBase(event.target.value)}
                className="sbx-input"
                placeholder="http://localhost:3001"
              />
            </label>

            <label className="mt-4 grid gap-2 text-sm">
              <span className="font-medium">Idempotency-Key</span>
              <div className="flex gap-2">
                <input
                  value={idempotencyKey}
                  onChange={(event) => setIdempotencyKey(event.target.value)}
                  className="sbx-input"
                />
                <button
                  type="button"
                  onClick={refreshIdempotencyKey}
                  className="btn sbx-mini"
                >
                  New
                </button>
              </div>
            </label>

            <label className="mt-4 grid gap-2 text-sm">
              <span className="font-medium">POST body (JSON) - create subscription</span>
              <textarea
                value={payloadText}
                onChange={(event) => setPayloadText(event.target.value)}
                className="sbx-input sbx-json"
              />
            </label>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={runCreateSubscription}
                className="cta sbx-mini"
              >
                POST create subscription
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={resetPayload}
                className="btn sbx-mini"
              >
                Reset JSON
              </button>
            </div>

            <label className="mt-6 grid gap-2 text-sm">
              <span className="font-medium">POST body (JSON) - checkout session</span>
              <textarea
                value={checkoutPayloadText}
                onChange={(event) => setCheckoutPayloadText(event.target.value)}
                className="sbx-input sbx-json"
              />
            </label>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={runCreateCheckoutSession}
                className="cta sbx-mini"
              >
                POST checkout-session
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={resetCheckoutPayload}
                className="btn sbx-mini"
              >
                Reset checkout JSON
              </button>
            </div>
          </div>

          <div className="panel">
            <label className="grid gap-2 text-sm">
              <span className="font-medium">subscription_id</span>
              <input
                value={subscriptionId}
                onChange={(event) => setSubscriptionId(event.target.value)}
                className="sbx-input"
                placeholder="Paste ID from response"
              />
            </label>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={runGetSubscription}
                className="cta sbx-mini"
              >
                GET subscription by id
              </button>
              <button
                type="button"
                disabled={isLoading || !hasCheckoutSession}
                onClick={() => runMockWebhook("success")}
                className="btn sbx-mini"
              >
                Mock success webhook
              </button>
              <button
                type="button"
                disabled={isLoading || !hasCheckoutSession}
                onClick={() => runMockWebhook("expired")}
                className="btn sbx-mini"
              >
                Mock failure/expiry webhook
              </button>
            </div>
            {!hasCheckoutSession ? (
              <p className="mt-2 text-xs sbx-muted">
                Webhook mocks require a created checkout session first.
              </p>
            ) : null}

            <div className="kv mt6">
              <p className="text-xs uppercase tracking-[0.2em] sbx-muted">Checkout response</p>
              {checkoutSnapshot ? (
                <div className="mt-3 space-y-1 text-sm">
                  <p>
                    <span className="font-medium">checkout_session_id:</span>{" "}
                    {checkoutSnapshot.checkout_session_id}
                  </p>
                  <p>
                    <span className="font-medium">provider_invoice_id:</span>{" "}
                    {checkoutSnapshot.provider_invoice_id}
                  </p>
                  <p>
                    <span className="font-medium">checkout_url:</span>{" "}
                    <a
                      href={checkoutSnapshot.checkout_url}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      open
                    </a>
                  </p>
                  <p>
                    <span className="font-medium">expires_at:</span>{" "}
                    {checkoutSnapshot.expires_at}
                  </p>
                  <p>
                    <span className="font-medium">status:</span> {checkoutSnapshot.status}
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-sm sbx-muted">No checkout session yet.</p>
              )}
            </div>

            <div className="kv">
              <p className="text-xs uppercase tracking-[0.2em] sbx-muted">
                Current subscription snapshot
              </p>
              {subscriptionSnapshot ? (
                <pre className="code">
                  {pretty(subscriptionSnapshot)}
                </pre>
              ) : (
                <p className="mt-3 text-sm sbx-muted">No subscription snapshot yet.</p>
              )}
            </div>

            <div className="kv">
              <p className="text-xs uppercase tracking-[0.2em] sbx-muted">Last response</p>
              {log ? (
                <div className="mt-3 space-y-2 text-sm">
                  <p className="font-medium">
                    {log.title}{" "}
                    <span className={log.ok ? "text-[var(--success)]" : "text-[var(--danger)]"}>
                      {log.status !== null ? `(${log.status})` : "(request error)"}
                    </span>
                  </p>
                  <pre className="code">
                    {pretty(log.body)}
                  </pre>
                </div>
              ) : (
                <p className="mt-3 text-sm sbx-muted">No requests yet.</p>
              )}
            </div>
          </div>
        </section>
      </main>

      <BillingFooter />
    </>
  );
}
