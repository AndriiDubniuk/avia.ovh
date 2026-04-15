import ResultPage from "@/app/result/page";
import { renderToStaticMarkup } from "react-dom/server";

describe("result page", () => {
  it("renders invalid identifier state when checkoutId is missing", async () => {
    const page = await ResultPage({
      searchParams: Promise.resolve({}),
    });

    const markup = renderToStaticMarkup(page);
    expect(markup).toContain("Result");
    expect(markup).toContain("checkoutId");
  });
});
