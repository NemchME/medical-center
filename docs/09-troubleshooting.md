# 9. Типовые проблемы

## Установка / запуск

### `Cannot find module '@prisma/client/runtime/query_engine_bg.postgresql.wasm-base64.js'`

**Причина**: Prisma Client не сгенерирован.

**Решение**:
```bash
npx prisma generate --schema=prisma/schema.prisma
```

В `package.json` уже есть `postinstall` хук, который должен запускать генерацию автоматически. Если не сработал — выполните руками.

Если ошибка повторяется после `npx prisma generate` — `node_modules` побит:
```bash
rm -rf node_modules package-lock.json
rm -rf apps/*/node_modules packages/*/node_modules
npm install
```

### `Error: Command failed with ENOENT: ts-node`

**Причина**: `ts-node` не установлен (требуется для `prisma db seed`).

**Решение**:
```bash
npm install -D ts-node
```

В корневом `package.json` он уже добавлен в `devDependencies`. Если `npm install` не подтянул — установите явно.

### `Error: P1001: Can't reach database server`

**Причина**: PostgreSQL не запущен.

**Решение**:
```bash
docker compose up -d
docker ps | grep medecina-db          # должен быть Up
```

Проверить порт в `.env`: `DATABASE_URL=postgresql://postgres:postgres@localhost:5434/medecina`. Контейнер использует **5434**, а не дефолтный 5432.

### Port 3000 / 5173 уже занят

```bash
# Убить процесс на порту
lsof -i :3000
kill -9 <PID>
```

Или поменять порт в `apps/api/src/main.ts` (`app.listen(3000)`) и `apps/web/vite.config.ts`.

## Backend / API

### `TypeError: Do not know how to serialize a BigInt`

**Причина**: Prisma возвращает BigInt для id, JSON.stringify его не умеет.

**Решение**: уже включено в `apps/api/src/main.ts`:
```ts
(BigInt.prototype as any).toJSON = function() {
  const n = Number(this);
  return Number.isSafeInteger(n) ? n : this.toString();
};
```

Если ошибка появилась — проверьте что этот блок не удалён.

### `403 Forbidden` при попытке создать сущность

**Причина**: токен не содержит `roles` (выпущен до миграции схемы JWT).

**Решение**: разлогиниться и залогиниться заново. На фронте есть автоматическая проверка `isTokenStale()`, которая редиректит на `/login` для устаревших токенов. Если не сработала — очистить вручную:
```js
// в DevTools console:
localStorage.removeItem('accessToken'); location.href = '/login';
```

### `401 Unauthorized` на каждом запросе

**Причины**:
1. Истёк access-токен (15 минут по умолчанию) → перелогиньтесь
2. `JWT_SECRET` отличается между бэкендом и токеном (рестартовали API с другим секретом)
3. Токен просто отсутствует или невалиден

Проверить токен:
```js
JSON.parse(atob(localStorage.getItem('accessToken').split('.')[1]))
```

Должен быть объект `{ sub, email, roles, iat, exp }`. Сравните `exp` с `Date.now()/1000` — если меньше, истёк.

### Implicit any errors при `nest start --watch`

Например:
```
src/modules/.../service.ts: error TS7006: Parameter 'g' implicitly has an 'any' type.
```

**Причина**: nest CLI использует свой компилятор, который иногда строже tsconfig.

**Решение**: добавить явные типы в коллбэки. Уже сделано во всех местах где было нужно (`analytics`, `auth`, `ml-prediction`, `user`).

Если появилась новая — добавьте явный тип:
```ts
// было
arr.find((x) => x.foo === 'bar')

// стало
arr.find((x: { foo: string }) => x.foo === 'bar')
```

### ML-модель не грузится: `Cannot find ONNX model`

В логах:
```
ERROR [MlPredictionService] Failed to load ML model from .../model.onnx: File doesn't exist
```

**Причина**: путь до модели неправильный.

**Проверить**:
```bash
ls packages/ml-model/model.onnx
```

Если файла нет — значит он не в репозитории. Скопируйте из бэкапа или переобучите модель (см. `ML_TRAINING.md`).

Если файл есть — проблема с резолвом пути:
```bash
# в .env
ML_MODEL_PATH=../../packages/ml-model/model.onnx
```

(относительно `apps/api`, потому что `process.cwd()` при `nest start` = `apps/api`).

Сервис также пробует несколько fallback-путей; см. `MlPredictionService.loadModel()`.

### Inference падает с ошибкой формы тензора

```
Error: input tensor shape mismatch: expected [1, 8], got [1, 7]
```

**Причина**: вы добавили/убрали фичу, но не обновили модель.

**Решение**: либо вернуть набор из 8 фичей в порядке из `params.json`, либо переобучить модель с новым набором фичей и заменить `model.onnx`.

## Frontend

### Вход прошёл, но в сайдбаре «Пациент» вместо «Администратор»

**Причина**: `/users/me` вернул `roles` в виде вложенных объектов, а не строк.

