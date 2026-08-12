import { SubscriptionManagement, summarizeHistory } from "@/components/subscription-management";
import { renderToStaticMarkup } from "react-dom/server";

describe("subscription management", () => {
  it("renders management route shell", () => {
    const markup = renderToStaticMarkup(
      <SubscriptionManagement subscriptionId="sub-test-123" />,
    );

    expect(markup).toContain("AVIA DIGITAL");
    expect(markup).toContain("Номер підписки");
    expect(markup).toContain("sub-test-123");
  });

  it("builds history summary when counters are present", () => {
    const summary = summarizeHistory({
      subscription_id: "sub-1",
      status: "active",
      client_id: "client-1",
      payment_method_id: "pm-1",
      amount_minor: 29900,
      currency: "UAH",
      interval: "yearly",
      next_charge_at: null,
      cancelled_at: null,
      created_at: "2026-04-15T00:00:00.000Z",
      total_paid: 2,
      total_failed: 1,
      retry_count: 0,
    });

    expect(summary).toHaveLength(3);
    expect(summary[0]).toContain("2");
    expect(summary[1]).toContain("1");
    expect(summary[2]).toContain("Повторних спроб: 0");
  });
});
