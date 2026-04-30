import * as fs from 'fs';
import * as path from 'path';

const EVALS_DIR = path.join(process.cwd(), 'src/evaluations');
const REGISTRY_PATH = path.join(EVALS_DIR, '_registry.json');

function validateEvaluation(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let data;
  try {
    data = JSON.parse(content);
  } catch (e) {
    throw new Error(`Invalid JSON format in ${path.basename(filePath)}`);
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

  const filesInDir = fs.readdirSync(EVALS_DIR).filter(f => f.endsWith('.json') && f !== '_registry.json');
  const filesInRegistry = Object.values(data.evaluations).map((e: any) => e.file);

  // Check if all files in registry exist
  for (const entry of Object.values(data.evaluations) as any[]) {
    const filePath = path.join(EVALS_DIR, entry.file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Registry refers to missing file: ${entry.file}`);
    }
  }

  console.log(`✓ _registry.json is valid.`);
}

function main() {
  try {
    console.log('Starting evaluation data validation...');
    
    // Validate registry
    validateRegistry();

    // Validate each evaluation file
    const files = fs.readdirSync(EVALS_DIR).filter(f => f.endsWith('.json') && f !== '_registry.json');
    for (const file of files) {
      validateEvaluation(path.join(EVALS_DIR, file));
    }

    console.log('\nSUCCESS: All evaluation data passed validation.');
  } catch (error: any) {
    console.error(`\nVALIDATION FAILED: ${error.message}`);
    process.exit(1);
  }
}

main();