**Решение**: уже исправлено в `UserService.findMe()` — возвращает `roles: string[]`. Если у вас старая версия — обновите backend.

Проверить:
```bash
curl -s http://localhost:3000/api/users/me -H "Authorization: Bearer $TOKEN" | jq .roles
```

Должен быть массив строк: `["admin"]`.

### Модалка не открывается / форма не отправляется

DevTools → Console: проверьте JS-ошибки.

DevTools → Network: при клике на «Создать» должен идти `POST /api/...`. Если не идёт — кнопка submit может быть вне `<form>` или `onClick` забыли. Если идёт но 403/400 — см. соответствующие пункты выше.

### Vite HMR не подхватывает изменения

Перезапустить dev-сервер:
```bash
# Ctrl+C
npm run dev
```

### React Query показывает старые данные после мутации

Не вызвали `qc.invalidateQueries()` или query-key не совпадает.

Проверьте что в `useMutation.onSuccess` есть инвалидация по правильному ключу:
```ts
onSuccess: () => qc.invalidateQueries({ queryKey: ['doctors'] })
```

Префиксная инвалидация — `['doctors']` сбросит и `['doctors', search]`, и `['doctor', 5]`.

## База данных

### Хочу сбросить всю БД и начать с чистого листа

```bash
npx prisma migrate reset --schema=prisma/schema.prisma
```

Это:
1. Drop database
2. Создать заново
3. Применить все миграции
4. Запустить `prisma db seed`

### Изменил `schema.prisma`, как применить?

```bash
npx prisma migrate dev --schema=prisma/schema.prisma --name describe_change
```

Создаст новую миграцию в `prisma/migrations/` и применит её.

Если только меняли поле без структурных изменений (например, default value) — `prisma db push` для dev без миграции:
```bash
npx prisma db push --schema=prisma/schema.prisma
```

(но в production всегда через `migrate deploy`).

### Prisma Studio не открывается

```bash
npm run db:studio
```

Если порт 5555 занят:
```bash
lsof -i :5555
kill -9 <PID>
```

## Сиды

### Сиды зависают на «Doctors»

**Причина**: `bcrypt.hash()` для каждого user-а врача занимает ~100мс. На 5 врачей — секунду суммарно.

Если зависает дольше 30 сек — что-то не то с БД. Посмотрите логи:
```bash
docker logs medecina-db | tail -20
```

### Дублирующиеся центры/врачи после повторного запуска

Не должно — все upsert-ы по уникальному коду или email. Если появились дубли:
1. Проверьте что в `seed.ts` используется правильный уникальный ключ
2. Сбросьте БД: `npx prisma migrate reset`

### Не хочу пересоздавать historical appointments

Они создаются только если `prisma.appointment.count() === 0`. Если в БД уже есть приёмы — сиды их не трогают (выводят `⏭️ Appointments: уже есть N, пропускаю`).

## Производительность

### Медленный запрос `/api/appointments`

```bash
# Включить логи Prisma в .env
DEBUG=prisma:query
```

Запустить и посмотреть SQL. Если включён `include: { patient, doctor, center, prediction }` — это N+1 не делается (Prisma делает join). Узкое место скорее всего — отсутствие индексов на `patient_id`, `doctor_id`, `start_at`. Можно добавить:

```prisma
model Appointment {
  ...
  @@index([patientId])
  @@index([doctorId])
  @@index([startAt])
}
```

И сделать миграцию.

### Web-bundle 921 KB — это много

В разработке нормально. Для production можно code-split по роутам:

```tsx
const AdminPatientsPage = lazy(() => import('@/pages/admin/AdminPatientsPage'));
```

С этим bundle разделится на vendor + per-route chunks.

## Прочее

### Где смотреть логи API

При `npm run dev` логи идут в терминал turbo. NestJS Logger пишет с префиксом `[Nest]`.

В production используйте process manager (PM2, systemd):
```bash
node apps/api/dist/main.js > api.log 2>&1
```

Или направьте в системный journald / loki / cloudwatch.

### Не работает Live Share

Если Марина (студентка) не может подключиться через VS Code Live Share — это вопрос самого Live Share, не проекта. Альтернатива — push в общий репозиторий, она у себя поднимает локально.

### Как сменить пароль admin

Через API:
```bash
# Получить токен
TOKEN=$(curl -sS -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@medecina.ru","password":"admin12345"}' | jq -r .accessToken)

# PATCH /users/me не меняет пароль — нужен отдельный endpoint
```

Сейчас эндпоинта смены пароля нет. Можно через Prisma Studio или SQL:

```sql
-- Сначала сгенерировать хеш в Node:
-- node -e "console.log(require('bcrypt').hashSync('newpass', 10))"

UPDATE "user" SET password_hash = '$2b$10$...' WHERE email = 'admin@medecina.ru';
```

Или добавьте эндпоинт `PATCH /users/me/password` (хорошее упражнение).
