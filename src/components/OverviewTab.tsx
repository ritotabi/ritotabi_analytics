import React from "react";
import { PINK, TEAL, SLATE, GRN } from "../utils/colors";
import type { StreamDef } from "../utils/calc";
import type { PageEvaluation } from "../types/evaluation";

interface OverviewTabProps {
  streams: StreamDef[];
  sum: Record<string, number>;
  baseSum: Record<string, number>;
  evaluations: Record<string, PageEvaluation>;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ streams, sum, evaluations }) => {
  const V6_STD = 878400;

  return (
    <div>
      <h3 style={{ color: PINK, fontSize: 11, fontFamily: "monospace", letterSpacing: "0.12em", marginBottom: 14 }}>
        — 収益ストリーム
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 22 }}>
        {streams.map((s) => {
          const streamSum = sum[s.key] || 0;
          return (
            <div key={s.key} style={{ background: "#0f172a", border: `1px solid ${s.color}25`, borderLeft: `3px solid ${s.color}`, borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <p style={{ color: s.color, fontWeight: 700, fontSize: 12, margin: 0 }}>{s.label}</p>
              </div>
              <p style={{ color: "#e2e8f0", fontSize: 18, fontWeight: 700, margin: "0 0 2px", fontFamily: "monospace" }}>{"¥" + streamSum.toLocaleString()}</p>
              <p style={{ color: "#475569", fontSize: 11, margin: "0 0 6px" }}>24ヶ月累計</p>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ fontSize: 10, color: s.color, border: `1px solid ${s.color}40`, borderRadius: 4, padding: "1px 7px", fontFamily: "monospace" }}>CVR {(s.cvr * 100).toFixed(2)}%</span>
                <span style={{ fontSize: 10, color: s.color, border: `1px solid ${s.color}40`, borderRadius: 4, padding: "1px 7px", fontFamily: "monospace" }}>単価 ¥{s.unit.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
        <div style={{ background: "linear-gradient(135deg, rgba(45,212,191, 0.08), rgba(236,72,153, 0.06))", border: `1px solid ${TEAL}40`, borderLeft: `3px solid ${TEAL}`, borderRadius: 8, padding: "12px 16px" }}>
          <p style={{ color: TEAL, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>合計（{streams.length}軸）</p>
          <p style={{ color: TEAL, fontSize: 22, fontWeight: 700, margin: "0 0 4px", fontFamily: "monospace" }}>{"¥" + sum.total.toLocaleString()}</p>
          <p style={{ color: "#475569", fontSize: 11, margin: "0 0 8px" }}>24ヶ月累計</p>
          <p style={{ color: GRN, fontSize: 12, fontWeight: 700, fontFamily: "monospace" }}>
            v6比 +¥{(sum.total - V6_STD).toLocaleString()}（+{Math.round(((sum.total - V6_STD) / V6_STD) * 100)}%）
          </p>
        </div>
      </div>

      <h3 style={{ color: PINK, fontSize: 11, fontFamily: "monospace", letterSpacing: "0.12em", marginBottom: 12 }}>
        — 評価済みPV蓄積（{Object.keys(evaluations).length}ページ）
      </h3>
      <div className="card">
        {Object.values(evaluations).map((ev, i, arr) => {
          const s = streams.find((st) => st.key === ev.stream);
          const pnSum = ev.pn.reduce((a, v) => a + v, 0);
          return (
            <div key={ev.url} style={{ padding: "12px 18px", borderBottom: i < arr.length - 1 ? "1px solid #1e293b" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: s?.color || SLATE, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#e2e8f0", flex: 1 }}>{ev.quality.title}</span>
                <span style={{ fontSize: 11, color: s?.color || SLATE, fontFamily: "monospace" }}>{ev.stream}</span>
                <span style={{ fontSize: 11, color: SLATE, fontFamily: "monospace" }}>通常 {pnSum.toLocaleString()}PV/24M</span>
                <span style={{ fontSize: 10, color: SLATE, fontFamily: "monospace" }}>（評価日: {ev.evaluatedAt}）</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OverviewTab;
