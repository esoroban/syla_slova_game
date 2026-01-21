# Промпт для интеграции игры "Місто зламаних слів" с сервером

## Контекст проекта

Я работаю над образовательной игрой "Місто зламаних слів" (City of Broken Words) - игра для обучения детей критическому мышлению и медиаграмотности. Игра состоит из 13 уровней, каждый учит определенному навыку (отличать факты от мнений, проверять источники и т.д.).

### Структура проекта

```
/Game/
├── app/                    # React + Vite приложение
│   ├── src/
│   │   ├── components/
│   │   │   └── game/
│   │   │       ├── levels/
│   │   │       │   ├── Level01Warehouse.jsx
│   │   │       │   ├── Level02Tower.jsx
│   │   │       │   └── UniversalLevel.jsx
│   │   │       └── ui/
│   │   ├── data/
│   │   │   ├── levels.js       # Импорт данных уровней
│   │   │   └── assets.js       # Пути к изображениям
│   │   ├── utils/
│   │   │   ├── audioManager.js
│   │   │   └── shuffle.js
│   │   └── styles/
│   ├── electron/              # Electron для desktop
│   └── public/
├── Content/
│   └── levels/
│       ├── level-01-warehouse.json
│       ├── level-02-tower.json
│       └── ... (13 файлов)
└── docs/
    └── API_REQUIREMENTS.md    # Требования к API
```

### Существующий сервер

Бекенд находится в `/prompter-system/backend/` и уже имеет:

1. **Аутентификация учеников** (`/src/routes/student.js`):
   - `POST /api/student/register` - регистрация (телефон + пароль + никнейм)
   - `POST /api/student/login` - вход
   - `GET /api/student/profile` - профиль
   - JWT токены (30 дней)

2. **База данных** (PostgreSQL):
   - `users` - пользователи (телефон, пароль, роль)
   - `student_profiles` - профили учеников (nickname, avatar_code, grade)
   - `groups` - группы учеников с учителями
   - `group_members` - связь ученик-группа

3. **Технологии**:
   - Express.js
   - PostgreSQL
   - JWT для авторизации
   - bcrypt для паролей

---

## Задача

Нужно интегрировать игру с сервером для:

1. **Авторизации учеников**:
   - Экран входа/регистрации в игре
   - Сохранение токена (localStorage + Electron storage)
   - Автоматический вход при наличии валидного токена

2. **Сохранения прогресса на сервер**:
   - После прохождения уровня отправлять результаты
   - Данные: звезды, очки, правильные/неправильные ответы, время, дата
   - Разблокировка следующих уровней

3. **Сохранения домашних заданий**:
   - Текстовые ответы (факт/мнение/вигадка) отправлять на сервер
   - Учитель может просматривать в своем кабинете

4. **Офлайн поддержки**:
   - Игра работает без интернета
   - Результаты сохраняются локально
   - Синхронизация при восстановлении связи

---

## Что нужно сделать

### На бекенде (добавить в `/prompter-system/backend/`)

1. **Создать миграцию** `010_game_tables.sql`:
```sql
-- game_progress - общий прогресс ученика
CREATE TABLE game_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES student_profiles(id),
  current_level INTEGER DEFAULT 1,
  total_stars INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id)
);

-- game_level_results - лучший результат по каждому уровню
CREATE TABLE game_level_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES student_profiles(id),
  level_id INTEGER NOT NULL,
  stars INTEGER NOT NULL,
  score INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  wrong_answers INTEGER NOT NULL,
  total_time INTEGER NOT NULL,  -- секунды
  retry_count INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, level_id)
);

-- game_homework - текстовые домашние задания
CREATE TABLE game_homework (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES student_profiles(id),
  level_id INTEGER NOT NULL,
  answers JSONB NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, level_id)
);

-- game_badges - заработанные бейджи
CREATE TABLE game_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES student_profiles(id),
  badge_id VARCHAR(50) NOT NULL,
  badge_name VARCHAR(100) NOT NULL,
  level_id INTEGER NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, badge_id)
);
```

2. **Создать роуты** `/src/routes/game.js`:
   - `POST /api/game/levels/:levelId/result` - сохранить результат
   - `POST /api/game/levels/:levelId/homework` - сохранить домашку
   - `GET /api/game/progress` - получить прогресс
   - `POST /api/game/sync` - синхронизировать офлайн данные

### На фронтенде (добавить в `/Game/app/`)

1. **Создать сервисы** в `/src/services/`:
   - `authService.js` - работа с авторизацией
   - `gameApi.js` - запросы к игровому API
   - `storageService.js` - localStorage + IndexedDB

2. **Создать контекст** `/src/context/AuthContext.jsx`:
   - Хранение состояния авторизации
   - useAuth() хук

3. **Создать экраны**:
   - `LoginScreen.jsx` - вход
   - `RegisterScreen.jsx` - регистрация
   - Модифицировать `App.jsx` для проверки авторизации

4. **Модифицировать уровни**:
   - После `onComplete` отправлять результат на сервер
   - Показывать ошибку при неудаче (но не блокировать игру)

---

## Данные которые отправляются при завершении уровня

Сейчас в компонентах уровней (`Level01Warehouse.jsx`, etc.) при завершении вызывается:

```javascript
onComplete({
  levelId: 1,
  stars: 3,              // 0-3 звезды
  score: 150,            // очки
  correctAnswers: 18,    // правильных
  wrongAnswers: 2,       // неправильных
  homework: {            // текстовые ответы (или null)
    fact: "...",
    opinion: "...",
    fiction: "..."
  }
});
```

Нужно добавить:
- `totalTime` - общее время в секундах
- `retryCount` - количество повторных попыток
- `completedAt` - дата/время завершения

---

## Конфигурация

API URL должен быть настраиваемым:
- Development: `http://localhost:3001`
- Production: `https://api.sylaslova.com` (или другой)
- Electron: тот же что и web

Использовать переменную окружения `VITE_API_URL`.

---

## Файлы для изучения

1. `/prompter-system/backend/src/routes/student.js` - существующие роуты учеников
2. `/prompter-system/backend/src/auth.js` - авторизация и middleware
3. `/prompter-system/backend/src/db/index.js` - работа с БД
4. `/Game/app/src/components/game/levels/Level01Warehouse.jsx` - пример уровня
5. `/Game/app/src/data/levels.js` - структура данных уровней
6. `/Game/docs/API_REQUIREMENTS.md` - полные требования к API

---

## Важные моменты

1. **Не блокировать игру** если нет интернета или сервер недоступен
2. **Сохранять локально** и синхронизировать потом
3. **Не дублировать авторизацию** - использовать существующую из student.js
4. **JWT токен** сохранять в localStorage (web) и Electron storage (desktop)
5. **CORS** настроить для игровых доменов
6. **Валидация на сервере** - проверять что scores разумные (анти-чит)

---

## Приоритет реализации

### Фаза 1 (MVP):
1. Авторизация в игре (логин/регистрация)
2. Сохранение результатов уровней
3. Получение прогресса (разблокировка уровней)
4. Локальное хранение для офлайн

### Фаза 2:
1. Сохранение домашних заданий
2. Синхронизация офлайн данных
3. Бейджи

---

## Начни с:

1. Изучи существующие файлы (особенно student.js и Level01Warehouse.jsx)
2. Создай миграцию для игровых таблиц
3. Создай роуты для игрового API
4. Создай сервисы на фронтенде
5. Добавь экраны авторизации
6. Подключи отправку результатов в компонентах уровней
