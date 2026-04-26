# 2. Установка и запуск

## Требования

| Софт | Минимум | Рекомендую |
|---|---|---|
| Node.js | 18.x | 20.x LTS |
| npm | 9.x | 10.x |
| Docker + Docker Compose | любой | latest |
| Git | любой | latest |
| OS | macOS / Linux / Windows + WSL2 | macOS / Linux |

Проверка:
```bash
node -v       # v20.x.x
npm -v        # 10.x.x
docker --version
```

## Первый запуск

### 1. Клонирование

```bash
git clone <repo-url> medecina
cd medecina
```

### 2. Установка зависимостей

```bash
npm install
```

> `postinstall`-хук автоматически выполнит `prisma generate`. Если по какой-то причине не сработал — `npx prisma generate --schema=prisma/schema.prisma`.

### 3. Конфигурация `.env`

В корне проекта создайте `.env` (или скопируйте `.env.example`):

```env
# PostgreSQL
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/medecina

# Redis (опционально, под очереди уведомлений)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ML
ML_MODEL_PATH=../../packages/ml-model/model.onnx
```

> Путь до ONNX-модели — относительно `process.cwd()` при запуске API. Сервис также пробует несколько fallback-путей, см. `MlPredictionService.loadModel()`.

### 4. Запуск PostgreSQL

```bash
docker compose up -d
```

В `docker-compose.yml` поднимается контейнер `medecina-db` на порту `5434` (чтобы не конфликтовать с системным postgres на 5432).

Проверка что БД жива:
```bash
docker ps --format '{{.Names}} {{.Status}}' | grep medecina-db
```

### 5. Миграции

```bash
npm run db:migrate
```

Это вызовет `prisma migrate dev`, который применит все миграции из `prisma/migrations/` к БД.

### 6. Сиды (первичные данные)

```bash
npx prisma db seed
```

Создаст:
- 4 роли (admin, doctor, patient, manager)
- 5 типов документов
- 1 админа (`admin@medecina.ru` / `admin12345`)
- 3 клинических центра
- 8 услуг + цены по центрам
- 6 анализов + цены по центрам
- 5 врачей с расписанием (`*@medecina.ru` / `doctor12345`)
- 5 пациентов с историей визитов (`*@mail.ru` / `patient123`)
- 15 приёмов (10 прошлых + 5 будущих)
- 4 результата анализов

> Скрипт идемпотентный — справочники через `upsert`, исторические данные создаются только если таблица пустая.

### 7. Запуск dev-режима

```bash
npm run dev
```

Turborepo параллельно стартует:
- **API** на `http://localhost:3000`
- **Web** на `http://localhost:5173`

Vite проксирует `/api/*` на `http://localhost:3000`, поэтому фронт обращается к API относительными путями.

## Проверка работоспособности

### Backend

```bash
# Health-чек
curl http://localhost:3000/api/auth/login -X POST \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@medecina.ru","password":"admin12345"}'
```

Должно вернуться `{accessToken, user}`.

Swagger UI: **http://localhost:3000/api/docs**

### Frontend

Открыть `http://localhost:5173` → войти под `admin@medecina.ru` / `admin12345`.

После входа должна открыться `/admin/patients` со списком из 5 пациентов.

## Полезные команды

```bash
# Запуск только API (для отладки)
cd apps/api && npm run dev

# Запуск только web
cd apps/web && npm run dev

# Тайпчек
cd apps/api && npx tsc --noEmit
cd apps/web && npx tsc --noEmit

# Production build
npm run build              # параллельная сборка обоих

# Prisma Studio (web GUI для БД)
npm run db:studio          # → http://localhost:5555

# Сброс БД (drop + миграции + сиды)
npx prisma migrate reset --schema=prisma/schema.prisma
```

## Что делать после `git pull`

Если в апстриме появились изменения:

```bash
git pull
npm install                # подтянуть новые зависимости
npm run db:migrate         # применить новые миграции
npm run dev                # перезапустить
```

Если изменилась `schema.prisma` — `prisma generate` запустится автоматически через `postinstall`.

## Деплой (заметка)

Production-сборка:
```bash
npm run build
```

Артефакты:
- `apps/api/dist/main.js` — Node.js сервер (запуск: `node apps/api/dist/main.js`)
- `apps/web/dist/` — статический фронт (положить за nginx / любой CDN)

В production `.env`:
- Сменить `JWT_SECRET` на сильный (32+ байт случайных)
- Сменить дефолтный пароль админа после первого входа
- `DATABASE_URL` указать на production-Postgres
- В `apps/api/src/main.ts` `enableCors({ origin: ... })` указать домен фронта
