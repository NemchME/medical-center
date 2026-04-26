# 6. ML-модель: прогноз неявки пациента

## Задача

Для каждой новой записи на приём вычислить **вероятность того, что пациент не придёт** (`no_show_probability`, число от 0 до 1). Используется администраторами и врачами для:

- Подсветки рискованных записей в админке (>30% — красный, 15-30% — жёлтый, <15% — зелёный)
- Принятия решения об отправке дополнительных напоминаний

## Архитектура

**Train in Python, Serve in Node.js:**

```
┌────────────────────┐    ┌──────────────┐    ┌────────────────────┐
│   Python           │    │  ONNX file   │    │   Node.js          │
│   (scikit-learn)   │ ──▶│  model.onnx  │ ──▶│   (onnxruntime)    │
│   обучение         │    │  ~85 KB      │    │   inference        │
└────────────────────┘    └──────────────┘    └────────────────────┘
   на машине ML-инженера     в репозитории       в NestJS API
```

**Почему так:**
- Обучение — стандартный Python-стек (`pandas`, `scikit-learn`, `skl2onnx`).
- Сериализация в открытый формат **ONNX** — независим от языка и фреймворка.
- Inference — `onnxruntime-node` грузит `.onnx` напрямую в Node.js, без Python-зависимости в API.

Подробный гайд по обучению — [`ML_TRAINING.md`](../ML_TRAINING.md) в корне проекта.

## Модель

| Параметр | Значение |
|---|---|
| Алгоритм | `GradientBoostingClassifier` (sklearn) |
| Pipeline | `StandardScaler` → `GradientBoostingClassifier` |
| n_estimators | 100 |
| max_depth | 4 |
| learning_rate | 0.1 |
| min_samples_split | 20 |
| min_samples_leaf | 10 |
| Train size | 5000 синтетических примеров |
| ONNX opset | 12 |
| Размер `.onnx` | ~85 KB |

### Метрики (на тестовой выборке)

| Метрика | Значение |
|---|---|
| **ROC AUC** | 0.830 |
| Precision (no_show) | 0.467 |
| Recall (no_show) | 0.775 |
| F1 | 0.583 |
| Accuracy | 0.744 |

Хранятся в `packages/ml-model/metrics.json`.

### Важность фичей

| Фича | Importance |
|---|---|
| `no_show_rate` | **0.576** ← самая сильная |
| `lead_time_days` | 0.166 |
| `hour_of_day` | 0.111 |
| `patient_age` | 0.072 |
| `day_of_week` | 0.036 |
| `previous_visits` | 0.018 |
| `previous_no_shows` | 0.012 |
| `source_channel` | 0.009 |

## Фичи для inference

8 числовых признаков, **порядок строго фиксирован** (см. `params.json`):

| # | Имя | Тип | Описание | Откуда берётся |
|---|---|---|---|---|
| 1 | `day_of_week` | int (0-6) | День недели приёма | `startAt.getDay()` |
| 2 | `hour_of_day` | int (0-23) | Час начала приёма | `startAt.getHours()` |
| 3 | `lead_time_days` | float | За сколько дней до приёма создана запись | `(startAt - createdAt) / 86400000` |
| 4 | `patient_age` | int | Возраст пациента на дату приёма | по `patient.birthDate` |
| 5 | `previous_visits` | int | Кол-во прошлых приёмов (`completed` + `no_show`) | `groupBy` по `appointment` |
| 6 | `previous_no_shows` | int | Кол-во прошлых неявок | `groupBy` |
| 7 | `no_show_rate` | float | `previous_no_shows / previous_visits` (или 0 если нет истории) | вычисляется |
| 8 | `source_channel` | int | 0=web, 1=phone, 2=admin | enum-маппинг |

## Inference в NestJS

### `MlPredictionService`

`apps/api/src/modules/ml-prediction/ml-prediction.service.ts`.

#### `onModuleInit()`

При старте приложения вызывается `loadModel()` — загружает `.onnx` в память (`ort.InferenceSession.create()`). Дальнейшие вызовы `predict()` работают с этой сессией без re-load.

#### `loadModel()`

Пробует несколько путей в порядке приоритета:
1. `process.env.ML_MODEL_PATH` (абсолютный или относительно cwd)
2. `process.cwd()/../../packages/ml-model/model.onnx` (когда cwd = `apps/api`)
3. `process.cwd()/packages/ml-model/model.onnx` (когда cwd = монорепа)
4. `__dirname/../../../../../packages/ml-model/model.onnx` (когда работает в `dist/`)

Первый существующий путь используется. При ошибке загрузки — `session = null`, inference будет пропускаться (запись на приём не сломается).

#### `predict(features)`

```ts
const inputArray = Float32Array.from([
  features.dayOfWeek,
  features.hourOfDay,
  features.leadTimeDays,
  features.patientAge,
  features.previousVisits,
  features.previousNoShows,
  features.noShowRate,
  features.sourceChannel,
]);

const inputTensor = new ort.Tensor('float32', inputArray, [1, 8]);
const results = await session.run({ [inputName]: inputTensor });

// outputs:
// [0] = labels         (predicted class)
// [1] = probabilities  [[prob_class_0, prob_class_1]]
const probs = results[outputName1].data as Float32Array;
return Math.round(probs[1] * 10000) / 10000;       // 4 знака
```

