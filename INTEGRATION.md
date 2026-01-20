# Інтеграція гри «Місто зламаних слів» з платформою Syla Slova

## Огляд архітектури

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────────┐  │
│  │  Teacher   │  │  Student   │  │   Admin    │  │    GAME      │  │
│  │  Cabinet   │  │  Cabinet   │  │   Panel    │  │  (iframe/    │  │
│  │            │  │            │  │            │  │   separate)  │  │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └──────┬───────┘  │
└────────┼───────────────┼───────────────┼────────────────┼──────────┘
         │               │               │                │
         │          HTTP + WebSocket     │           HTTP + WS
         │               │               │                │
┌────────┴───────────────┴───────────────┴────────────────┴──────────┐
│                    BACKEND (Express + Socket.IO)                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │
│  │ Teacher Routes  │  │ Student Routes  │  │   GAME Routes       │ │
│  │ /api/teacher/*  │  │ /api/student/*  │  │   /api/game/*       │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────┘ │
└─────────────────────────────────┬──────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │       PostgreSQL          │
                    │  + game_progress table    │
                    │  + game_homework table    │
                    └───────────────────────────┘
```

---

## Варіанти інтеграції

### Варіант A: Гра як окремий модуль (iframe)

**Переваги:**
- Незалежна розробка
- Легке тестування
- Можливість використання окремо від платформи

**Недоліки:**
- Складніша комунікація між батьківським вікном та iframe
- Потребує postMessage API

```
Frontend                         Game (iframe)
   │                                  │
   │  postMessage({type: 'INIT',      │
   │    student_id, group_id,         │
   │    homework_id})                 │
   │ ─────────────────────────────►   │
   │                                  │
   │  postMessage({type: 'PROGRESS',  │
   │    level: 1, stars: 3})          │
   │ ◄─────────────────────────────   │
   │                                  │
   │  postMessage({type: 'HOMEWORK',  │
   │    level: 1, data: {...}})       │
   │ ◄─────────────────────────────   │
```

### Варіант B: Гра як React компонент (рекомендовано)

**Переваги:**
- Пряма інтеграція з існуючим фронтендом
- Спільний стейт та автентифікація
- Простіше оновлення

**Недоліки:**
- Тісніший зв'язок з платформою

```
/prompter-system/frontend/src/
├── pages/
│   ├── StudentCabinet.jsx
│   ├── StudentGame.jsx          ← Новий роут для гри
│   └── TeacherHomeworkReview.jsx ← Перегляд ДЗ
├── components/
│   └── game/                    ← Компоненти гри
│       ├── GameEngine.jsx
│       ├── levels/
│       │   ├── Level01.jsx
│       │   ├── Level02.jsx
│       │   └── ...
│       ├── ui/
│       │   ├── Box.jsx
│       │   ├── Card.jsx
│       │   └── ...
│       └── hooks/
│           └── useGameProgress.js
```

---

## Нові API Endpoints

### Для Backend (`/prompter-system/backend/src/routes/game.js`)

```javascript
// ========================================
// GAME ROUTES - /api/game/*
// ========================================

const express = require('express');
const router = express.Router();
const { studentAuthMiddleware } = require('../auth');

// -----------------------------------------
// GET /api/game/progress
// Отримати прогрес учня по грі
// -----------------------------------------
router.get('/progress', studentAuthMiddleware, async (req, res) => {
  /*
  Response:
  {
    "current_level": 3,
    "total_stars": 7,
    "levels_completed": [1, 2],
    "badges": ["sorter", "truth_guardian"],
    "map_pieces": 2,
    "wisdom_bulbs": 1
  }
  */
});

// -----------------------------------------
// POST /api/game/level/:levelId/start
// Почати рівень (для трекінгу часу)
// -----------------------------------------
router.post('/level/:levelId/start', studentAuthMiddleware, async (req, res) => {
  /*
  Body: { group_id }
  Response: { session_id, started_at }
  */
});

// -----------------------------------------
// POST /api/game/level/:levelId/complete
// Завершити рівень з результатами
// -----------------------------------------
router.post('/level/:levelId/complete', studentAuthMiddleware, async (req, res) => {
  /*
  Body:
  {
    "session_id": "uuid",
    "stars": 3,
    "score": 85,
    "time_seconds": 480,
    "answers": [
      { "statement": "...", "answer": "fact", "correct": true, "attempt": 1 }
    ],
    "badge_earned": "sorter"
  }

  Response:
  {
    "success": true,
    "new_total_stars": 10,
    "new_badges": ["sorter"],
    "map_piece_unlocked": true,
    "next_level_available": true
  }
  */
});

