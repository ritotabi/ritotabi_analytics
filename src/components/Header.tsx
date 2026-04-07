import React from "react";
import { PINK, GRN } from "../utils/colors";

interface HeaderProps {
  streamCount: number;
  evalCount: number;
}

const Header: React.FC<HeaderProps> = ({ streamCount, evalCount }) => {
  return (
    <div style={{ background: "linear-gradient(135deg, #080f1a, #0c1829)", borderBottom: "1px solid #1e293b", padding: "22px 24px 16px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, right: 0, width: 400, height: 180, background: "radial-gradient(ellipse at top right, rgba(236,72,153, 0.08), rgba(45,212,191, 0.05) 50%, transparent 70%)", pointerEvents: "none" }} />
      <p style={{ color: PINK, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 5, fontFamily: "monospace" }}>RitoTabi — Revenue Forecast · Dynamic Stream Edition</p>
      <h1 style={{ fontSize: 19, fontWeight: 700, margin: "0 0 4px" }}>離島アフィリエイト 収益予測ダッシュボード</h1>
      <p style={{ color: "#64748b", fontSize: 12, margin: "0 0 6px" }}>{streamCount}収益ストリーム ／ 24ヶ月予測 ／ 品質評価 {evalCount}ページ</p>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 10, fontFamily: "monospace", color: GRN, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: GRN, display: "inline-block" }} />
          データ読み込み完了（evaluations/*.json）
        </span>
      </div>
    </div>
  );
};

export default Header;
