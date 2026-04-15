import { PersonalPaymentLink } from "@/components/personal-payment-link";

export default async function PersonalPayPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolved = await params;

  return <PersonalPaymentLink token={resolved.token} />;
}
