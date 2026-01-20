#!/usr/bin/env python3
"""
Генерація всіх графічних ресурсів для гри «Місто зламаних слів»
- Локації (13)
- UI елементи (15)
- Ефекти (5)
- Карта міста (3)
- Бейджі (14)
"""

import requests
import base64
import os
import random
import time
import json
from datetime import datetime

API_KEY = "sk-5ieA06nc2rEu8ItnRYKY6EDr7GqkawHMCVtvbpPmx07Rn2nG"
API_URL = "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image"

# Базовий стиль для всіх елементів
BASE_STYLE = "Style: flat design illustration, soft shadows, rounded shapes, warm friendly colors, childrens book illustration style"
NEG_BASE = "realistic, photorealistic, 3d render, scary, dark, gloomy, sharp edges, text, watermark, signature, blurry, low quality, distorted"

# ============================================================
# ЛОКАЦІЇ / ФОНИ (13 шт)
# ============================================================

LOCATIONS = [
    {
        "name": "location_01_warehouse",
        "title": "1. Склад фактів",
        "prompt": f"Colorful warehouse interior scene, large wooden shelves with organized boxes in green yellow and red colors, soft warm lighting from windows, wooden floor, friendly welcoming atmosphere, some boxes have simple labels, magical sparkles in air, cozy storage room feeling. {BASE_STYLE}, game background, horizontal composition, no characters.",
        "negative": NEG_BASE + ", people, characters, faces"
    },
    {
        "name": "location_02_tower",
        "title": "2. Башта перевірки",
        "prompt": f"Tall stone tower exterior on floating island, wooden signs and plaques on walls, fluffy white clouds around, blue sky background, spiral staircase visible, friendly fantasy architecture, warm sunlight, magical atmosphere, observatory dome on top. {BASE_STYLE}, game background, horizontal composition, no characters.",
        "negative": NEG_BASE + ", people, characters, faces, dark, ominous"
    },
    {
        "name": "location_03_laboratory",
        "title": "3. Лабораторія доказів",
        "prompt": f"Colorful science laboratory interior, bubbling test tubes and beakers in rainbow colors, friendly lab equipment, chalkboard with simple formulas, wooden desk with microscope, warm lighting, plants on windowsill, safe and inviting science room. {BASE_STYLE}, game background, horizontal composition, no characters.",
        "negative": NEG_BASE + ", people, characters, faces, dangerous, toxic"
    },
    {
        "name": "location_04_park",
        "title": "4. Парк випадковостей",
        "prompt": f"Whimsical park scene with winding paths, colorful signposts pointing different directions, friendly trees with round canopies, flower beds, wooden benches, blue sky with fluffy clouds, birds, butterflies, magical garden atmosphere. {BASE_STYLE}, game background, horizontal composition, no characters.",
        "negative": NEG_BASE + ", people, characters, faces"
    },
    {
        "name": "location_05_arena",
        "title": "5. Арена суперечки",
        "prompt": f"Friendly debate arena, circular wooden stage in center, comfortable audience seats around, judge podium with wooden gavel, colorful banners and flags, warm theatrical lighting, supportive atmosphere, like a cozy amphitheater. {BASE_STYLE}, game background, horizontal composition, no characters.",
        "negative": NEG_BASE + ", people, characters, faces, violent, aggressive"
    },
    {
        "name": "location_06_camp",
        "title": "6. Табір розвідників",
        "prompt": f"Forest scout camp scene, cozy tents in green and orange colors, campfire with warm glow, two diverging forest paths, wooden signs, pine trees, lanterns hanging, camping equipment, adventure atmosphere, sunset sky through trees. {BASE_STYLE}, game background, horizontal composition, no characters.",
        "negative": NEG_BASE + ", people, characters, faces"
    },
    {
        "name": "location_07_emotions_city",
        "title": "7. Місто емоцій",
        "prompt": f"Colorful town with unique houses in different emotion colors, large decorative mirrors on buildings reflecting light, cobblestone streets, rainbow elements, friendly architecture with round windows and doors, flower boxes, magical sparkles. {BASE_STYLE}, game background, horizontal composition, no characters.",
        "negative": NEG_BASE + ", people, characters, faces"
    },
    {
        "name": "location_08_theater",
        "title": "8. Театр інтонацій",
        "prompt": f"Beautiful theater stage interior, red velvet curtains open wide, golden spotlights shining, ornate decorations, comfortable red seats visible, comedy and tragedy masks as decorations, warm theatrical atmosphere, stage ready for performance. {BASE_STYLE}, game background, horizontal composition, no characters.",
        "negative": NEG_BASE + ", people, characters, faces"
    },
    {
        "name": "location_09_market",
        "title": "9. Ринок переконань",
        "prompt": f"Colorful bazaar marketplace scene, merchant stalls with striped awnings in bright colors, hanging signs and banners, displayed goods and products, cobblestone ground, festive atmosphere, bunting decorations, warm daylight. {BASE_STYLE}, game background, horizontal composition, no characters.",
        "negative": NEG_BASE + ", people, characters, faces"
    },
    {
        "name": "location_10_archive",
        "title": "10. Архів джерел",
        "prompt": f"Ancient library archive interior, tall wooden bookshelves filled with old books and scrolls, warm candlelight, floating dust particles in light beams, reading desk with open book, cozy scholarly atmosphere, magical knowledge feeling. {BASE_STYLE}, game background, horizontal composition, no characters.",
        "negative": NEG_BASE + ", people, characters, faces"
    },
    {
        "name": "location_11_cartographer",
        "title": "11. Кімната картографа",
        "prompt": f"Explorer cartographer room interior, large wooden desk with spread maps, globe in corner, compass and navigation tools, world maps on walls, warm lamp light, adventure feeling, travel souvenirs, rolled scrolls, cozy study room. {BASE_STYLE}, game background, horizontal composition, no characters.",
        "negative": NEG_BASE + ", people, characters, faces"
    },
    {
        "name": "location_12_slippery_hall",
        "title": "12. Зала ухилянь",
        "prompt": f"Mysterious hall with shiny reflective floor, multiple mirrors on walls creating reflections, soft diffused lighting, elegant but tricky atmosphere, marble columns, subtle sparkles, labyrinth-like feeling, smooth surfaces everywhere. {BASE_STYLE}, game background, horizontal composition, no characters.",
        "negative": NEG_BASE + ", people, characters, faces, scary"
    },
    {
        "name": "location_13_city_heart",
        "title": "13. Серце міста (Фінал)",
        "prompt": f"Grand city central square, beautiful town hall building with clock tower, decorative fountain in center, cobblestone plaza, festive banners and flags, warm golden hour lighting, celebration atmosphere, flowers and trees, majestic finale location. {BASE_STYLE}, game background, horizontal composition, no characters.",
        "negative": NEG_BASE + ", people, characters, faces"
    }
]

