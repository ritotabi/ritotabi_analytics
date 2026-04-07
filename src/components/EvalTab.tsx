import React from "react";
import { CYAN, SLATE, PINK } from "../utils/colors";

interface EvalTabProps {
  lastUpdated: string;
  evalCount: number;
}

const EvalTab: React.FC<EvalTabProps> = ({ lastUpdated, evalCount }) => {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px 0" }}>
      <div className="card" style={{ padding: "40px", textAlign: "center", background: "radial-gradient(circle at center, #0c1829, #080f1a)" }}>
        <div style={{ fontSize: 40, marginBottom: 20 }}>🔍</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 16px", color: CYAN }}>ページ評価の実行</h2>
        <p style={{ color: SLATE, fontSize: 14, lineHeight: 1.6, marginBottom: 30 }}>
          新しいページの評価や既存ページの更新は、<br />
          Antigravityの <span style={{ color: PINK, fontWeight: 700 }}>page_evaluator</span> スキルを使用して実行します。
        </p>

        <div style={{ background: "#080f1a", border: "1px solid #1e293b", borderRadius: 8, padding: "20px", textAlign: "left", marginBottom: 30 }}>
          <p style={{ fontSize: 12, color: SLATE, marginBottom: 10, fontFamily: "monospace" }}>実行例:</p>
          <code style={{ color: "#e2e8f0", fontSize: 13, background: "#1e293b", padding: "8px 12px", borderRadius: 4, display: "block" }}>
            https://ritotabi.com/destinations/con-dao-island/ を評価して。<br />
            公開日は2026-03-22。
          </code>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 30, color: SLATE, fontSize: 12 }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 10, textTransform: "uppercase" }}>蓄積済み</p>
            <p style={{ margin: 0, color: CYAN, fontSize: 18, fontWeight: 700 }}>{evalCount} ページ</p>
          </div>
          <div style={{ width: 1, background: "#1e293b" }} />
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 10, textTransform: "uppercase" }}>最終更新</p>
            <p style={{ margin: 0, color: "#e2e8f0", fontSize: 18, fontWeight: 700 }}>{lastUpdated}</p>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 40 }}>
        <h3 style={{ color: SLATE, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>評価済みページ一覧</h3>
        {/* QualityTab will handle the list, but we could add a summary here if needed */}
        <p style={{ color: "#475569", fontSize: 12 }}>
          「品質評価」タブで詳細な分析レポートを確認できます。
        </p>
      </div>
    </div>
  );
};

export default EvalTab;
