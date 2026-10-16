import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content-Security-Policy.
 *
 * Сайт усе вантажить зі свого домену: шрифти системні, зовнішніх скриптів і
 * аналітики немає. Тому політика сувора — `'self'` майже скрізь.
 *
 * `'unsafe-inline'` у script-src лишається свідомо: Next вбудовує інлайн-
 * скрипти гідратації, а nonce зробив би всі сторінки динамічними й прибрав
 * статичну генерацію. JSON-LD (`application/ld+json`) — це блок даних, а не
 * скрипт, CSP його не блокує.
 */
function contentSecurityPolicy() {
  // У dev React Refresh використовує eval і WebSocket, а форма ходить на
  // локальний API з .env.local — у проді нічого з цього не потрібно.
  const devApi = isDev ? (process.env.NEXT_PUBLIC_API_BASE_URL ?? "") : "";
  const devConnect = isDev ? ` ws: ${devApi.startsWith("http") ? new URL(devApi).origin : ""}` : "";

  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self'${devConnect}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

const securityHeaders = [
  /* Без includeSubDomains і preload — свідомо. Поштовий піддомен віддає
     сертифікат на інше імʼя, і з includeSubDomains браузер заблокував би його
     без можливості обійти. preload — практично незворотний запис у списки
     браузерів; вмикати його варто лише тоді, коли всі піддомени гарантовано
     мають коректний HTTPS. */
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy() },
];

const nextConfig: NextConfig = {
  output: "standalone",
  // Не розкриваємо стек у заголовку X-Powered-By.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
