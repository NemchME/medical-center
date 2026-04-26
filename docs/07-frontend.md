# 7. Frontend

React + Vite SPA. Запускается на `http://localhost:5173`. Прокси на `/api/*` → `http://localhost:3000`.

## Структура

```
apps/web/src/
├── main.tsx                      # Entry point, ReactDOM.createRoot
├── App.tsx                       # Router + QueryClient + hydrate()
├── types.ts                      # Доменные типы (Patient, Doctor, …)
│
├── api/                          # Axios-клиенты per-entity
│   ├── auth.ts
│   ├── centers.ts
│   ├── doctors.ts
│   ├── patients.ts
│   ├── appointments.ts
│   ├── services.ts
│   ├── test-results.ts
│   ├── visits.ts
│   ├── notifications.ts
│   ├── analytics.ts
│   ├── ml.ts
│   └── index.ts
│
├── services/
│   └── api.ts                    # Axios instance + interceptors
│
├── stores/
│   └── auth.store.ts             # Zustand: user, isAuthenticated, login, logout, hydrate
│
├── layouts/
│   ├── PublicLayout.tsx          # Header + Footer для публичных страниц
│   ├── AuthLayout.tsx            # Простой layout для login/register
│   └── DashboardLayout.tsx       # Sidebar + Outlet, защита от анонима
│
├── pages/
│   ├── public/                   # 5 публичных
│   │   ├── HomePage.tsx
│   │   ├── DoctorsPage.tsx
│   │   ├── ServicesPage.tsx
│   │   ├── CentersPage.tsx
│   │   └── TestsPage.tsx
│   │
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   │
│   ├── patient/                  # 5 пациентских
│   │   ├── ProfilePage.tsx
│   │   ├── AppointmentsPage.tsx
│   │   ├── MedCardPage.tsx
│   │   ├── PrescriptionsPage.tsx
│   │   └── TestResultsPage.tsx
│   │
│   ├── doctor/
│   │   ├── SchedulePage.tsx
│   │   ├── DoctorPatientsPage.tsx
│   │   └── DoctorProfilePage.tsx
│   │
│   └── admin/                    # 7 админских
│       ├── AdminPatientsPage.tsx
│       ├── AdminDoctorsPage.tsx
│       ├── AdminAppointmentsPage.tsx
│       ├── AdminCentersPage.tsx
│       ├── AdminServicesPage.tsx
│       ├── AnalyticsPage.tsx
│       └── AdminNotificationsPage.tsx
│
├── components/
│   ├── shared/                   # Доменные карточки
│   │   ├── DoctorCard.tsx
│   │   ├── CenterCard.tsx
│   │   ├── ServiceCard.tsx
│   │   ├── TestCard.tsx
│   │   ├── AppointmentCard.tsx
│   │   └── NoShowIndicator.tsx
│   │
│   └── ui/                       # Универсальные UI-блоки
│       ├── DataTable.tsx
│       ├── EmptyState.tsx
│       ├── Modal.tsx
│       ├── SearchInput.tsx
│       ├── Skeleton.tsx
│       ├── StatCard.tsx
│       └── StatusBadge.tsx
│
├── hooks/                        # Кастомные хуки (пока пусто)
├── lib/utils.ts                  # cn (clsx)
└── styles/globals.css            # Tailwind + base styles
```

## Routing

`apps/web/src/App.tsx`:

```tsx
<Routes>
  <Route element={<PublicLayout />}>
    <Route path="/" element={<HomePage />} />
    <Route path="/doctors" element={<DoctorsPage />} />
    <Route path="/services" element={<ServicesPage />} />
    <Route path="/centers" element={<CentersPage />} />
    <Route path="/tests" element={<TestsPage />} />
  </Route>

  <Route element={<AuthLayout />}>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
  </Route>

  <Route element={<DashboardLayout />}>
    {/* Patient */}
    <Route path="/patient/profile" element={<ProfilePage />} />
    <Route path="/patient/appointments" element={<AppointmentsPage />} />
    <Route path="/patient/med-card" element={<MedCardPage />} />
    <Route path="/patient/prescriptions" element={<PrescriptionsPage />} />
    <Route path="/patient/test-results" element={<TestResultsPage />} />

    {/* Doctor */}
    <Route path="/doctor/schedule" element={<SchedulePage />} />
    <Route path="/doctor/patients" element={<DoctorPatientsPage />} />
    <Route path="/doctor/profile" element={<DoctorProfilePage />} />

    {/* Admin */}
    <Route path="/admin/patients" element={<AdminPatientsPage />} />
    <Route path="/admin/appointments" element={<AdminAppointmentsPage />} />
    <Route path="/admin/doctors" element={<AdminDoctorsPage />} />
    <Route path="/admin/centers" element={<AdminCentersPage />} />
    <Route path="/admin/services" element={<AdminServicesPage />} />
    <Route path="/admin/analytics" element={<AnalyticsPage />} />
    <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
  </Route>
</Routes>
```

## State management

### Server state — TanStack Query

```tsx
// global config in App.tsx
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});
```

#### Паттерны

**Query (чтение):**
```tsx
const { data: doctors = [], isLoading } = useQuery({
  queryKey: ['doctors'],
  queryFn: () => doctorsApi.list(),
});
```

**Mutation (запись):**
```tsx
const qc = useQueryClient();
const mutation = useMutation({
  mutationFn: () => doctorsApi.create(form),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['doctors'] });
    closeModal();
  },
});
```

**Параметризованный query:**
```tsx
const { data } = useQuery({
  queryKey: ['patient', selectedId],
  queryFn: () => patientsApi.get(selectedId!),
  enabled: !!selectedId,                     // не запускать пока id null
});
```

