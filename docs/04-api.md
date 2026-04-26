# 4. REST API

Весь API живёт на префиксе `/api`. Полная интерактивная документация — Swagger UI: **http://localhost:3000/api/docs**.

Сериализация: все запросы и ответы — JSON. `BigInt` сериализуется как `number` (при влезании в safe integer) или `string`.

## Соглашения

### Авторизация

Большинство эндпоинтов требуют JWT. Передавать в заголовке:

```
Authorization: Bearer <accessToken>
```

Токен выдаёт `POST /auth/login` или `/auth/register`. См. [Аутентификация](./05-authentication.md).

### Роли

| Роль | Назначение |
|---|---|
| `admin` | Полные права |
| `manager` | Управление приёмами, пациентами, уведомлениями |
| `doctor` | Свои приёмы, ведение визитов |
| `patient` | Свой профиль и записи |

### Коды ответов

| Код | Когда |
|---|---|
| 200 | Успешное чтение/обновление |
| 201 | Успешное создание |
| 400 | Bad Request (валидация, недопустимый переход статуса) |
| 401 | Нет токена / токен невалиден |
| 403 | Нет прав (RolesGuard) |
| 404 | Ресурс не найден |
| 409 | Конфликт (например email уже зарегистрирован) |
| 500 | Внутренняя ошибка |

---

## Auth — `/api/auth`

| Метод | Путь | Тело | Кто может | Описание |
|---|---|---|---|---|
| POST | `/auth/register` | `RegisterDto` | public | Регистрация (по умолчанию роль `patient`) |
| POST | `/auth/login` | `LoginDto` | public | Логин по email + паролю |

### `RegisterDto`

```json
{
  "email": "user@example.com",
  "password": "secret123",
  "fullName": "Иванов Иван Иванович",
  "phone": "+7 (900) 123-45-67",          // optional
  "birthDate": "1990-05-15",              // optional
  "role": "patient"                        // optional, default 'patient'
}
```

### Ответ

```json
{
  "accessToken": "eyJhbGciOi...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "fullName": "Иванов И.И.",
    "roles": ["patient"]
  }
}
```

При регистрации с `role: "patient"` автоматически создаётся запись в таблице `Patient`, привязанная к user.

---

## Users — `/api/users` (требует JWT)

| Метод | Путь | Кто | Описание |
|---|---|---|---|
| GET | `/users/me` | любой авторизованный | Профиль текущего пользователя (с `profile`, `roles`, `doctor`, `patient`) |
| PATCH | `/users/me` | любой авторизованный | Обновить профиль (ФИО, телефон, дата рождения, пол, адрес) |
| GET | `/users` | admin, manager | Все пользователи |
| DELETE | `/users/:id` | admin | Деактивация (soft delete: `isActive = false`) |

### `PATCH /users/me`

```json
{
  "fullName": "Новое ФИО",
  "phone": "+7 (901) 222-33-44",
  "birthDate": "1995-02-10",
  "gender": "male",
  "address": "ул. Ленина, 1"
}
```

---

## Patients — `/api/patients` (требует JWT)

| Метод | Путь | Кто | Описание |
|---|---|---|---|
| GET | `/patients/me` | любой | Карточка пациента, привязанная к текущему user |
| GET | `/patients` | admin, manager, doctor | Список пациентов (`?search=`) |
| GET | `/patients/:id` | admin, manager, doctor | Карточка пациента |
| POST | `/patients` | admin, manager | Создать пациента (без user) |
| PATCH | `/patients/:id` | admin, manager | Обновить |
| DELETE | `/patients/:id` | admin | Удалить (hard delete) |

### `POST /patients`

```json
{
  "userId": 5,                // optional, связать с user
  "fullName": "Сидоров И.П.",
  "birthDate": "1985-03-15",
  "phone": "+7 (900) 111-22-33",
  "email": "sidorov@mail.ru",
  "gender": "male",
  "address": "г. Москва, ул. Мира, 10"
}
```

---

## Doctors — `/api/doctors`

| Метод | Путь | Кто | Описание |
|---|---|---|---|
| GET | `/doctors` | **public** | Список всех (`?centerId=N` — фильтр) |
| GET | `/doctors/:id` | **public** | Карточка |
| POST | `/doctors` | admin, manager | Создать |
| PATCH | `/doctors/:id` | admin, manager | Обновить |
| DELETE | `/doctors/:id` | admin | Удалить |

### `POST /doctors`

```json
{
  "userId": 12,                              // optional, привязка к user (для логина)
  "centerId": 1,
  "fullName": "Иванова А.С.",
  "specialization": "Терапевт",
  "photoUrl": "https://...",
  "experience": "15 лет",
  "education": "ВГМУ им. Бурденко",
  "bio": "..."
}
```

> Чтобы врач мог логиниться: сначала `POST /auth/register` с `role: "doctor"`, потом `POST /doctors` с полученным `userId`.

---

## Doctor Schedule — `/api/doctors/:doctorId/schedule`

