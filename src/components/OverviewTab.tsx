import React, { useState } from "react";
import { PINK, TEAL, SLATE, GRN, YELLOW, AMBER } from "../utils/colors";
import type { StreamDef } from "../utils/calc";
import { getPageTypeCvrMultiplier } from "../utils/calc";
import type { PageEvaluation } from "../types/evaluation";
import Tooltip, { HelpIcon } from "./Tooltip";
import { CHECKLIST_LABELS, CHECKLIST_DESCRIPTIONS, GAP_DESCRIPTIONS } from "../utils/checklists";

interface OverviewTabProps {
  streams: StreamDef[];
  sum: Record<string, number>;
  baseSum: Record<string, number>;
  evaluations: Record<string, PageEvaluation>;
  scenario: "pessimistic" | "normal" | "optimistic";
}

const QUALITY_AXES = [
  "コンテンツ独自性",
  "写真・ビジュアル",
  "アフィリエイト設計",
  "内部リンク",
  "SEO技術実装",
  "ユーザー体験(UX)",
  "英語品質",
  "キーワード獲得可能性",
] as const;

type QualityAxis = typeof QUALITY_AXES[number];

const LEVEL_COLOR: Record<string, string> = { 高: "#f43f5e", 中: "#f59e0b", 低: "#06b6d4" };

