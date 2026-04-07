import React from "react";
import { SLATE, TEAL, ROSE, GRN } from "../utils/colors";

interface ModeBannerProps {
  scenario: "pessimistic" | "normal" | "optimistic";
  setScenario: (s: "pessimistic" | "normal" | "optimistic") => void;
  useAccumulated: boolean;
  setUseAccumulated: (val: boolean) => void;
  totalRevenue: number;
  diffTotal: number;
  baseTotal: number;
}

const ModeBanner: React.FC<ModeBannerProps> = ({
  scenario,
  setScenario,
  useAccumulated,
  setUseAccumulated,
  totalRevenue,
  diffTotal,
  baseTotal,
}) => {
  return (
    <div style={{ background: "#0c1829", borderBottom: "1px solid #1e293b", padding: "8px 24px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <span style={{ fontSize: 10, color: SLATE, fontFamily: "monospace" }}>予測モード:</span>
      <button
        onClick={() => setUseAccumulated(false)}
        style={{
          padding: "4px 14px",
          border: `1px solid ${!useAccumulated ? SLATE : SLATE + "40"}`,
          borderRadius: 20,
          background: !useAccumulated ? "#1e293b" : "transparent",
          color: !useAccumulated ? SLATE : SLATE + "60",
          fontSize: 10,
          cursor: "pointer",
          fontFamily: "monospace",
        }}
      >
        v7準拠ベース
      </button>
      <button
        onClick={() => setUseAccumulated(true)}
        style={{
          padding: "4px 14px",
          border: `1px solid ${useAccumulated ? TEAL : TEAL + "40"}`,
          borderRadius: 20,
          background: useAccumulated ? TEAL + "18" : "transparent",
          color: useAccumulated ? TEAL : TEAL + "60",
          fontSize: 10,
          cursor: "pointer",
          fontFamily: "monospace",
        }}
      >
        評価済み反映
      </button>

      <span style={{ fontSize: 10, color: "#334155", fontFamily: "monospace" }}>│</span>
      <span style={{ fontSize: 10, color: SLATE, fontFamily: "monospace" }}>シナリオ:</span>
      {[
        { key: "pessimistic", label: "悲観", color: ROSE },
        { key: "normal", label: "通常", color: TEAL },
        { key: "optimistic", label: "楽観", color: GRN },
      ].map((s) => (
        <button
          key={s.key}
          onClick={() => setScenario(s.key as any)}
          style={{
            padding: "4px 14px",
            border: `1px solid ${scenario === s.key ? s.color : s.color + "40"}`,
            borderRadius: 20,
            background: scenario === s.key ? s.color + "18" : "transparent",
            color: scenario === s.key ? s.color : s.color + "60",
            fontSize: 10,
            cursor: "pointer",
            fontFamily: "monospace",
          }}
        >
          {s.label}
          {scenario === s.key ? ` ¥${totalRevenue.toLocaleString()}` : ""}
        </button>
      ))}

      <span style={{ fontSize: 10, color: diffTotal >= 0 ? GRN : ROSE, fontFamily: "monospace", marginLeft: "auto" }}>
        標準比 {diffTotal >= 0 ? "+" : ""}
        {Math.round((diffTotal / baseTotal) * 100)}%（¥{Math.abs(diffTotal).toLocaleString()}）
      </span>
    </div>
  );
};

export default ModeBanner;
