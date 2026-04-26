# 3. База данных

PostgreSQL 16. Управляется через Prisma 6: схема в `prisma/schema.prisma`, миграции в `prisma/migrations/`. Сиды — `prisma/seed.ts`.

## Сводная диаграмма

```
                  ┌──────────┐
                  │   Role   │
                  └────┬─────┘
                       │ M:N
                       ▼
           ┌─────── User ────────┐
           │           │         │
           ▼           ▼         ▼
   UserProfile    UserDocument  UserRole
                       │
                  DocumentType, FileStorage

       ┌────────── ClinicCenter ───────────┐
       │              │                    │
       ▼              ▼                    ▼
    Doctor       ServicePrice          TestPrice
       │              │                    │
       │           Service              LabTest
   DoctorSchedule

   Patient ────┐
       │       │
       │       └──── TestResult ──── LabTest
       │
       ▼
   Appointment ─────┬───────────────┐
       │            │               │
       │            ▼               ▼
       │        MlPrediction   Notification
       │
       ├──── AppointmentService ──── Service
       │
       ├──── AppointmentTest ──── LabTest
       │
       └──── Visit
                │
                └──── Prescription
```

## Список моделей

20 моделей, все используют `BigInt` как первичный ключ.

| # | Модель | Назначение |
|---|---|---|
| 1 | `User` | Учётные записи (email, пароль, ФИО) |
| 2 | `UserProfile` | Профиль (телефон, дата рождения, пол, адрес) |
| 3 | `Role` | Роли (admin, doctor, patient, manager) |
| 4 | `UserRole` | M:N связь user ↔ role |
| 5 | `DocumentType` | Типы документов (паспорт, СНИЛС, …) |
| 6 | `UserDocument` | Документы пользователя (с file_id) |
| 7 | `FileStorage` | Метаданные файлов (для будущей загрузки) |
| 8 | `ClinicCenter` | Клинические центры (филиалы) |
| 9 | `Doctor` | Карточка врача (привязка к user, центру) |
| 10 | `DoctorSchedule` | Расписание (день недели + интервал) |
| 11 | `Service` | Каталог медуслуг |
| 12 | `ServicePrice` | Цена услуги в конкретном центре (история через valid_from/to) |
| 13 | `LabTest` | Каталог лабораторных анализов |
| 14 | `TestPrice` | Цены анализов (как ServicePrice) |
| 15 | `Patient` | Карточка пациента (опционально привязана к user) |
| 16 | `Appointment` | Запись на приём |
| 17 | `AppointmentService` | Привязка услуг к приёму |
| 18 | `AppointmentTest` | Привязка анализов к приёму |
| 19 | `Visit` | Протокол визита (заполняется врачом) |
| 20 | `Prescription` | Рецепты в рамках визита |
| 21 | `TestResult` | Результаты анализов пациента |
| 22 | `Notification` | Уведомления (reminder_24h, reminder_1h, …) |
| 23 | `MlPrediction` | Прогноз неявки (1:1 с appointment) |

## Ключевые модели

### User → Patient/Doctor

Один `User` может быть либо `Doctor`, либо `Patient`, либо ни тем ни другим (например, admin без привязки). Связь 1:1 через `Doctor.userId` / `Patient.userId` (обе уникальные nullable).

```prisma
model User {
  id            BigInt    @id @default(autoincrement())
  email         String    @unique
  passwordHash  String    @map("password_hash")
  fullName      String    @map("full_name")
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())

  profile       UserProfile?
  roles         UserRole[]
  documents     UserDocument[]
  doctor        Doctor?
  patient       Patient?
}
```

### Appointment (центральная сущность)

```prisma
model Appointment {
  id            BigInt   @id @default(autoincrement())
  patientId     BigInt
  doctorId      BigInt
  centerId      BigInt
  startAt       DateTime
  durationMin   Int      @default(30)
  status        String   @default("pending")   // см. AppointmentStatus enum
  createdAt     DateTime @default(now())
  sourceChannel String?                        // 'web' | 'phone' | 'admin'

  patient       Patient
  doctor        Doctor
  center        ClinicCenter
  visit         Visit?
  prediction    MlPrediction?
  services      AppointmentService[]
  tests         AppointmentTest[]
  notifications Notification[]
}
```

#### Жизненный цикл (статусы)