#### Конвенции query key

| Шаблон | Пример |
|---|---|
| `['<entity>']` | `['doctors']`, `['patients']` |
| `['<entity>', id]` | `['doctor', 5]` |
| `['<entity>', filter]` | `['patients', searchString]` |
| `['<entity>', 'me']` | `['appointments', 'mine']` |
| `['<entity>', 'sub-resource', id]` | `['appointments', 'by-doctor', 1]` |

При мутации инвалидируем по prefix: `qc.invalidateQueries({ queryKey: ['doctors'] })` сбросит и `['doctors']`, и `['doctor', 5]`.

### Client state — Zustand

Только auth: `useAuthStore`. Всё остальное держим в React Query.

```tsx
const user = useAuthStore((s) => s.user);
const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
const role = useCurrentRole();             // вычисляемый из user.roles
```

## API клиенты

Каждая сущность — отдельный модуль `apps/web/src/api/<entity>.ts`. Пример:

```ts
// apps/web/src/api/patients.ts
import { api } from '@/services/api';
import type { ID, Patient } from '@/types';

export const patientsApi = {
  async list(search?: string): Promise<Patient[]> {
    const { data } = await api.get<Patient[]>('/patients', {
      params: search ? { search } : undefined,
    });
    return data;
  },
  async get(id: ID): Promise<Patient> {
    const { data } = await api.get<Patient>(`/patients/${id}`);
    return data;
  },
  async create(dto: { ... }): Promise<Patient> { ... },
  async update(id: ID, dto: Partial<Patient>): Promise<Patient> { ... },
  async remove(id: ID) { ... },
};
```

Все запросы идут через единый `api` (axios instance из `services/api.ts`) с interceptors:
- request: добавляет `Authorization: Bearer <token>` из localStorage
- response: на 401 — редирект на `/login`
- request: на устаревший токен (без `roles`) — редирект на `/login`

## Layouts

### PublicLayout

Header с навигацией + Footer. Используется на главной, `/doctors`, `/services`, `/centers`, `/tests`.

### AuthLayout

Минимальный layout без header — фон с градиентом, логотип. Для `/login`, `/register`.

### DashboardLayout

Sidebar по роли + main с `<Outlet />`. Защита: если `!isAuthenticated` — `<Navigate to="/login" />`.

В сайдбаре пункты выбираются по роли:
- `admin` или `manager` → admin links (7 пунктов)
- `doctor` → doctor links (3 пункта)
- иначе → patient links (5 пунктов)

## Страницы — паттерны

### Каталог сущностей с CRUD-модалками

Пример: `AdminCentersPage`. Структура:

```tsx
export function AdminCentersPage() {
  const qc = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<ID | null>(null);
  const [form, setForm] = useState<CenterFormState>(emptyForm);

  const { data: centers = [], isLoading } = useQuery({...});

  const createMutation = useMutation({...});
  const updateMutation = useMutation({...});
  const deleteMutation = useMutation({...});

  return (
    <div>
      {/* Header + Add button */}
      {/* List/Table */}
      {/* Create/Edit Modal */}
    </div>
  );
}
```

### Master/Detail (таблица + модалка деталей)

Пример: `AdminDoctorsPage`. Клик по строке открывает модалку с расширенной инфой и историей приёмов (отдельный query, активируется по `selectedId`).

### Дашборд с графиками

Пример: `AnalyticsPage`. Параллельные queries для разных метрик, рендер через `recharts`.

## Компоненты

### `DataTable`

Универсальная таблица с сортировкой и кликом по строке.

```tsx
<DataTable
  data={items}
  columns={columns}
  onRowClick={(row) => setSelectedId(row.id)}
  emptyMessage="Нет данных"
/>
```

### `Modal`

Портал в `document.body` через `createPortal`. С `max-h-[90vh]` и `overflow-y-auto` — длинные формы скроллятся.

```tsx
<Modal isOpen={open} onClose={close} title="..." size="lg">
  <form>...</form>
</Modal>
```

### `StatusBadge`

Цветной бейдж по статусу приёма (pending/confirmed/completed/cancelled/no_show/in_progress).

### `NoShowIndicator`

Цветной индикатор риска неявки (используется во всех местах с `prediction`):

```tsx
<NoShowIndicator probability={appointment.prediction.noShowProbability} />
```

## Стили

TailwindCSS. Конвенции:
- Семейство фиолетового / purple — основной акцент (`primary-500`, `purple-600`)
- Серые — текст и фоны (`gray-50`, `gray-500`, `gray-900`)
- Закруглённые углы — `rounded-xl` для блоков, `rounded-2xl` для карточек, `rounded-full` для бейджей
- Тени — `shadow-sm` по умолчанию, `shadow-lg` для модалок
- Анимации — `transition-colors` / `transition-shadow`

Утилита `cn(...classes)` из `lib/utils.ts` — обёртка над `clsx` для условных классов.

## Сборка

```bash
cd apps/web
npm run build          # tsc -b && vite build → apps/web/dist/
```

Артефакт — статика. Можно деплоить за nginx или на любой статический хостинг (Vercel, Netlify). Только не забыть указать в проде:
- `VITE_API_URL` если фронт и API на разных доменах (потребует доработки в `services/api.ts`)
- nginx fallback на `index.html` для SPA-роутинга

## Hot reload

Vite + React Refresh. Изменения в `.tsx` подхватываются мгновенно без потери state.

Если состояние Zustand потерялось — перезапустите login (или хотя бы `localStorage.setItem('accessToken', ...)` в DevTools).
