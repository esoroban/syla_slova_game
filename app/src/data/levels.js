// Дані рівнів гри "Місто зламаних слів"
// Контент завантажується з JSON файлів у директорії Content/levels/

// Імпорт контенту з JSON файлів
import level01Data from '../../../Content/levels/level-01-warehouse.json';
import level02Data from '../../../Content/levels/level-02-tower.json';
import level03Data from '../../../Content/levels/level-03-laboratory.json';
import level04Data from '../../../Content/levels/level-04-park.json';
import level05Data from '../../../Content/levels/level-05-arena.json';
import level06Data from '../../../Content/levels/level-06-camp.json';
import level07Data from '../../../Content/levels/level-07-emotions.json';
import level08Data from '../../../Content/levels/level-08-theater.json';
import level09Data from '../../../Content/levels/level-09-market.json';
import level10Data from '../../../Content/levels/level-10-archive.json';
import level11Data from '../../../Content/levels/level-11-map.json';
import level12Data from '../../../Content/levels/level-12-slippery.json';
import level13Data from '../../../Content/levels/level-13-heart.json';

// Масив усіх даних рівнів
const allLevelData = [
  level01Data,
  level02Data,
  level03Data,
  level04Data,
  level05Data,
  level06Data,
  level07Data,
  level08Data,
  level09Data,
  level10Data,
  level11Data,
  level12Data,
  level13Data
];

// Список всіх рівнів (метадані для карти)
export const LEVELS = allLevelData.map(data => ({
  id: data.id,
  name: data.name,
  skill: data.skill,
  character: data.character,
  characterName: data.characterName,
  location: data.location,
  minCorrect: data.minCorrect,
  totalQuestions: data.questions.length,
  badge: data.badge,
  badgeName: data.badgeName
}));

// Функція для отримання даних рівня за ID
export const getLevelData = (levelId) => {
  return allLevelData.find(data => data.id === levelId);
};

// Експорт даних рівнів (для зворотної сумісності)
export const LEVEL_1_DATA = level01Data;
export const LEVEL_2_DATA = level02Data;
export const LEVEL_3_DATA = level03Data;
export const LEVEL_4_DATA = level04Data;
export const LEVEL_5_DATA = level05Data;
export const LEVEL_6_DATA = level06Data;
export const LEVEL_7_DATA = level07Data;
export const LEVEL_8_DATA = level08Data;
export const LEVEL_9_DATA = level09Data;
export const LEVEL_10_DATA = level10Data;
export const LEVEL_11_DATA = level11Data;
export const LEVEL_12_DATA = level12Data;
export const LEVEL_13_DATA = level13Data;

// Категорії для рівня 1
export const CATEGORIES = level01Data.categories;

// Категорії для рівня 2
export const CATEGORIES_LEVEL_2 = level02Data.categories;
