const fs = require('fs');
const path = require('path');

const EVALS_DIR = path.join(__dirname, '../src/evaluations');

function convertFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let data;
  try {
    data = JSON.parse(content);
  } catch (e) {
    console.error(`Error parsing JSON in ${path.basename(filePath)}: ${e.message}`);
    return { success: false, filename: path.basename(filePath), error: e.message };
  }

  // Check if already converted
  if (data.scenarios) {
    return { success: true, filename: path.basename(filePath), alreadyConverted: true };
  }

  const { pp, pn, po } = data;
  if (!pp || !pn || !po) {
    return { success: false, filename: path.basename(filePath), error: 'Missing pp, pn, or po arrays.' };
  }

  // Create scenarios object
  // Map: pn -> pessimistic, pp -> normal, po -> optimistic
  data.scenarios = {
    pessimistic: pn,
    normal: pp,
    optimistic: po
  };

  // Remove old fields
  delete data.pp;
  delete data.pn;
  delete data.po;

  // Verify order: pessimistic <= normal <= optimistic
  let hasOrderContradiction = false;
  const length = 24;
  for (let i = 0; i < length; i++) {
    const pesVal = data.scenarios.pessimistic[i];
    const norVal = data.scenarios.normal[i];
    const optVal = data.scenarios.optimistic[i];

    if (pesVal > norVal || norVal > optVal) {
      hasOrderContradiction = true;
      break;
    }
  }

  // Save the modified file
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');

  return {
    success: true,
    filename: path.basename(filePath),
    hasOrderContradiction,
    alreadyConverted: false
  };
}

function main() {
  console.log('Starting evaluation JSON data migration...\n');

  if (!fs.existsSync(EVALS_DIR)) {
    console.error(`Evaluations directory does not exist: ${EVALS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(EVALS_DIR).filter(f => f.endsWith('.json') && f !== '_registry.json');
  const results = [];
  const contradictions = [];

  for (const file of files) {
    const filePath = path.join(EVALS_DIR, file);
    const res = convertFile(filePath);
    results.push(res);
    if (res.success && res.hasOrderContradiction) {
      contradictions.push(res.filename);
    }
  }

  const successfulCount = results.filter(r => r.success).length;
  const alreadyConvertedCount = results.filter(r => r.success && r.alreadyConverted).length;
  const newlyConvertedCount = successfulCount - alreadyConvertedCount;
  const failedCount = results.filter(r => !r.success).length;

  console.log('-------------------------------------------');
  console.log(`Total processed: ${files.length}`);
  console.log(`Newly converted: ${newlyConvertedCount}`);
  console.log(`Already converted: ${alreadyConvertedCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log('-------------------------------------------');

  if (contradictions.length > 0) {
    console.warn('\n[WARNING] The following files have order contradictions (pessimistic > normal or normal > optimistic):');
    contradictions.forEach(f => {
      console.warn(`  - ${f}`);
    });
    console.warn('\nPlease manually review and fix the values in these files to satisfy: pessimistic <= normal <= optimistic.\n');
  } else {
    console.log('\nNo order contradictions detected in the converted files.');
  }

  if (failedCount > 0) {
    process.exit(1);
  }
}

main();
