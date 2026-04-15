import { renderToStaticMarkup } from "react-dom/server";

describe("billing home route", () => {
  const originalPrivateMode = process.env.BILLING_PRIVATE_MODE;

  afterEach(() => {
    process.env.BILLING_PRIVATE_MODE = originalPrivateMode;
    jest.resetModules();
  });

  it("renders private mode message when flag is enabled", async () => {
    process.env.BILLING_PRIVATE_MODE = "true";
    const pageModule = await import("./page");
    const Home = pageModule.default;
    const markup = renderToStaticMarkup(<Home />);

    expect(markup).toContain("приватному режимі");
  });
});
