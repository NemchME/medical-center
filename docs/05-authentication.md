# 5. Аутентификация и роли

## Общая схема

JWT-аутентификация. Access-токен в заголовке `Authorization: Bearer <token>`. Срок жизни — 15 минут (по умолчанию, в `.env`). Хранится на фронте в `localStorage`.

Refresh-токены не реализованы (можно добавить — есть `JWT_REFRESH_EXPIRES_IN` в `.env`).

## Backend

### `AuthModule`

Файл `apps/api/src/modules/auth/auth.module.ts`. Подключает:
- `JwtModule` с секретом из `process.env.JWT_SECRET`
- `PassportModule` со стратегией `jwt`
- `JwtStrategy` (валидация токена, извлечение `req.user`)

### `AuthService`

#### `register(dto)`

1. Проверяет уникальность email → `ConflictException` если занят
2. Хеширует пароль `bcrypt.hash(password, 10)`
3. Upsert роли (`UserRole.PATIENT` по умолчанию, или из dto)
4. INSERT в `user`, `user_profile`, `user_role`
5. Если роль `patient` — автосоздание `Patient` с `userId`
6. Возвращает `buildAuthResponse(userId)`

#### `login(dto)`

1. SELECT user по email
2. Проверка `isActive` → `UnauthorizedException` если деактивирован
3. `bcrypt.compare(password, passwordHash)` → `UnauthorizedException` при несовпадении
4. `buildAuthResponse(userId)`

#### `buildAuthResponse(userId)`

Возвращает:
```ts
{
  accessToken: string,
  user: {
    id: number,
    email: string,
    fullName: string,
    roles: string[]                  // ['admin'], ['doctor'], ['patient'], …
  }
}
```

JWT-payload содержит `{ sub, email, roles }` — это позволяет `RolesGuard` работать без обращения к БД.

### `JwtStrategy`

```ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'dev-secret',
    });
  }

  validate(payload: { sub: number; email: string; roles?: string[] }) {
    return { id: payload.sub, email: payload.email, roles: payload.roles ?? [] };
  }
}
```

После валидации в каждом контроллере доступен `req.user = { id, email, roles }`.

## Guards

### `JwtAuthGuard`

`apps/api/src/common/guards/jwt-auth.guard.ts`:

```ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

Простая обёртка над Passport-стратегией. При отсутствии токена / невалидном токене → 401.

### `RolesGuard`

`apps/api/src/common/guards/roles.guard.ts`:

```ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user?.roles?.includes(role));
  }
}
```

Читает метаданные `@Roles(...)` и проверяет что хотя бы одна роль из требуемых есть у пользователя.

### Декоратор `@Roles()`

`apps/api/src/common/decorators/roles.decorator.ts`:

```ts
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

## Применение в контроллерах

### Public + JWT-only + Role-based

```ts
@ApiTags('Doctors')
@Controller('doctors')
export class DoctorController {
  @Get()                                     // public
  findAll() { ... }

  @Get(':id')                                // public
  findOne() { ... }

  @Post()                                    // requires admin or manager
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create() { ... }

  @Delete(':id')                             // requires admin
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove() { ... }
}
```

### Class-level guard

```ts
@Controller('users')
@UseGuards(JwtAuthGuard)                     // все методы требуют JWT
export class UserController {
  @Get('me') getMe() { ... }                 // только JWT

  @Get()
  @UseGuards(RolesGuard)                     // дополнительно — admin/manager
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  findAll() { ... }
}
```

## Роли

Enum в `packages/shared/src/enums.ts`:

```ts
export enum UserRole {
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  PATIENT = 'patient',
  MANAGER = 'manager',
}
```

### Матрица доступа

