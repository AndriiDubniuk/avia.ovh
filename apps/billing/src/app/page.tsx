import { BillingHome } from "@/components/billing-home";
import { BillingPrivateMode } from "@/components/billing-private-mode";

function isBillingPrivateModeEnabled() {
  const rawValue =
    process.env.BILLING_PRIVATE_MODE ??
    process.env.NEXT_PUBLIC_BILLING_PRIVATE_MODE ??
    "false";

  return rawValue.trim().toLowerCase() === "true";
}

export default function Home() {
  if (isBillingPrivateModeEnabled()) {
    return <BillingPrivateMode />;
  }

  return <BillingHome />;
}
