# 1. Обзор и архитектура

## Назначение

Medecina — система автоматизации работы амбулаторного медицинского центра (или сети центров). Система решает три класса задач:

1. **Для пациента** — публичный сайт с поиском врачей/услуг, онлайн-запись на приём, личный кабинет с историей визитов и результатами анализов
2. **Для врача** — расписание приёмов, ведение визитов, выписка рецептов, доступ к истории пациента
3. **Для администратора** — управление врачами/пациентами/центрами/услугами, контроль записей, ML-аналитика неявок

## Tech stack

### Backend (`apps/api/`)

| Технология | Версия | Назначение |
|---|---|---|
| **NestJS** | 11 | Фреймворк (модули, DI, guards, pipes) |
| **TypeScript** | 5.7 | Язык |
| **Prisma** | 6.3 | ORM + миграции + типогенерация |
| **PostgreSQL** | 16 | СУБД |
| **Passport + JWT** | 11 / 4 | Аутентификация |
| **@nestjs/swagger** | 11 | OpenAPI / Swagger UI |
| **class-validator** | 0.14 | Валидация DTO |
| **onnxruntime-node** | latest | Inference ML-модели |
| **bcrypt** | 5 | Хеширование паролей |

### Frontend (`apps/web/`)

| Технология | Версия | Назначение |
|---|---|---|
| **React** | 18 | UI |
| **Vite** | 6.4 | Dev-сервер + сборка |
| **React Router** | 7 | Роутинг |
| **TanStack Query** | 5 | Серверный state, кеширование, мутации |
| **Zustand** | 4 | Клиентский state (auth) |
| **axios** | 1.7 | HTTP-клиент |
| **TailwindCSS** | 3 | Стили |
| **Recharts** | 2 | Графики аналитики |
| **lucide-react** | latest | Иконки |
| **date-fns** | 3 | Форматирование дат |

### Общее

