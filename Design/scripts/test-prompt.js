/**
 * Test script - виводить промпт для ручного тестування
 *
 * Використання:
 *   node test-prompt.js <prompt-file>
 *
 * Копіюйте промпт та вставляйте в Stability AI веб-інтерфейс
 */

const fs = require('fs');
const path = require('path');

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node test-prompt.js <prompt-file>');
    console.log('Example: node test-prompt.js prompts/characters/robot.json');
    process.exit(0);
  }

  const promptFile = path.resolve(args[0]);

  if (!fs.existsSync(promptFile)) {
    console.error(`❌ File not found: ${promptFile}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(promptFile, 'utf-8'));

  console.log('═'.repeat(60));
  console.log(`🎨 CHARACTER: ${data.name} (${data.name_en})`);
  console.log('═'.repeat(60));

  console.log('\n📋 PROMPT (copy this):');
  console.log('─'.repeat(60));
  console.log(data.prompt);
  console.log('─'.repeat(60));

  if (data.negative_prompt) {
    console.log('\n🚫 NEGATIVE PROMPT:');
    console.log('─'.repeat(60));
    console.log(data.negative_prompt);
    console.log('─'.repeat(60));
  }

  console.log('\n⚙️ RECOMMENDED SETTINGS:');
  console.log('  • Size: 1024x1024');
  console.log('  • Steps: 30-50');
  console.log('  • CFG Scale: 7-8');
  console.log('  • Sampler: DPM++ 2M Karras');

  console.log('\n📁 Save results to:');
  console.log(`  ${path.join(path.dirname(promptFile), '..', '..', 'generated', data.id || 'output')}/`);

  console.log('\n✨ After generation:');
  console.log('  1. Save 4 best variations');
  console.log('  2. Name them: draft_v1.png, draft_v2.png, etc.');
  console.log('  3. Note the seed if you want to reproduce');
  console.log('═'.repeat(60));
}

main();
