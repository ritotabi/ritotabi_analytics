const fs = require('fs');
const path = require('path');

const EVALS_DIR = path.join(__dirname, '../src/evaluations');

function migrateChecklists(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let data = JSON.parse(content);
  let changed = false;

  const quality = data.quality;
  if (!quality) return false;

  // Migrate seoChecklist keys
  if (quality.seoChecklist) {
    const seoMap = {
      'JSON-LD': 'faq',
      'Title KW': 'keyword',
      'Meta Desc': 'meta',
      'Canonical': 'canonical',
      'OGP': 'ogp',
      'faqJsonLd': 'faq',
      'metaTitleKw': 'keyword',
      'metaDescLength': 'meta',
      'canonicalUrl': 'canonical',
      'ogpTwitterCard': 'ogp'
    };

    const newSeo = {};
    const keys = Object.keys(quality.seoChecklist);
    
    // Default keys to false if missing
    const standardKeys = ['hreflang', 'faq', 'keyword', 'meta', 'canonical', 'ogp'];
    standardKeys.forEach(k => {
      newSeo[k] = false;
    });

    keys.forEach(k => {
      const targetKey = seoMap[k] || k;
      if (standardKeys.includes(targetKey)) {
        newSeo[targetKey] = quality.seoChecklist[k];
        if (targetKey !== k) changed = true;
      } else {
        // Drop any other non-standard keys
        changed = true;
      }
    });

    // If standardKeys weren't all present before
    if (JSON.stringify(quality.seoChecklist) !== JSON.stringify(newSeo)) {
      quality.seoChecklist = newSeo;
      changed = true;
    }
  }

  // Migrate/Fill affiliateChecklist fields
  if (quality.affiliateChecklist) {
    const defaults = {
      ctaPosition: false,
      microCopy: false,
      multipleOta: false,
      priceVisible: false,
      socialProof: false,
      mobileStickyCta: false,
      carRentalLink: false,
      activityLink: false,
      urgencySignals: 0,
      minClicks: 0
    };

    const currentKeys = Object.keys(quality.affiliateChecklist);
    const newAff = { ...quality.affiliateChecklist };

    Object.keys(defaults).forEach(key => {
      if (newAff[key] === undefined) {
        newAff[key] = defaults[key];
        changed = true;
      }
    });

    // Drop any unexpected fields if they exist
    Object.keys(newAff).forEach(key => {
      if (defaults[key] === undefined) {
        delete newAff[key];
        changed = true;
      }
    });

    if (changed) {
      quality.affiliateChecklist = newAff;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
    console.log(`✓ Migrated checklists in ${path.basename(filePath)}`);
    return true;
  }

  return false;
}

function main() {
  console.log('Migrating and filling missing checklist fields in JSON evaluations...\n');
  const files = fs.readdirSync(EVALS_DIR).filter(f => f.endsWith('.json') && f !== '_registry.json');
  let count = 0;

  for (const file of files) {
    const filePath = path.join(EVALS_DIR, file);
    if (migrateChecklists(filePath)) {
      count++;
    }
  }

  console.log(`\nFinished. Migrated ${count} files.`);
}

main();
