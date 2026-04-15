import Link from "next/link";

export function BillingPrivateMode() {
  return (
    <main className="billing-shell min-h-screen">
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-6 py-10 lg:px-8">
        <div className="rounded-[1.8rem] border border-black/10 bg-white/80 p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-black/45">AVIA Billing</p>
          <h1 className="display mt-3 text-4xl font-semibold sm:text-5xl">
            Оплати тимчасово у приватному режимі
          </h1>
          <p className="mt-4 text-sm leading-6 text-black/70">
            Публічне оформлення підписки тимчасово вимкнено. Для оплати використовуйте персональне посилання, яке ви отримали напряму.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/portal"
              className="rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold hover:-translate-y-0.5"
            >
              Мої підписки
            </Link>
            <Link
              href="/"
              className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:-translate-y-0.5"
            >
              Оновити сторінку
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
