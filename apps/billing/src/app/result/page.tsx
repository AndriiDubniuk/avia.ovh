import { SubscriptionStatus } from "@/components/subscription-status";

export default async function ResultPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const checkoutId = resolvedSearchParams.checkoutId;
  const normalizedCheckoutId =
    typeof checkoutId === "string" ? checkoutId : checkoutId?.[0];

  return <SubscriptionStatus checkoutId={normalizedCheckoutId ?? ""} />;
}
