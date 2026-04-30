const fs = require('fs');
const path = require('path');

const EVALS_DIR = path.join(process.cwd(), 'src/evaluations');
const REGISTRY_PATH = path.join(EVALS_DIR, '_registry.json');

// 統計データ (月間ベースの観光客数)
const STATISTICS = {
  jp_ishigaki: { domestic: 100000, intl: 16000 },
  en_ishigaki: { domestic: 100000, intl: 16000 },
  jp_miyako: { domestic: 83000, intl: 16000 },
  en_miyako: { domestic: 83000, intl: 16000 },
  hjp: { domestic: 100000, intl: 260000 },
  hen: { domestic: 100000, intl: 260000 },
  cjp: { domestic: 48000, intl: 1400 },
  cen: { domestic: 48000, intl: 1400 },
  jp_yoron: { domestic: 7000, intl: 1000 },
  en_yoron: { domestic: 7000, intl: 1000 },
  jp_kume: { domestic: 8000, intl: 500 },
  jp_amami: { domestic: 50000, intl: 3000 },
  jp_other: { domestic: 100000, intl: 10000 },
  en_other: { domestic: 100000, intl: 10000 },
};

function validateEvaluation(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let data;
  try {
    data = JSON.parse(content);
  } catch (e) {
    throw new Error(`Invalid JSON format in ${path.basename(filePath)}: ${e.message}`);
  }

  const requiredTopFields = ['id', 'url', 'evaluatedAt', 'stream', 'pp', 'pn', 'po', 'quality'];
  for (const field of requiredTopFields) {
    if (data[field] === undefined) {
      throw new Error(`Missing required field: "${field}" in ${path.basename(filePath)}`);
    }
  }

  // Check array lengths (24 months)
  const arrays = ['pp', 'pn', 'po'];
  for (const arr of arrays) {
    if (!Array.isArray(data[arr]) || data[arr].length !== 24) {
      throw new Error(`Field "${arr}" must be an array of length 24 in ${path.basename(filePath)}`);
    }
  }

  // Check quality object
  const quality = data.quality;
  if (!quality || typeof quality !== 'object') {
     throw new Error(`"quality" must be an object in ${path.basename(filePath)}`);
  }
  const requiredQualityFields = ['title', 'lang', 'type', 'overall', 'scores', 'publishedDate'];
  for (const field of requiredQualityFields) {
    if (quality[field] === undefined) {
      throw new Error(`Missing required field: "quality.${field}" in ${path.basename(filePath)}`);
    }
  }

  // Check publishedDate format (YYYY-MM-DD)
  if (quality.publishedDate && !/^\d{4}-\d{2}-\d{2}$/.test(quality.publishedDate)) {
    throw new Error(`Invalid publishedDate format in ${path.basename(filePath)}. Expected YYYY-MM-DD.`);
  }

  // --- Reach Rate Validation ---
  const stats = STATISTICS[data.stream];
  if (stats) {
    const market = quality.lang === 'JP' ? stats.domestic : stats.intl;
    const maxPn = Math.max(...data.pn);
    const reachRate = (maxPn / market);
    
    // 大拠点（石垣、宮古、ホイアン）は 10% を上限（警告・エラー）
    // ニッチ拠点は 25% を上限とする
    const isMajor = data.stream.includes('ishigaki') || data.stream.includes('miyako') || data.stream.includes('h');
    const limit = isMajor ? 0.10 : 0.25;

    if (reachRate > limit) {
      throw new Error(`REACH RATE TOO HIGH in ${path.basename(filePath)}: ${(reachRate * 100).toFixed(2)}% (Limit: ${limit * 100}%). Market: ${market}, Max PN: ${maxPn}`);
    }
  }

  console.log(`✓ ${path.basename(filePath)} is valid.`);
}

function validateRegistry() {
  const content = fs.readFileSync(REGISTRY_PATH, 'utf-8');
  let data;
  try {
    data = JSON.parse(content);
  } catch (e) {
    throw new Error(`Invalid JSON format in _registry.json`);
  }

  if (!data.evaluations || typeof data.evaluations !== 'object') {
    throw new Error(`_registry.json must have an "evaluations" object.`);
  }

  const entries = Object.values(data.evaluations);
  for (const entry of entries) {
    const filePath = path.join(EVALS_DIR, entry.file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Registry refers to missing file: ${entry.file}`);
    }
  }

  console.log(`✓ _registry.json is valid.`);
}

function main() {
  try {
    console.log('Starting evaluation data validation with Reach Rate check...\n');
    
    validateRegistry();

    const files = fs.readdirSync(EVALS_DIR).filter(f => f.endsWith('.json') && f !== '_registry.json');
    for (const file of files) {
      validateEvaluation(path.join(EVALS_DIR, file));
    }

    console.log('\nSUCCESS: All evaluation data passed validation.');
  } catch (error) {
    console.error(`\nVALIDATION FAILED: ${error.message}`);
    process.exit(1);
  }
}

main();