// -----------------------------------------
// POST /api/game/homework/:levelId
// Зберегти домашнє завдання
// -----------------------------------------
router.post('/homework/:levelId', studentAuthMiddleware, async (req, res) => {
  /*
  Body (Level 1 example):
  {
    "group_id": "uuid",
    "homework_id": "uuid", // якщо призначено вчителем
    "data": {
      "fact": "Сонце сходить о 6 ранку",
      "opinion": "Математика складна",
      "fiction": "Дракони існують"
    }
  }

  Response:
  {
    "success": true,
    "homework_id": "uuid",
    "wisdom_bulb_earned": true
  }
  */
});

// -----------------------------------------
// GET /api/game/homework/:levelId
// Отримати домашнє завдання учня (для review)
// -----------------------------------------
router.get('/homework/:levelId', studentAuthMiddleware, async (req, res) => {
  /*
  Response:
  {
    "level_id": 1,
    "submitted_at": "2024-01-15T10:30:00Z",
    "data": { "fact": "...", "opinion": "...", "fiction": "..." },
    "reviewed": false,
    "feedback": null
  }
  */
});

module.exports = router;
```

### Для Вчителя (адмінпанель домашніх завдань)

```javascript
// ========================================
// TEACHER HOMEWORK ROUTES - /api/teacher/homework/*
// ========================================

// -----------------------------------------
// GET /api/teacher/groups/:groupId/homework
// Отримати всі домашні завдання групи
// -----------------------------------------
router.get('/groups/:groupId/homework', teacherMiddleware, async (req, res) => {
  /*
  Query params: ?level_id=1&status=pending

  Response:
  {
    "group_id": "uuid",
    "group_name": "5-А клас",
    "homework_submissions": [
      {
        "homework_id": "uuid",
        "student_id": "uuid",
        "student_name": "Іван Петренко",
        "level_id": 1,
        "level_name": "Склад фактів",
        "submitted_at": "2024-01-15T10:30:00Z",
        "status": "pending", // pending, reviewed, needs_revision
        "data": { "fact": "...", "opinion": "...", "fiction": "..." },
        "feedback": null
      }
    ],
    "stats": {
      "total_students": 25,
      "submitted": 18,
      "reviewed": 10,
      "pending": 8
    }
  }
  */
});

// -----------------------------------------
// POST /api/teacher/homework/:homeworkId/review
// Залишити відгук на домашнє завдання
// -----------------------------------------
router.post('/homework/:homeworkId/review', teacherMiddleware, async (req, res) => {
  /*
  Body:
  {
    "status": "reviewed", // reviewed, needs_revision
    "feedback": "Чудова робота! Твій факт дійсно можна перевірити.",
    "wisdom_bulb_awarded": true
  }

  Response:
  {
    "success": true,
    "homework_id": "uuid"
  }
  */
});

// -----------------------------------------
// GET /api/teacher/groups/:groupId/game-stats
// Статистика гри по групі
// -----------------------------------------
router.get('/groups/:groupId/game-stats', teacherMiddleware, async (req, res) => {
  /*
  Response:
  {
    "group_id": "uuid",
    "group_name": "5-А клас",
    "total_students": 25,
    "game_stats": {
      "students_started": 20,
      "students_completed": 5, // пройшли всі 13 рівнів
      "average_stars": 2.3,
      "average_completion_percent": 45
    },
    "level_breakdown": [
      {
        "level_id": 1,
        "level_name": "Склад фактів",
        "students_completed": 20,
        "average_stars": 2.5,
        "average_score": 78,
        "homework_submitted": 18
      },
      {
        "level_id": 2,
        "level_name": "Башта перевірки",
        "students_completed": 15,
        "average_stars": 2.2,
        "average_score": 72,
        "homework_submitted": 12
      }
    ],
    "student_progress": [
      {
        "student_id": "uuid",
        "student_name": "Іван Петренко",
        "current_level": 5,
        "total_stars": 12,
        "badges": ["sorter", "truth_guardian", "young_scientist"],
        "homework_completed": 4,
        "last_activity": "2024-01-15T10:30:00Z"
      }
    ]
  }
  */
});

