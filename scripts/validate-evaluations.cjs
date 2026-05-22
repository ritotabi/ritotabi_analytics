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

  const requiredTopFields = ['id', 'url', 'evaluatedAt', 'evaluatedBy', 'stream', 'scenarios', 'quality'];
  for (const field of requiredTopFields) {
    if (data[field] === undefined) {
      throw new Error(`Missing required field: "${field}" in ${path.basename(filePath)}`);
    }
  }

  // Check evaluatedBy enum
  const allowedEvaluatedBy = ['skill', 'manual', 'Antigravity'];
  if (!allowedEvaluatedBy.includes(data.evaluatedBy)) {
    throw new Error(`Invalid "evaluatedBy" value: "${data.evaluatedBy}" in ${path.basename(filePath)}. Allowed values: ${allowedEvaluatedBy.join(', ')}`);
  }

  // Check scenarios object and arrays
  const scenarios = data.scenarios;
  if (!scenarios || typeof scenarios !== 'object') {
    throw new Error(`"scenarios" must be an object in ${path.basename(filePath)}`);
  }

  const scenarioKeys = ['pessimistic', 'normal', 'optimistic'];
  for (const key of scenarioKeys) {
    if (!Array.isArray(scenarios[key]) || scenarios[key].length !== 24) {
      throw new Error(`Scenario array "scenarios.${key}" must be an array of length 24 in ${path.basename(filePath)}`);
    }
  }

  // Check scenario values order: pessimistic <= normal <= optimistic
  for (let i = 0; i < 24; i++) {
    const pes = scenarios.pessimistic[i];
    const nor = scenarios.normal[i];
    const opt = scenarios.optimistic[i];
    if (pes > nor || nor > opt) {
      throw new Error(`Scenario values order mismatch at index ${i} in ${path.basename(filePath)}: pessimistic(${pes}) <= normal(${nor}) <= optimistic(${opt}) is violated.`);
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

  // Strict check for seoChecklist keys if present
  if (quality.seoChecklist) {
    const allowedSeoKeys = ['hreflang', 'faq', 'keyword', 'meta', 'canonical', 'ogp'];
    for (const key of Object.keys(quality.seoChecklist)) {
      if (!allowedSeoKeys.includes(key)) {
        throw new Error(`Unexpected key in "quality.seoChecklist": "${key}" in ${path.basename(filePath)}`);
      }
      if (typeof quality.seoChecklist[key] !== 'boolean') {
        throw new Error(`"quality.seoChecklist.${key}" must be a boolean in ${path.basename(filePath)}`);
      }
    }
    // Also verify all required seo keys exist
    for (const key of allowedSeoKeys) {
      if (quality.seoChecklist[key] === undefined) {
        throw new Error(`Missing required key "quality.seoChecklist.${key}" in ${path.basename(filePath)}`);
      }
    }
  }

  // Strict check for affiliateChecklist keys if present
  if (quality.affiliateChecklist) {
    const booleanKeys = [
      'ctaPosition', 'microCopy', 'multipleOta', 'priceVisible',
      'socialProof', 'mobileStickyCta', 'carRentalLink', 'activityLink'
    ];
    const numberKeys = ['urgencySignals', 'minClicks'];
    
    // Check type of each key
    for (const key of booleanKeys) {
      if (quality.affiliateChecklist[key] === undefined) {
        throw new Error(`Missing required key "quality.affiliateChecklist.${key}" in ${path.basename(filePath)}`);
      }
      if (typeof quality.affiliateChecklist[key] !== 'boolean') {
        throw new Error(`"quality.affiliateChecklist.${key}" must be a boolean in ${path.basename(filePath)}`);
      }
    }
    for (const key of numberKeys) {
      if (quality.affiliateChecklist[key] === undefined) {
        throw new Error(`Missing required key "quality.affiliateChecklist.${key}" in ${path.basename(filePath)}`);
      }
      if (typeof quality.affiliateChecklist[key] !== 'number') {
        throw new Error(`"quality.affiliateChecklist.${key}" must be a number in ${path.basename(filePath)}`);
      }
    }
    
    // Ensure no unexpected keys
    const allAllowedAffiliateKeys = [...booleanKeys, ...numberKeys];
    for (const key of Object.keys(quality.affiliateChecklist)) {
      if (!allAllowedAffiliateKeys.includes(key)) {
        throw new Error(`Unexpected key in "quality.affiliateChecklist": "${key}" in ${path.basename(filePath)}`);
      }
    }
  }

  // --- Reach Rate Validation ---
  const stats = STATISTICS[data.stream];
  if (stats) {
    const market = quality.lang === 'JP' ? stats.domestic : stats.intl;
    const maxPes = Math.max(...scenarios.pessimistic);
    const reachRate = (maxPes / market);
    
    // 大拠点（石垣、宮古、ホイアン）は 10% を上限（警告・エラー）
    // ニッチ拠点は 25% を上限とする
    const isMajor = data.stream.includes('ishigaki') || data.stream.includes('miyako') || data.stream.startsWith('h');
    const limit = isMajor ? 0.10 : 0.25;

    if (reachRate > limit) {
      throw new Error(`REACH RATE TOO HIGH in ${path.basename(filePath)}: ${(reachRate * 100).toFixed(2)}% (Limit: ${limit * 100}%). Market: ${market}, Max pessimistic: ${maxPes}`);
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
