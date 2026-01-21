# API Requirements for "Місто зламаних слів" Game

## Overview

Integration between the educational game "Місто зламаних слів" (City of Broken Words) and the existing SylaSlova backend server.

## Current Game Data Structure

### Level Data (13 levels total)
```json
{
  "id": 1,
  "name": "Склад фактів",
  "skill": "Розрізняти факт, думку та вигадку",
  "character": "robot",
  "characterName": "SORT-1",
  "location": "warehouse",
  "minCorrect": 5,
  "badge": "sorter",
  "badgeName": "Сортувальник",
  "questions": [
    {
      "id": 1,
      "text": "Вода кипить при 100 градусах",
      "answer": "fact",
      "hint": "Це можна перевірити термометром"
    }
  ],
  "homework": {
    "title": "Домашнє завдання",
    "tasks": [
      { "key": "fact", "label": "1 ФАКТ" }
    ]
  }
}
```

### Game Completion Data (sent on level complete)
```javascript
{
  levelId: 1,
  stars: 3,              // 0-3 stars based on percentage
  score: 150,            // points accumulated
  correctAnswers: 18,    // total correct
  wrongAnswers: 2,       // total wrong
  homework: {            // optional text answers
    fact: "Сонце сходить на сході",
    opinion: "Я люблю морозиво",
    fiction: "Мій кіт вміє літати"
  }
}
```

### Progress Tracking Needs
- Total time spent on level
- Per-question response time
- Retry attempts count
- First attempt vs retry scores
- Date/time of completion

---

## Existing Server API Analysis

### Authentication (already exists)
- `POST /api/student/register` - Register new student
- `POST /api/student/login` - Login with phone/password
- `GET /api/student/profile` - Get student profile
- JWT tokens with 30-day expiry

### Student Profile (already exists)
```javascript
{
  id: "uuid",
  nickname: "string",
  fullName: "string",
  avatarCode: "string",
  grade: "string",
  phone: "string"
}
```

### Groups (already exists)
- Students can join groups via join_code
- Groups are linked to courses and teachers

---

## Required New API Endpoints

### 1. Game Progress API

#### Save Level Result
```
POST /api/game/levels/{levelId}/result
Authorization: Bearer {token}

Request:
{
  "stars": 3,
  "score": 150,
  "correctAnswers": 18,
  "wrongAnswers": 2,
  "totalTime": 245,           // seconds
  "retryCount": 1,            // number of retry rounds
  "firstAttemptCorrect": 15,  // correct on first try
  "completedAt": "2025-01-20T15:30:00Z"
}

Response:
{
  "success": true,
  "resultId": "uuid",
  "totalStars": 25,           // cumulative stars
  "unlockedLevel": 2,         // next level if unlocked
  "badge": {                  // if badge earned
    "id": "sorter",
    "name": "Сортувальник"
  }
}
```

#### Save Homework (Text Answers)
```
POST /api/game/levels/{levelId}/homework
Authorization: Bearer {token}

Request:
{
  "answers": {
    "fact": "Сонце сходить на сході",
    "opinion": "Морозиво смачне",
    "fiction": "Мій кіт вміє літати"
  },
  "submittedAt": "2025-01-20T16:00:00Z"
}

Response:
{
  "success": true,
  "homeworkId": "uuid"
}
```

#### Get Game Progress
```
GET /api/game/progress
Authorization: Bearer {token}

Response:
{
  "currentLevel": 5,
  "unlockedLevels": [1, 2, 3, 4, 5],
  "totalStars": 45,
  "totalScore": 1250,
  "badges": ["sorter", "truth_guardian", "young_scientist"],
  "levels": [
    {
      "levelId": 1,
      "completed": true,
      "stars": 3,
      "bestScore": 150,
      "attempts": 2,
      "lastPlayedAt": "2025-01-20T15:30:00Z",
      "homeworkSubmitted": true
    }
  ]
}
```

#### Get Level Statistics (for replay)
```
GET /api/game/levels/{levelId}/stats
Authorization: Bearer {token}

Response:
{
  "levelId": 1,
  "attempts": 3,
  "bestScore": 150,
  "bestStars": 3,
  "bestTime": 180,
  "totalTime": 645,
  "averageAccuracy": 0.85,
  "lastPlayedAt": "2025-01-20T15:30:00Z"
}
```

### 2. Leaderboard API (optional for MVP)

