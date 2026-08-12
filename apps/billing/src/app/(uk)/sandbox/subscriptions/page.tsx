import { SubscriptionsSandbox } from "@/components/subscriptions-sandbox";
import { isSandboxRouteEnabled } from "@/lib/sandbox-guard";
import { notFound } from "next/navigation";

export default function SubscriptionsSandboxPage() {
  if (!isSandboxRouteEnabled()) {
    notFound();
  }

  return <SubscriptionsSandbox />;
}
