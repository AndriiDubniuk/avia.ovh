import { NextResponse, type NextRequest } from "next/server";

/**
 * Старий домен білінгу → 301 на канонічний. Вмикається змінною
 * LEGACY_BILLING_DOMAIN на час переїзду (план — docs/domain-migration); поки
 * змінної немає, проксі нічого не робить.
 *
 * Клієнтам на той момент уже будуть розіслані персональні посилання на оплату й magic-link кабінету
 * зі старою адресою — вони мають вести на ту саму сторінку нового домену.
 *
 * `/api` сюди не доходить: Traefik віддає його напряму в API, бо на старий
 * білінг досі приходять вебхуки Monobank від підписок, створених до переїзду.
 * Перевірка нижче — запобіжник: навіть якщо маршрутизація зміниться, вебхук
 * не отримає редиректу, за яким банк не піде.
 */

const CANONICAL_HOST = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://billing.avia.ovh",
).host;

export function proxy(request: NextRequest) {
  const host = (
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    ""
  ).toLowerCase();

  // Читається під час запиту: старий домен вимикається змінною оточення.
  const legacy = (process.env.LEGACY_BILLING_DOMAIN ?? "").trim().toLowerCase();
  const url = new URL(request.url);

  if (!legacy || host !== legacy || url.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  return NextResponse.redirect(
    new URL(`https://${CANONICAL_HOST}${url.pathname}${url.search}`),
    301,
  );
}

export const config = {
  matcher: ["/((?!_next/|.*[.]).*)", "/robots.txt", "/sitemap.xml"],
};
