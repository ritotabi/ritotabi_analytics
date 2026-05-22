const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, '../src/evaluations/japan_en.json');

if (!fs.existsSync(FILE_PATH)) {
  console.error(`File not found: ${FILE_PATH}`);
  process.exit(1);
}

const content = fs.readFileSync(FILE_PATH, 'utf-8');
const data = JSON.parse(content);

if (!data.scenarios) {
  console.error('No scenarios found in japan_en.json');
  process.exit(1);
}

// Scale scenarios down by 0.5
data.scenarios.pessimistic = data.scenarios.pessimistic.map(v => Math.round(v * 0.5));
data.scenarios.normal = data.scenarios.normal.map(v => Math.round(v * 0.5));
data.scenarios.optimistic = data.scenarios.optimistic.map(v => Math.round(v * 0.5));

fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2) + '\n', 'utf-8');
console.log('✓ scaled japan_en.json scenarios by 0.5');
