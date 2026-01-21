# Промпт для интеграции игры "Місто зламаних слів" с сервером

## Контекст проекта

Я работаю над образовательной игрой "Місто зламаних слів" (City of Broken Words) - игра для обучения детей критическому мышлению и медиаграмотности. Игра состоит из 13 уровней, каждый учит определенному навыку (отличать факты от мнений, проверять источники и т.д.).

### Структура проекта

```
/Game/
├── app/                    # React + Vite приложение
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   └── LoginScreen.jsx   # ✅ ГОТОВО
│   │   │   └── game/
│   │   │       ├── levels/
│   │   │       │   ├── Level01Warehouse.jsx
│   │   │       │   ├── Level02Tower.jsx
│   │   │       │   └── UniversalLevel.jsx
│   │   │       └── ui/
│   │   ├── config/
│   │   │   └── api.js               # ✅ ГОТОВО - API URL config
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # ✅ ГОТОВО - Auth context
│   │   ├── data/
│   │   │   ├── levels.js
│   │   │   └── assets.js
│   │   ├── stores/
│   │   │   └── gameStore.jsx        # Локальный прогресс
│   │   ├── utils/
│   │   │   ├── audioManager.js
│   │   │   └── shuffle.js
│   │   └── styles/
│   ├── electron/              # Electron для desktop
│   └── public/
├── Content/
│   └── levels/
│       ├── level-01-warehouse.json
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

## Что уже реализовано на фронтенде ✅

### 1. Авторизация (ГОТОВО)

**Файлы:**
- `/Game/app/src/config/api.js` - конфигурация API URL
- `/Game/app/src/context/AuthContext.jsx` - контекст авторизации
- `/Game/app/src/components/auth/LoginScreen.jsx` - экран входа/регистрации

**Функционал:**
- Вход по телефону (+380) и паролю
- Регистрация с никнеймом
- Гостевой режим (игра без авторизации)
- Сохранение токена в localStorage
- Автовход при наличии токена
- Валидация токена при старте
- Отображение имени пользователя в шапке игры
- Кнопка "Вийти" (logout)

**Конфигурация API:**
```javascript
// /Game/app/src/config/api.js
export const API_URL = getApiUrl(); // localhost:3001 или VITE_API_URL
export const STORAGE_KEYS = {
  TOKEN: 'game_student_token',
  PROFILE: 'game_student_profile',
  PROGRESS: 'game_progress',
  PENDING_RESULTS: 'game_pending_results'
};
```

### 2. Локальный прогресс (ГОТОВО)

**Файл:** `/Game/app/src/stores/gameStore.jsx`

- Сохранение прогресса в localStorage
- Разблокировка уровней
- Подсчет звезд и бейджей

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
   - `POST /api/game/levels/:levelId/result` - сохранить результат уровня
   - `POST /api/game/levels/:levelId/homework` - сохранить домашку
   - `GET /api/game/progress` - получить прогресс (уровни, звезды, бейджи)
   - `POST /api/game/sync` - синхронизировать офлайн данные

3. **Добавить в `server.js`**:
```javascript
const gameRoutes = require('./routes/game');
app.use('/api/game', gameRoutes);
```

### На фронтенде (модифицировать `/Game/app/`)

1. **Создать сервис** `/src/services/gameApi.js`:
```javascript
import { API_URL, STORAGE_KEYS } from '../config/api';

const getToken = () => localStorage.getItem(STORAGE_KEYS.TOKEN);

export async function saveResult(levelId, result) {
  const token = getToken();
  if (!token) {
    // Гостевой режим - сохранить локально для синхронизации
    savePendingResult(levelId, result);
    return { success: true, offline: true };
  }

  try {
    const res = await fetch(`${API_URL}/api/game/levels/${levelId}/result`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(result)
    });

    if (!res.ok) throw new Error('Failed to save');
    return { success: true };
  } catch (err) {
    savePendingResult(levelId, result);
    return { success: true, offline: true };
  }
}

export async function getProgress() {
  const token = getToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_URL}/api/game/progress`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function savePendingResult(levelId, result) {
  const pending = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING_RESULTS) || '[]');
  pending.push({ levelId, result, timestamp: Date.now() });
  localStorage.setItem(STORAGE_KEYS.PENDING_RESULTS, JSON.stringify(pending));
}

export async function syncPendingResults() {
  const token = getToken();
  if (!token) return;

  const pending = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING_RESULTS) || '[]');
  if (pending.length === 0) return;

  try {
    const res = await fetch(`${API_URL}/api/game/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ results: pending })
    });

    if (res.ok) {
      localStorage.removeItem(STORAGE_KEYS.PENDING_RESULTS);
    }
  } catch {
    // Попробуем позже
  }
}
```

2. **Модифицировать `GameEngine.jsx`**:
   - При старте: загрузить прогресс с сервера (если авторизован)
   - При завершении уровня: отправить результат на сервер
   - При подключении интернета: синхронизировать

3. **Модифицировать компоненты уровней**:
   - Добавить `totalTime` в результат (уже есть таймер в большинстве)
   - Добавить `completedAt: new Date().toISOString()`

---

## Данные которые отправляются при завершении уровня

Сейчас в компонентах уровней вызывается:

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
- `completedAt` - дата/время завершения (ISO string)

---

## Файлы для изучения

### На бекенде:
1. `/prompter-system/backend/src/routes/student.js` - существующие роуты учеников
2. `/prompter-system/backend/src/auth.js` - авторизация и middleware
3. `/prompter-system/backend/src/db/index.js` - работа с БД

### На фронтенде:
1. `/Game/app/src/config/api.js` - конфигурация API
2. `/Game/app/src/context/AuthContext.jsx` - авторизация (ГОТОВО)
3. `/Game/app/src/components/auth/LoginScreen.jsx` - экран входа (ГОТОВО)
4. `/Game/app/src/stores/gameStore.jsx` - локальный прогресс
5. `/Game/app/src/components/game/GameEngine.jsx` - главный компонент игры
6. `/Game/app/src/components/game/levels/Level01Warehouse.jsx` - пример уровня
7. `/Game/docs/API_REQUIREMENTS.md` - полные требования к API

---

## Важные моменты

1. **Не блокировать игру** если нет интернета или сервер недоступен
2. **Сохранять локально** и синхронизировать потом (PENDING_RESULTS)
3. **Не дублировать авторизацию** - она уже реализована в AuthContext
4. **JWT токен** уже сохраняется в localStorage (ключ: `game_student_token`)
5. **CORS** настроить для игровых доменов
6. **Валидация на сервере** - проверять что scores разумные (анти-чит)
7. **Гостевой режим** - локальный прогресс, без синхронизации

---

## Приоритет реализации

### Фаза 1 (MVP):
1. ✅ Авторизация в игре (ГОТОВО)
2. Создать миграцию для игровых таблиц
3. Создать роуты `/api/game/*`
4. Создать `gameApi.js` сервис
5. Подключить сохранение результатов в GameEngine
6. Получение прогресса с сервера при старте

### Фаза 2:
1. Сохранение домашних заданий
2. Синхронизация офлайн данных (sync endpoint)
3. Бейджи
4. Кабинет учителя - просмотр результатов учеников

---

## Начни с:

1. Изучи существующие файлы бекенда (student.js, auth.js)
2. Изучи готовую авторизацию на фронте (AuthContext.jsx, api.js)
3. Создай миграцию для игровых таблиц
4. Создай роуты `/api/game/*` для сохранения и получения прогресса
5. Создай `gameApi.js` сервис на фронтенде
6. Подключи сохранение результатов в `GameEngine.jsx`