# ============================================================
# UI ЕЛЕМЕНТИ (15 шт)
# ============================================================

UI_ELEMENTS = [
    # Ящики
    {
        "name": "ui_box_green",
        "title": "Зелений ящик (факт)",
        "prompt": f"Single green wooden crate box with rounded corners, cute friendly appearance, small label tag, soft shadow underneath, front view, game UI element, isolated on transparent white background. {BASE_STYLE}, simple clean design, icon style.",
        "negative": NEG_BASE + ", complex, detailed, background elements"
    },
    {
        "name": "ui_box_yellow",
        "title": "Жовтий ящик (думка)",
        "prompt": f"Single yellow wooden crate box with rounded corners, cute friendly appearance, small label tag, soft shadow underneath, front view, game UI element, isolated on transparent white background. {BASE_STYLE}, simple clean design, icon style.",
        "negative": NEG_BASE + ", complex, detailed, background elements"
    },
    {
        "name": "ui_box_red",
        "title": "Червоний ящик (вигадка)",
        "prompt": f"Single red wooden crate box with rounded corners, cute friendly appearance, small label tag, soft shadow underneath, front view, game UI element, isolated on transparent white background. {BASE_STYLE}, simple clean design, icon style.",
        "negative": NEG_BASE + ", complex, detailed, background elements"
    },
    # Картки
    {
        "name": "ui_card_statement",
        "title": "Картка з твердженням",
        "prompt": f"Single white paper card with rounded corners, subtle shadow, friendly appearance, slight curl at corner, game UI card element, isolated on transparent white background. {BASE_STYLE}, simple clean design, minimalist.",
        "negative": NEG_BASE + ", text, writing, complex"
    },
    {
        "name": "ui_card_answer",
        "title": "Картка відповіді",
        "prompt": f"Single light blue paper card with rounded corners, subtle shadow, question mark symbol hint, friendly appearance, game UI card element, isolated on transparent white background. {BASE_STYLE}, simple clean design, minimalist.",
        "negative": NEG_BASE + ", complex, detailed"
    },
    # Кнопки
    {
        "name": "ui_button_yes",
        "title": "Кнопка Так",
        "prompt": f"Green button with checkmark symbol, rounded rectangle shape, soft 3D appearance with highlight, friendly game UI button, isolated on transparent white background. {BASE_STYLE}, simple clean design, glossy.",
        "negative": NEG_BASE + ", text, words, complex"
    },
    {
        "name": "ui_button_no",
        "title": "Кнопка Ні",
        "prompt": f"Red button with X cross symbol, rounded rectangle shape, soft 3D appearance with highlight, friendly game UI button, isolated on transparent white background. {BASE_STYLE}, simple clean design, glossy.",
        "negative": NEG_BASE + ", text, words, complex"
    },
    {
        "name": "ui_button_next",
        "title": "Кнопка Далі",
        "prompt": f"Blue button with right arrow symbol, rounded rectangle shape, soft 3D appearance with highlight, friendly game UI button, isolated on transparent white background. {BASE_STYLE}, simple clean design, glossy.",
        "negative": NEG_BASE + ", text, words, complex"
    },
    {
        "name": "ui_button_hint",
        "title": "Кнопка Підказка",
        "prompt": f"Yellow button with lightbulb symbol, rounded rectangle shape, soft 3D appearance with highlight, friendly game UI button, isolated on transparent white background. {BASE_STYLE}, simple clean design, glossy.",
        "negative": NEG_BASE + ", text, words, complex"
    },
    # Іконки
    {
        "name": "ui_icon_star",
        "title": "Іконка зірка",
        "prompt": f"Golden star icon, friendly rounded shape, soft glow effect, simple game reward icon, isolated on transparent white background. {BASE_STYLE}, simple clean design, glossy metallic.",
        "negative": NEG_BASE + ", complex, detailed"
    },
    {
        "name": "ui_icon_trophy",
        "title": "Іконка трофей",
        "prompt": f"Golden trophy cup icon, friendly rounded shape, small star decorations, simple game achievement icon, isolated on transparent white background. {BASE_STYLE}, simple clean design, glossy metallic.",
        "negative": NEG_BASE + ", complex, detailed"
    },
    {
        "name": "ui_icon_lightbulb",
        "title": "Іконка лампочка",
        "prompt": f"Glowing yellow lightbulb icon, friendly rounded shape, idea symbol, soft glow rays, simple hint icon, isolated on transparent white background. {BASE_STYLE}, simple clean design.",
        "negative": NEG_BASE + ", complex, detailed"
    },
    {
        "name": "ui_icon_map_piece",
        "title": "Іконка шматок карти",
        "prompt": f"Single puzzle piece shaped like map fragment, parchment paper texture, treasure map style, friendly game collectible icon, isolated on transparent white background. {BASE_STYLE}, simple clean design.",
        "negative": NEG_BASE + ", complex, detailed"
    },
    # Шкали
    {
        "name": "ui_progress_bar",
        "title": "Прогрес-бар",
        "prompt": f"Horizontal progress bar game UI element, rounded rectangle frame, partially filled with gradient color, friendly design, stars at milestone points, isolated on transparent white background. {BASE_STYLE}, simple clean design.",
        "negative": NEG_BASE + ", complex, text"
    },
    {
        "name": "ui_trust_scale",
        "title": "Шкала довіри (3 зірки)",
        "prompt": f"Three star rating display, horizontal arrangement, golden stars with soft glow, friendly game rating UI element, isolated on transparent white background. {BASE_STYLE}, simple clean design.",
        "negative": NEG_BASE + ", complex, detailed"
    }
]

