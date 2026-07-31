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
  {
  "m": "May'26",
  "mp": "5月",
  "pv": {
    "jp_ishigaki": 121,
    "en_ishigaki": 46,
    "jp_miyako": 340,
    "en_miyako": 124,
    "jp_yoron": 155,
    "jp_kume": 42,
    "jp_aka": 103,
    "jp_amami": 40,
    "en_amami": 15,
    "jp_other": 385,
    "en_other": 91,
    "cjp": 126,
    "cen": 63,
    "hjp": 151,
    "hen": 90
  },
  "rev": {
    "jp_ishigaki": 0,
    "en_ishigaki": 0,
    "jp_miyako": 0,
    "en_miyako": 0,
    "jp_yoron": 0,
    "jp_kume": 0,
    "jp_aka": 0,
    "jp_amami": 0,
    "en_amami": 0,
    "jp_other": 234,
    "en_other": 0,
    "cjp": 0,
    "cen": 0,
    "hjp": 96,
    "hen": 0
  }
},
  {
    "m": "Jun'26",
    "mp": "6月",
    "pv": {
          "jp_ishigaki": 40,
          "en_ishigaki": 14,
          "jp_miyako": 272,
          "en_miyako": 41,
          "jp_yoron": 117,
          "en_yoron": 0,
          "jp_kume": 17,
          "en_kume": 0,
          "jp_aka": 106,
          "en_aka": 0,
          "jp_amami": 4,
          "en_amami": 6,
          "jp_other": 402,
          "en_other": 240,
          "cjp": 41,
          "cen": 16,
          "hjp": 123,
          "hen": 53
    },
    "rev": {
          "jp_ishigaki": 0,
          "en_ishigaki": 0,
          "jp_miyako": 0,
          "en_miyako": 0,
          "jp_yoron": 0,
          "en_yoron": 0,
          "jp_kume": 0,
          "en_kume": 0,
          "jp_aka": 0,
          "en_aka": 0,
          "jp_amami": 0,
          "en_amami": 0,
          "jp_other": 509,
          "en_other": 0,
          "cjp": 0,
          "cen": 0,
          "hjp": 0,
          "hen": 0
    }
  },
  {
    "m": "Jul'26",
    "mp": "7月",
    "pv": {
          "jp_ishigaki": 86,
          "en_ishigaki": 8,
          "jp_miyako": 380,
          "en_miyako": 45,
          "jp_yoron": 200,
          "en_yoron": 0,
          "jp_kume": 7,
          "en_kume": 0,
          "jp_aka": 157,
          "en_aka": 0,
          "jp_amami": 2,
          "en_amami": 4,
          "jp_other": 259,
          "en_other": 150,
          "cjp": 66,
          "cen": 26,
          "hjp": 106,
          "hen": 40
    },
    "rev": {
          "jp_ishigaki": 0,
          "en_ishigaki": 0,
          "jp_miyako": 0,
          "en_miyako": 0,
          "jp_yoron": 0,
          "en_yoron": 0,
          "jp_kume": 0,
          "en_kume": 0,
          "jp_aka": 0,
          "en_aka": 0,
          "jp_amami": 0,
          "en_amami": 0,
          "jp_other": 2316,
          "en_other": 85,
          "cjp": 0,
          "cen": 0,
          "hjp": 0,
          "hen": 0
    }
  },
];