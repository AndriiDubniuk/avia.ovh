# AVIA: коротка техдок для команди

## 1) Що це
- Монорепа `pnpm` з 3 сервісами:
- `apps/web` — основний сайт (`Next.js`, порт `3000`)
- `apps/billing` — білінг-зона (`Next.js`, порт `3002`)
- `apps/api` — бекенд (`NestJS` + `PostgreSQL`, порт `3001`)

## 2) Як воно працює
- `web` і `billing` ходять в `api`.
- `api` працює з PostgreSQL.
- У проді все стоїть у Docker, назовні віддає `Traefik`:
- `https://avia.ovh` -> `web`
- `https://billing.avia.ovh` -> `billing`
- `https://avia.ovh/api` і `https://billing.avia.ovh/api` -> `api`

## 3) Що треба новому розробнику
- Node.js `20+`
- `pnpm` (версія з репи: `10.28.2`)
- Docker + Docker Compose
- Доступ до `.env` (локальні/продові значення)

## 4) Локальний старт (швидкий)
1. З кореня репи:
```bash
pnpm dev
```
Це піднімає Postgres у Docker і запускає `api + web + billing` паралельно.

2. URL локально:
- `http://localhost:3000` — web
- `http://localhost:3002` — billing
- `http://localhost:3001` — api

## 5) Обов'язкові env-файли
- `apps/api/.env`
- `apps/web/.env.local`
- `apps/billing/.env.local`

Критичне для прод-білінгу:
- `MONOBANK_ACQUIRING_TOKEN`
- креди БД (`DB_NAME`, `DB_USER`, `DB_PASSWORD`)
- домени (`APP_DOMAIN`, `BILLING_DOMAIN`)

## 6) Мінімальний чек перед PR
```bash
pnpm build
pnpm lint
```

## 7) Як летить на сервер (прод)
1. Пуш у `main`.
2. GitHub Actions збирає образи `web/api/billing`.
3. На VPS оновлюються image refs і виконується `docker compose -f docker-compose.deploy.yml up -d`.
4. `Traefik` маршрутизує домени на потрібні сервіси.
5. Healthchecks перевіряють:
- `api`: `/v1/health`
- `web`: `/health`
- `billing`: `/health`

## 8) Де шукати головне
- `docker-compose.yml` — локальна БД
- `docker-compose.deploy.yml` — продова схема
- `apps/*/Dockerfile` — як зібрані прод-образи
- кореневий `package.json` — основні команди

## 9) Реальні ENV (поточні)

### apps/api/.env
```env
APP_ENV=local
PORT=3003
FRONTEND_ORIGIN=http://localhost:3000,http://localhost:3002

DB_HOST=localhost
DB_PORT=5432
DB_USER=avia
DB_PASSWORD=avia
DB_NAME=avia_agro
DB_SSL=false

TYPEORM_SYNCHRONIZE=false

MONOBANK_API_BASE_URL=https://api.monobank.ua
MONOBANK_MODE=real   #real/mock
MONOBANK_TOKEN=mqVxPoc9GY16djEf82Nnthg
MONOBANK_WEBHOOK_URL=https://hunting-endnote-ravine.ngrok-free.dev/v1/billing/webhooks/monobank
MONOBANK_ACQUIRING_TOKEN=mqVxPoc9GY16djEf82Nnthg
TOKEN_ENCRYPTION_KEY=0ae94947c611f11abc929f7680eecd1fb3426a4c8e8ccf6a2b9a85d8fb639eaf
IDEMPOTENCY_TTL_HOURS=72

RESEND_API_KEY=re_BrqkXKZ9_5FjRFFH4dY3gUaJhk3TJYmF2
RESEND_FROM_EMAIL=billing@avia.ovh
BILLING_NOTIFICATION_TO_EMAIL=vabara209@gmail.com

NODE_ENV=development 
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001 #https://api.avia.ovh
NEXT_PUBLIC_LANDING_URL=http://localhost:3000  #https://avia.ovh
NEXT_PUBLIC_SITE_URL=http://localhost:3002     #https://billing.avia.ovh
NEXT_PUBLIC_BILLING_SANDBOX_ENABLED=true       #false



BILLING_PLANS_JSON=[{"code":"monthly","name":"Місячна підписка","description":"Щомісячне автопродовження","amount_minor":2000,"interval":"monthly"},{"code":"annual_2","name":"Річна підписка","amount_minor":300,"interval":"yearly"},{"code":"annual_10000","name":"Індивідуальний тариф","amount_minor":1000000,"interval":"yearly"}]


BILLING_PORTAL_MAGIC_TTL_MINUTES=15
BILLING_PORTAL_SESSION_TTL_HOURS=24
BILLING_PORTAL_COOKIE_NAME=billing_portal_session



BILLING_PRIVATE_MODE=true
BILLING_PERSONAL_LINK_BASE_URL=http://localhost:3002/pay
BILLING_PERSONAL_LINK_TTL_HOURS=720
```

