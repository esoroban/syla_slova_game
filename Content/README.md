# Контент гри "Місто зламаних слів"

Ця директорія містить весь методичний контент гри, який можна редагувати окремо від коду.

## Структура

```
Content/
└── levels/
    ├── level-01-warehouse.json   # Рівень 1: Склад фактів
    ├── level-02-tower.json       # Рівень 2: Башта перевірки
    └── ...                       # Інші рівні
```

## Формат файлу рівня

Кожен файл рівня містить:

```json
{
  "id": 1,
  "name": "Назва рівня",
  "skill": "Навичка, яку тренує рівень",
  "character": "robot",
  "characterName": "SORT-1",
  "location": "warehouse",
  "minCorrect": 5,
  "badge": "sorter",
  "badgeName": "Сортувальник",

  "intro": {
    "dialogues": ["Діалог 1", "Діалог 2", ...]
  },

  "tutorial": {
    "dialogues": ["Пояснення 1", "Пояснення 2", ...]
  },

  "questions": [
    {
      "id": 1,
      "text": "Текст питання",
      "answer": "fact",
      "hint": "Підказка при помилці"
    }
  ],

  "outro": {
    "dialogues": ["Фінальний діалог 1", ...]
  },

  "homework": {
    "title": "Домашнє завдання",
    "description": "Опис завдання",
    "tasks": [
      { "key": "fact", "label": "Опис завдання" }
    ]
  },

  "categories": {
    "fact": {
      "name": "Факт",
      "color": "#7ED321",
      "boxColor": "green",
      "description": "Опис категорії"
    }
  }
}
```

## Як редагувати

1. Відкрийте цю директорію в Obsidian або будь-якому текстовому редакторі
2. Редагуйте JSON файли
3. Зміни автоматично підхоплюються при перезапуску dev-сервера

## Типи відповідей

### Рівень 1 (Склад фактів)
- `fact` - Факт (зелений ящик)
- `opinion` - Думка (жовтий ящик)
- `fiction` - Вигадка (червоний ящик)

### Рівень 2 (Башта перевірки)
- `verifiable` - Можна перевірити (зелена кнопка)
- `unverifiable` - Неможливо перевірити (червона кнопка)

## Персонажі

| ID | Ім'я | Локація |
|----|------|---------|
| robot | SORT-1 | warehouse |
| owl | Сова-страж | tower |
| scientist | Вчений | laboratory |
| gardener | Садівник | park |
| judge | Суддя | arena |
| scout | Розвідник | camp |
| mirror-keeper | Дзеркальник | emotions_city |
| actor | Актор | theater |
| vendor | Продавець | market |
| archivist | Архіваріус | archive |
| cartographer | Картограф | cartographer |
| slippery | Слизький | slippery_hall |
| mayor | Мер | city_heart |
