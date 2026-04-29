export interface BasePVRow {
  m: string;
  mp: string;
  pv: Record<string, number>;
  rev?: Record<string, number>; // スコア補正後の予測報酬
  potRev?: Record<string, number>; // 最大ポテンシャル報酬 (スコア100時)
}

/**
 * 各エリアの月別補正係数（季節性バイアス）
 */
export const SEASONAL_BIAS: Record<string, Record<number, number>> = {
  // 沖縄エリア (石垣島、宮古島、与論島、久米島、阿嘉島など)
  // 夏休み・GWのピークと、冬場の閑散期、および台風シーズンの落ち込みを考慮
  okinawa: {
    1: 0.55, 2: 0.60, 3: 0.85, 4: 0.80, 5: 1.30, 6: 0.65, 7: 1.40, 8: 1.35, 9: 0.50, 10: 0.90, 11: 0.75, 12: 0.85
  },
  // ホイアン (ベトナム中部)
  // 2-4月のベストシーズンと、10-12月の雨季（特に10月の洪水リスク）を考慮
  hoian: {
    1: 0.80, 2: 1.10, 3: 1.25, 4: 1.30, 5: 1.20, 6: 1.10, 7: 1.05, 8: 0.95, 9: 0.60, 10: 0.50, 11: 0.60, 12: 0.70
  },
  // コンダオ島 (ベトナム南部)
  // 3-9月の穏やかな海（ダイビング好機）と、11-2月の強風による欠航リスクを考慮
  condao: {
    1: 0.60, 2: 0.70, 3: 1.20, 4: 1.30, 5: 1.25, 6: 1.20, 7: 1.10, 8: 1.00, 9: 0.80, 10: 0.60, 11: 0.50, 12: 0.60
  }
};

export interface SeasonalResult {
  estimatedPv: number;
  confidence: "low" | "medium" | "high";
  riskFactor: string | null;
}

/**
 * エリアと月に基づき季節性補正を適用したPVを算出する
 * @param basePv 基本PV
 * @param month 月 (1-12)
 * @param stream ストリームID (例: jp_ishigaki, cjp, hen)
 */
export function getSeasonalPv(basePv: number, month: number, stream: string): SeasonalResult {
  let area = "okinawa";
  if (stream.startsWith("h")) area = "hoian"; 
  if (stream.startsWith("c")) area = "condao";

  const mul = SEASONAL_BIAS[area]?.[month] || 1.0;
  let confidence: "low" | "medium" | "high" = "medium";
  let riskFactor: string | null = null;

  // エリアごとの固有リスク要因の判定
  if (area === "okinawa") {
    if (month === 9) {
      // 沖縄エリア: 9月は台風の発生・直撃リスクが年間で最も高く、交通遮断や旅行キャンセルが多発するため予測の不確実性が高い
      confidence = "low";
      riskFactor = "Typhoon Risk";
    } else if (month >= 7 && month <= 8) {
      confidence = "high";
    }
  } else if (area === "hoian") {
    if (month === 10) {
      // ホイアン: 10月は雨季の最盛期であり、旧市街の冠水（洪水）リスクがあるため、観光需要が急激に減退する
      confidence = "low";
      riskFactor = "Flood Risk";
    }
  } else if (area === "condao") {
    if (month === 11 || month === 12 || month === 1 || month === 2) {
      // コンダオ島: 冬季は北東からのモンスーン（強風）の影響を受けやすく、高速船の欠航や波高によるマリンレジャー中止のリスクがある
      confidence = "low";
      riskFactor = "Strong Wind/High Waves Risk";
    }
  }

  return {
    estimatedPv: Math.round(basePv * mul),
    confidence,
    riskFactor
  };
}

export function scaleBasePv(basePvObj: BasePVRow[], factor: number): BasePVRow[] {
  return basePvObj.map(row => ({
    ...row,
    pv: Object.fromEntries(
      Object.entries(row.pv).map(([k, v]) => [k, Math.round(v * factor)])
    )
  }));
}

export interface StreamDef {
  key: string;
  label: string;
  color: string;
  cvr: number;
  unit: number;
}

