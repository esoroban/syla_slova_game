#!/usr/bin/env python3
"""
Скрипт для генерації аудіо через ElevenLabs API
для гри "Місто зламаних слів"

Використання:
1. Встановіть: pip install requests
2. Запустіть: python generate_audio.py          # показати план
3. Запустіть: python generate_audio.py --generate  # згенерувати аудіо
"""

import os
import json
import requests
import time
from pathlib import Path

# Директорія скрипта
SCRIPT_DIR = Path(__file__).parent

# Завантажуємо конфігурацію з JSON
def load_config():
    """Завантажує конфігурацію з JSON файлу"""
    config_file = SCRIPT_DIR / "elevenlabs_phrases.json"
    with open(config_file, 'r', encoding='utf-8') as f:
        return json.load(f)

# Завантажуємо конфіг
CONFIG = load_config()

# API налаштування
API_KEY = CONFIG["api_usage_notes"]["headers"]["xi-api-key"]
BASE_URL = "https://api.elevenlabs.io/v1"
MODEL_ID = CONFIG["api_usage_notes"]["recommended_model"]

# Голоси
VOICES = CONFIG["voices"]

# Директорія для збереження аудіо
OUTPUT_DIR = SCRIPT_DIR / "audio"


def get_voice_id(voice_type: str) -> str:
    """Отримує voice_id за типом голосу"""
    return VOICES.get(voice_type, {}).get("voice_id", VOICES["male"]["voice_id"])


def get_voice_settings(voice_type: str) -> dict:
    """Отримує налаштування голосу"""
    default_settings = {
        "stability": 0.5,
        "similarity_boost": 0.75,
        "style": 0.3,
        "use_speaker_boost": True
    }
    voice_settings = VOICES.get(voice_type, {}).get("settings", {})
    return {**default_settings, **voice_settings, "use_speaker_boost": True}


def text_to_speech(text: str, voice_type: str, output_path: Path) -> bool:
    """
    Конвертує текст в аудіо через ElevenLabs API

    Args:
        text: Текст для озвучування
        voice_type: Тип голосу (male, female, robot, theatrical)
        output_path: Шлях для збереження MP3 файлу

    Returns:
        True якщо успішно, False якщо помилка
    """
    voice_id = get_voice_id(voice_type)
    url = f"{BASE_URL}/text-to-speech/{voice_id}"

    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": API_KEY
    }

    data = {
        "text": text,
        "model_id": MODEL_ID,
        "voice_settings": get_voice_settings(voice_type)
    }

    try:
        response = requests.post(url, json=data, headers=headers)

        if response.status_code == 200:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, 'wb') as f:
                f.write(response.content)
            return True
        else:
            print(f"Помилка API: {response.status_code} - {response.text}")
            return False

    except Exception as e:
        print(f"Помилка: {e}")
        return False


def generate_level_audio(level_data: dict, dry_run: bool = True):
    """
    Генерує аудіо для одного рівня

    Args:
        level_data: Дані рівня з JSON
        dry_run: Якщо True, тільки показує що буде зроблено
    """
    level_id = level_data["level_id"]
    level_name = level_data["level_name"]
    voice_type = level_data.get("voice", "male")

    print(f"\n{'='*60}")
    print(f"Рівень {level_id}: {level_name}")
    print(f"Персонаж: {level_data['character']}")
    print(f"Голос: {voice_type} ({get_voice_id(voice_type)[:8]}...)")
    print(f"{'='*60}")

    phases = [
        ("intro", level_data.get("intro", [])),
        ("tutorial", level_data.get("tutorial", [])),
        ("outro", level_data.get("outro", []))
    ]

    for phase_name, phrases in phases:
        if not phrases:
            continue

        print(f"\n--- {phase_name.upper()} ({len(phrases)} фраз) ---")

        for i, phrase in enumerate(phrases, 1):
            filename = f"level{level_id:02d}_{voice_type}_{phase_name}_{i:02d}.mp3"
            output_path = OUTPUT_DIR / f"level{level_id:02d}" / filename

            # Показуємо скорочену версію тексту
            short_text = phrase[:50] + "..." if len(phrase) > 50 else phrase
            print(f"  [{i:02d}] {filename}")
            print(f"       \"{short_text}\"")

            if not dry_run:
                print(f"       Генерація...", end=" ", flush=True)
                if text_to_speech(phrase, voice_type, output_path):
                    print("OK")
                else:
                    print("ПОМИЛКА")
                # Затримка щоб не перевищити rate limit
                time.sleep(0.5)

    # Генеруємо приклади з tutorial_examples (рівень 7)
    if "tutorial_examples" in level_data:
        examples = level_data["tutorial_examples"].get("examples", [])
        if examples:
            print(f"\n--- TUTORIAL_EXAMPLES ({len(examples)} прикладів) ---")
            for i, ex in enumerate(examples, 1):
                ex_voice = ex.get("voice", "female")
                emotion = ex.get("emotion", "neutral")
                filename = f"level{level_id:02d}_{ex_voice}_example_{emotion}_{i:02d}.mp3"
                output_path = OUTPUT_DIR / f"level{level_id:02d}" / "examples" / filename

                print(f"  [{i:02d}] {filename}")
                print(f"       \"{ex['text']}\" ({emotion})")

                if not dry_run:
                    print(f"       Генерація...", end=" ", flush=True)
                    if text_to_speech(ex["text"], ex_voice, output_path):
                        print("OK")
                    else:
                        print("ПОМИЛКА")
                    time.sleep(0.5)

    # Генеруємо приклади інтонацій (рівень 8)
    if "tutorial_intonation_examples" in level_data:
        examples = level_data["tutorial_intonation_examples"].get("examples", [])
        if examples:
            print(f"\n--- INTONATION_EXAMPLES ({len(examples)} прикладів) ---")
            for i, ex in enumerate(examples, 1):
                ex_voice = ex.get("voice", "theatrical")
                intonation = ex.get("intonation", "neutral")
                filename = f"level{level_id:02d}_{ex_voice}_intonation_{intonation}_{i:02d}.mp3"
                output_path = OUTPUT_DIR / f"level{level_id:02d}" / "intonations" / filename

                print(f"  [{i:02d}] {filename}")
                print(f"       \"{ex['text']}\" ({intonation})")

                if not dry_run:
                    print(f"       Генерація...", end=" ", flush=True)
                    if text_to_speech(ex["text"], ex_voice, output_path):
                        print("OK")
                    else:
                        print("ПОМИЛКА")
                    time.sleep(0.5)


