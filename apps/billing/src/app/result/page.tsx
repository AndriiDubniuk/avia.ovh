import { SubscriptionStatus } from "@/components/subscription-status";
import Link from "next/link";

export default async function ResultPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const checkoutId = resolvedSearchParams.checkoutId;
  const normalizedCheckoutId =
    typeof checkoutId === "string" ? checkoutId : checkoutId?.[0];

  if (!normalizedCheckoutId) {
    return (
      <main className="billing-shell min-h-screen">
        <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-6 py-10 lg:px-8">
          <div className="rounded-[1.8rem] border border-black/10 bg-white/80 p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-black/45">Result</p>
            <h1 className="display mt-3 text-4xl font-semibold">Некоректне посилання</h1>
            <p className="mt-4 text-sm leading-6 text-black/70">
              У URL відсутній `checkoutId`. Відкрийте сторінку з валідним ідентифікатором або
              створіть новий checkout.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/"
                className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white"
              >
                До checkout
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return <SubscriptionStatus checkoutId={normalizedCheckoutId ?? ""} />;
}
