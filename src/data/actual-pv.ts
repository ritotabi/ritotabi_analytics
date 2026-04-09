import type { BasePVRow } from "../utils/calc";

/**
 * Google Analyticsから取得した実績PVデータ
 * フォーマットは baseline-pv.ts と同様
 */
export const ACTUAL_PV_OBJ: BasePVRow[] = [
  { 
    m: "Mar'26", 
    mp: "3月", 
    pv: { 
      jp_yoron: 296, 
      jp_miyako: 313, 
      jp_ishigaki: 141, 
      jp_kume: 32,
      jp_aka: 51,
      cjp: 72, 
      cen: 31,
      hjp: 32,
      hen: 3,
      jp_other: 449,
      en_other: 16,
    },
    // 3月は開発・テスト期間のため収益はゼロとして記録
    rev: {
      jp_yoron: 0, jp_miyako: 0, jp_ishigaki: 0, jp_kume: 0, jp_aka: 0,
      cjp: 0, cen: 0, hjp: 0, hen: 0, jp_other: 0, en_other: 0
    }
  },
];