export interface CalculatedRow {
  m: string;
  mp: string;
  total: number;
  potTotal: number;
  cumTotal: number;
  cumPotTotal: number;
  cumVN: number;
  s_total: string;
  s_potTotal: string;
  s_cum: string;
  isActual: boolean;
  actualPvTotal?: number;
  forecastPvTotal?: number;
  [key: string]: any; // rev_*, pot_rev_*, s_rev_*, cum_*, pv_*
}

export function calcData(pvObj: BasePVRow[], streams: StreamDef[]): CalculatedRow[] {
  const cum: Record<string, number> = {};
  const cumPot: Record<string, number> = {};
  streams.forEach((s) => {
    cum[s.key] = 0;
    cumPot[s.key] = 0;
  });
  let cumTotal = 0,
    cumPotTotal = 0,
    cumVN = 0;
  return pvObj.map((row) => {
    const isActual = (row as any).isActual || false;
    const res: CalculatedRow = {
      m: row.m,
      mp: row.mp,
      total: 0,
      potTotal: 0,
      cumTotal: 0,
      cumPotTotal: 0,
      cumVN: 0,
      s_total: "¥0",
      s_potTotal: "¥0",
      s_cum: "¥0",
      isActual,
    };

    let rowPvTotal = 0;
    streams.forEach((s) => {
      const pv = row.pv[s.key] || 0;
      rowPvTotal += pv;
      
      // 実績予測値（rev）があれば優先、なければ標準CVRで計算
      const rev = row.rev?.[s.key] ?? Math.round(pv * s.cvr * s.unit);
      // 最大ポテンシャル（potRev）があれば優先、なければ標準CVR（スコア100相当）で計算
      const potRev = row.potRev?.[s.key] ?? Math.round(pv * s.cvr * s.unit);

      res[`rev_${s.key}`] = rev;
      res[`pot_rev_${s.key}`] = potRev;
      res[`pv_${s.key}`] = pv;
      res[`s_rev_${s.key}`] = "¥" + rev.toLocaleString();
      res[`s_pot_rev_${s.key}`] = "¥" + potRev.toLocaleString();
      res[`s_pv_${s.key}`] = pv.toLocaleString() + " PV";
      
      res.total += rev;
      res.potTotal += potRev;
      
      cum[s.key] += rev;
      cumPot[s.key] += potRev;
      res[`cum_${s.key}`] = cum[s.key];
      
      if (s.key !== "r") cumVN += rev;
    });

    if (isActual) {
      res.actualPvTotal = rowPvTotal;
    } else {
      res.forecastPvTotal = rowPvTotal;
    }

    cumTotal += res.total;
    cumPotTotal += res.potTotal;
    res.cumTotal = cumTotal;
    res.cumPotTotal = cumPotTotal;
    res.cumVN = cumVN;
    res.s_total = "¥" + res.total.toLocaleString();
    res.s_potTotal = "¥" + res.potTotal.toLocaleString();
    res.s_cum = "¥" + cumTotal.toLocaleString();
    return res;
  });
}

export function sumRevDyn(data: CalculatedRow[], streams: StreamDef[]): Record<string, number> {
  const res: Record<string, number> = { total: 0, potTotal: 0, totalPv: 0 };
  streams.forEach((s) => {
    res[s.key] = data.reduce((a, r) => a + (r[`rev_${s.key}`] || 0), 0);
    res[`pot_${s.key}`] = data.reduce((a, r) => a + (r[`pot_rev_${s.key}`] || 0), 0);
    res[`pv_${s.key}`] = data.reduce((a, r) => a + (r[`pv_${s.key}`] || 0), 0);
  });
  res.total = streams.reduce((a, s) => a + (res[s.key] || 0), 0);
  res.potTotal = streams.reduce((a, s) => a + (res[`pot_${s.key}`] || 0), 0);
  res.totalPv = streams.reduce((a, s) => a + (res[`pv_${s.key}`] || 0), 0);
  return res;
}

export function getPageTypeCvrMultiplier(type: string): number {
  switch (type) {
    case "ホテル":    return 1.0;
    case "ガイド":    return 0.5;
    case "ランニング": return 0.3;
    case "トップ":    return 0.2;
    default:          return 0.5;
  }
}

