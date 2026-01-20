// Простий стор для гри (без зовнішніх залежностей)
// Можна замінити на Zustand чи Redux при інтеграції

import { useState, useCallback } from 'react';

// Початковий стан гри
const initialState = {
  currentLevel: 1,
  totalStars: 0,
  levelsCompleted: [],
  badges: [],
  mapPieces: 0,
  wisdomBulbs: 0,

  // Стан поточного рівня
  currentLevelProgress: {
    questionIndex: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    answers: [],
    startTime: null,
    score: 0
  }
};

// Хук для управління станом гри
export function useGameStore() {
  const [state, setState] = useState(() => {
    // Спробувати завантажити з localStorage
    const saved = localStorage.getItem('game_progress');
    if (saved) {
      try {
        return { ...initialState, ...JSON.parse(saved) };
      } catch {
        return initialState;
      }
    }
    return initialState;
  });

  // Зберегти прогрес
  const saveProgress = useCallback((newState) => {
    const toSave = {
      currentLevel: newState.currentLevel,
      totalStars: newState.totalStars,
      levelsCompleted: newState.levelsCompleted,
      badges: newState.badges,
      mapPieces: newState.mapPieces,
      wisdomBulbs: newState.wisdomBulbs
    };
    localStorage.setItem('game_progress', JSON.stringify(toSave));
  }, []);

  // Почати рівень
  const startLevel = useCallback((levelId) => {
    setState(prev => ({
      ...prev,
      currentLevelProgress: {
        questionIndex: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        answers: [],
        startTime: Date.now(),
        score: 0
      }
    }));
  }, []);

  // Відповісти на питання
  const answerQuestion = useCallback((questionId, answer, isCorrect, attempt = 1) => {
    setState(prev => {
      const newProgress = { ...prev.currentLevelProgress };

      // Рахуємо очки
      let points = 0;
      if (isCorrect) {
        points = attempt === 1 ? 10 : 5;
        newProgress.correctAnswers += 1;
      } else {
        points = -2;
        newProgress.wrongAnswers += 1;
      }

      newProgress.score += points;
      newProgress.answers.push({
        questionId,
        answer,
        isCorrect,
        attempt,
        points
      });
      newProgress.questionIndex += 1;

      return {
        ...prev,
        currentLevelProgress: newProgress
      };
    });
  }, []);

  // Завершити рівень
  const completeLevel = useCallback((levelId, correctAnswers, minCorrect) => {
    console.log(`completeLevel called: levelId=${levelId}, correctAnswers=${correctAnswers}, minCorrect=${minCorrect}`);
    setState(prev => {
      const passed = correctAnswers >= minCorrect;
      console.log(`completeLevel inside setState: passed=${passed}, prev.currentLevel=${prev.currentLevel}`);

      if (!passed) {
        console.log('Level not passed, returning prev state');
        return prev; // Не зараховуємо, якщо не пройшов
      }

      const newState = {
        ...prev,
        currentLevel: Math.max(prev.currentLevel, levelId + 1),
        levelsCompleted: [...new Set([...prev.levelsCompleted, levelId])],
        mapPieces: prev.mapPieces + 1
      };

      console.log('New state after level complete:', newState);

      // Зберегти
      saveProgress(newState);

      return newState;
    });
  }, [saveProgress]);

  // Додати бейдж
  const addBadge = useCallback((badgeId) => {
    setState(prev => {
      if (prev.badges.includes(badgeId)) return prev;

      const newState = {
        ...prev,
        badges: [...prev.badges, badgeId]
      };
      saveProgress(newState);
      return newState;
    });
  }, [saveProgress]);

  // Додати лампочку мудрості (за домашку)
  const addWisdomBulb = useCallback(() => {
    setState(prev => {
      const newState = {
        ...prev,
        wisdomBulbs: prev.wisdomBulbs + 1
      };
      saveProgress(newState);
      return newState;
    });
  }, [saveProgress]);

  // Скинути прогрес
  const resetProgress = useCallback(() => {
    localStorage.removeItem('game_progress');
    setState(initialState);
  }, []);

  return {
    ...state,
    startLevel,
    answerQuestion,
    completeLevel,
    addBadge,
    addWisdomBulb,
    resetProgress
  };
}

// Контекст для гри (опціонально)
import { createContext, useContext } from 'react';

export const GameContext = createContext(null);

export function GameProvider({ children }) {
  const gameStore = useGameStore();

  return (
    <GameContext.Provider value={gameStore}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
}