| Метод | Путь | Кто | Описание |
|---|---|---|---|
| GET | `/doctors/:id/schedule` | **public** | Расписание |
| POST | `/doctors/:id/schedule` | admin, manager, doctor | Upsert одного дня |
| PUT | `/doctors/:id/schedule` | admin, manager, doctor | Установить всё расписание (массив) |

### `PUT /doctors/:id/schedule`

```json
[
  { "dayOfWeek": 0, "startTime": "09:00", "endTime": "17:00", "slotMin": 30 },
  { "dayOfWeek": 1, "startTime": "09:00", "endTime": "17:00", "slotMin": 30 },
  { "dayOfWeek": 2, "startTime": "09:00", "endTime": "17:00", "slotMin": 30 }
]
```

`dayOfWeek`: `0=Пн … 6=Вс`. `slotMin` — длительность одного слота записи.

---

## Centers — `/api/centers`

| Метод | Путь | Кто | Описание |
|---|---|---|---|
| GET | `/centers` | **public** | Все активные |
| GET | `/centers/:id` | **public** | Карточка с врачами |
| POST | `/centers` | admin | Создать |
| PATCH | `/centers/:id` | admin | Обновить |
| DELETE | `/centers/:id` | admin | Деактивировать |

---

## Appointments — `/api/appointments` (требует JWT)

| Метод | Путь | Кто | Описание |
|---|---|---|---|
| GET | `/appointments/me` | любой | Свои приёмы (как пациент) |
| GET | `/appointments/doctor/me` | любой | Свои приёмы (как врач) |
| GET | `/appointments` | admin, manager, doctor | Все приёмы с фильтрами |
| GET | `/appointments/:id` | любой авториз. | Детали приёма |
| POST | `/appointments` | любой авториз. | Создать запись |
| PATCH | `/appointments/:id/status` | любой авториз. | Сменить статус |
| POST | `/appointments/:id/services` | admin, manager, doctor | Добавить услугу |
| POST | `/appointments/:id/tests` | admin, manager, doctor | Добавить анализ |
| DELETE | `/appointments/:id/services/:rowId` | admin, manager, doctor | Снять услугу |
| DELETE | `/appointments/:id/tests/:rowId` | admin, manager, doctor | Снять анализ |

### Фильтры в `GET /appointments`

- `patientId` — number
- `doctorId` — number
- `status` — string (`pending`/`confirmed`/`completed`/…)
- `from` — ISO date (start_at >= from)
- `to` — ISO date

### `POST /appointments`

```json
{
  "patientId": 3,
  "doctorId": 1,
  "centerId": 1,
  "startAt": "2026-04-26T11:00:00Z",
  "durationMin": 30,
  "sourceChannel": "web",                  // 'web' | 'phone' | 'admin'
  "serviceIds": [1, 2],                    // optional, привязать услуги при создании
  "testIds": [1]                           // optional, привязать анализы
}
```

**Что происходит при создании:**
1. INSERT `appointment` в БД
2. Привязка услуг и анализов (с расчётом `totalPrice`)
3. Inference ML-модели → запись в `ml_prediction`
4. Создание `notification`-ов: `reminder_24h`, `reminder_1h`
5. Возврат полного объекта со всеми вложениями

### `PATCH /appointments/:id/status`

```json
{ "status": "confirmed" }
```

