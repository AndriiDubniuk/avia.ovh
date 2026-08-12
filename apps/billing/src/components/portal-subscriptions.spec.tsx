import { PortalSubscriptions } from "@/components/portal-subscriptions";
import { renderToStaticMarkup } from "react-dom/server";

describe("portal subscriptions", () => {
  it("renders subscriptions shell", () => {
    const markup = renderToStaticMarkup(<PortalSubscriptions />);

    expect(markup).toContain("AVIA DIGITAL");
    expect(markup).toContain("Мої підписки");
    expect(markup).toContain("Увійти з іншої пошти");
  });
});
