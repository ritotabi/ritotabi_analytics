const fs = require('fs');
const path = require('path');

const EVALS_DIR = path.join(process.cwd(), 'src/evaluations');
const MARKET_DATA_PATH = path.join(process.cwd(), '.agent/skills/page_evaluator/resources/market_data.md');

// 統計データの簡易マッピング (月間ベース)
const STATISTICS = {
  jp_ishigaki: { domestic: 100000, intl: 16000 },
  en_ishigaki: { domestic: 100000, intl: 16000 },
  jp_miyako: { domestic: 83000, intl: 16000 },
  en_miyako: { domestic: 83000, intl: 16000 },
  hjp: { domestic: 100000, intl: 260000 },
  hen: { domestic: 100000, intl: 260000 },
  cjp: { domestic: 48000, intl: 1400 },
  cen: { domestic: 48000, intl: 1400 },
  jp_yoron: { domestic: 7000, intl: 1000 }, // 推定
  en_yoron: { domestic: 7000, intl: 1000 },
  jp_kume: { domestic: 8000, intl: 500 }, // 推定
  jp_amami: { domestic: 50000, intl: 3000 }, // 推定
};

function auditFile(file) {
  const content = fs.readFileSync(path.join(EVALS_DIR, file), 'utf-8');
  const data = JSON.parse(content);
  
  const stream = data.stream;
  const lang = data.quality?.lang || (data.id.startsWith('en_') ? 'EN' : 'JP');
  const stats = STATISTICS[stream];
  
  if (!stats) return null;

  const targetMarket = lang === 'JP' ? stats.domestic : stats.intl;
  const maxPn = Math.max(...data.pn);
  const reachRate = (maxPn / targetMarket) * 100;

  return {
    file,
    id: data.id,
    lang,
    maxPn,
    market: targetMarket,
    reachRate: reachRate.toFixed(2) + '%'
  };
}

function main() {
  const files = fs.readdirSync(EVALS_DIR).filter(f => f.endsWith('.json') && f !== '_registry.json');
  const results = files.map(auditFile).filter(r => r !== null);

  console.log('--- Reach Rate Audit Report ---');
  console.log('Threshold for "Strongly Aggressive": > 15% for main, > 30% for niche\n');
  
  results.sort((a, b) => parseFloat(b.reachRate) - parseFloat(a.reachRate));

  console.table(results);

  const aggressive = results.filter(r => {
    const rate = parseFloat(r.reachRate);
    if (r.id.includes('ishigaki') || r.id.includes('miyako') || r.id.includes('hoian')) {
      return rate > 10; // 大拠点で10%超えは強気
    }
    return rate > 25; // ニッチで25%超えは強気
  });

  if (aggressive.length > 0) {
    console.log('\nPotential issues found:');
    aggressive.forEach(r => {
      console.log(`- ${r.file}: Reach rate ${r.reachRate} (Max PN: ${r.maxPn} vs Market: ${r.market})`);
    });
  } else {
    console.log('\nNo major issues found based on current guidelines.');
  }
}

main();
