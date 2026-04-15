import { isSandboxRouteEnabled } from "@/lib/sandbox-guard";

describe("isSandboxRouteEnabled", () => {
  it("returns false in production without explicit flag", () => {
    expect(
      isSandboxRouteEnabled({
        nodeEnv: "production",
        sandboxFlag: undefined,
      }),
    ).toBe(false);
  });

  it("returns true in development", () => {
    expect(
      isSandboxRouteEnabled({
        nodeEnv: "development",
        sandboxFlag: undefined,
      }),
    ).toBe(true);
  });
});
