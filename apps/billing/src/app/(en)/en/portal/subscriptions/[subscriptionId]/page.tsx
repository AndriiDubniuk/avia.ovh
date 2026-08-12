import { SubscriptionManagement } from "@/components/subscription-management";

export default async function PortalSubscriptionPage({
  params,
}: {
  params: Promise<{ subscriptionId: string }>;
}) {
  const resolvedParams = await params;

  return (
    <SubscriptionManagement
      subscriptionId={resolvedParams.subscriptionId}
      mode="portal"
    />
  );
}
