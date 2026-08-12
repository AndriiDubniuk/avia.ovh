import { PortalAccessRequest } from "@/components/portal-access-request";
import { renderToStaticMarkup } from "react-dom/server";

describe("portal access request", () => {
  it("renders request form shell", () => {
    const markup = renderToStaticMarkup(<PortalAccessRequest />);

    expect(markup).toContain("AVIA DIGITAL");
    expect(markup).toContain("Мої підписки");
    expect(markup).toContain("Надіслати посилання для входу");
  });
});