#### `predictAndSave(appointmentId)`

1. SELECT `appointment` (с `patient`)
2. `prisma.appointment.groupBy({ by: ['status'], where: { patientId, startAt: { lt }, status: { in: ['completed', 'no_show'] } } })`
3. Считаем фичи (`completed`, `noShows`, `noShowRate`, …)
4. Возраст = `(startAt - patient.birthDate) / 365.25 days` (или 30 если нет даты)
5. `sourceChannel`: `phone` → 1, `admin` → 2, иначе 0
6. `predict(features)`
7. `prisma.mlPrediction.upsert(...)` — сохраняет в БД (`appointmentId` unique)

Вызывается из `AppointmentService.create()` в try/catch — ошибка inference **не ломает** создание записи (только пишется warning в лог).

### Эндпоинт перезагрузки модели

```
POST /api/ml/reload
```

Только для admin. Вызывает `loadModel()` повторно. Используется когда:
- Обновили `model.onnx` без рестарта сервера
- Хотите переключиться на другую версию модели через `ML_MODEL_PATH`

Возвращает `{ status: 'ok' | 'error', modelVersion: 'v1.0-gb' }`.

## Где видны прогнозы в UI

| Место | Что показывается |
|---|---|
| `/admin/appointments` — таблица | Колонка «Прогноз» с цветным бейджем (🟢 < 15%, 🟡 15-30%, 🔴 > 30%) |
| `/admin/patients` → модалка пациента | На каждой строке истории приёмов |
| `/admin/doctors` → модалка врача | На каждой строке истории приёмов |
| `/doctor/schedule` → модалка приёма | Отдельная строка «Риск неявки» |
| `Appointment` API response | Поле `prediction: { id, noShowProbability, modelVersion, createdAt }` |

Используется один компонент `apps/web/src/components/shared/NoShowIndicator.tsx`:

```tsx
function NoShowIndicator({ probability }: { probability: number }) {
  const pct = Math.round(probability * 100);
  const color =
    probability < 0.15  ? 'green'
    : probability <= 0.3 ? 'yellow'
    : 'red';
  return <span className={...}>{pct}%</span>;
}
```

## Дифференциация на практике

Реальные результаты с тестовыми пациентами (после сидов):

| Пациент | История (completed/no_show) | Прогноз |
|---|---|---|
| Морозов | 1 / 2 | **43%** 🔴 |
| Лебедев | 2 / 0 | 17% 🟡 |
| Сидоров | 2 / 0 | **3%** 🟢 |

`no_show_rate` — главная фича модели, с ней корреляция почти линейная.

## Обновление модели

Чтобы обновить модель без перезаписи кода:

1. Обучить новую версию (см. `ML_TRAINING.md`)
2. Сгенерировать новый `model.onnx`
3. Заменить файл в `packages/ml-model/model.onnx`
4. Обновить `metrics.json` и `params.json` (если изменились гиперпараметры/фичи)
5. Если изменилась версия → обновить константу в `MlPredictionService`:
   ```ts
   private readonly MODEL_VERSION = 'v1.0-gb';
   ```
6. Перезагрузить модель: `POST /api/ml/reload` (от admin) — без рестарта сервера

> Если изменился набор/порядок фичей — нужно править `predict()` в сервисе, потому что порядок числе в `Float32Array` критичен.

## Известные предупреждения

При загрузке модели в логах появляется:

```
[W:onnxruntime:, model.cc:215 Model] ONNX Runtime only *guarantees* support
for models stamped with opset version 7 or above. ... For now, this opset 1
model may run depending upon legacy support.
```

`skl2onnx` помечает некоторые внутренние подоператоры как opset 1. Inference работает корректно — это просто warning. Можно игнорировать.

## Тонкости

### Холодный старт пациента

Если у пациента нет истории (новая регистрация) — `no_show_rate = 0`, `previous_visits = 0`. Модель занижает прогноз для таких пациентов (типично 10-20%). Это **корректное** поведение — пациент действительно "белый лист", и решение должно опираться на другие фичи (день, время, lead_time).

### Чувствительность к feature drift

Если в production распределение фичей сильно отличается от обучающего датасета (например клиника начала работать ночью, или появились пациенты 90+ лет которых не было в обучении) — модель может давать смещённые прогнозы.

Решение — периодическое переобучение (раз в 1-3 месяца) на свежих данных и обновление через `/ml/reload`.

### Дисбаланс классов

Базовый рейт неявок ~23%. Это умеренный дисбаланс — модель не использует SMOTE / class weights. Если базовый рейт сильно изменится в production → стоит балансировать через `class_weight='balanced'` при переобучении.

## Файлы

```
packages/ml-model/
├── model.onnx          # Обученная модель в ONNX (бинарь)
├── metrics.json        # ROC AUC, precision/recall, feature_importance
├── params.json         # Гиперпараметры, список фичей в правильном порядке
├── package.json        # (заглушка для workspace)
└── requirements.txt    # Python-зависимости для обучения
```

`ML_TRAINING.md` в корне — пошаговый гайд по подготовке данных, обучению, экспорту в ONNX и интеграции.