### apps/api/.env.production
```env
APP_ENV=production
PORT=3001
FRONTEND_ORIGIN=https://avia.ovh,https://billing.avia.ovh
DB_HOST=postgres
DB_PORT=5432
DB_USER=avia
DB_PASSWORD=avia
DB_NAME=avia_agro
DB_SSL=false
TYPEORM_SYNCHRONIZE=true
BILLING_PUBLIC_URL=https://billing.avia.ovh
BILLING_PUBLIC_API_URL=https://billing.avia.ovh
BILLING_PERSONAL_LINK_BASE_URL=https://billing.avia.ovh/pay
BILLING_PERSONAL_LINK_TTL_HOURS=720
BILLING_PRIVATE_MODE=true
BILLING_PLANS_JSON=[{"code":"monthly","name":"Місячна підписка","description":"Щомісячне автопродовження","amount_minor":2000,"interval":"monthly"},{"code":"annual_2","name":"Річна підписка","amount_minor":300,"interval":"yearly"},{"code":"annual_10000","name":"Індивідуальний тариф","amount_minor":1000000,"interval":"yearly"}]
BILLING_PORTAL_MAGIC_TTL_MINUTES=15
BILLING_PORTAL_SESSION_TTL_HOURS=24
BILLING_PORTAL_COOKIE_NAME=billing_portal_session
RESEND_API_KEY=re_BrqkXKZ9_5FjRFFH4dY3gUaJhk3TJYmF2
RESEND_FROM_EMAIL=billing@avia.ovh
BILLING_NOTIFICATION_TO_EMAIL=owner@avia.ovh
MONOBANK_API_BASE_URL=https://api.monobank.ua
MONOBANK_MODE=real
MONOBANK_TOKEN=mqVxPoc9GY16djEf82Nnthg
MONOBANK_ACQUIRING_TOKEN=mqVxPoc9GY16djEf82Nnthg
MONOBANK_WEBHOOK_URL=https://billing.avia.ovh/api/v1/billing/webhooks/monobank
TOKEN_ENCRYPTION_KEY=0ae94947c611f11abc929f7680eecd1fb3426a4c8e8ccf6a2b9a85d8fb639eaf
IDEMPOTENCY_TTL_HOURS=72
MONOBANK_CHECKOUT_VALIDITY_SECONDS=2592000
```

### apps/web/.env.local
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3002
NEXT_PUBLIC_API_BASE_URL=http://localhost:3003
NEXT_PUBLIC_LANDING_URL=http://localhost:3000
NEXT_PUBLIC_BILLING_URL=http://localhost:3002
```

### apps/web/.env.production
```env
NEXT_PUBLIC_SITE_URL=https://avia.ovh
NEXT_PUBLIC_API_BASE_URL=https://billing.avia.ovh
NEXT_PUBLIC_LANDING_URL=https://avia.ovh
NEXT_PUBLIC_BILLING_URL=https://billing.avia.ovh
```

### apps/billing/.env
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3002
NEXT_PUBLIC_API_BASE_URL=http://localhost:3003
NEXT_PUBLIC_LANDING_URL=http://localhost:3000
BILLING_PRIVATE_MODE=true
```

### apps/billing/.env.production
```env
NEXT_PUBLIC_SITE_URL=https://billing.avia.ovh
NEXT_PUBLIC_API_BASE_URL=https://billing.avia.ovh
NEXT_PUBLIC_LANDING_URL=https://avia.ovh
BILLING_PRIVATE_MODE=true
```