export function addEvalsToPv(
  basePvObj: BasePVRow[],
  storedEvals: Record<string, any>,
  scenario: "pessimistic" | "normal" | "optimistic",
  streams: StreamDef[]
): BasePVRow[] {
  const additions: Record<string, number[]> = {};
  const revAdditions: Record<string, number[]> = {};
  const potAdditions: Record<string, number[]> = {};

  streams.forEach((s) => {
    additions[s.key] = Array(basePvObj.length).fill(0);
    revAdditions[s.key] = Array(basePvObj.length).fill(0);
    potAdditions[s.key] = Array(basePvObj.length).fill(0);
  });

  Object.values(storedEvals).forEach((ev) => {
    const arr =
      scenario === "pessimistic" ? ev.pp : scenario === "optimistic" ? ev.po : ev.pn;
    const pubDate = ev.quality?.publishedDate;
    if (!pubDate) return;

    // 品質補正係数 (0.0 - 1.0)
    const qualityMul = (ev.quality?.overall || 0) / 100;
    // ページタイプ別CVR補正: ホテル1.0 / ガイド0.5 / ランニング0.3 / トップ0.2
    const pageTypeMul = getPageTypeCvrMultiplier(ev.quality?.type || "");
    const sDef = streams.find(s => s.key === ev.stream);
    const streamCvr = sDef?.cvr || 0;
    const streamUnit = sDef?.unit || 0;

    // Find start index in basePvObj
    const [y, m] = pubDate.split("-").map(Number);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const targetM = months[m - 1] + "'" + String(y).slice(-2);
    
    let startIdx = basePvObj.findIndex((row) => row.m === targetM);
    let forecastOffset = 0;

    if (startIdx === -1) {
      // 公開月がダッシュボードの開始月より前の場合の処理
      const firstDashboardM = basePvObj[0].m; // 例: "Mar'26"
      const [firstMName, firstYYear] = firstDashboardM.split("'");
      const firstMonthNum = months.indexOf(firstMName) + 1;
      const firstYearNum = 2000 + Number(firstYYear);
      
      const dashboardStartSerial = firstYearNum * 12 + firstMonthNum;
      const pubSerial = y * 12 + m;
      
      if (pubSerial < dashboardStartSerial) {
        // ダッシュボード開始点 (i=0) における予測データのインデックスを算出
        forecastOffset = dashboardStartSerial - pubSerial;
        startIdx = 0;
      } else {
        // 未来の公開予定などの場合（現状は対象外）
        return;
      }
    }

    for (let i = startIdx; i < basePvObj.length; i++) {
      const forecastIdx = i - startIdx + forecastOffset;
      if (forecastIdx < 0) continue;
      const val = forecastIdx < arr.length ? arr[forecastIdx] : arr[arr.length - 1];
      
      if (!additions[ev.stream]) {
        additions[ev.stream] = Array(basePvObj.length).fill(0);
        revAdditions[ev.stream] = Array(basePvObj.length).fill(0);
        potAdditions[ev.stream] = Array(basePvObj.length).fill(0);
      }
      
      additions[ev.stream][i] += val;
      // 品質スコア × ページタイプ補正に基づいた収益予測
      revAdditions[ev.stream][i] += Math.round(val * streamCvr * streamUnit * qualityMul * pageTypeMul);
      // スコア100とした場合の最大ポテンシャル
      potAdditions[ev.stream][i] += Math.round(val * streamCvr * streamUnit);
    }
  });

  return basePvObj.map((row, i) => {
    const newPv = { ...row.pv };
    const newRev = { ...row.rev };
    const newPotRev = { ...row.potRev };
    
    Object.keys(additions).forEach((key) => {
      newPv[key] = (newPv[key] || 0) + (additions[key][i] || 0);
      newRev[key] = (newRev[key] || 0) + (revAdditions[key][i] || 0);
      newPotRev[key] = (newPotRev[key] || 0) + (potAdditions[key][i] || 0);
    });
    
    return { ...row, pv: newPv, rev: newRev, potRev: newPotRev };
  });
}