# ============================================================
# ЕФЕКТИ (5 шт)
# ============================================================

EFFECTS = [
    {
        "name": "effect_correct",
        "title": "Ефект: Правильно",
        "prompt": f"Green sparkle burst effect, small stars and glitter particles, celebration effect, success feeling, bright happy explosion, game feedback animation frame. {BASE_STYLE}, isolated on transparent white background, simple clean.",
        "negative": NEG_BASE + ", complex, characters"
    },
    {
        "name": "effect_incorrect",
        "title": "Ефект: Неправильно",
        "prompt": f"Soft red puff cloud effect, gentle wobble lines, not scary, mild oops effect, game feedback animation frame, friendly mistake indicator. {BASE_STYLE}, isolated on transparent white background, simple clean.",
        "negative": NEG_BASE + ", scary, angry, complex, characters"
    },
    {
        "name": "effect_victory",
        "title": "Ефект: Перемога",
        "prompt": f"Colorful confetti explosion effect, celebration streamers, firework burst, rainbow colors, victory celebration, game win animation frame, joyful happy feeling. {BASE_STYLE}, isolated on transparent white background.",
        "negative": NEG_BASE + ", complex, characters"
    },
    {
        "name": "effect_badge_unlock",
        "title": "Ефект: Отримано бейдж",
        "prompt": f"Golden sparkle glow effect, achievement unlock burst, magical shimmer, crown of light rays, special reward feeling, game achievement animation frame. {BASE_STYLE}, isolated on transparent white background.",
        "negative": NEG_BASE + ", complex, characters"
    },
    {
        "name": "effect_level_complete",
        "title": "Ефект: Рівень пройдено",
        "prompt": f"Magical swirl portal effect in blue and gold colors, completion circle, level done celebration, sparkles and stars around, triumphant finish feeling. {BASE_STYLE}, isolated on transparent white background.",
        "negative": NEG_BASE + ", complex, characters"
    }
]