| Технология | Назначение |
|---|---|
| **npm workspaces** | Монорепа (apps/*, packages/*) |
| **Turborepo** | Параллельные сборки, кеширование задач |
| **Docker Compose** | PostgreSQL для локальной разработки |

## Монорепа: структура

```
medecina/
├── apps/
│   ├── api/                       # NestJS backend
│   │   ├── src/
│   │   │   ├── main.ts            # Точка входа, ValidationPipe, Swagger
│   │   │   ├── app.module.ts      # Корневой модуль
│   │   │   ├── prisma/            # PrismaModule (Global)
│   │   │   ├── common/
│   │   │   │   ├── decorators/    # @Roles
│   │   │   │   └── guards/        # JwtAuthGuard, RolesGuard
│   │   │   └── modules/           # 12 функциональных модулей
│   │   │       ├── auth/
│   │   │       ├── user/
│   │   │       ├── patient/
│   │   │       ├── doctor/
│   │   │       ├── doctor-schedule/
│   │   │       ├── clinic-center/
│   │   │       ├── appointment/
│   │   │       ├── visit/
│   │   │       ├── service/
│   │   │       ├── test-result/
│   │   │       ├── notification/
│   │   │       ├── analytics/
│   │   │       └── ml-prediction/
│   │   └── package.json
│   │
│   └── web/                       # Vite + React frontend
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx            # Роутер, QueryClient, hydrate
│       │   ├── types.ts           # Доменные типы
│       │   ├── api/               # Axios-клиенты per-entity
│       │   ├── stores/            # Zustand (auth.store)
│       │   ├── services/api.ts    # Axios instance + interceptors
│       │   ├── layouts/           # PublicLayout, AuthLayout, DashboardLayout
│       │   ├── pages/             # Страницы по разделам
│       │   ├── components/
│       │   │   ├── shared/        # Карточки врача/пациента/приёма
│       │   │   └── ui/            # DataTable, Modal, Skeleton, …
│       │   └── lib/utils.ts       # cn (clsx)
│       └── vite.config.ts         # Прокси /api → :3000
│
├── packages/
│   ├── shared/                    # Общие enum'ы и Zod-схемы
│   │   └── src/
│   │       ├── enums.ts           # UserRole, AppointmentStatus, …
│   │       └── schemas.ts         # Zod (login, register, …)
│   │
│   └── ml-model/                  # ML-артефакты
│       ├── model.onnx             # Обученная модель в ONNX (~85 KB)
│       ├── metrics.json           # ROC AUC, precision, recall, …
│       ├── params.json            # Гиперпараметры, фичи
│       └── requirements.txt       # Зависимости для обучения (Python)
│
├── prisma/
│   ├── schema.prisma              # Схема БД (~20 моделей)
│   ├── migrations/                # SQL-миграции
│   └── seed.ts                    # Скрипт первичного наполнения БД
│
├── docs/                          # Эта документация
├── docker-compose.yml             # PostgreSQL
├── turbo.json                     # Turbo задачи
├── package.json                   # workspaces root
├── README.md                      # Краткое описание
├── ML_TRAINING.md                 # Подробный гайд по обучению модели
└── .env                           # DATABASE_URL, JWT_SECRET, …
```

## Архитектура потоков данных

### Создание записи на приём (E2E flow)

```
┌─────────┐  POST /appointments    ┌──────────┐
│  Web    │ ──────────────────────▶│   API    │
│         │  {patientId, doctorId, │ NestJS   │
│         │   centerId, startAt}   │          │
└─────────┘                        └────┬─────┘
                                        │
                  ┌─────────────────────┼──────────────────────────┐
                  ▼                     ▼                          ▼
            ┌──────────┐         ┌─────────────┐          ┌────────────────┐
            │ Prisma   │         │ ML predict  │          │ Notifications  │
            │ create   │         │  (ONNX)     │          │  schedule      │
            │ appoint  │         │  → 0.43     │          │  +24h, +1h     │
            └────┬─────┘         └──────┬──────┘          └────────┬───────┘
                 │                      │                          │
                 ▼                      ▼                          ▼
            ┌────────────────────────────────────────────────────────────┐
            │                      PostgreSQL                            │
            │  appointment | ml_prediction | notification                │
            └────────────────────────────────────────────────────────────┘
```

1. `AppointmentController.create()` → `AppointmentService.create()`
2. Создаётся запись в `appointment`
3. `MlPredictionService.predictAndSave()` собирает фичи из истории пациента, прогоняет ONNX, сохраняет в `ml_prediction`
4. `NotificationService.scheduleStandardReminders()` создаёт `reminder_24h` и `reminder_1h` в `notification`
5. Возвращает полный объект с вложенными `prediction`, `services`, `tests`

### Аутентификация

```
┌─────────┐                          ┌──────────┐
│ Browser │                          │   API    │
└────┬────┘                          └────┬─────┘
     │   POST /auth/login                 │
     │   {email, password}                │
     │ ──────────────────────────────────▶│
     │                                    │ bcrypt.compare
     │                                    │ JwtService.sign({sub, email, roles})
     │   200 OK                           │
     │   {accessToken, user}              │
     │ ◀──────────────────────────────────│
     │                                    │
     │ localStorage.setItem(...)          │
     │                                    │
     │   GET /users/me                    │
     │   Authorization: Bearer <jwt>      │
     │ ──────────────────────────────────▶│
     │                                    │ JwtStrategy.validate
     │                                    │ → req.user = {id, email, roles}
     │   200 OK { ...user with roles }    │
     │ ◀──────────────────────────────────│
```

См. подробнее: [Аутентификация и роли](./05-authentication.md)

## Принципы архитектуры

### Backend

- **Modular monolith** — каждый бизнес-домен в отдельном NestJS-модуле, через `@Global()` PrismaModule.
- **Validation pipe global** — все DTO проходят через `class-validator`.
- **Guards-based RBAC** — `JwtAuthGuard` ставит `req.user`, `RolesGuard` проверяет `@Roles(...)`.
- **Prisma как single source of truth** — миграции, типы, сиды.
- **Train in Python, serve in Node.js** — ML обучается отдельно, сериализуется в ONNX, инференс в NestJS через `onnxruntime-node`.

### Frontend

- **Server-state via TanStack Query** — кеш, автоматический рефетч, мутации с инвалидацией.
- **Auth-state via Zustand** — только пользователь и токен, всё остальное в React Query.
- **API-модули per-entity** — `src/api/{auth,doctors,patients,…}.ts` инкапсулируют axios-вызовы.
- **Доменные типы в `types.ts`** — соответствуют Prisma-моделям, без зависимости от бэкенда.
- **Layouts** — `PublicLayout` (публичный сайт), `AuthLayout` (логин/регистрация), `DashboardLayout` (личный кабинет с защитой от анонима).
