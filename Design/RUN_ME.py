#!/usr/bin/env python3
"""
🤖 ROBOT CHARACTER GENERATOR
============================
Просто запустіть цей файл на вашому комп'ютері:

    python RUN_ME.py

Потрібен тільки модуль requests:
    pip install requests
"""

import requests
import base64
import os
import random
import time

API_KEY = "sk-5ieA06nc2rEu8ItnRYKY6EDr7GqkawHMCVtvbpPmx07Rn2nG"

PROMPT = "Cute friendly warehouse robot character, boxy silver-blue metallic body with rounded corners, large circular LED eyes glowing sky blue, small antenna on head, thin mechanical arms with claw hands, short stubby legs, holding tiny clipboard, confused expression with tilted head, name tag SORT-1 on chest. Style: flat design illustration, soft shadows, rounded shapes, warm friendly colors, childrens book illustration style, simple clean background, character design sheet. No realistic textures, no scary elements, no sharp edges."

NEGATIVE = "realistic, photorealistic, 3d render, scary, dark, gloomy, sharp edges, complex background, multiple characters, text, watermark, signature, blurry, low quality, distorted"

def main():
    print("\n🤖 Generating Robot Character (4 variations)...\n")

    # Створюємо папку поруч з цим файлом
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(script_dir, "generated", "robot-warehouse")
    os.makedirs(output_dir, exist_ok=True)

    for i in range(1, 5):
        seed = random.randint(0, 2147483647)
        print(f"⏳ [{i}/4] Generating (seed: {seed})...")

        try:
            resp = requests.post(
                "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
                headers={
                    "Authorization": f"Bearer {API_KEY}",
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                json={
                    "text_prompts": [
                        {"text": PROMPT, "weight": 1},
                        {"text": NEGATIVE, "weight": -1}
                    ],
                    "cfg_scale": 7,
                    "height": 1024,
                    "width": 1024,
                    "steps": 30,
                    "samples": 1,
                    "seed": seed
                },
                timeout=60
            )

            if resp.status_code == 200:
                img_data = resp.json()["artifacts"][0]["base64"]
                filepath = os.path.join(output_dir, f"robot_v{i}_seed{seed}.png")
                with open(filepath, "wb") as f:
                    f.write(base64.b64decode(img_data))
                print(f"✅ Saved: {filepath}")
            else:
                print(f"❌ Error {resp.status_code}: {resp.text[:100]}")

        except Exception as e:
            print(f"❌ Error: {e}")

        if i < 4:
            time.sleep(1)

    print(f"\n✨ Done! Check: {output_dir}\n")
    print("Next: Choose favorite → note the seed → tell me!")

if __name__ == "__main__":
    main()
