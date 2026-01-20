import React, { useState } from 'react';
import { LEVELS } from '../../../data/levels';
import { MAP } from '../../../data/assets';

// Позиції станцій на карті (у відсотках) - зигзагоподібний шлях
const STATION_POSITIONS = [
  { x: 10, y: 85 },   // 1 - старт внизу зліва
  { x: 25, y: 75 },   // 2
  { x: 40, y: 80 },   // 3
  { x: 55, y: 70 },   // 4
  { x: 70, y: 75 },   // 5
  { x: 85, y: 65 },   // 6
  { x: 75, y: 50 },   // 7
  { x: 60, y: 45 },   // 8
  { x: 45, y: 50 },   // 9
  { x: 30, y: 40 },   // 10
  { x: 40, y: 25 },   // 11
  { x: 55, y: 20 },   // 12
  { x: 70, y: 15 },   // 13 - фініш вгорі
];

export default function MapScreen({ progress, onSelectLevel, onBack }) {
  const { currentLevel, levelsCompleted, totalStars } = progress;
  const [hoveredLevel, setHoveredLevel] = useState(null);

  // Знайти позицію поточного рівня (де стоїть фішка гравця)
  const playerPosition = STATION_POSITIONS[currentLevel - 1] || STATION_POSITIONS[0];

  return (
    <div className="game-container">
      <div
        className="game-background"
        style={{ backgroundImage: `url(${MAP.full})` }}
      />

      <div className="map-screen">
        {/* Хедер */}
        <div className="map-header">
          <button className="btn btn-secondary" onClick={onBack}>
            ← Назад
          </button>

          <h2 className="map-title">Місто зламаних слів</h2>

          <div className="stars-counter">
            ⭐ {totalStars}
          </div>
        </div>

        {/* Ігрове поле - настільна гра */}
        <div className="board-game">
          {/* Доріжка між станціями */}
          <svg className="board-path" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="pathGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFD700" />
                <stop offset="100%" stopColor="#FFA500" />
              </linearGradient>
            </defs>
            <path
              d={`M ${STATION_POSITIONS.map(p => `${p.x} ${p.y}`).join(' L ')}`}
              fill="none"
              stroke="url(#pathGradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="4 2"
            />
          </svg>

          {/* Станції */}
          {LEVELS.slice(0, 13).map((level, index) => {
            const position = STATION_POSITIONS[index];
            if (!position) return null;

            const isCompleted = levelsCompleted.includes(level.id);
            const isAvailable = level.id <= currentLevel;
            const isCurrent = level.id === currentLevel;
            const isLocked = !isAvailable;

            return (
              <div
                key={level.id}
                className={`station ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isLocked ? 'locked' : ''}`}
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                }}
                onClick={() => isAvailable && onSelectLevel(level.id)}
                onMouseEnter={() => setHoveredLevel(level.id)}
                onMouseLeave={() => setHoveredLevel(null)}
              >
                <div className="station-circle">
                  {isLocked ? '🔒' : level.id}
                </div>

                {/* Фішка гравця на поточній станції */}
                {isCurrent && (
                  <div className="player-token">
                    🎮
                  </div>
                )}

                {/* Зірочки для пройдених */}
                {isCompleted && (
                  <div className="station-stars">⭐</div>
                )}

                {/* Тултіп при наведенні */}
                {hoveredLevel === level.id && (
                  <div className="station-tooltip">
                    <div className="tooltip-title">{level.name}</div>
                    <div className="tooltip-skill">{level.skill}</div>
                    {isCompleted && <div className="tooltip-status">✓ Пройдено</div>}
                    {isCurrent && !isCompleted && <div className="tooltip-status">▶ Грати</div>}
                    {isLocked && <div className="tooltip-status">🔒 Заблоковано</div>}
                  </div>
                )}
              </div>
            );
          })}

          {/* Старт і Фініш */}
          <div className="board-label start-label" style={{ left: '5%', top: '90%' }}>
            СТАРТ
          </div>
          <div className="board-label finish-label" style={{ left: '75%', top: '8%' }}>
            ФІНІШ 🏆
          </div>
        </div>
      </div>
    </div>
  );
}