const OverviewTab: React.FC<OverviewTabProps> = ({ streams, sum, evaluations }) => {
  const V6_STD = 878400;
  const [showGapBreakdown, setShowGapBreakdown] = useState(false);
  const [expandedPageId, setExpandedPageId] = useState<string | null>(null);
  const evalById = Object.fromEntries(Object.values(evaluations).map(ev => [ev.id, ev]));

  const pageGapRows = Object.values(evaluations)
    .filter(ev => ev.quality?.publishedDate)
    .map(ev => {
      const pv24m = ev.pn.reduce((a, v) => a + v, 0);
      const sDef = streams.find(s => s.key === ev.stream);
      const cvr = sDef?.cvr ?? 0;
      const unit = sDef?.unit ?? 0;
      const qualityMul = (ev.quality?.overall ?? 0) / 100;
      const pageTypeMul = getPageTypeCvrMultiplier(ev.quality?.type ?? "");
      const potRev = pv24m * cvr * unit;
      const actRev = pv24m * cvr * unit * qualityMul * pageTypeMul;
      const totalGap = potRev - actRev;

      // 最も改善余地のある軸を特定
      const scores = ev.quality.scores;
      const validAxes = QUALITY_AXES.filter(ax => {
        if (ax === "英語品質" && ev.quality?.lang === "JP") return false;
        return scores[ax] !== null && scores[ax] !== undefined;
      });
      const weakestAxis = validAxes.length > 0
        ? validAxes.reduce((w, ax) => (scores[ax] as number) < (scores[w] as number) ? ax : w)
        : null;
      const weakestScore = weakestAxis ? (scores[weakestAxis] as number) : null;

      return {
        id: ev.id,
        title: ev.quality.title,
        stream: ev.stream,
        streamColor: sDef?.color ?? SLATE,
        type: ev.quality?.type ?? "",
        qualityScore: ev.quality?.overall ?? 0,
        pageTypeMul,
        qualityGap: pv24m * cvr * unit * pageTypeMul * (1 - qualityMul),
        typeGap: pv24m * cvr * unit * (1 - pageTypeMul),
        totalGap,
        weakestAxis,
        weakestScore,
      };
    })
    .sort((a, b) => b.totalGap - a.totalGap);

  const totalQualityGap = pageGapRows.reduce((a, r) => a + r.qualityGap, 0);
  const totalTypeGap    = pageGapRows.reduce((a, r) => a + r.typeGap, 0);
  const totalGapAll     = totalQualityGap + totalTypeGap;

  // 品質軸別 改善ポテンシャル計算
  // overall ≈ avg(非null軸スコア) なので、軸iをスコアsからs'に改善すると overall が (s'-s)/n 増加する
  const axisGaps: Record<QualityAxis, number> = Object.fromEntries(
    QUALITY_AXES.map(ax => [ax, 0])
  ) as Record<QualityAxis, number>;

  Object.values(evaluations)
    .filter(ev => ev.quality?.publishedDate)
    .forEach(ev => {
      const pv24m = ev.pn.reduce((a, v) => a + v, 0);
      const sDef = streams.find(s => s.key === ev.stream);
      const cvr = sDef?.cvr ?? 0;
      const unit = sDef?.unit ?? 0;
      const pageTypeMul = getPageTypeCvrMultiplier(ev.quality?.type ?? "");
      const scores = ev.quality.scores;
      const validAxes = QUALITY_AXES.filter(ax => {
        if (ax === "英語品質" && ev.quality?.lang === "JP") return false;
        return scores[ax] !== null && scores[ax] !== undefined;
      });
      const n = validAxes.length;
      if (n === 0) return;
      validAxes.forEach(ax => {
        const score = scores[ax] as number;
        // この軸を100にすることで overall が (100-score)/n 上がり、収益が増える
        axisGaps[ax] += pv24m * cvr * unit * pageTypeMul * (100 - score) / (100 * n);
      });
    });

  const sortedAxisGaps = QUALITY_AXES
    .map(ax => ({ ax, gap: axisGaps[ax] }))
    .filter(x => x.gap > 0)
    .sort((a, b) => b.gap - a.gap);
  const maxAxisGap = sortedAxisGaps[0]?.gap ?? 1;

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
              <p style={{ color: s.color, fontSize: 11, margin: "0 0 6px", fontWeight: 700 }}>機会損失: ¥{((sum[`pot_${s.key}`] || 0) - streamSum).toLocaleString()}</p>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ fontSize: 10, color: s.color, border: `1px solid ${s.color}40`, borderRadius: 4, padding: "1px 7px", fontFamily: "monospace" }}>CVR {(s.cvr * 100).toFixed(2)}%</span>
                <span style={{ fontSize: 10, color: s.color, border: `1px solid ${s.color}40`, borderRadius: 4, padding: "1px 7px", fontFamily: "monospace" }}>単価 ¥{s.unit.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
        <div style={{ background: "linear-gradient(135deg, rgba(45,212,191, 0.08), rgba(236,72,153, 0.06))", border: `1px solid ${TEAL}40`, borderLeft: `3px solid ${TEAL}`, borderRadius: 8, padding: "12px 16px" }}>
          <p style={{ color: TEAL, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>合計（{streams.length}軸）</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 4 }}>
            <div>
              <p style={{ color: TEAL, fontSize: 22, fontWeight: 700, margin: 0, fontFamily: "monospace" }}>{"¥" + sum.total.toLocaleString()}</p>
              <p style={{ color: "#475569", fontSize: 10, margin: 0 }}>現状の予測収益 (24M)</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ color: YELLOW, fontSize: 16, fontWeight: 700, margin: 0, fontFamily: "monospace" }}>{"¥" + (sum.potTotal || 0).toLocaleString()}</p>
              <p style={{ color: "#475569", fontSize: 10, margin: 0 }}>最大ポテンシャル</p>
            </div>
          </div>
          <p style={{ color: PINK, fontSize: 11, fontWeight: 700, fontFamily: "monospace", margin: "0 0 4px" }}>
            機会損失: -¥{((sum.potTotal || 0) - sum.total).toLocaleString()}
          </p>
          <p style={{ color: GRN, fontSize: 11, fontWeight: 700, fontFamily: "monospace" }}>
            v6比 +¥{(sum.total - V6_STD).toLocaleString()}（+{Math.round(((sum.total - V6_STD) / V6_STD) * 100)}%）
          </p>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ color: PINK, fontSize: 11, fontFamily: "monospace", letterSpacing: "0.12em", margin: 0 }}>
          — 機会損失 内訳
        </h3>
        <button
          onClick={() => setShowGapBreakdown(v => !v)}
          style={{ 
            background: "none", 
            border: `1px solid ${PINK}40`, 
            color: PINK, 
            borderRadius: 4, 
            padding: "4px 12px", 
            cursor: "pointer", 
            fontSize: 10, 
            fontWeight: 700, 
            fontFamily: "monospace",
            display: "flex",
            alignItems: "center",
            gap: 6
          }}
        >
          {showGapBreakdown ? "内訳を隠す ▲" : "内訳を表示 ▼"}
        </button>
      </div>

      {showGapBreakdown && (
        <div style={{ background: "#0a1628", border: `1px solid ${PINK}30`, borderTop: `2px solid ${PINK}`, borderRadius: 8, padding: "16px 20px", marginBottom: 22 }}>


          {/* 原因別バー */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: SLATE, fontSize: 10, fontFamily: "monospace" }}>原因別</span>
              <span style={{ color: SLATE, fontSize: 10, fontFamily: "monospace" }}>合計 -¥{Math.round(totalGapAll).toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", height: 14, borderRadius: 4, overflow: "hidden", background: "#1e293b" }}>
              <div style={{ width: `${totalGapAll > 0 ? (totalQualityGap / totalGapAll * 100) : 0}%`, background: AMBER, transition: "width 0.3s" }} />
              <div style={{ width: `${totalGapAll > 0 ? (totalTypeGap / totalGapAll * 100) : 0}%`, background: TEAL, transition: "width 0.3s" }} />
            </div>
            <div style={{ display: "flex", gap: 24, marginTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: AMBER, flexShrink: 0 }} />
                <span style={{ color: SLATE, fontSize: 10, fontFamily: "monospace" }}>
                  品質スコア不足 -¥{Math.round(totalQualityGap).toLocaleString()} ({totalGapAll > 0 ? Math.round(totalQualityGap / totalGapAll * 100) : 0}%)
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: TEAL, flexShrink: 0 }} />
                <span style={{ color: SLATE, fontSize: 10, fontFamily: "monospace" }}>
                  ページタイプ補正 -¥{Math.round(totalTypeGap).toLocaleString()} ({totalGapAll > 0 ? Math.round(totalTypeGap / totalGapAll * 100) : 0}%)
                </span>
              </div>
            </div>
          </div>

          {/* 品質軸別 改善ポテンシャル */}
          <div style={{ borderTop: "1px solid #1e293b", paddingTop: 14, marginBottom: 18 }}>
            <p style={{ color: AMBER, fontSize: 10, fontFamily: "monospace", letterSpacing: "0.08em", marginBottom: 10 }}>品質スコア軸別 改善ポテンシャル</p>
            {sortedAxisGaps.map(({ ax, gap }) => (
              <div key={ax} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ color: SLATE, fontSize: 10, fontFamily: "monospace", minWidth: 148, flexShrink: 0 }}>{ax}</span>
                <div style={{ flex: 1, height: 8, background: "#1e293b", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${(gap / maxAxisGap) * 100}%`, height: "100%", background: AMBER, borderRadius: 4, transition: "width 0.3s" }} />
                </div>
                <span style={{ color: AMBER, fontSize: 10, fontFamily: "monospace", minWidth: 90, textAlign: "right" }}>-¥{Math.round(gap).toLocaleString()}</span>
              </div>
            ))}
          </div>

          {/* ページ別ランキング */}
          <div style={{ borderTop: "1px solid #1e293b", paddingTop: 12 }}>
            <p style={{ color: SLATE, fontSize: 10, fontFamily: "monospace", marginBottom: 8 }}>ページ別ランキング（機会損失 降順）</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 90px 90px", gap: 8, padding: "4px 0", borderBottom: "1px solid #1e293b", marginBottom: 4 }}>
              <span style={{ color: "#334155", fontSize: 9, fontFamily: "monospace" }}>ページ / 最弱軸</span>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2 }}>
                <span style={{ color: AMBER, fontSize: 9, fontFamily: "monospace" }}>品質ギャップ</span>
                <HelpIcon content={GAP_DESCRIPTIONS.qualityGap} width={210} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2 }}>
                <span style={{ color: TEAL, fontSize: 9, fontFamily: "monospace" }}>タイプ補正</span>
                <HelpIcon content={GAP_DESCRIPTIONS.typeGap} width={210} />
              </div>
              <span style={{ color: PINK, fontSize: 9, fontFamily: "monospace", textAlign: "right" }}>合計Gap</span>
            </div>
            {pageGapRows.map((row, idx) => {
              const isExpanded = expandedPageId === row.id;
              const ev = evalById[row.id];
              return (
                <div key={row.id} style={{ borderBottom: "1px solid #0f172a" }}>
                  {/* ヘッダー行（クリックで展開） */}
                  <div
                    onClick={() => setExpandedPageId(isExpanded ? null : row.id)}
                    style={{ display: "grid", gridTemplateColumns: "1fr 90px 90px 90px", gap: 8, padding: "7px 0", alignItems: "center", cursor: "pointer" }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <span style={{ color: "#334155", fontSize: 9, fontFamily: "monospace", minWidth: 18 }}>#{idx + 1}</span>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: row.streamColor, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {row.title}
                        </span>
                        <span style={{ color: SLATE, fontSize: 9, fontFamily: "monospace", flexShrink: 0 }}>{isExpanded ? "▲" : "▼"}</span>
                      </div>
                      <div style={{ display: "flex", gap: 6, paddingLeft: 24, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 9, color: "#334155", fontFamily: "monospace", border: "1px solid #1e293b", borderRadius: 3, padding: "0 4px" }}>{row.type}</span>
                        <span style={{ fontSize: 9, color: SLATE, fontFamily: "monospace" }}>総合 {row.qualityScore} / ×{row.pageTypeMul.toFixed(1)}</span>
                        {row.weakestAxis && (
                          <span style={{ fontSize: 9, color: AMBER, fontFamily: "monospace" }}>
                            最弱: {row.weakestAxis} {row.weakestScore}
                          </span>
                        )}
                      </div>
                    </div>
                    <span style={{ color: AMBER, fontSize: 11, fontFamily: "monospace", textAlign: "right" }}>-¥{Math.round(row.qualityGap).toLocaleString()}</span>
                    <span style={{ color: TEAL, fontSize: 11, fontFamily: "monospace", textAlign: "right" }}>-¥{Math.round(row.typeGap).toLocaleString()}</span>
                    <span style={{ color: PINK, fontSize: 11, fontFamily: "monospace", fontWeight: 700, textAlign: "right" }}>-¥{Math.round(row.totalGap).toLocaleString()}</span>
                  </div>

                  {/* 展開: 改善点 + 失敗チェックリスト */}
                  {isExpanded && ev && (
                    <div style={{ background: "#080f1a", borderRadius: 6, padding: "12px 16px", marginBottom: 6, marginLeft: 24 }}>

                      {/* 改善点 (issues) */}
                      {ev.quality.issues && ev.quality.issues.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <p style={{ color: SLATE, fontSize: 9, fontFamily: "monospace", letterSpacing: "0.08em", marginBottom: 6 }}>改善点</p>
                          {[...ev.quality.issues]
                            .sort((a, b) => ({ 高: 0, 中: 1, 低: 2 }[a.level] ?? 3) - ({ 高: 0, 中: 1, 低: 2 }[b.level] ?? 3))
                            .map((issue, i) => (
                              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5, alignItems: "flex-start" }}>
                                <span style={{
                                  fontSize: 9, color: LEVEL_COLOR[issue.level] ?? SLATE,
                                  border: `1px solid ${LEVEL_COLOR[issue.level] ?? SLATE}50`,
                                  borderRadius: 3, padding: "1px 5px", fontFamily: "monospace",
                                  flexShrink: 0, marginTop: 1
                                }}>{issue.level}</span>
                                <span style={{ fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>
                                  {issue.isSpeculation && <span style={{ color: "#f43f5e", fontWeight: 700, marginRight: 4 }}>[推測]</span>}
                                  {issue.text}
                                </span>
                              </div>
                            ))}
                        </div>
                      )}

                      {/* 失敗チェックリスト */}
                      {(() => {
                        const aff = ev.quality.affiliateChecklist as Record<string, unknown> | undefined;
                        const seo = ev.quality.seoChecklist as Record<string, unknown> | undefined;
                        const failedAff = aff ? Object.entries(aff).filter(([, v]) => v === false) : [];
                        const failedSeo = seo ? Object.entries(seo).filter(([, v]) => v === false) : [];
                        if (failedAff.length === 0 && failedSeo.length === 0) return null;
                        return (
                          <div>
                            <p style={{ color: SLATE, fontSize: 9, fontFamily: "monospace", letterSpacing: "0.08em", marginBottom: 6 }}>チェックリスト未達（×）</p>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              {[...failedAff, ...failedSeo].map(([k]) => (
                                <Tooltip key={k} content={CHECKLIST_DESCRIPTIONS[k] ?? ""}>
                                  <span style={{ fontSize: 10, color: "#f43f5e", border: "1px solid #f43f5e40", borderRadius: 4, padding: "1px 8px", fontFamily: "monospace", cursor: "help" }}>
                                    × {CHECKLIST_LABELS[k] ?? k}
                                  </span>
                                </Tooltip>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

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
