import React from "react";
import type { StreamDef, CalculatedRow } from "../utils/calc";
import { SLATE, PINK, GRN } from "../utils/colors";

interface TableTabProps {
  data: CalculatedRow[];
  streams: StreamDef[];
  sum: Record<string, number>;
}

const MONTH_MAP: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12
};

function parseMonthYear(m: string): number {
  const match = m.match(/^([A-Za-z]{3})'(\d{2})$/);
  if (!match) return 0;
  const monthStr = match[1];
  const yearStr = match[2];
  const month = MONTH_MAP[monthStr] || 0;
  const year = 2000 + parseInt(yearStr, 10);
  return year * 100 + month;
}

const TableTab: React.FC<TableTabProps> = ({ data, streams }) => {
  // 1. 月（時系列）でソート。同じ月なら実績(isActual: true)を先にする
  const sortedData = [...data].sort((a, b) => {
    const valA = parseMonthYear(a.m);
    const valB = parseMonthYear(b.m);
    if (valA !== valB) {
      return valA - valB;
    }
    return a.isActual ? -1 : 1;
  });

  // 2. 実績が存在する月を特定
  const actualMonths = new Set(data.filter(r => r.isActual).map(r => r.m));

  // 3. 累積値の再計算
  let cumActual = 0;
  let cumPlan = 0;

  const displayData: (CalculatedRow & { displayCum: string })[] = sortedData.map((row) => {
    const isActual = row.isActual || false;
    const rowTotal = (row.total as number) || 0;
    let cumValue = 0;

    if (isActual) {
      cumActual += rowTotal;
      cumValue = cumActual;
    } else {
      if (actualMonths.has(row.m)) {
        // 実績が存在する過去の月の予定データ
        cumPlan += rowTotal;
        cumValue = cumPlan;
      } else {
        // 未来の予定データ（実績の最終値に未来の予定を累積していく）
        cumActual += rowTotal;
        cumValue = cumActual;
      }
    }

    return {
      ...row,
      displayCum: "¥" + cumValue.toLocaleString()
    };
  });

  // 4. 重複を排除した「最新見込み合計（実績＋未来予定）」の再計算
  const customSum: Record<string, number> = { total: 0 };
  streams.forEach((s) => {
    customSum[s.key] = 0;
    customSum[`pv_${s.key}`] = 0;
  });

  sortedData.forEach((row) => {
    const isTarget = row.isActual || !actualMonths.has(row.m);
    if (isTarget) {
      streams.forEach((s) => {
        const rev = (row[`rev_${s.key}`] as number) || 0;
        const pv = (row[`pv_${s.key}`] as number) || 0;
        customSum[s.key] += rev;
        customSum[`pv_${s.key}`] += pv;
      });
      customSum.total += (row.total as number) || 0;
    }
  });

  return (
    <div className="card" style={{ overflowX: "auto", padding: 0 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", color: "#e2e8f0", fontSize: 13, textAlign: "left" }}>
        <thead>
          <tr style={{ background: "#0c1829", borderBottom: "2px solid #1e293b" }}>
            <th style={{ padding: "14px 20px", fontWeight: 700, color: SLATE, whiteSpace: "nowrap" }}>月</th>
            <th style={{ padding: "14px 20px", fontWeight: 700, textAlign: "right", color: SLATE, whiteSpace: "nowrap" }}>月次合計</th>
            {streams.map((s) => (
              <th key={s.key} style={{ padding: "14px 20px", fontWeight: 700, textAlign: "right", color: s.color, whiteSpace: "nowrap" }}>{s.label}</th>
            ))}
            <th style={{ padding: "14px 20px", fontWeight: 700, textAlign: "right", color: SLATE, whiteSpace: "nowrap" }}>累計合計</th>
          </tr>
        </thead>
        <tbody className="table-body-hover">
          {displayData.map((row, i) => {
            const nextRow = displayData[i + 1];
            const isLastOfMonth = !nextRow || nextRow.m !== row.m;
            const rowBackground = row.isActual 
              ? "rgba(236, 72, 153, 0.04)" 
              : "rgba(74, 222, 128, 0.02)";
            const rowBorderBottom = isLastOfMonth 
              ? "2px solid #1e293b" 
              : "1px dashed #1e293b40";

            return (
              <tr 
                key={`${row.m}-${row.isActual ? 'act' : 'fc'}`} 
                className="table-row" 
                style={{ 
                  borderBottom: rowBorderBottom, 
                  background: rowBackground 
                }}
              >
                <td style={{ padding: "12px 20px", color: row.isActual ? PINK : SLATE, fontWeight: 700, whiteSpace: "nowrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {row.mp}
                    {row.isActual ? (
                      <span style={{ 
                        fontSize: 10, 
                        padding: "2px 6px", 
                        background: PINK + "20", 
                        color: PINK, 
                        borderRadius: 4, 
                        border: `1px solid ${PINK}40`,
                        fontWeight: 600
                      }}>実績</span>
                    ) : (
                      <span style={{ 
                        fontSize: 10, 
                        padding: "2px 6px", 
                        background: GRN + "20", 
                        color: GRN, 
                        borderRadius: 4, 
                        border: `1px solid ${GRN}40`,
                        fontWeight: 600
                      }}>予定</span>
                    )}
                  </div>
                </td>
                <td style={{ padding: "12px 20px", textAlign: "right", fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{row.s_total}</div>
                  <div style={{ fontSize: 11, opacity: 0.6 }}>{(row.actualPvTotal || row.forecastPvTotal || 0).toLocaleString()} <span style={{ fontSize: 10 }}>PV</span></div>
                </td>
                {streams.map((s) => (
                  <td key={s.key} style={{ padding: "12px 20px", textAlign: "right", fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace" }}>
                    <div style={{ color: s.color, fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{row[`s_rev_${s.key}`]}</div>
                    <div style={{ fontSize: 11, opacity: 0.7, color: s.color }}>{row[`s_pv_${s.key}`]}</div>
                  </td>
                ))}
                <td style={{ padding: "12px 20px", textAlign: "right", fontSize: 14, fontWeight: 700, color: SLATE, fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace" }}>{row.displayCum}</td>
              </tr>
            );
          })}
          <tr style={{ background: "#0c1829", fontWeight: 700, borderTop: "2px solid #1e293b" }}>
            <td style={{ padding: "16px 20px", color: SLATE }}>合計</td>
            <td style={{ padding: "16px 20px", textAlign: "right", fontSize: 15, color: SLATE, fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace" }}>
              <div style={{ color: "#fff" }}>¥{customSum.total.toLocaleString()}</div>
            </td>
            {streams.map((s) => (
              <td key={s.key} style={{ padding: "16px 20px", textAlign: "right", fontSize: 13, color: s.color, fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace" }}>
                <div style={{ fontSize: 14 }}>¥{customSum[s.key].toLocaleString()}</div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>{(customSum[`pv_${s.key}`] || 0).toLocaleString()} <span style={{ fontSize: 10 }}>PV</span></div>
              </td>
            ))}
            <td style={{ padding: "16px 20px", textAlign: "right", fontSize: 15, color: SLATE, fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace" }}>
              <div style={{ color: "#fff" }}>¥{customSum.total.toLocaleString()}</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default TableTab;