// -----------------------------------------
// POST /api/teacher/groups/:groupId/assign-homework
// Призначити домашнє завдання (опціонально)
// -----------------------------------------
router.post('/groups/:groupId/assign-homework', teacherMiddleware, async (req, res) => {
  /*
  Body:
  {
    "level_id": 1,
    "due_date": "2024-01-20T23:59:59Z",
    "instructions": "Виконайте домашнє завдання до понеділка"
  }

  Response:
  {
    "success": true,
    "assignment_id": "uuid"
  }
  */
});
```

---

## Нові таблиці БД

### Міграція: `010_game_progress.sql`

```sql
-- ================================================
-- GAME PROGRESS TABLE
-- Зберігає прогрес учня по грі
-- ================================================

CREATE TABLE IF NOT EXISTS game_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE SET NULL,

    -- Загальний прогрес
    current_level INTEGER DEFAULT 1,
    total_stars INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    map_pieces INTEGER DEFAULT 0,
    wisdom_bulbs INTEGER DEFAULT 0,

    -- Масиви
    levels_completed INTEGER[] DEFAULT '{}',
    badges TEXT[] DEFAULT '{}',

    -- Мета
    game_started_at TIMESTAMP WITH TIME ZONE,
    game_completed_at TIMESTAMP WITH TIME ZONE,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(student_id, group_id)
);

-- Індекси
CREATE INDEX idx_game_progress_student ON game_progress(student_id);
CREATE INDEX idx_game_progress_group ON game_progress(group_id);
CREATE INDEX idx_game_progress_level ON game_progress(current_level);

-- ================================================
-- GAME LEVEL SESSIONS
-- Сесії проходження рівнів
-- ================================================

CREATE TABLE IF NOT EXISTS game_level_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    progress_id UUID NOT NULL REFERENCES game_progress(id) ON DELETE CASCADE,
    level_id INTEGER NOT NULL,

    -- Результати
    stars INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    time_seconds INTEGER,

    -- Детальні відповіді (JSONB)
    answers JSONB DEFAULT '[]',

    -- Бейдж
    badge_earned TEXT,

    -- Час
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Індекси
CREATE INDEX idx_game_sessions_progress ON game_level_sessions(progress_id);
CREATE INDEX idx_game_sessions_level ON game_level_sessions(level_id);

-- ================================================
-- GAME HOMEWORK
-- Домашні завдання гри
-- ================================================

CREATE TABLE IF NOT EXISTS game_homework (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    progress_id UUID NOT NULL REFERENCES game_progress(id) ON DELETE CASCADE,
    level_id INTEGER NOT NULL,

    -- Дані домашки (JSONB - різна структура для різних рівнів)
    data JSONB NOT NULL,

    -- Статус
    status VARCHAR(20) DEFAULT 'pending', -- pending, reviewed, needs_revision

    -- Відгук вчителя
    reviewed_by UUID REFERENCES teacher_profiles(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    feedback TEXT,
    wisdom_bulb_awarded BOOLEAN DEFAULT FALSE,

    -- Час
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(progress_id, level_id)
);

-- Індекси
CREATE INDEX idx_game_homework_progress ON game_homework(progress_id);
CREATE INDEX idx_game_homework_level ON game_homework(level_id);
CREATE INDEX idx_game_homework_status ON game_homework(status);

-- ================================================
-- GAME HOMEWORK ASSIGNMENTS (optional)
-- Призначені домашні завдання вчителем
-- ================================================

CREATE TABLE IF NOT EXISTS game_homework_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teacher_profiles(id),
    level_id INTEGER NOT NULL,

    instructions TEXT,
    due_date TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(group_id, level_id)
);

CREATE INDEX idx_homework_assignments_group ON game_homework_assignments(group_id);
```

---

## WebSocket Events для гри

```javascript
// ========================================
// GAME WEBSOCKET EVENTS
// ========================================

// CLIENT → SERVER
// ----------------

// Учень почав гру
socket.emit('GAME_START', {
  student_id: 'uuid',
  group_id: 'uuid'
});

// Учень почав рівень
socket.emit('GAME_LEVEL_START', {
  level_id: 1
});

// Учень завершив рівень
socket.emit('GAME_LEVEL_COMPLETE', {
  level_id: 1,
  stars: 3,
  score: 85
});

