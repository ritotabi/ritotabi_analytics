import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// プロジェクトルートとディレクトリ設定
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EVAL_DIR = path.resolve(__dirname, '../src/evaluations');

// 季節性係数（calc.tsから転記）
const SEASONAL_BIAS: Record<string, Record<number, number>> = {
  okinawa: {
    1: 0.55, 2: 0.60, 3: 0.85, 4: 0.80, 5: 1.30, 6: 0.65, 7: 1.40, 8: 1.35, 9: 0.50, 10: 0.90, 11: 0.75, 12: 0.85
  },
  hoian: {
    1: 0.80, 2: 1.10, 3: 1.25, 4: 1.30, 5: 1.20, 6: 1.10, 7: 1.05, 8: 0.95, 9: 0.60, 10: 0.50, 11: 0.60, 12: 0.70
  },
  condao: {
    1: 0.60, 2: 0.70, 3: 1.20, 4: 1.30, 5: 1.25, 6: 1.20, 7: 1.10, 8: 1.00, 9: 0.80, 10: 0.60, 11: 0.50, 12: 0.60
  }
};

/**
 * 月を移動させる（1-12の範囲に収める）
 */
function addMonths(startMonth: number, add: number): number {
  const m = (startMonth + add) % 12;
  return m === 0 ? 12 : m;
}

function migrate() {
  const files = fs.readdirSync(EVAL_DIR).filter(f => f.endsWith('.json') && !f.startsWith('_'));

  console.log(`Found ${files.length} evaluation files. Starting migration...`);

  files.forEach(file => {
    const filePath = path.join(EVAL_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // すでに適用済みの場合は再計算をスキップ（ただし seasonalRisk の追加は行う）
    const alreadyApplied = data.memo.includes("季節性バイアス適用済み");

    const pubDateStr = data.quality?.publishedDate;
    const stream = data.stream;

    if (!pubDateStr || !stream) {
      console.warn(`Skipping ${file}: Missing publishedDate or stream.`);
      return;
    }

    const [, month] = pubDateStr.split('-').map(Number);
    
    let area = "okinawa";
    if (stream.startsWith("h")) area = "hoian"; 
    if (stream.startsWith("c")) area = "condao";

    if (!alreadyApplied) {
      // pp, pn, po の各配列を更新
      ['pp', 'pn', 'po'].forEach(key => {
        if (Array.isArray(data[key])) {
          data[key] = data[key].map((val: number, idx: number) => {
            const currentMonth = addMonths(month, idx);
            const mul = SEASONAL_BIAS[area]?.[currentMonth] || 1.0;
            return Math.round(val * mul);
          });
        }
      });
      data.memo += " (2026-04-13: 季節性バイアス適用済みモデルで再計算)";
    }

    // seasonalRisk の追加
    let seasonalRisk: string | null = null;
    if (area === "okinawa") {
      seasonalRisk = "台風リスク (9月)";
    } else if (area === "hoian") {
      seasonalRisk = "洪水リスク (10月)";
    } else if (area === "condao") {
      seasonalRisk = "強風・波高リスク (11月-2月)";
    }
    data.quality.seasonalRisk = seasonalRisk;

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`Updated ${file} (Area: ${area}, SkipCalc: ${alreadyApplied})`);
  });

  console.log("Migration completed.");
}

migrate();