```
   pending ──confirm──▶ confirmed ──start──▶ in_progress ──complete──▶ completed
      │                    │                       │
      cancel               cancel                  │
      │                    │                       │
      ▼                    ▼                       │
   cancelled           cancelled              (terminal)
                            │
                          no_show
                            │
                            ▼
                         no_show
```

Допустимые переходы — в `packages/shared/src/enums.ts` (`APPOINTMENT_TRANSITIONS`). `AppointmentService.updateStatus()` проверяет переходы и выбрасывает `BadRequestException` при недопустимом.

### MlPrediction

```prisma
model MlPrediction {
  id                BigInt   @id @default(autoincrement())
  appointmentId     BigInt   @unique               // 1:1
  noShowProbability Float                          // 0..1
  modelVersion      String                         // 'v1.0-gb'
  createdAt         DateTime @default(now())

  appointment       Appointment
}
```

Заполняется в `AppointmentService.create()` через `MlPredictionService.predictAndSave()`. См. [ML-модель](./06-ml-model.md).

### Visit + Prescription

```prisma
model Visit {
  id            BigInt    @id @default(autoincrement())
  appointmentId BigInt    @unique                   // 1:1
  complaints    String?
  diagnosis     String?
  examination   String?
  notes         String?
  closedAt      DateTime?

  appointment   Appointment
  prescriptions Prescription[]
}

model Prescription {
  id        BigInt   @id @default(autoincrement())
  visitId   BigInt
  text      String
  status    String   @default("active")
  createdAt DateTime @default(now())

  visit Visit
}
```

Visit создаётся врачом при начале приёма, закрывается при завершении (`closedAt = now()`). Рецепты привязаны к визиту.

### ServicePrice / TestPrice

Реализуют **историю цен** через `valid_from` / `valid_to` + `is_active`. При установке новой цены через `ServiceService.setServicePrice()` старые активные цены деактивируются (`isActive: false`, `validTo: now()`).

Для подсчёта `totalPrice` в `AppointmentService` используется текущая активная цена услуги в центре приёма.

## Конвенции

### Naming

- **Prisma модели** — `PascalCase` (например `ClinicCenter`)
- **Поля** — `camelCase` в Prisma → `snake_case` в БД через `@map`/`@@map`
- **Foreign keys** — `<entity>Id` (например `patientId BigInt @map("patient_id")`)
- **Связи** — без суффиксов (просто `patient`, `doctor`)

### Soft delete

Где есть `isActive` — используется soft-delete:
- `ClinicCenter.isActive` — `DELETE /centers/:id` ставит `false`
- `Service.isActive`, `LabTest.isActive` — то же
- `User.isActive` — `DELETE /users/:id` (admin)

Hard delete только для:
- `Patient` (через каскад или явно)
- `Doctor` — но в админке `DELETE /doctors/:id` делает hard delete (опасно при наличии приёмов)
- `Appointment.tests`, `Appointment.services` — отдельные строки с `qty` и `unitPrice`

### Декларация ID на фронте

В `apps/web/src/types.ts`:

```ts
export type ID = number | string;
```

Сериализатор BigInt → JSON: число если влезает в `Number.MAX_SAFE_INTEGER`, иначе строка. См. `apps/api/src/main.ts`:

```ts
(BigInt.prototype as any).toJSON = function() {
  const n = Number(this);
  return Number.isSafeInteger(n) ? n : this.toString();
};
```

## Миграции

Создание новой:
```bash
npx prisma migrate dev --schema=prisma/schema.prisma --name add_xyz_field
```

Применение:
```bash
npm run db:migrate
```

Полный сброс:
```bash
npx prisma migrate reset --schema=prisma/schema.prisma
```

## Prisma Studio

Web-GUI для просмотра/редактирования данных:

```bash
npm run db:studio
```

→ `http://localhost:5555`

## Сиды

Запуск:
```bash
npx prisma db seed
```

Логика — `prisma/seed.ts`. Идемпотентный:
- Справочники (роли, document types, центры, услуги, анализы) — через `upsert by code`.
- Пользователи (admin, doctors, patients) — `upsertUser()` ищет по email и привязывает роль если ещё не привязана.
- Расписания врачей — `upsert` по уникальной паре `(doctorId, dayOfWeek)`.
- Исторические приёмы и результаты анализов — создаются только если таблицы пусты (по `count()`).
