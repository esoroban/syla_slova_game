#!/usr/bin/env python3
"""
Stability AI Image Generation - Python Script
Запустіть на вашому комп'ютері

Встановлення:
    pip install requests

Використання:
    python generate-simple.py
"""

import requests
import base64
import os
import random
import time

# Конфігурація
API_KEY = "sk-5ieA06nc2rEu8ItnRYKY6EDr7GqkawHMCVtvbpPmx07Rn2nG"
API_HOST = "https://api.stability.ai"
ENGINE = "stable-diffusion-xl-1024-v1-0"

# Промпт для робота
PROMPT = """Cute friendly warehouse robot character, boxy silver-blue metallic body with rounded corners, large circular LED eyes glowing sky blue, small antenna on head, thin mechanical arms with claw hands, short stubby legs, holding tiny clipboard, confused expression with tilted head, name tag SORT-1 on chest. Style: flat design illustration, soft shadows, rounded shapes, warm friendly colors, childrens book illustration style, simple clean background, character design sheet. No realistic textures, no scary elements, no sharp edges."""

NEGATIVE_PROMPT = """realistic, photorealistic, 3d render, scary, dark, gloomy, sharp edges, complex background, multiple characters, text, watermark, signature, blurry, low quality, distorted"""

OUTPUT_DIR = "./generated/robot-warehouse"


def generate_image(prompt, negative_prompt, seed=None):
    """Генерує зображення через Stability AI API"""

    if seed is None:
        seed = random.randint(0, 2147483647)

    url = f"{API_HOST}/v1/generation/{ENGINE}/text-to-image"

    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }

    data = {
        "text_prompts": [
            {"text": prompt, "weight": 1},
            {"text": negative_prompt, "weight": -1}
        ],
        "cfg_scale": 7,
        "height": 1024,
        "width": 1024,
        "steps": 30,
        "samples": 1,
        "seed": seed
    }

    response = requests.post(url, headers=headers, json=data)

    if response.status_code != 200:
        raise Exception(f"API Error {response.status_code}: {response.text}")

    result = response.json()
    return result["artifacts"][0]["base64"], seed


def save_image(base64_data, filepath):
    """Зберігає зображення з base64"""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "wb") as f:
        f.write(base64.b64decode(base64_data))


def main():
    print("=" * 60)
    print("🎨 Generating: Робот-кладовщик (Warehouse Robot)")
    print("=" * 60)
    print(f"\n📝 Prompt: {PROMPT[:80]}...")
    print(f"🔢 Variations: 4")
    print(f"📁 Output: {OUTPUT_DIR}")
    print("\n" + "=" * 60)

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    for i in range(1, 5):
        print(f"\n⏳ Generating variation {i}/4...")

        try:
            image_data, seed = generate_image(PROMPT, NEGATIVE_PROMPT)

            filepath = os.path.join(OUTPUT_DIR, f"draft_v{i}_seed{seed}.png")
            save_image(image_data, filepath)

            print(f"✅ Saved: {filepath}")
            print(f"   Seed: {seed}")

        except Exception as e:
            print(f"❌ Error: {e}")

        if i < 4:
            time.sleep(1)  # Пауза між запитами

    print("\n" + "=" * 60)
    print("✨ Done!")
    print("\nNext steps:")
    print("1. Open the generated images")
    print("2. Choose your favorite")
    print("3. Note the seed from the filename")
    print("=" * 60)


if __name__ == "__main__":
    main()
