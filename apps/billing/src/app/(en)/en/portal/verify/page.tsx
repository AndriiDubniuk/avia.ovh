import { PortalVerify } from "@/components/portal-verify";

export default async function PortalVerifyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const rawToken = resolvedSearchParams.token;
  const token = typeof rawToken === "string" ? rawToken : rawToken?.[0] ?? null;

  return <PortalVerify token={token} />;
}