```
GET /api/game/leaderboard
Authorization: Bearer {token}

Query params:
- scope: "group" | "global"
- groupId: uuid (if scope=group)
- period: "week" | "month" | "all"

Response:
{
  "leaderboard": [
    {
      "rank": 1,
      "studentId": "uuid",
      "nickname": "Максим",
      "avatarCode": "avatar_01",
      "totalStars": 39,
      "levelsCompleted": 13
    }
  ],
  "myRank": 5
}
```

### 3. Sync API (for offline support)

```
POST /api/game/sync
Authorization: Bearer {token}

Request:
{
  "lastSyncAt": "2025-01-19T10:00:00Z",
  "pendingResults": [
    {
      "levelId": 3,
      "stars": 2,
      "score": 100,
      "completedAt": "2025-01-20T12:00:00Z",
      // ... full result data
    }
  ],
  "pendingHomework": [
    {
      "levelId": 3,
      "answers": { ... },
      "submittedAt": "2025-01-20T12:30:00Z"
    }
  ]
}

Response:
{
  "syncedAt": "2025-01-20T16:00:00Z",
  "progress": { ... },  // full progress object
  "conflicts": []       // any sync conflicts
}
```

---

## Database Schema (New Tables)

### game_progress
```sql
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
```

### game_level_results
```sql
CREATE TABLE game_level_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES student_profiles(id),
  level_id INTEGER NOT NULL,
  stars INTEGER NOT NULL CHECK (stars >= 0 AND stars <= 3),
  score INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  wrong_answers INTEGER NOT NULL,
  total_time INTEGER NOT NULL,  -- seconds
  retry_count INTEGER DEFAULT 0,
  first_attempt_correct INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_best_per_level UNIQUE (student_id, level_id)
);

CREATE INDEX idx_game_level_results_student ON game_level_results(student_id);
CREATE INDEX idx_game_level_results_level ON game_level_results(level_id);
```

### game_level_attempts
```sql
CREATE TABLE game_level_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES student_profiles(id),
  level_id INTEGER NOT NULL,
  stars INTEGER NOT NULL,
  score INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  wrong_answers INTEGER NOT NULL,
  total_time INTEGER NOT NULL,
  retry_count INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_game_level_attempts_student ON game_level_attempts(student_id);
```

### game_homework
```sql
CREATE TABLE game_homework (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES student_profiles(id),
  level_id INTEGER NOT NULL,
  answers JSONB NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(student_id, level_id)
);

CREATE INDEX idx_game_homework_student ON game_homework(student_id);
```

### game_badges
```sql
CREATE TABLE game_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES student_profiles(id),
  badge_id VARCHAR(50) NOT NULL,
  badge_name VARCHAR(100) NOT NULL,
  level_id INTEGER NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(student_id, badge_id)
);

CREATE INDEX idx_game_badges_student ON game_badges(student_id);
```

---

## Frontend Integration Points

### 1. Auth Service (new file)
```javascript
// /Game/app/src/services/authService.js
- login(phone, password)
- register(phone, password, nickname)
- logout()
- getToken()
- isAuthenticated()
- getCurrentUser()
```

### 2. Game API Service (new file)
```javascript
// /Game/app/src/services/gameApi.js
- saveResult(levelId, resultData)
- saveHomework(levelId, homeworkData)
- getProgress()
- getLevelStats(levelId)
- syncOfflineData()
```

### 3. Storage Service (for offline)
```javascript
// /Game/app/src/services/storageService.js
- savePendingResult(result)
- savePendingHomework(homework)
- getPendingData()
- clearPendingData()
- saveProgress(progress)
- getProgress()
```

### 4. Auth Context/State
```javascript
// /Game/app/src/context/AuthContext.jsx
- AuthProvider
- useAuth() hook
- Protected routes
```

---

## Implementation Priority

### Phase 1: MVP (Must Have)
1. Student authentication (login/register)
2. Save level results
3. Get progress (unlock levels)
4. Local storage for offline play

### Phase 2: Enhanced (Should Have)
1. Save homework
2. Level statistics
3. Sync offline data
4. Badge system

### Phase 3: Social (Nice to Have)
1. Leaderboard (group/global)
2. Teacher dashboard integration
3. Achievement notifications

---

## Security Considerations

1. JWT tokens with appropriate expiry
2. Rate limiting on result submission
3. Server-side validation of scores (anti-cheat)
4. Sanitization of homework text input
5. CORS configuration for game domains

---

## Offline Support Strategy

1. Game playable without internet
2. Results saved to localStorage
3. Auto-sync when connection restored
4. Conflict resolution: server wins for scores, merge for homework
