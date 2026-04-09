export interface BasePVRow {
  m: string;
  mp: string;
  pv: Record<string, number>;
  rev?: Record<string, number>; // 実績報酬があれば直接指定可能
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
  cumTotal: number;
  cumVN: number;
  s_total: string;
  s_cum: string;
  isActual: boolean;
  actualPvTotal?: number;
  forecastPvTotal?: number;
  [key: string]: any; // rev_*, s_rev_*, cum_*, pv_*
}

export function calcData(pvObj: BasePVRow[], streams: StreamDef[]): CalculatedRow[] {
  const cum: Record<string, number> = {};
  streams.forEach((s) => {
    cum[s.key] = 0;
  });
  let cumTotal = 0,
    cumVN = 0;
  return pvObj.map((row) => {
    const isActual = (row as any).isActual || false;
    const res: CalculatedRow = {
      m: row.m,
      mp: row.mp,
      total: 0,
      cumTotal: 0,
      cumVN: 0,
      s_total: "¥0",
      s_cum: "¥0",
      isActual,
    };

    let rowPvTotal = 0;
    streams.forEach((s) => {
      const pv = row.pv[s.key] || 0;
      rowPvTotal += pv;
      // 実績値があれば優先、なければ推計
      const rev = (row as any).rev?.[s.key] ?? Math.round(pv * s.cvr * s.unit);
      res[`rev_${s.key}`] = rev;
      res[`pv_${s.key}`] = pv;
      res[`s_rev_${s.key}`] = "¥" + rev.toLocaleString();
      res[`s_pv_${s.key}`] = pv.toLocaleString() + " PV";
      res.total += rev;
      cum[s.key] += rev;
      res[`cum_${s.key}`] = cum[s.key];
      if (s.key !== "r") cumVN += rev;
    });

    if (isActual) {
      res.actualPvTotal = rowPvTotal;
    } else {
      res.forecastPvTotal = rowPvTotal;
    }

    cumTotal += res.total;
    res.cumTotal = cumTotal;
    res.cumVN = cumVN;
    res.s_total = "¥" + res.total.toLocaleString();
    res.s_cum = "¥" + cumTotal.toLocaleString();
    return res;
  });
}

export function sumRevDyn(data: CalculatedRow[], streams: StreamDef[]): Record<string, number> {
  const res: Record<string, number> = { total: 0, totalPv: 0 };
  streams.forEach((s) => {
    res[s.key] = data.reduce((a, r) => a + (r[`rev_${s.key}`] || 0), 0);
    res[`pv_${s.key}`] = data.reduce((a, r) => a + (r[`pv_${s.key}`] || 0), 0);
  });
  res.total = streams.reduce((a, s) => a + (res[s.key] || 0), 0);
  res.totalPv = streams.reduce((a, s) => a + (res[`pv_${s.key}`] || 0), 0);
  return res;
}

export function addEvalsToPv(
  basePvObj: BasePVRow[],
  storedEvals: Record<string, any>,
  scenario: "pessimistic" | "normal" | "optimistic",
  streams: StreamDef[]
): BasePVRow[] {
  const additions: Record<string, number[]> = {};
  streams.forEach((s) => {
    additions[s.key] = Array(basePvObj.length).fill(0);
  });

  Object.values(storedEvals).forEach((ev) => {
    const arr =
      scenario === "pessimistic" ? ev.pp : scenario === "optimistic" ? ev.po : ev.pn;
    const pubDate = ev.quality?.publishedDate;
    if (!pubDate) return;

    // Find start index in basePvObj (Format: e.g. "Apr'26")
    const [y, m] = pubDate.split("-").map(Number);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const targetM = months[m - 1] + "'" + String(y).slice(-2);
    const startIdx = basePvObj.findIndex((row) => row.m === targetM);

    if (startIdx === -1) return;

    for (let i = startIdx; i < basePvObj.length; i++) {
      const forecastIdx = i - startIdx;
      // If array is shorter than timeline, sustain the last value
      const val = forecastIdx < arr.length ? arr[forecastIdx] : arr[arr.length - 1];
      if (!additions[ev.stream]) additions[ev.stream] = Array(basePvObj.length).fill(0);
      additions[ev.stream][i] = (additions[ev.stream][i] || 0) + val;
    }
  });

  return basePvObj.map((row, i) => {
    const newPv = { ...row.pv };
    Object.keys(additions).forEach((key) => {
      newPv[key] = (newPv[key] || 0) + (additions[key][i] || 0);
    });
    return { ...row, pv: newPv };
  });
}
