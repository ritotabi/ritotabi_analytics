import React from "react";
import { SLATE, TEAL, ROSE, GRN, AMBER } from "../utils/colors";

interface ModeBannerProps {
  scenario: "pessimistic" | "normal" | "optimistic";
  setScenario: (s: "pessimistic" | "normal" | "optimistic") => void;
  useAccumulated: boolean;
  setUseAccumulated: (val: boolean) => void;
  baselineMode: "standard" | "conservative";
  setBaselineMode: (m: "standard" | "conservative") => void;
  totalRevenue: number;
  diffTotal: number;
  baseTotal: number;
}

const SCENARIOS = [
  { key: "pessimistic", label: "悲観", color: ROSE },
  { key: "normal", label: "通常", color: TEAL },
  { key: "optimistic", label: "楽観", color: GRN },
] as const;

const ModeBanner: React.FC<ModeBannerProps> = ({
  scenario,
  setScenario,
  useAccumulated,
  setUseAccumulated,
  baselineMode,
  setBaselineMode,
  totalRevenue,
  diffTotal,
  baseTotal,
}) => {
  return (
    <div style={{ background: "#0c1829", borderBottom: "1px solid #1e293b", display: "flex", flexDirection: "column", gap: 0 }}>
      {/* メイン行 */}
      <div style={{ padding: "8px 24px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
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
        <span style={{ fontSize: 10, color: SLATE, fontFamily: "monospace" }}>ベースライン:</span>
        <button
          onClick={() => setBaselineMode("standard")}
          style={{
            padding: "4px 14px",
            border: `1px solid ${baselineMode === "standard" ? TEAL : TEAL + "40"}`,
            borderRadius: 20,
            background: baselineMode === "standard" ? TEAL + "18" : "transparent",
            color: baselineMode === "standard" ? TEAL : TEAL + "60",
            fontSize: 10,
            cursor: "pointer",
            fontFamily: "monospace",
          }}
        >
          標準
        </button>
        <button
          onClick={() => setBaselineMode("conservative")}
          style={{
            padding: "4px 14px",
            border: `1px solid ${baselineMode === "conservative" ? AMBER : AMBER + "40"}`,
            borderRadius: 20,
            background: baselineMode === "conservative" ? AMBER + "18" : "transparent",
            color: baselineMode === "conservative" ? AMBER : AMBER + "60",
            fontSize: 10,
            cursor: "pointer",
            fontFamily: "monospace",
          }}
        >
          保守的 (×0.7)
        </button>

        <span style={{ fontSize: 10, color: "#334155", fontFamily: "monospace" }}>│</span>
        <span style={{ fontSize: 10, color: SLATE, fontFamily: "monospace" }}>シナリオ:</span>
        {SCENARIOS.map((s) => (
          <button
            key={s.key}
            onClick={() => setScenario(s.key)}
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

      {/* 楽観シナリオ注釈バー */}
      {scenario === "optimistic" && (
        <div style={{
          padding: "5px 24px",
          background: GRN + "10",
          borderTop: `1px solid ${GRN}20`,
          display: "flex",
          alignItems: "center",
          gap: 8
        }}>
          <span style={{ fontSize: 10, color: GRN, fontFamily: "monospace" }}>⚠ 楽観シナリオ</span>
          <span style={{ fontSize: 10, color: SLATE, fontFamily: "monospace" }}>
            実現確率10〜20%の上限値。SNS拡散・特需・競合撤退など正のイベントが重なった場合の最大推計値として参照してください。通常業務の計画立案には「通常」シナリオを使用してください。
          </span>
        </div>
      )}

      {/* 保守的ベースライン注釈バー */}
      {baselineMode === "conservative" && (
        <div style={{
          padding: "5px 24px",
          background: AMBER + "10",
          borderTop: `1px solid ${AMBER}20`,
          display: "flex",
          alignItems: "center",
          gap: 8
        }}>
          <span style={{ fontSize: 10, color: AMBER, fontFamily: "monospace" }}>📉 保守的ベースライン</span>
          <span style={{ fontSize: 10, color: SLATE, fontFamily: "monospace" }}>
            オーガニック成長を標準の70%と仮定。新興ドメインのSEO権威獲得遅延・競合優位KWでの上位表示困難を想定したリスクシナリオです。
          </span>
        </div>
      )}
    </div>
  );
};

export default ModeBanner;
