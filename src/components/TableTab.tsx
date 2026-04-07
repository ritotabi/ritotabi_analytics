import React from "react";
import type { StreamDef, CalculatedRow } from "../utils/calc";
import { SLATE } from "../utils/colors";

interface TableTabProps {
  data: CalculatedRow[];
  streams: StreamDef[];
  sum: Record<string, number>;
}

const TableTab: React.FC<TableTabProps> = ({ data, streams, sum }) => {
  return (
    <div className="card" style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", color: "#e2e8f0", fontSize: 11, textAlign: "left" }}>
        <thead>
          <tr style={{ background: "#0c1829", borderBottom: "1px solid #1e293b" }}>
            <th style={{ padding: "10px 16px", fontWeight: 700, color: SLATE }}>月</th>
            <th style={{ padding: "10px 16px", fontWeight: 700, textAlign: "right", color: SLATE }}>月次合計</th>
            {streams.map((s) => (
              <th key={s.key} style={{ padding: "10px 16px", fontWeight: 700, textAlign: "right", color: s.color }}>{s.label}</th>
            ))}
            <th style={{ padding: "10px 16px", fontWeight: 700, textAlign: "right", color: SLATE }}>累計合計</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.m} style={{ borderBottom: "1px solid #1e293b15", background: i % 2 === 0 ? "transparent" : "#0f172a50" }}>
              <td style={{ padding: "8px 16px", color: SLATE, fontWeight: 700 }}>{row.mp}</td>
              <td style={{ padding: "8px 16px", textAlign: "right", fontSize: 12, fontWeight: 700, fontFamily: "monospace" }}>{row.s_total}</td>
              {streams.map((s) => (
                <td key={s.key} style={{ padding: "8px 16px", textAlign: "right", color: s.color + "cc", fontFamily: "monospace" }}>{row[`s_rev_${s.key}`]}</td>
              ))}
              <td style={{ padding: "8px 16px", textAlign: "right", fontSize: 12, fontWeight: 700, color: SLATE, fontFamily: "monospace" }}>{row.s_cum}</td>
            </tr>
          ))}
          <tr style={{ background: "#0c1829", fontWeight: 700, borderTop: "2px solid #1e293b" }}>
            <td style={{ padding: "10px 16px", color: SLATE }}>合計</td>
            <td style={{ padding: "10px 16px", textAlign: "right", fontSize: 13, color: SLATE, fontFamily: "monospace" }}>¥{sum.total.toLocaleString()}</td>
            {streams.map((s) => (
              <td key={s.key} style={{ padding: "10px 16px", textAlign: "right", color: s.color, fontFamily: "monospace" }}>¥{sum[s.key].toLocaleString()}</td>
            ))}
            <td style={{ padding: "10px 16px", textAlign: "right", fontSize: 13, color: SLATE, fontFamily: "monospace" }}>¥{sum.total.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default TableTab;