Допустимые переходы — см. [База данных → Appointment](./03-database.md#жизненный-цикл-статусы).

---

## Visits — `/api/visits` (требует JWT)

| Метод | Путь | Кто | Описание |
|---|---|---|---|
| GET | `/visits/:id` | любой авториз. | Карточка визита |
| POST | `/visits` | doctor, admin | Создать (при начале приёма) |
| PATCH | `/visits/:id` | doctor, admin | Обновить (жалобы, диагноз, осмотр, заметки) |
| PATCH | `/visits/:id/close` | doctor, admin | Закрыть (`closedAt = now()`) |
| POST | `/visits/:id/prescriptions` | doctor, admin | Добавить рецепт |
| DELETE | `/visits/prescriptions/:id` | doctor, admin | Удалить рецепт |

### `POST /visits`

```json
{
  "appointmentId": 16,
  "complaints": "Головная боль, температура 38",
  "diagnosis": "ОРВИ",
  "examination": "Зев гиперемирован, лёгкие чистые",
  "notes": "Рекомендован постельный режим"
}
```

### `POST /visits/:id/prescriptions`

```json
{ "text": "Парацетамол 500мг по 1 табл. 3 раза в день — 5 дней" }
```

---

## Services & Tests — `/api/services`

| Метод | Путь | Кто | Описание |
|---|---|---|---|
| GET | `/services` | **public** | Все услуги (с ценами) |
| GET | `/services/tests` | **public** | Все анализы (с ценами) |
| POST | `/services` | admin | Создать услугу |
| PATCH | `/services/:id` | admin | Обновить услугу |
| DELETE | `/services/:id` | admin | Деактивировать |
| POST | `/services/tests` | admin | Создать анализ |
| PATCH | `/services/tests/:id` | admin | Обновить анализ |
| DELETE | `/services/tests/:id` | admin | Деактивировать анализ |
| POST | `/services/:id/prices` | admin | Установить цену услуги |
| POST | `/services/tests/:id/prices` | admin | Установить цену анализа |

### `POST /services/:id/prices`

```json
{ "centerId": 1, "price": 1500, "currency": "RUB" }
```

> Старая активная цена для пары `(serviceId, centerId)` автоматически деактивируется.

---

## Test Results — `/api/test-results` (требует JWT)

| Метод | Путь | Кто | Описание |
|---|---|---|---|
| GET | `/test-results/me` | patient | Свои результаты |
| GET | `/test-results/patient/:patientId` | admin, manager, doctor | Результаты пациента |
| GET | `/test-results/:id` | любой авториз. | Один результат |
| POST | `/test-results` | admin, manager, doctor | Создать |
| PATCH | `/test-results/:id` | admin, manager, doctor | Обновить |
| PATCH | `/test-results/:id/ready` | admin, manager, doctor | Отметить готовым (status='ready', readyAt=now) |
| DELETE | `/test-results/:id` | admin | Удалить |

---

## Notifications — `/api/notifications` (admin, manager)

| Метод | Путь | Описание |
|---|---|---|
| GET | `/notifications` | Все (`?status=pending\|sent\|failed`) |
| GET | `/notifications/appointment/:id` | По приёму |
| GET | `/notifications/:id` | Одно |
| POST | `/notifications` | Создать |
| PATCH | `/notifications/:id/sent` | Отметить отправленным |
| PATCH | `/notifications/:id/failed` | Отметить неудачным |
| DELETE | `/notifications/:id` | Удалить |

---

## ML — `/api/ml` (требует JWT)

| Метод | Путь | Кто | Описание |
|---|---|---|---|
| GET | `/ml/predictions/:appointmentId` | любой авториз. | Получить прогноз |
| POST | `/ml/predictions/:appointmentId` | admin, manager, doctor | Пересчитать прогноз вручную |
| POST | `/ml/reload` | admin | Перезагрузить ONNX-модель без рестарта сервера |

См. [ML-модель](./06-ml-model.md).

---

## Analytics — `/api/analytics` (admin, manager)

| Метод | Путь | Описание |
|---|---|---|
| GET | `/analytics/overview` | Сводка: пациенты, приёмы, % неявок, по статусам |
| GET | `/analytics/appointments-by-month` | Кол-во приёмов по месяцам (12 мес) |
| GET | `/analytics/doctor-load` | Загрузка врачей (приёмов за 30 дней) |
| GET | `/analytics/no-show-trend` | Тренд неявок по месяцам |

### `GET /analytics/overview`

```json
{
  "totalPatients": 5,
  "totalAppointments": 18,
  "totalDoctors": 5,
  "totalCenters": 3,
  "appointmentsByStatus": [
    { "status": "completed", "count": 6 },
    { "status": "no_show", "count": 3 },
    { "status": "pending", "count": 5 },
    { "status": "confirmed", "count": 4 }
  ],
  "noShowRate": 0.333
}
```

---

## Примеры использования

### Полный flow: запись + просмотр прогноза

```bash
# 1. Логин
TOKEN=$(curl -sS -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@medecina.ru","password":"admin12345"}' \
  | jq -r .accessToken)

# 2. Создание записи
APT=$(curl -sS -X POST http://localhost:3000/api/appointments \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "patientId": 5,
    "doctorId": 1,
    "centerId": 1,
    "startAt": "2026-04-30T10:00:00Z",
    "durationMin": 30,
    "sourceChannel": "admin"
  }')

# 3. Из ответа сразу видно прогноз
echo $APT | jq .prediction
```

### Полный flow врача: визит + рецепт + закрытие

```bash
TOKEN=$(curl -sS -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"ivanova@medecina.ru","password":"doctor12345"}' \
  | jq -r .accessToken)

# Перевод приёма в in_progress
curl -X PATCH http://localhost:3000/api/appointments/16/status \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"status":"in_progress"}'

# Создание визита
VISIT=$(curl -sS -X POST http://localhost:3000/api/visits \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{
    "appointmentId": 16,
    "complaints": "Головная боль",
    "diagnosis": "Мигрень",
    "examination": "Без очаговой неврологической симптоматики"
  }')
VISIT_ID=$(echo $VISIT | jq -r .id)

# Рецепт
curl -X POST http://localhost:3000/api/visits/$VISIT_ID/prescriptions \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"text":"Суматриптан 50мг при приступе"}'

# Закрытие визита
curl -X PATCH http://localhost:3000/api/visits/$VISIT_ID/close \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"notes":"Назначена контрольная явка"}'

# Завершение приёма
curl -X PATCH http://localhost:3000/api/appointments/16/status \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"status":"completed"}'
```
