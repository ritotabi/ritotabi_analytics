export interface BasePVRow {
  m: string;
  mp: string;
  pv: Record<string, number>;
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
  [key: string]: any; // rev_*, s_rev_*, cum_*
}

export function calcData(pvObj: BasePVRow[], streams: StreamDef[]): CalculatedRow[] {
  const cum: Record<string, number> = {};
  streams.forEach((s) => {
    cum[s.key] = 0;
  });
  let cumTotal = 0,
    cumVN = 0;
  return pvObj.map((row) => {
    const res: CalculatedRow = {
      m: row.m,
      mp: row.mp,
      total: 0,
      cumTotal: 0,
      cumVN: 0,
      s_total: "¥0",
      s_cum: "¥0",
    };
    streams.forEach((s) => {
      const pv = row.pv[s.key] || 0;
      const rev = Math.round(pv * s.cvr * s.unit);
      res[`rev_${s.key}`] = rev;
      res[`s_rev_${s.key}`] = "¥" + rev.toLocaleString();
      res.total += rev;
      cum[s.key] += rev;
      res[`cum_${s.key}`] = cum[s.key];
      if (s.key !== "r") cumVN += rev;
    });
    cumTotal += res.total;
    res.cumTotal = cumTotal;
    res.cumVN = cumVN;
    res.s_total = "¥" + res.total.toLocaleString();
    res.s_cum = "¥" + cumTotal.toLocaleString();
    return res;
  });
}

export function sumRevDyn(data: CalculatedRow[], streams: StreamDef[]): Record<string, number> {
  const res: Record<string, number> = { total: 0 };
  streams.forEach((s) => {
    res[s.key] = data.reduce((a, r) => a + (r[`rev_${s.key}`] || 0), 0);
  });
  res.total = streams.reduce((a, s) => a + (res[s.key] || 0), 0);
  return res;
}

export function addEvalsToPv(
  basePvObj: BasePVRow[],
  storedEvals: Record<string, { pp: number[]; pn: number[]; po: number[]; stream: string }>,
  scenario: "pessimistic" | "normal" | "optimistic",
  streams: StreamDef[]
): BasePVRow[] {
  const additions: Record<string, number[]> = {};
  streams.forEach((s) => {
    additions[s.key] = Array(24).fill(0);
  });
  Object.values(storedEvals).forEach((ev) => {
    const arr =
      scenario === "pessimistic" ? ev.pp : scenario === "optimistic" ? ev.po : ev.pn;
    if (!additions[ev.stream]) additions[ev.stream] = Array(24).fill(0);
    arr.forEach((v, i) => {
      additions[ev.stream][i] = (additions[ev.stream][i] || 0) + v;
    });
  });
  return basePvObj.map((row, i) => {
    const newPv = { ...row.pv };
    Object.keys(additions).forEach((key) => {
      newPv[key] = (newPv[key] || 0) + (additions[key][i] || 0);
    });
    return { ...row, pv: newPv };
  });
}
