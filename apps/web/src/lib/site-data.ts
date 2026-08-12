export const siteConfig = {
  name: "AVIA Digital",
  priceLabel: "від 45 000 грн",
  description:
    "Лендінги, сайти компаній, MVP, особисті кабінети та інтеграції. Одна команда веде продукт від структури до запуску.",
  primaryServiceName: "Розробка цифрових продуктів",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://avia.ovh",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api",
  billingUrl: process.env.NEXT_PUBLIC_BILLING_URL ?? "https://billing.avia.ovh",
  portfolioUrl: "https://monibex.com",
} as const;
