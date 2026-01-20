/**
 * Stability AI Image Generation Script
 * Для гри «Місто зламаних слів»
 *
 * Використання:
 *   node generate.js <prompt-file> [--variations 4]
 *
 * Приклад:
 *   node generate.js prompts/characters/robot.json --variations 4
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Конфігурація
const CONFIG = {
  apiKey: process.env.STABILITY_API_KEY,
  apiHost: 'api.stability.ai',
  engine: 'stable-diffusion-xl-1024-v1-0', // або інший доступний
  outputDir: path.join(__dirname, '..', 'generated'),
  defaultVariations: 4,
  defaultSize: { width: 1024, height: 1024 },
  defaultSteps: 30,
  defaultCfgScale: 7,
};

/**
 * Генерує зображення через Stability AI API
 */
async function generateImage(prompt, negativePrompt = '', seed = null) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      text_prompts: [
        { text: prompt, weight: 1 },
        { text: negativePrompt, weight: -1 }
      ],
      cfg_scale: CONFIG.defaultCfgScale,
      height: CONFIG.defaultSize.height,
      width: CONFIG.defaultSize.width,
      steps: CONFIG.defaultSteps,
      samples: 1,
      ...(seed && { seed })
    });

    const options = {
      hostname: CONFIG.apiHost,
      port: 443,
      path: `/v1/generation/${CONFIG.engine}/text-to-image`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${CONFIG.apiKey}`,
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`API Error ${res.statusCode}: ${body}`));
          return;
        }
        try {
          const response = JSON.parse(body);
          resolve(response);
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * Зберігає зображення з base64
 */
function saveImage(base64Data, outputPath) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, Buffer.from(base64Data, 'base64'));
  console.log(`✅ Saved: ${outputPath}`);
}

/**
 * Завантажує промпт з JSON файлу
 */
function loadPrompt(promptFile) {
  const fullPath = path.resolve(promptFile);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Prompt file not found: ${fullPath}`);
  }
  return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
}

/**
 * Головна функція генерації
 */
async function main() {
  // Перевірка API ключа
  if (!CONFIG.apiKey) {
    console.error('❌ Error: STABILITY_API_KEY environment variable not set');
    console.log('\nSet it with:');
    console.log('  export STABILITY_API_KEY="your-api-key-here"');
    process.exit(1);
  }

  // Парсинг аргументів
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log(`
Usage: node generate.js <prompt-file> [options]

Options:
  --variations <n>   Number of variations to generate (default: 4)
  --seed <n>         Fixed seed for reproducibility

Examples:
  node generate.js prompts/characters/robot.json
  node generate.js prompts/characters/robot.json --variations 4
  node generate.js prompts/characters/robot.json --seed 12345
    `);
    process.exit(0);
  }

  const promptFile = args[0];
  const variationsIdx = args.indexOf('--variations');
  const seedIdx = args.indexOf('--seed');

  const variations = variationsIdx !== -1 ? parseInt(args[variationsIdx + 1]) : CONFIG.defaultVariations;
  const fixedSeed = seedIdx !== -1 ? parseInt(args[seedIdx + 1]) : null;

  try {
    // Завантаження промпту
    console.log(`\n📄 Loading prompt: ${promptFile}`);
    const promptData = loadPrompt(promptFile);

    console.log(`\n🎨 Character: ${promptData.name}`);
    console.log(`📝 Prompt: ${promptData.prompt.substring(0, 100)}...`);
    console.log(`🔢 Variations: ${variations}`);
    if (fixedSeed) console.log(`🌱 Seed: ${fixedSeed}`);

    // Створення директорії для результатів
    const outputDir = path.join(CONFIG.outputDir, promptData.id || promptData.name.toLowerCase().replace(/\s+/g, '-'));
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Генерація варіацій
    console.log(`\n🚀 Generating ${variations} variations...\n`);

    for (let i = 1; i <= variations; i++) {
      console.log(`⏳ Generating variation ${i}/${variations}...`);

      try {
        const seed = fixedSeed || Math.floor(Math.random() * 2147483647);
        const response = await generateImage(
          promptData.prompt,
          promptData.negative_prompt || '',
          seed
        );

        if (response.artifacts && response.artifacts.length > 0) {
          const artifact = response.artifacts[0];
          const outputPath = path.join(outputDir, `draft_v${i}_seed${seed}.png`);
          saveImage(artifact.base64, outputPath);

          // Зберігаємо інформацію про seed
          const metaPath = path.join(outputDir, `draft_v${i}_seed${seed}.json`);
          fs.writeFileSync(metaPath, JSON.stringify({
            seed,
            prompt: promptData.prompt,
            negative_prompt: promptData.negative_prompt,
            timestamp: new Date().toISOString()
          }, null, 2));
        }
      } catch (err) {
        console.error(`❌ Error generating variation ${i}: ${err.message}`);
      }

      // Невелика затримка між запитами
      if (i < variations) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    console.log(`\n✨ Done! Check results in: ${outputDir}`);
    console.log(`\nNext steps:`);
    console.log(`1. Review generated images`);
    console.log(`2. Choose the best one`);
    console.log(`3. Note the seed from the filename`);
    console.log(`4. Update the prompt file with the chosen seed`);

  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  }
}

main();
