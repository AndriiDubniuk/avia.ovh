# AVIA Agro

Преміальний україномовний лендінг для послуги серверного ресурсу під агро-проєкти.

## Стек

- `apps/web` — `Next.js 16`, `Tailwind CSS 4`, `shadcn/ui`
- `apps/api` — `NestJS 11`, `TypeORM`, `PostgreSQL`

## Що вже є

- лендінг-сторінка з описом послуги та ціною `4 000 грн / рік`
- форма зворотного зв’язку
- API для збереження заявок у PostgreSQL
- сторінки `Публічна оферта` та `Політика конфіденційності`
- логотип, favicon, sitemap, robots, manifest, Open Graph image

## Локальний запуск

### 1. Підняти PostgreSQL

```bash
docker compose up -d
```

### 2. Налаштувати змінні середовища

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

### 3. Запустити API

```bash
cd apps/api
pnpm start:dev
```

API буде доступний на [http://localhost:3001](http://localhost:3001).

### 4. Запустити фронт

```bash
cd apps/web
pnpm dev
```

Сайт буде доступний на [http://localhost:3000](http://localhost:3000).

## Перевірка збірки

```bash
cd apps/api && pnpm build
cd apps/web && pnpm build
```

## Продакшн-деплой на `avia.ovh`

- використовується `Traefik` на VPS, фронт і API сидять на одному домені
- фронт віддається з `https://avia.ovh`
- API проксіюється через `https://avia.ovh/api`
- автодеплой запускається GitHub Actions при пуші в `main`

### Що є в репі

- `docker-compose.deploy.yml` — продовий compose для VPS
- `apps/web/Dockerfile` і `apps/api/Dockerfile` — продові образи
- `.github/workflows/deploy.yml` — CI/CD для `main`

### Які GitHub secrets потрібні

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`
- `DB_PASSWORD`

### Які DNS-записи мають бути

- `A avia.ovh -> 51.195.110.101`
- `A www.avia.ovh -> 51.195.110.101`