| Эндпоинт | admin | manager | doctor | patient | public |
|---|:-:|:-:|:-:|:-:|:-:|
| `POST /auth/login` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /auth/register` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /doctors` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /centers` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /services` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /users/me` | ✅ | ✅ | ✅ | ✅ | — |
| `GET /appointments/me` | ✅ | ✅ | ✅ | ✅ | — |
| `POST /appointments` | ✅ | ✅ | ✅ | ✅ | — |
| `GET /appointments` | ✅ | ✅ | ✅ | — | — |
| `GET /patients` | ✅ | ✅ | ✅ | — | — |
| `POST /patients` | ✅ | ✅ | — | — | — |
| `POST /doctors` | ✅ | ✅ | — | — | — |
| `POST /centers` | ✅ | — | — | — | — |
| `POST /services` | ✅ | — | — | — | — |
| `POST /visits` | ✅ | — | ✅ | — | — |
| `GET /analytics/overview` | ✅ | ✅ | — | — | — |
| `POST /ml/reload` | ✅ | — | — | — | — |
| `DELETE /users/:id` | ✅ | — | — | — | — |

## Frontend

### Хранение токена

Токен в `localStorage.getItem('accessToken')`. Записывается при login/register, удаляется при logout или 401/устаревший токен.

### Axios interceptor

`apps/web/src/services/api.ts`:

```ts
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    if (isTokenStale(token)) {                // нет поля roles в payload
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
      return Promise.reject(new Error('Stale token'));
    }
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);
```

`isTokenStale()` декодирует payload и проверяет наличие `roles`. Если нет — токен из старой версии (до миграции схемы JWT), редирект на `/login`.

### Auth-store (Zustand)

`apps/web/src/stores/auth.store.ts`:

```ts
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email, password) => Promise<void>;
  register: (dto) => Promise<void>;
  logout: () => void;
  hydrate: () => Promise<void>;       // вызвать /users/me, наполнить store
}
```

В `App.tsx` вызывается `hydrate()` при старте — если в localStorage есть токен, происходит запрос `/users/me` и заполняется store.

### Хук `useCurrentRole()`

```ts
function primaryRole(roles: string[] | undefined): AppRole {
  if (!roles?.length) return 'patient';
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('manager')) return 'manager';
  if (roles.includes('doctor')) return 'doctor';
  return 'patient';
}

export function useCurrentRole(): AppRole {
  const user = useAuthStore((s) => s.user);
  return primaryRole(user?.roles);
}
```

Используется в `DashboardLayout` для выбора набора пунктов меню.

### Защита маршрутов

`DashboardLayout`:

```tsx
export function DashboardLayout() {
  const { isAuthenticated, isLoading, user, hydrate } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && !user) hydrate();
  }, [isAuthenticated, user]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading && !user) {
    return <Loading />;
  }

  // … sidebar по роли + Outlet
}
```

При попытке зайти в `/admin/*`, `/doctor/*`, `/patient/*` без токена — редирект на `/login`.

## Безопасность

### Что сделано

- Пароли хешируются `bcrypt` с salt-rounds = 10
- JWT подписан секретом из `.env` (`JWT_SECRET`)
- В контроллерах `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)`
- На фронте axios-интерсептор отлавливает 401, очищает токен
- Устаревшие токены (без `roles`) автоматически инвалидируются на фронте
- Soft-delete (`isActive: false`) для центров/услуг/анализов/пользователей

### Что нужно сделать для production

- [ ] Сменить `JWT_SECRET` на 32+ байт случайной строки (`openssl rand -hex 32`)
- [ ] Сменить дефолтный пароль admin (`admin12345`)
- [ ] Реализовать refresh-токены (сейчас access-only, 15 мин истечение → пользователь логинится заново)
- [ ] HTTPS (через nginx/cloudflare)
- [ ] Rate limiting на `/auth/login` (например `@nestjs/throttler`)
- [ ] CORS — указать конкретный `origin`, не `localhost:5173`
- [ ] Логирование security-событий (login, logout, failed attempts)
- [ ] 2FA для админа (опционально)
