#!/bin/bash
# Stability AI Image Generation - Local Script
# Запустіть цей скрипт на вашому комп'ютері
#
# Використання:
#   chmod +x generate-local.sh
#   ./generate-local.sh

API_KEY="sk-5ieA06nc2rEu8ItnRYKY6EDr7GqkawHMCVtvbpPmx07Rn2nG"
OUTPUT_DIR="./generated/robot-warehouse"

# Створюємо директорію
mkdir -p "$OUTPUT_DIR"

# Промпт для робота
PROMPT="Cute friendly warehouse robot character, boxy silver-blue metallic body with rounded corners, large circular LED eyes glowing sky blue, small antenna on head, thin mechanical arms with claw hands, short stubby legs, holding tiny clipboard, confused expression with tilted head, name tag SORT-1 on chest. Style: flat design illustration, soft shadows, rounded shapes, warm friendly colors, childrens book illustration style, simple clean background, character design sheet. No realistic textures, no scary elements, no sharp edges."

NEGATIVE="realistic, photorealistic, 3d render, scary, dark, gloomy, sharp edges, complex background, multiple characters, text, watermark, signature, blurry, low quality, distorted"

echo "🚀 Generating 4 variations of robot character..."
echo ""

for i in 1 2 3 4; do
    SEED=$RANDOM$RANDOM
    OUTPUT_FILE="$OUTPUT_DIR/draft_v${i}_seed${SEED}.png"

    echo "⏳ Generating variation $i/4 (seed: $SEED)..."

    curl -s -X POST "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image" \
      -H "Content-Type: application/json" \
      -H "Accept: application/json" \
      -H "Authorization: Bearer $API_KEY" \
      -d "{
        \"text_prompts\": [
          {\"text\": \"$PROMPT\", \"weight\": 1},
          {\"text\": \"$NEGATIVE\", \"weight\": -1}
        ],
        \"cfg_scale\": 7,
        \"height\": 1024,
        \"width\": 1024,
        \"steps\": 30,
        \"samples\": 1,
        \"seed\": $SEED
      }" | jq -r '.artifacts[0].base64' | base64 -d > "$OUTPUT_FILE"

    if [ -s "$OUTPUT_FILE" ]; then
        echo "✅ Saved: $OUTPUT_FILE"
    else
        echo "❌ Error generating variation $i"
        rm -f "$OUTPUT_FILE"
    fi

    sleep 1
done

echo ""
echo "✨ Done! Check results in: $OUTPUT_DIR"
echo ""
echo "Next steps:"
echo "1. Open the generated images"
echo "2. Choose your favorite"
echo "3. Note the seed from the filename"