# ============================================================
# КАРТА МІСТА (3 шт)
# ============================================================

MAP_ELEMENTS = [
    {
        "name": "map_full_city",
        "title": "Повна карта міста",
        "prompt": f"Top-down city map illustration, winding path connecting 13 unique locations, treasure map style, parchment paper background, colorful building icons, compass rose in corner, decorative border, fantasy town layout. {BASE_STYLE}, game map design, overhead view.",
        "negative": NEG_BASE + ", realistic map, satellite view"
    },
    {
        "name": "map_puzzle_piece",
        "title": "Шматок карти (пазл)",
        "prompt": f"Single jigsaw puzzle piece, parchment map texture, partial town illustration visible, collectible game item, aged paper edges, warm sepia tones with color accents. {BASE_STYLE}, isolated on transparent white background.",
        "negative": NEG_BASE + ", complex, multiple pieces"
    },
    {
        "name": "map_location_icons",
        "title": "Міні-іконки локацій",
        "prompt": f"Set of 13 tiny location icons arranged in grid: warehouse, tower, laboratory, park, arena, camp, colorful town, theater, market, archive, study room, mirror hall, town square, each as simple cute miniature building. {BASE_STYLE}, icon set, game map markers.",
        "negative": NEG_BASE + ", detailed, complex"
    }
]

# ============================================================
# БЕЙДЖІ (14 шт)
# ============================================================