// Учень здав домашку
socket.emit('GAME_HOMEWORK_SUBMIT', {
  level_id: 1,
  data: { fact: '...', opinion: '...', fiction: '...' }
});


// SERVER → CLIENT
// ----------------

// Підтвердження старту
socket.emit('GAME_STARTED', {
  progress: { current_level: 1, total_stars: 0 }
});

// Рівень завершено
socket.emit('GAME_LEVEL_COMPLETED', {
  level_id: 1,
  stars: 3,
  new_total_stars: 3,
  badge_earned: 'sorter',
  next_level_unlocked: true
});

// Домашка збережена
socket.emit('GAME_HOMEWORK_SAVED', {
  level_id: 1,
  wisdom_bulb_earned: true
});


// SERVER → TEACHER (real-time notifications)
// ------------------------------------------

// Учень завершив рівень
socket.emit('STUDENT_LEVEL_COMPLETE', {
  student_id: 'uuid',
  student_name: 'Іван',
  group_id: 'uuid',
  level_id: 1,
  stars: 3
});

// Учень здав домашку
socket.emit('STUDENT_HOMEWORK_SUBMIT', {
  student_id: 'uuid',
  student_name: 'Іван',
  group_id: 'uuid',
  level_id: 1
});
```

---

## Структура Frontend компонентів

```
/prompter-system/frontend/src/
├── pages/
│   ├── StudentGame.jsx              ← Головна сторінка гри
│   ├── TeacherHomework.jsx          ← Перегляд ДЗ учнів
│   └── TeacherGameStats.jsx         ← Статистика гри групи
│
├── components/
│   └── game/
│       ├── GameEngine.jsx           ← Головний движок гри
│       ├── GameMap.jsx              ← Карта міста
│       ├── GameProgress.jsx         ← Панель прогресу
│       ├── GameRewards.jsx          ← Бейджі та зірки
│       │
│       ├── levels/
│       │   ├── LevelWrapper.jsx     ← Обгортка для рівнів
│       │   ├── Level01Warehouse.jsx ← Склад фактів
│       │   ├── Level02Tower.jsx     ← Башта перевірки
│       │   ├── Level03Laboratory.jsx
│       │   └── ...
│       │
│       ├── characters/
│       │   ├── Robot.jsx            ← SORT-1
│       │   ├── Owl.jsx              ← Сова
│       │   ├── Scientist.jsx        ← Вчений
│       │   └── ...
│       │
│       ├── ui/
│       │   ├── Box.jsx              ← Ящик (зелений/жовтий/червоний)
│       │   ├── Card.jsx             ← Картка твердження
│       │   ├── Button.jsx           ← Кнопки
│       │   ├── StarRating.jsx       ← Зірки результату
│       │   ├── ProgressBar.jsx      ← Прогрес рівня
│       │   └── Dialog.jsx           ← Діалоги персонажів
│       │
│       ├── homework/
│       │   ├── HomeworkForm.jsx     ← Форма домашки
│       │   └── HomeworkReview.jsx   ← Перегляд відповіді
│       │
│       └── hooks/
│           ├── useGameProgress.js   ← Хук для прогресу
│           ├── useGameApi.js        ← Хук для API
│           └── useGameSocket.js     ← Хук для WebSocket
│
├── assets/
│   └── game/                        ← Копія з Game/Design/generated/
│       ├── characters/
│       ├── locations/
│       ├── ui/
│       ├── badges/
│       └── effects/
│
└── services/
    └── gameApi.js                   ← API сервіс для гри
```

---

## Приклад React компонента

### `StudentGame.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GameEngine from '../components/game/GameEngine';
import GameMap from '../components/game/GameMap';
import { useGameProgress } from '../components/game/hooks/useGameProgress';
import { useAuth } from '../hooks/useAuth';

