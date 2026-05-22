const fs = require('fs');
const path = require('path');

const EVALS_DIR = path.join(__dirname, '../src/evaluations');
const TARGET_FILES = [
  'condao_guide_en.json',
  'condao_guide_jp.json',
  'condao_hotels_en.json',
  'condao_hotels_jp.json',
  'condao_running_en.json',
  'condao_running_jp.json',
  'top_en.json',
  'top_jp.json'
];

function fixFile(file) {
  const filePath = path.join(EVALS_DIR, file);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${file}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);

  if (!data.scenarios) {
    console.error(`No scenarios object in ${file}`);
    return;
  }

  // Swap pessimistic and normal
  const temp = data.scenarios.pessimistic;
  data.scenarios.pessimistic = data.scenarios.normal;
  data.scenarios.normal = temp;

  // Check order again
  let hasOrderContradiction = false;
  const length = 24;
  for (let i = 0; i < length; i++) {
    const pesVal = data.scenarios.pessimistic[i];
    const norVal = data.scenarios.normal[i];
    const optVal = data.scenarios.optimistic[i];

    if (pesVal > norVal || norVal > optVal) {
      hasOrderContradiction = true;
      console.error(`  - Index ${i} still invalid in ${file}: pes=${pesVal}, nor=${norVal}, opt=${optVal}`);
    }
  }

  if (!hasOrderContradiction) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
    console.log(`✓ Fixed and verified: ${file}`);
  } else {
    console.error(`✗ Failed to fix due to order validation errors in: ${file}`);
  }
}

console.log('Fixing swapped scenarios in target files...');
TARGET_FILES.forEach(fixFile);
console.log('Done.');
