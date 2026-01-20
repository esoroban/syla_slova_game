#!/usr/bin/env python3
"""
Генерація всіх персонажів для гри «Місто зламаних слів»
По 1 версії кожного персонажа
"""

import requests
import base64
import os
import random
import time

API_KEY = "sk-5ieA06nc2rEu8ItnRYKY6EDr7GqkawHMCVtvbpPmx07Rn2nG"
API_URL = "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image"

NEG = "realistic, photorealistic, 3d render, scary, dark, gloomy, sharp edges, complex background, multiple characters, text, watermark, signature, blurry, low quality, distorted"

CHARACTERS = [
    {
        "name": "owl",
        "title": "Сова-страж (Рівень 2)",
        "prompt": "Wise owl character wearing round glasses, fluffy brown and cream feathers, sitting on wooden perch, holding old book, intelligent and friendly expression, slightly tilted head, soft purple scarf around neck. Style: flat design illustration, soft shadows, rounded shapes, warm friendly colors, childrens book illustration style, simple clean background, character design sheet. No realistic textures, no scary elements.",
        "negative": NEG
    },
    {
        "name": "scientist",
        "title": "Вчений (Рівень 3)",
        "prompt": "Friendly scientist character, white lab coat, big round glasses, wild messy hair, holding test tube, enthusiastic excited expression, slightly disheveled appearance, pocket full of pens. Style: flat design illustration, soft shadows, rounded shapes, warm friendly colors, childrens book illustration style, simple clean background, character design sheet. No realistic textures, no scary elements.",
        "negative": NEG
    },
    {
        "name": "gardener",
        "title": "Садівник (Рівень 4)",
        "prompt": "Friendly gardener character, wearing straw hat and green apron, holding watering can, warm smile, rosy cheeks, dirt on hands, surrounded by small plants and flowers, gentle kind expression. Style: flat design illustration, soft shadows, rounded shapes, warm friendly colors, childrens book illustration style, simple clean background, character design sheet. No realistic textures, no scary elements.",
        "negative": NEG
    },
    {
        "name": "judge",
        "title": "Суддя (Рівень 5)",
        "prompt": "Wise judge character, wearing black robe with white collar, holding small wooden gavel, calm and fair expression, gray hair, sitting at wooden podium, patient and understanding look. Style: flat design illustration, soft shadows, rounded shapes, warm friendly colors, childrens book illustration style, simple clean background, character design sheet. No realistic textures, no scary elements.",
        "negative": NEG
    },
    {
        "name": "soldier",
        "title": "Солдат (Рівень 6)",
        "prompt": "Cartoon soldier character, wearing simple green uniform and helmet, standing at attention, proud confident expression, crossed arms, determined look but friendly face, badge on chest. Style: flat design illustration, soft shadows, rounded shapes, warm friendly colors, childrens book illustration style, simple clean background, character design sheet. No realistic textures, no scary elements, no weapons.",
        "negative": NEG + ", weapons, guns"
    },
    {
        "name": "scout",
        "title": "Розвідник (Рівень 6)",
        "prompt": "Scout explorer character, wearing camouflage vest and cap, holding binoculars, curious and observant expression, one eyebrow raised, thoughtful pose, compass around neck, friendly approachable look. Style: flat design illustration, soft shadows, rounded shapes, warm friendly colors, childrens book illustration style, simple clean background, character design sheet. No realistic textures, no scary elements.",
        "negative": NEG
    },
    {
        "name": "mirror-keeper",
        "title": "Дзеркальник (Рівень 7)",
        "prompt": "Magical mirror keeper character, translucent glowing appearance, friendly ghost-like figure, holding ornate hand mirror, gentle smile, flowing ethereal clothes in purple and blue, sparkles around, mystical but not scary. Style: flat design illustration, soft shadows, rounded shapes, warm friendly colors, childrens book illustration style, simple clean background, character design sheet. No realistic textures, no scary elements.",
        "negative": NEG + ", horror, creepy"
    },
    {
        "name": "actor",
        "title": "Актор (Рівень 8)",
        "prompt": "Theater actor character, wearing dramatic red cape, holding two theater masks comedy and tragedy, expressive face, theatrical pose, curly hair, golden buttons on vest, enthusiastic dramatic expression. Style: flat design illustration, soft shadows, rounded shapes, warm friendly colors, childrens book illustration style, simple clean background, character design sheet. No realistic textures, no scary elements.",
        "negative": NEG
    },
    {
        "name": "vendor",
        "title": "Продавець (Рівень 9)",
        "prompt": "Friendly market vendor character, wearing colorful apron and merchant hat, arms spread wide in welcoming gesture, big smile, mustache, standing behind market stall with colorful goods, enthusiastic salesman expression. Style: flat design illustration, soft shadows, rounded shapes, warm friendly colors, childrens book illustration style, simple clean background, character design sheet. No realistic textures, no scary elements.",
        "negative": NEG
    },
    {
        "name": "archivist",
        "title": "Архіваріус (Рівень 10)",
        "prompt": "Old archivist librarian character, wearing round spectacles and cardigan, holding ancient scroll, wise gentle expression, white beard, surrounded by floating books, kind grandfatherly appearance, dust particles in air. Style: flat design illustration, soft shadows, rounded shapes, warm friendly colors, childrens book illustration style, simple clean background, character design sheet. No realistic textures, no scary elements.",
        "negative": NEG
    },
    {
        "name": "cartographer",
        "title": "Картограф (Рівень 11)",
        "prompt": "Explorer cartographer character, wearing adventure hat and vest with many pockets, holding compass and rolled map, weathered friendly face, pencil behind ear, excited discoverer expression, travel patches on clothes. Style: flat design illustration, soft shadows, rounded shapes, warm friendly colors, childrens book illustration style, simple clean background, character design sheet. No realistic textures, no scary elements.",
        "negative": NEG
    },
    {
        "name": "slippery",
        "title": "Слизький (Рівень 12)",
        "prompt": "Slippery trickster character, wearing shiny smooth suit, sly but not evil expression, leaning to one side, hands up in deflecting gesture, mischievous smile, slicked back hair, one eyebrow raised, cartoonish sneaky pose. Style: flat design illustration, soft shadows, rounded shapes, warm friendly colors, childrens book illustration style, simple clean background, character design sheet. No realistic textures, no scary elements.",
        "negative": NEG + ", evil, villain"
    },
    {
        "name": "mayor",
        "title": "Мер міста (Рівень 13 - Фінал)",
        "prompt": "Friendly mayor character, wearing formal suit with mayoral sash, holding rolled document, dignified but approachable expression, gray hair, warm smile, standing proudly, golden chain of office, kind leadership appearance. Style: flat design illustration, soft shadows, rounded shapes, warm friendly colors, childrens book illustration style, simple clean background, character design sheet. No realistic textures, no scary elements.",
        "negative": NEG
    }
]


def generate_character(char):
    """Генерує 1 версію персонажа"""
    name = char["name"]
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "generated", name)
    os.makedirs(output_dir, exist_ok=True)

    seed = random.randint(0, 2147483647)
    print(f"\n🎨 {char['title']}")
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
                    {"text": char["prompt"], "weight": 1},
                    {"text": char["negative"], "weight": -1}
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
            print(f"   ✅ Saved: {filepath}")
            return True
        else:
            print(f"   ❌ Error {resp.status_code}: {resp.text[:200]}")
            return False

    except Exception as e:
        print(f"   ❌ Exception: {e}")
        return False


def main():
    print("=" * 60)
    print("🎮 Генерація персонажів: Місто зламаних слів")
    print("=" * 60)
    print(f"Персонажів для генерації: {len(CHARACTERS)}")

    success = 0
    for i, char in enumerate(CHARACTERS, 1):
        print(f"\n[{i}/{len(CHARACTERS)}]", end="")
        if generate_character(char):
            success += 1
        time.sleep(2)  # Пауза між запитами

    print("\n" + "=" * 60)
    print(f"✨ Готово! Згенеровано: {success}/{len(CHARACTERS)}")
    print("=" * 60)


if __name__ == "__main__":
    main()