export default function StudentGame() {
  const navigate = useNavigate();
  const { student } = useAuth();
  const { progress, loading, startLevel, completeLevel, submitHomework } = useGameProgress();

  const [currentView, setCurrentView] = useState('map'); // 'map' | 'level' | 'homework'
  const [selectedLevel, setSelectedLevel] = useState(null);

  if (!student) {
    navigate('/student/login');
    return null;
  }

  if (loading) {
    return <div className="game-loading">Завантаження гри...</div>;
  }

  const handleLevelSelect = (levelId) => {
    if (levelId <= progress.current_level) {
      setSelectedLevel(levelId);
      setCurrentView('level');
      startLevel(levelId);
    }
  };

  const handleLevelComplete = async (result) => {
    await completeLevel(selectedLevel, result);
    setCurrentView('homework');
  };

  const handleHomeworkSubmit = async (data) => {
    await submitHomework(selectedLevel, data);
    setSelectedLevel(null);
    setCurrentView('map');
  };

  return (
    <div className="student-game">
      {currentView === 'map' && (
        <GameMap
          progress={progress}
          onLevelSelect={handleLevelSelect}
        />
      )}

      {currentView === 'level' && (
        <GameEngine
          levelId={selectedLevel}
          onComplete={handleLevelComplete}
          onExit={() => setCurrentView('map')}
        />
      )}

      {currentView === 'homework' && (
        <HomeworkForm
          levelId={selectedLevel}
          onSubmit={handleHomeworkSubmit}
          onSkip={() => {
            setSelectedLevel(null);
            setCurrentView('map');
          }}
        />
      )}
    </div>
  );
}
```

### `useGameProgress.js`

```javascript
import { useState, useEffect, useCallback } from 'react';
import gameApi from '../../../services/gameApi';

