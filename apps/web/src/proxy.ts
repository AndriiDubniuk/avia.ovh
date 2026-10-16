import { NextResponse, type NextRequest } from "next/server";

/**
 * Один канонічний адрес на кожну сторінку.
 *
 * 1. Старий домен → 301 на той самий шлях канонічного. Вмикається змінною
 *    LEGACY_APP_DOMAIN на час переїзду (план — docs/domain-migration); поки
 *    змінної немає, ця гілка не спрацьовує.
 * 2. `www.` → без `www.`.
 * 3. Зайві слеші в шляху (`//offer`) → один.
 *
 * canonical на всіх сторінках і так указує на новий домен, але 301 — сильніший
 * сигнал: він передає вагу сторінки й не дає дублікатам потрапити в індекс.
 */

const CANONICAL_HOST = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://avia.ovh",
).host;

export function proxy(request: NextRequest) {
  // За Traefik справжній хост приходить у X-Forwarded-Host.
  const host = (
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    ""
  ).toLowerCase();

  // Сирий шлях із request.url: nextUrl уже може бути нормалізований.
  const raw = new URL(request.url);
  const path = raw.pathname.replace(/\/{2,}/g, "/");

  // Читається під час запиту, а не під час збірки: старий домен вмикається
  // й вимикається змінною оточення контейнера.
  const legacy = (process.env.LEGACY_APP_DOMAIN ?? "").trim().toLowerCase();
  const isLegacy = Boolean(legacy) && (host === legacy || host === `www.${legacy}`);
  const isWww = host.startsWith("www.");
  const hasExtraSlashes = path !== raw.pathname;

  if (!isLegacy && !isWww && !hasExtraSlashes) {
    return NextResponse.next();
  }

  // Старий домен і www ведуть одразу на остаточну адресу — одним стрибком.
  const target =
    isLegacy || isWww
      ? new URL(`https://${isLegacy ? CANONICAL_HOST : host.slice(4)}${path}${raw.search}`)
      : new URL(`${path}${raw.search}`, request.nextUrl.origin);

  return NextResponse.redirect(target, 301);
}

export const config = {
  // Статика Next і файли з розширенням проксі не потрібні — так він не додає
  // затримки кожному ресурсу. Виняток — robots.txt і sitemap.xml: на старому
  // домені їх теж треба перенаправити, інакше пошуковик читатиме їх звідти.
  matcher: ["/((?!_next/|.*[.]).*)", "/robots.txt", "/sitemap.xml"],
};
