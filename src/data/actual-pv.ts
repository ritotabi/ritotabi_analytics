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
      jp_yoron: 303, 
      jp_miyako: 314, 
      jp_ishigaki: 141, 
      jp_kume: 32,
      jp_aka: 55,
      cjp: 72, 
      cen: 31,
      hjp: 32,
      hen: 3,
      jp_other: 450,
      en_other: 16,
    },
    // 3月は開発・テスト期間のため収益はゼロとして記録
    rev: {
      jp_yoron: 0, jp_miyako: 0, jp_ishigaki: 0, jp_kume: 0, jp_aka: 0,
      cjp: 0, cen: 0, hjp: 0, hen: 0, jp_other: 0, en_other: 0
    }
  },
  {
    m: "Apr'26",
    mp: "4月",
    pv: {
      jp_yoron: 185,
      jp_miyako: 352,
      jp_ishigaki: 181,
      jp_kume: 56,
      jp_aka: 72,
      jp_amami: 88,
      en_ishigaki: 169,
      en_miyako: 87,
      en_amami: 48,
      cjp: 147,
      cen: 129,
      hjp: 290,
      hen: 236,
      jp_other: 454,
      en_other: 165,
    },
    // 4月も売上ゼロ
    rev: {
      jp_yoron: 0, jp_miyako: 0, jp_ishigaki: 0, jp_kume: 0, jp_aka: 0,
      jp_amami: 0, en_ishigaki: 0, en_miyako: 0, en_amami: 0,
      cjp: 0, cen: 0, hjp: 0, hen: 0, jp_other: 0, en_other: 0
    }
  },
];