BADGES = [
    {
        "name": "badge_01_sorter",
        "title": "Бейдж: Сортувальник",
        "prompt": f"Circular achievement badge with cute wooden crate box icon in center, golden border, ribbon banner below, friendly reward medal design, game achievement badge. {BASE_STYLE}, isolated on transparent white background.",
        "negative": NEG_BASE + ", text, complex"
    },
    {
        "name": "badge_02_truth_guardian",
        "title": "Бейдж: Страж істини",
        "prompt": f"Circular achievement badge with cute tower icon in center, golden border, ribbon banner below, friendly reward medal design, game achievement badge. {BASE_STYLE}, isolated on transparent white background.",
        "negative": NEG_BASE + ", text, complex"
    },
    {
        "name": "badge_03_young_scientist",
        "title": "Бейдж: Юний науковець",
        "prompt": f"Circular achievement badge with cute test tube flask icon in center, golden border, ribbon banner below, friendly reward medal design, game achievement badge. {BASE_STYLE}, isolated on transparent white background.",
        "negative": NEG_BASE + ", text, complex"
    },
    {
        "name": "badge_04_cause_hunter",
        "title": "Бейдж: Мисливець на причини",
        "prompt": f"Circular achievement badge with cute target bullseye icon in center, golden border, ribbon banner below, friendly reward medal design, game achievement badge. {BASE_STYLE}, isolated on transparent white background.",
        "negative": NEG_BASE + ", text, complex"
    },
    {
        "name": "badge_05_peacemaker",
        "title": "Бейдж: Миротворець",
        "prompt": f"Circular achievement badge with cute balance scales icon in center, golden border, ribbon banner below, friendly reward medal design, game achievement badge. {BASE_STYLE}, isolated on transparent white background.",
        "negative": NEG_BASE + ", text, complex"
    },
    {
        "name": "badge_06_scout",
        "title": "Бейдж: Розвідник",
        "prompt": f"Circular achievement badge with cute magnifying glass icon in center, golden border, ribbon banner below, friendly reward medal design, game achievement badge. {BASE_STYLE}, isolated on transparent white background.",
        "negative": NEG_BASE + ", text, complex"
    },
    {
        "name": "badge_07_emotion_reader",
        "title": "Бейдж: Читач емоцій",
        "prompt": f"Circular achievement badge with cute hand mirror icon in center, golden border, ribbon banner below, friendly reward medal design, game achievement badge. {BASE_STYLE}, isolated on transparent white background.",
        "negative": NEG_BASE + ", text, complex"
    },
    {
        "name": "badge_08_intonation_master",
        "title": "Бейдж: Майстер інтонацій",
        "prompt": f"Circular achievement badge with cute theater comedy tragedy masks icon in center, golden border, ribbon banner below, friendly reward medal design, game achievement badge. {BASE_STYLE}, isolated on transparent white background.",
        "negative": NEG_BASE + ", text, complex"
    },
    {
        "name": "badge_09_ad_analyst",
        "title": "Бейдж: Аналітик реклами",
        "prompt": f"Circular achievement badge with cute shopping cart basket icon in center, golden border, ribbon banner below, friendly reward medal design, game achievement badge. {BASE_STYLE}, isolated on transparent white background.",
        "negative": NEG_BASE + ", text, complex"
    },
    {
        "name": "badge_10_archivist",
        "title": "Бейдж: Архіваріус",
        "prompt": f"Circular achievement badge with cute scroll parchment icon in center, golden border, ribbon banner below, friendly reward medal design, game achievement badge. {BASE_STYLE}, isolated on transparent white background.",
        "negative": NEG_BASE + ", text, complex"
    },
    {
        "name": "badge_11_cartographer",
        "title": "Бейдж: Картограф",
        "prompt": f"Circular achievement badge with cute folded treasure map icon in center, golden border, ribbon banner below, friendly reward medal design, game achievement badge. {BASE_STYLE}, isolated on transparent white background.",
        "negative": NEG_BASE + ", text, complex"
    },
    {
        "name": "badge_12_dodge_catcher",
        "title": "Бейдж: Ловець ухилів",
        "prompt": f"Circular achievement badge with cute ski skis icon in center, golden border, ribbon banner below, friendly reward medal design, game achievement badge. {BASE_STYLE}, isolated on transparent white background.",
        "negative": NEG_BASE + ", text, complex"
    },
    {
        "name": "badge_13_city_hero",
        "title": "Бейдж: Герой міста",
        "prompt": f"Circular achievement badge with cute golden crown icon in center, premium golden border, ribbon banner below, special hero medal design, game final achievement badge. {BASE_STYLE}, isolated on transparent white background.",
        "negative": NEG_BASE + ", text, complex"
    },
    {
        "name": "badge_14_perfectionist",
        "title": "Бейдж: Перфекціоніст",
        "prompt": f"Circular achievement badge with cute glowing star icon in center, premium diamond border, ribbon banner below, special perfect score medal design, platinum game achievement badge. {BASE_STYLE}, isolated on transparent white background.",
        "negative": NEG_BASE + ", text, complex"
    }
]


