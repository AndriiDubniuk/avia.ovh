import ResultPage from "@/app/(uk)/result/page";
import { renderToStaticMarkup } from "react-dom/server";

describe("result page", () => {
  it("renders invalid identifier state when checkoutId is missing", async () => {
    const page = await ResultPage({
      searchParams: Promise.resolve({}),
    });

    const markup = renderToStaticMarkup(page);
    expect(markup).toContain("Посилання");
    expect(markup).toContain("checkoutId");
  });
});
