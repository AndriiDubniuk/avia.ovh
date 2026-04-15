export function isSandboxRouteEnabled({
  nodeEnv = process.env.NODE_ENV,
  sandboxFlag = process.env.NEXT_PUBLIC_BILLING_SANDBOX_ENABLED,
}: {
  nodeEnv?: string;
  sandboxFlag?: string;
} = {}): boolean {
  if (nodeEnv === "development") {
    return true;
  }

  return sandboxFlag === "true";
}