export function useGameProgress() {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Завантажити прогрес
  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const data = await gameApi.getProgress();
      setProgress(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Почати рівень
  const startLevel = useCallback(async (levelId) => {
    try {
      const session = await gameApi.startLevel(levelId);
      return session;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Завершити рівень
  const completeLevel = useCallback(async (levelId, result) => {
    try {
      const response = await gameApi.completeLevel(levelId, result);

      // Оновити локальний прогрес
      setProgress(prev => ({
        ...prev,
        current_level: Math.max(prev.current_level, levelId + 1),
        total_stars: response.new_total_stars,
        badges: [...new Set([...prev.badges, ...response.new_badges])],
        levels_completed: [...new Set([...prev.levels_completed, levelId])]
      }));

      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Здати домашку
  const submitHomework = useCallback(async (levelId, data) => {
    try {
      const response = await gameApi.submitHomework(levelId, data);

      if (response.wisdom_bulb_earned) {
        setProgress(prev => ({
          ...prev,
          wisdom_bulbs: prev.wisdom_bulbs + 1
        }));
      }

      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    progress,
    loading,
    error,
    startLevel,
    completeLevel,
    submitHomework,
    refresh: loadProgress
  };
}
```

### `gameApi.js`

```javascript
const API_BASE = '/api/game';

const gameApi = {
  // Прогрес
  async getProgress() {
    const res = await fetch(`${API_BASE}/progress`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
  },

  // Почати рівень
  async startLevel(levelId, groupId) {
    const res = await fetch(`${API_BASE}/level/${levelId}/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ group_id: groupId })
    });
    return res.json();
  },

  // Завершити рівень
  async completeLevel(levelId, result) {
    const res = await fetch(`${API_BASE}/level/${levelId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(result)
    });
    return res.json();
  },

  // Домашка
  async submitHomework(levelId, data) {
    const res = await fetch(`${API_BASE}/homework/${levelId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getHomework(levelId) {
    const res = await fetch(`${API_BASE}/homework/${levelId}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
  }
};

function getToken() {
  return localStorage.getItem('student_token');
}

export default gameApi;
```

---

## Структура даних домашніх завдань по рівнях

```javascript
// Level 1: Склад фактів
{
  "level_id": 1,
  "data": {
    "fact": "Вода кипить при 100 градусах",
    "opinion": "Собаки кращі за котів",
    "fiction": "Дракони існують"
  }
}

// Level 2: Башта перевірки
{
  "level_id": 2,
  "data": {
    "statement": "Якщо одягти улюблену футболку — контрольна буде легкою",
    "why_not_verifiable": "Бо зв'язок між футболкою та контрольною не можна перевірити"
  }
}

// Level 3: Лабораторія доказів
{
  "level_id": 3,
  "data": {
    "what_verified": "Скільки ложок в шухляді",
    "how_verified": "Порахував усі ложки",
    "result": "24 ложки"
  }
}

// Level 4: Парк випадковостей
{
  "level_id": 4,
  "data": {
    "funny_example": "Я почухав ніс — автобус приїхав. Тепер завжди чухаю ніс!",
    "real_cause": "Автобус приїхав за розкладом"
  }
}

// Level 5: Арена суперечки
{
  "level_id": 5,
  "data": {
    "what_they_said": "Про іграшку",
    "what_it_was_really_about": "Про справедливість"
  }
}

// Level 6: Табір розвідників
{
  "level_id": 6,
  "data": {
    "what_adult_said": "Ти повинен прибрати кімнату",
    "scout_response": "Я запитав чому саме зараз і що саме прибрати",
    "was_it_hard": "Так, хотілося відразу сказати ні"
  }
}

// Level 7-12: Аналогічна структура
// ...

// Level 13: Серце міста (фінал)
{
  "level_id": 13,
  "data": {
    "shared_with": "Мама",
    "what_told": "Розповів про факти і думки, і як їх розрізняти",
    "main_learning": "Тепер я завжди питаю — звідки ти це знаєш?"
  }
}
```

---

## План розробки гри

### Фаза 1: Підготовка інфраструктури (1 тиждень)

- [ ] Створити міграцію БД `010_game_progress.sql`
- [ ] Додати `/api/game/*` routes до backend
- [ ] Створити базові компоненти React для гри
- [ ] Скопіювати ассети з `Game/Design/generated/` до frontend
- [ ] Налаштувати роутинг `/student/game`

### Фаза 2: Ядро гри (2 тижні)

- [ ] Розробити `GameEngine.jsx` — головний движок
- [ ] Розробити `GameMap.jsx` — карта міста
- [ ] Розробити систему прогресу та нагород
- [ ] Створити базові UI компоненти (Box, Card, Button, Dialog)
- [ ] Реалізувати збереження прогресу через API

### Фаза 3: Рівні 1-6 (2 тижні)

- [ ] Level 1: Склад фактів (drag-and-drop)
- [ ] Level 2: Башта перевірки (two-step questions)
- [ ] Level 3: Лабораторія доказів (multiple choice)
- [ ] Level 4: Парк випадковостей (cause/coincidence)
- [ ] Level 5: Арена суперечки (dialogue analysis)
- [ ] Level 6: Табір розвідників (soldier vs scout)
- [ ] Домашні завдання для рівнів 1-6

### Фаза 4: Рівні 7-12 (2 тижні)

- [ ] Level 7: Дзеркало емоцій
- [ ] Level 8: Театр інтонацій
- [ ] Level 9: Ринок переконань
- [ ] Level 10: Архів джерел
- [ ] Level 11: Карта спору
- [ ] Level 12: Зала ухилянь
- [ ] Домашні завдання для рівнів 7-12

### Фаза 5: Фінал та адмінпанель (1 тиждень)

- [ ] Level 13: Серце міста (комплексний аналіз)
- [ ] Система сертифікатів
- [ ] Адмінпанель для вчителя (перегляд ДЗ)
- [ ] Статистика по групі
- [ ] Real-time сповіщення

### Фаза 6: Тестування та полірування (1 тиждень)

- [ ] Unit тести для API
- [ ] E2E тести для гри
- [ ] Оптимізація продуктивності
- [ ] Адаптація під мобільні пристрої
- [ ] Локалізація (uk, en)

---

## Загальний час: ~9-10 тижнів

```
Тиждень 1:     [Інфраструктура]
Тиждень 2-3:   [Ядро гри]
Тиждень 4-5:   [Рівні 1-6]
Тиждень 6-7:   [Рівні 7-12]
Тиждень 8:     [Фінал + Адмін]
Тиждень 9:     [Тестування]
Тиждень 10:    [Буфер + Запуск]
```

---

## Контрольні точки

| Milestone | Дата | Критерії |
|-----------|------|----------|
| M1: Інфраструктура | +1 тиждень | API працює, БД мігрована, роутинг налаштовано |
| M2: MVP гри | +3 тижні | Карта, прогрес, 2-3 рівні працюють |
| M3: Половина рівнів | +5 тижнів | Рівні 1-6 завершені з ДЗ |
| M4: Всі рівні | +7 тижнів | Рівні 1-13 завершені |
| M5: Адмінпанель | +8 тижнів | Вчитель бачить статистику та ДЗ |
| M6: Реліз | +10 тижнів | Тестування пройдено, готово до продакшену |

---

*Документ версія 1.0*
*Інтеграція гри «Місто зламаних слів» з платформою Syla Slova*