def generate_image(item, category):
    """Генерує 1 зображення"""
    name = item["name"]
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "generated", category)
    os.makedirs(output_dir, exist_ok=True)

    seed = random.randint(0, 2147483647)
    print(f"\n🎨 {item['title']}")
    print(f"   Category: {category}")
    print(f"   Generating (seed: {seed})...")

    try:
        resp = requests.post(
            API_URL,
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            json={
                "text_prompts": [
                    {"text": item["prompt"], "weight": 1},
                    {"text": item["negative"], "weight": -1}
                ],
                "cfg_scale": 7,
                "height": 1024,
                "width": 1024,
                "steps": 30,
                "samples": 1,
                "seed": seed
            },
            timeout=120
        )

        if resp.status_code == 200:
            img_data = resp.json()["artifacts"][0]["base64"]
            filepath = os.path.join(output_dir, f"{name}_seed{seed}.png")
            with open(filepath, "wb") as f:
                f.write(base64.b64decode(img_data))
            print(f"   ✅ Saved: {name}_seed{seed}.png")
            return True, seed
        else:
            print(f"   ❌ Error {resp.status_code}: {resp.text[:200]}")
            return False, None

    except Exception as e:
        print(f"   ❌ Exception: {e}")
        return False, None


def generate_category(items, category_name, delay=2):
    """Генерує всі елементи категорії"""
    print(f"\n{'='*60}")
    print(f"📦 Категорія: {category_name.upper()}")
    print(f"   Елементів: {len(items)}")
    print(f"{'='*60}")

    results = []
    success = 0

    for i, item in enumerate(items, 1):
        print(f"\n[{i}/{len(items)}]", end="")
        ok, seed = generate_image(item, category_name)
        if ok:
            success += 1
            results.append({"name": item["name"], "seed": seed, "status": "ok"})
        else:
            results.append({"name": item["name"], "seed": None, "status": "failed"})
        time.sleep(delay)

    print(f"\n✅ {category_name}: {success}/{len(items)} generated")
    return results


def main():
    start_time = datetime.now()

    print("="*60)
    print("🎮 ГЕНЕРАЦІЯ РЕСУРСІВ: Місто зламаних слів")
    print("="*60)
    print(f"\nПлан генерації:")
    print(f"  • Локації:    {len(LOCATIONS)} шт")
    print(f"  • UI:         {len(UI_ELEMENTS)} шт")
    print(f"  • Ефекти:     {len(EFFECTS)} шт")
    print(f"  • Карта:      {len(MAP_ELEMENTS)} шт")
    print(f"  • Бейджі:     {len(BADGES)} шт")
    total = len(LOCATIONS) + len(UI_ELEMENTS) + len(EFFECTS) + len(MAP_ELEMENTS) + len(BADGES)
    print(f"  ─────────────────────")
    print(f"  ВСЬОГО:       {total} шт")
    print(f"\nОчікуваний час: ~{total * 10 // 60} хвилин")

    all_results = {}

    # Генерація по категоріях
    all_results["locations"] = generate_category(LOCATIONS, "locations")
    all_results["ui"] = generate_category(UI_ELEMENTS, "ui")
    all_results["effects"] = generate_category(EFFECTS, "effects")
    all_results["map"] = generate_category(MAP_ELEMENTS, "map")
    all_results["badges"] = generate_category(BADGES, "badges")

    # Підсумок
    end_time = datetime.now()
    duration = end_time - start_time

    print("\n" + "="*60)
    print("📊 ПІДСУМОК")
    print("="*60)

    total_success = 0
    for cat, results in all_results.items():
        success = len([r for r in results if r["status"] == "ok"])
        total_success += success
        print(f"  {cat}: {success}/{len(results)}")

    print(f"  ─────────────────────")
    print(f"  ВСЬОГО: {total_success}/{total}")
    print(f"  Час: {duration}")
    print("="*60)

    # Зберігаємо результати
    results_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "generation_results.json")
    with open(results_file, "w", encoding="utf-8") as f:
        json.dump({
            "timestamp": str(datetime.now()),
            "duration": str(duration),
            "results": all_results
        }, f, indent=2, ensure_ascii=False)
    print(f"\n📝 Results saved to: generation_results.json")


if __name__ == "__main__":
    main()