def generate_all(dry_run: bool = True):
    """
    Генерує аудіо для всіх рівнів

    Args:
        dry_run: Якщо True, тільки показує що буде зроблено
    """
    print("\n" + "="*60)
    print(f"ГЕНЕРАЦІЯ АУДІО ДЛЯ ГРИ: {CONFIG['project']}")
    print("="*60)

    if dry_run:
        print("\n[DRY RUN MODE] - Показуємо що буде згенеровано")
        print("Для реальної генерації запустіть з --generate")
    else:
        print("\n[GENERATION MODE] - Генеруємо аудіо файли")
        print(f"API Key: {'*' * 20}{API_KEY[-4:]}")

    print("\nГолоси:")
    for voice_name, voice_data in VOICES.items():
        print(f"  {voice_name}: {voice_data['voice_id'][:12]}...")

    total_phrases = 0

    for level in CONFIG["levels"]:
        generate_level_audio(level, dry_run)
        total_phrases += len(level.get("intro", []))
        total_phrases += len(level.get("tutorial", []))
        total_phrases += len(level.get("outro", []))

    print("\n" + "="*60)
    print(f"ПІДСУМОК: {total_phrases} основних фраз для {len(CONFIG['levels'])} рівнів")
    print("="*60)

    if dry_run:
        print("\nДля генерації запустіть:")
        print("  python generate_audio.py --generate")


def generate_single_level(level_id: int, dry_run: bool = True):
    """Генерує аудіо для одного рівня"""
    for level in CONFIG["levels"]:
        if level["level_id"] == level_id:
            print(f"\nГенерація рівня {level_id}...")
            generate_level_audio(level, dry_run)
            return
    print(f"Рівень {level_id} не знайдено!")


def list_voices():
    """Показує список налаштованих голосів"""
    print("\nНалаштовані голоси:")
    print("-" * 50)
    for voice_name, voice_data in VOICES.items():
        print(f"\n{voice_name.upper()}:")
        print(f"  Voice ID: {voice_data['voice_id']}")
        print(f"  Опис: {voice_data.get('description', 'N/A')}")
        print(f"  Налаштування: {voice_data.get('settings', {})}")


def test_voice(voice_type: str, text: str = "Привіт! Це тестове повідомлення."):
    """Тестує голос"""
    print(f"\nТестування голосу: {voice_type}")
    print(f"Текст: {text}")

    output_path = OUTPUT_DIR / "test" / f"test_{voice_type}.mp3"

    print("Генерація...", end=" ", flush=True)
    if text_to_speech(text, voice_type, output_path):
        print(f"OK! Збережено: {output_path}")
    else:
        print("ПОМИЛКА!")


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        arg = sys.argv[1]

        if arg == "--generate":
            generate_all(dry_run=False)

        elif arg == "--voices":
            list_voices()

        elif arg == "--test":
            voice = sys.argv[2] if len(sys.argv) > 2 else "male"
            text = sys.argv[3] if len(sys.argv) > 3 else "Привіт! Це тестове повідомлення для перевірки голосу."
            test_voice(voice, text)

        elif arg == "--level":
            if len(sys.argv) > 2:
                level_id = int(sys.argv[2])
                dry_run = "--generate" not in sys.argv
                generate_single_level(level_id, dry_run)
            else:
                print("Вкажіть номер рівня: --level 1")

        elif arg == "--help":
            print("Використання:")
            print("  python generate_audio.py              - показати план генерації (dry run)")
            print("  python generate_audio.py --generate   - згенерувати все аудіо")
            print("  python generate_audio.py --voices     - показати налаштовані голоси")
            print("  python generate_audio.py --test male  - тестувати голос")
            print("  python generate_audio.py --level 1    - показати план для рівня 1")
            print("  python generate_audio.py --level 1 --generate  - згенерувати рівень 1")

        else:
            print(f"Невідома опція: {arg}")
            print("Використайте --help для допомоги")
    else:
        generate_all(dry_run=True)
