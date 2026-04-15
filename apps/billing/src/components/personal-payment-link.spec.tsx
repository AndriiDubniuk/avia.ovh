import { PersonalPaymentLink } from "@/components/personal-payment-link";
import { renderToStaticMarkup } from "react-dom/server";

describe("personal payment link", () => {
  it("renders personal payment shell", () => {
    const markup = renderToStaticMarkup(<PersonalPaymentLink token="test-token" />);

    expect(markup).toContain("Персональна оплата");
    expect(markup).toContain("фіксованою пропозицією");
  });
});
