import { PortalSubscriptions } from "@/components/portal-subscriptions";
import { renderToStaticMarkup } from "react-dom/server";

describe("portal subscriptions", () => {
  it("renders subscriptions shell", () => {
    const markup = renderToStaticMarkup(<PortalSubscriptions />);

    expect(markup).toContain("AVIA Billing Portal");
    expect(markup).toContain("Мої підписки");
    expect(markup).toContain("Інший email");
  });
});
