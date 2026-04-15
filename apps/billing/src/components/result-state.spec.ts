import { getResultStateUi, isCancelActionVisible } from "@/components/result-state";

describe("result state UI", () => {
  it("renders past_due with renewal CTA", () => {
    const state = getResultStateUi("past_due");
    expect(state.ctaLabel).toBe("Оформити нову оплату");
    expect(state.ctaHref).toBe("/");
  });

  it("renders suspended with restart guidance", () => {
    const state = getResultStateUi("suspended");
    expect(state.description).toContain("призупинено");
  });

  it("renders failed_initial_payment with retry CTA", () => {
    const state = getResultStateUi("failed_initial_payment");
    expect(state.ctaLabel).toBe("Спробувати ще раз");
  });
});

describe("cancel action visibility", () => {
  it("shows cancel for active when backend allows", () => {
    expect(isCancelActionVisible("active", true)).toBe(true);
  });

  it("hides cancel for cancelled even if backend flag is true", () => {
    expect(isCancelActionVisible("cancelled", true)).toBe(false);
  });
});
