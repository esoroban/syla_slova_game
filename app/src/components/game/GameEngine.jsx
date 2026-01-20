import React, { useState } from 'react';
import { useGameStore, GameProvider } from '../../stores/gameStore.jsx';
import { LEVELS } from '../../data/levels';
import TitleScreen from './screens/TitleScreen';
import MapScreen from './screens/MapScreen';
import Level01Warehouse from './levels/Level01Warehouse';
import Level02Tower from './levels/Level02Tower';
import Level03Laboratory from './levels/Level03Laboratory';
import UniversalLevel from './levels/UniversalLevel';

// Екрани гри
const SCREENS = {
  TITLE: 'title',
  MAP: 'map',
  LEVEL: 'level'
};

function GameEngineInner() {
  const gameStore = useGameStore();
  const [screen, setScreen] = useState(SCREENS.TITLE);
  const [selectedLevel, setSelectedLevel] = useState(null);

  const hasProgress = gameStore.levelsCompleted.length > 0;

  // Почати нову гру
  const handleNewGame = () => {
    gameStore.resetProgress();
    setScreen(SCREENS.MAP);
  };

  // Продовжити гру
  const handleContinue = () => {
    setScreen(SCREENS.MAP);
  };

  // Вибрати рівень
  const handleSelectLevel = (levelId) => {
    setSelectedLevel(levelId);
    gameStore.startLevel(levelId);
    setScreen(SCREENS.LEVEL);
  };

  // Отримати дані рівня з LEVELS
  const getLevelInfo = (levelId) => {
    return LEVELS.find(l => l.id === levelId) || { minCorrect: 5, badge: null };
  };

  // Завершити рівень
  const handleLevelComplete = (result) => {
    console.log('Level completed:', result);

    const levelInfo = getLevelInfo(result.levelId);
    const passed = result.correctAnswers >= levelInfo.minCorrect;

    console.log(`Level ${result.levelId}: correctAnswers=${result.correctAnswers}, minCorrect=${levelInfo.minCorrect}, passed=${passed}`);

    if (passed) {
      gameStore.completeLevel(result.levelId, result.correctAnswers, levelInfo.minCorrect);

      if (result.stars >= 3 && levelInfo.badge) {
        gameStore.addBadge(levelInfo.badge);
      }
    }

    setSelectedLevel(null);
    setScreen(SCREENS.MAP);
  };

  // Вийти з рівня
  const handleExitLevel = () => {
    setSelectedLevel(null);
    setScreen(SCREENS.MAP);
  };

  // Перейти на наступний рівень
  const handleNextLevel = (result) => {
    if (result && result.levelId) {
      const levelInfo = getLevelInfo(result.levelId);
      const passed = result.correctAnswers >= levelInfo.minCorrect;

      if (passed) {
        gameStore.completeLevel(result.levelId, result.correctAnswers, levelInfo.minCorrect);
        if (result.stars >= 3 && levelInfo.badge) {
          gameStore.addBadge(levelInfo.badge);
        }
      }
    }

    const nextLevelId = selectedLevel + 1;
    if (nextLevelId <= 13) {
      setSelectedLevel(nextLevelId);
      gameStore.startLevel(nextLevelId);
    } else {
      setSelectedLevel(null);
      setScreen(SCREENS.MAP);
    }
  };

  // Рендер екрану
  const renderScreen = () => {
    switch (screen) {
      case SCREENS.TITLE:
        return (
          <TitleScreen
            hasProgress={hasProgress}
            onStart={handleNewGame}
            onContinue={handleContinue}
          />
        );

      case SCREENS.MAP:
        return (
          <MapScreen
            progress={gameStore}
            onSelectLevel={handleSelectLevel}
            onBack={() => setScreen(SCREENS.TITLE)}
          />
        );

      case SCREENS.LEVEL:
        // Рівень 1 - Склад фактів (спеціальний компонент з drag-and-drop)
        if (selectedLevel === 1) {
          return (
            <Level01Warehouse
              onComplete={handleLevelComplete}
              onExit={handleExitLevel}
              onNextLevel={handleNextLevel}
            />
          );
        }

        // Рівень 2 - Башта перевірки (спеціальний компонент)
        if (selectedLevel === 2) {
          return (
            <Level02Tower
              onComplete={handleLevelComplete}
              onExit={handleExitLevel}
              onNextLevel={handleNextLevel}
            />
          );
        }

        // Рівень 3 - Лабораторія доказів (спеціальний компонент)
        if (selectedLevel === 3) {
          return (
            <Level03Laboratory
              onComplete={handleLevelComplete}
              onExit={handleExitLevel}
              onNextLevel={handleNextLevel}
            />
          );
        }

        // Рівні 4-13 - Універсальний компонент
        if (selectedLevel >= 4 && selectedLevel <= 13) {
          return (
            <UniversalLevel
              levelId={selectedLevel}
              onComplete={handleLevelComplete}
              onExit={handleExitLevel}
              onNextLevel={handleNextLevel}
            />
          );
        }

        // Заглушка для невідомих рівнів
        return (
          <div className="game-container">
            <div className="game-screen">
              <div className="game-content" style={{ textAlign: 'center', color: 'white' }}>
                <h2>Рівень {selectedLevel}</h2>
                <p style={{ margin: '20px 0' }}>Цей рівень не знайдено</p>
                <button className="btn btn-secondary" onClick={handleExitLevel}>
                  Повернутись
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return renderScreen();
}

// Обгортка з провайдером
export default function GameEngine() {
  return (
    <GameProvider>
      <GameEngineInner />
    </GameProvider>
  );
}
