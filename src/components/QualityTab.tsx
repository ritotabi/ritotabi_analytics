import React, { useState } from "react";
import type { PageEvaluation } from "../types/evaluation";
import { SLATE, scoreColor, TEAL, AMBER, ROSE, CYAN, GRN, VIOLET, ORANGE, PINK } from "../utils/colors";
import OverallGauge from "./OverallGauge";
import ScoreBar from "./ScoreBar";
import { HelpIcon } from "./Tooltip";
import { CHECKLIST_LABELS, CHECKLIST_DESCRIPTIONS, GAP_DESCRIPTIONS } from "../utils/checklists";
import { getPageTypeCvrMultiplier } from "../utils/calc";

interface StreamDef {
  key: string;
  label: string;
  color: string;
  cvr: number;
  unit: number;
}

interface QualityTabProps {
  evaluations: PageEvaluation[];
  streams: StreamDef[];
  scenario: "pessimistic" | "normal" | "optimistic";
}

const AXES = ["コンテンツ独自性", "写真・ビジュアル", "アフィリエイト設計", "内部リンク", "SEO技術実装", "ユーザー体験(UX)", "英語品質", "キーワード獲得可能性"] as const;

const QualityTab: React.FC<QualityTabProps> = ({ evaluations, streams, scenario }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const avg = Math.round(evaluations.reduce((s, p) => s + p.quality.overall, 0) / evaluations.length) || 0;
  const hi = evaluations.reduce((s, p) => s + (p.quality.issues?.filter(i => i.level === "高").length || 0), 0);

  const selected = evaluations.find((e) => e.id === selectedId);

  if (selected) {
    return (
      <div>
        <button
          onClick={() => setSelectedId(null)}
          style={{
            background: "transparent",
            border: "1px solid #1e293b",
            borderRadius: 6,
            color: SLATE,
            fontSize: 12,
            padding: "6px 14px",
            cursor: "pointer",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 6
          }}
        >
          ← 一覧に戻る
        </button>
        <QualityDetail evaluation={selected} streams={streams} scenario={scenario} />
      </div>
    );
  }

  return (
    <div>
      {/* 統計サマリー */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 32 }}>
        {[
          { label: "平均スコア", val: avg + "点", c: TEAL },
          { label: "評価ページ数", val: evaluations.length + " P", c: CYAN },
          { label: "高優先度 Issues", val: hi + " 件", c: ROSE }
        ].map(s => (
          <div key={s.label} style={{ background: "#0f172a", border: `1px solid ${s.c}25`, borderRadius: 10, padding: "14px 18px", textAlign: "center" }}>
            <p style={{ color: SLATE, fontSize: 11, margin: "0 0 6px" }}>{s.label}</p>
            <p style={{ color: s.c, fontWeight: 700, fontSize: 22, margin: 0, fontFamily: "monospace" }}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* エリアごとのグループ表示 */}
      {streams.map((stream) => {
        const streamEvals = evaluations
          .filter(ev => ev.stream === stream.key)
          .sort((a, b) => b.quality.overall - a.quality.overall);

        if (streamEvals.length === 0) return null;

        return (
          <div key={stream.key} style={{ marginBottom: 40 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
              borderBottom: "1px solid #1e293b",
              paddingBottom: 8
            }}>
              <div style={{ width: 4, height: 18, background: stream.color, borderRadius: 2 }}></div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#f8fafc" }}>{stream.label}</h3>
              <span style={{ fontSize: 11, color: SLATE, background: "#1e293b", padding: "1px 8px", borderRadius: 10 }}>{streamEvals.length}</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(440px, 1fr))", gap: 10 }}>
              {streamEvals.map((ev) => {
                const q = ev.quality;
                const pc = scoreColor(q.overall);
                const issueH = q.issues?.filter(i => i.level === "高").length || 0;

                const publishedDate = q.publishedDate;
                let daysSince: number | null = null;
                if (publishedDate) {
                  const d = new Date(publishedDate);
                  const today = new Date();
                  daysSince = Math.floor((today.getTime() - d.getTime()) / (86400000));
                }

                return (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedId(ev.id)}
                    style={{
                      background: "#0f172a",
                      border: `1px solid ${pc}25`,
                      borderTop: `3px solid ${pc}`,
                      borderRadius: 10,
                      padding: "14px 16px",
                      cursor: "pointer",
                      transition: "border-color 0.25s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = pc}
                    onMouseLeave={e => e.currentTarget.style.borderColor = pc + "25"}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                      <OverallGauge score={q.overall} color={pc} size={72} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 10, color: pc, border: `1px solid ${pc}40`, borderRadius: 4, padding: "1px 7px", fontFamily: "monospace" }}>{q.lang}</span>
                          <span style={{ fontSize: 10, color: SLATE, border: "1px solid #1e293b", borderRadius: 4, padding: "1px 7px", fontFamily: "monospace" }}>{q.type}</span>
                          <span style={{ fontSize: 10, color: SLATE, border: "1px solid #1e293b", borderRadius: 4, padding: "1px 7px", fontFamily: "monospace" }}>評価：{ev.evaluatedAt}</span>
                          {issueH > 0 && <span style={{ fontSize: 10, color: ROSE, border: `1px solid ${ROSE}40`, borderRadius: 4, padding: "1px 7px", fontFamily: "monospace" }}>要対応×{issueH}</span>}
                          {daysSince !== null && (
                            <span style={{
                              fontSize: 10,
                              color: (daysSince ?? 0) < 30 ? ROSE : (daysSince ?? 0) < 90 ? AMBER : (daysSince ?? 0) < 180 ? CYAN : GRN,
                              border: `1px solid ${( (daysSince ?? 0) < 30 ? ROSE : (daysSince ?? 0) < 90 ? AMBER : (daysSince ?? 0) < 180 ? CYAN : GRN)}40`,
                              borderRadius: 4, padding: "1px 7px", fontFamily: "monospace"
                            }}>
                              公開{daysSince}日
                            </span>
                          )}
                        </div>
                        <p style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 13, margin: "0 0 3px", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {q.title}
                        </p>
                        <p style={{ color: "#334155", fontFamily: "monospace", fontSize: 10, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {ev.url}
                        </p>
                      </div>
                    </div>

                    {/* サブスコア・グリッド (Axis Scores) */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 16px" }}>
                      {AXES.map((ax) => {
                        const v = q.scores[ax as keyof typeof q.scores];
                        if (v === null || v === undefined) return null;
                        if (ax === "英語品質" && q.lang === "JP") return null;
                        const c = scoreColor(v);
                        return (
                          <div key={ax} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 0" }}>
                            <span style={{ fontSize: 10, color: "#475569", maxWidth: 110, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ax}</span>
                            <span style={{ fontSize: 11, color: c, fontFamily: "monospace", fontWeight: 700, minWidth: 24, textAlign: "right" }}>{v}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* 下部ステータス */}
                    <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid #1e293b", display: "flex", gap: 8, alignItems: "center" }}>
                      {[["高", ROSE], ["中", AMBER], ["低", CYAN]].map(([lv, color]) => {
                        const cnt = q.issues?.filter(i => i.level === lv).length || 0;
                        if (!cnt) return null;
                        return <span key={lv} style={{ fontSize: 10, color: color, fontFamily: "monospace" }}>{lv}: {cnt}件</span>;
                      })}
                      <span style={{ fontSize: 10, color: "#334155", marginLeft: "auto" }}>詳細を見る →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface QualityDetailProps {
  evaluation: PageEvaluation;
  streams: StreamDef[];
  scenario: "pessimistic" | "normal" | "optimistic";
}

const QualityDetail: React.FC<QualityDetailProps> = ({ evaluation, streams, scenario }) => {
  const q = evaluation.quality;
  const pc = scoreColor(q.overall);

  const publishedDate = q.publishedDate;
  let daysSince: number | null = null;
  if (publishedDate) {
    const d = new Date(publishedDate);
    const today = new Date();
    daysSince = Math.floor((today.getTime() - d.getTime()) / (86400000));
  }

  // 機会損失計算
  const sDef = streams.find(s => s.key === evaluation.stream);
  const scArr = evaluation.scenarios?.[scenario] || [];
  const pv24m = scArr.reduce((a, v) => a + v, 0);
  const cvr = sDef?.cvr ?? 0;
  const unit = sDef?.unit ?? 0;
  const qualityMul = (q.overall ?? 0) / 100;
  const pageTypeMul = getPageTypeCvrMultiplier(q.type ?? "");
  const qualityGap = pv24m * cvr * unit * pageTypeMul * (1 - qualityMul);
  const typeGap = pv24m * cvr * unit * (1 - pageTypeMul);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
        <OverallGauge score={q.overall} color={pc} size={72} />
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: pc, border: `1px solid ${pc}40`, borderRadius: 4, padding: "1px 7px", fontFamily: "monospace" }}>{q.lang}</span>
            <span style={{ fontSize: 10, color: SLATE, border: "1px solid #1e293b", borderRadius: 4, padding: "1px 7px", fontFamily: "monospace" }}>{q.type}</span>
            <span style={{ fontSize: 10, color: SLATE, border: "1px solid #1e293b", borderRadius: 4, padding: "1px 7px", fontFamily: "monospace" }}>評価：{evaluation.evaluatedAt}</span>
            {daysSince !== null && (
              <span style={{
                fontSize: 10,
                color: daysSince < 30 ? ROSE : daysSince < 90 ? AMBER : daysSince < 180 ? CYAN : GRN,
                border: `1px solid ${(daysSince < 30 ? ROSE : daysSince < 90 ? AMBER : daysSince < 180 ? CYAN : GRN)}40`,
                borderRadius: 4, padding: "1px 7px", fontFamily: "monospace"
              }}>
                公開{daysSince}日（{q.publishedDate}）
              </span>
            )}
            {q.competitorBenchmark && (
              <span style={{
                fontSize: 10,
                color: q.competitorBenchmark === "above" ? GRN : q.competitorBenchmark === "equal" ? AMBER : ROSE,
                border: `1px solid ${(q.competitorBenchmark === "above" ? GRN : q.competitorBenchmark === "equal" ? AMBER : ROSE)}40`,
                borderRadius: 4, padding: "1px 7px", fontFamily: "monospace"
              }}>
                競合比: {q.competitorBenchmark === "above" ? "上回る" : q.competitorBenchmark === "equal" ? "同水準" : "下回る"}
              </span>
            )}
          </div>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 4px" }}>{q.title}</h2>
          <p style={{ color: "#334155", fontFamily: "monospace", fontSize: 11, margin: 0 }}>{evaluation.url}</p>
        </div>
      </div>

      {/* 機会損失インパクトカード */}
      {(qualityGap > 0 || typeGap > 0) && (
        <div style={{
          background: "linear-gradient(135deg, rgba(236,72,153,0.07), rgba(45,212,191,0.04))",
          border: "1px solid #ec489928",
          borderLeft: "3px solid #ec4899",
          borderRadius: 10,
          padding: "12px 18px",
          marginBottom: 18,
          display: "flex",
          gap: 28,
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 3 }}>
              <p style={{ color: SLATE, fontSize: 9, fontFamily: "monospace", margin: 0 }}>24M 品質改善ポテンシャル (回収可能)</p>
              <HelpIcon content={GAP_DESCRIPTIONS.qualityGap} width={220} />
            </div>
            <p style={{ color: PINK, fontSize: 20, fontWeight: 700, fontFamily: "monospace", margin: 0 }}>-¥{Math.round(qualityGap).toLocaleString()}</p>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 3 }}>
              <p style={{ color: SLATE, fontSize: 9, fontFamily: "monospace", margin: 0 }}>構造的減衰 (ページタイプ補正)</p>
              <HelpIcon content={GAP_DESCRIPTIONS.typeGap} width={220} />
            </div>
            <p style={{ color: TEAL, fontSize: 16, fontWeight: 700, fontFamily: "monospace", margin: 0 }}>-¥{Math.round(typeGap).toLocaleString()}</p>
          </div>
        </div>
      )}

      <div style={{ background: "#0f172a", border: `1px solid ${pc}25`, borderRadius: 10, padding: "16px 20px", marginBottom: 18 }}>
        {AXES.map((ax) => {
          if (ax === "英語品質" && q.lang === "JP") return null;
          return <ScoreBar key={ax} label={ax} value={q.scores[ax as keyof typeof q.scores] ?? null} />;
        })}
      </div>

      <h3 style={{ color: GRN, fontSize: 11, fontFamily: "monospace", letterSpacing: "0.12em", marginBottom: 12 }}>✓ 強み（{q.strengths?.length || 0}件）</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 20 }}>
        {q.strengths?.map((s, i) => (
          <div key={i} style={{ background: "rgba(74,222,128,0.04)", border: `1px solid ${GRN}20`, borderLeft: `3px solid ${GRN}`, borderRadius: 8, padding: "10px 16px", display: "flex", gap: 10 }}>
            <span style={{ color: GRN, fontSize: 12, flexShrink: 0 }}>✓</span>
            <p style={{ color: "#94a3b8", fontSize: 12.5, lineHeight: 1.75, margin: 0 }}>{s}</p>
          </div>
        ))}
      </div>

      <h3 style={{ color: AMBER, fontSize: 11, fontFamily: "monospace", letterSpacing: "0.12em", marginBottom: 12 }}>⚠ 改善点（{q.issues?.length || 0}件）</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 24 }}>
        {q.issues?.map((issue, i) => {
          const color = (issue.level === "高" ? ROSE : issue.level === "中" ? AMBER : CYAN);
          return (
            <div key={i} style={{ background: "#0f172a", border: `1px solid ${color}25`, borderLeft: `3px solid ${color}`, borderRadius: 8, padding: "10px 16px", display: "flex", gap: 10 }}>
              <span style={{ fontSize: 10, color: color, border: `1px solid ${color}40`, borderRadius: 4, padding: "1px 8px", fontFamily: "monospace", flexShrink: 0, marginTop: 2 }}>{issue.level}</span>
              <p style={{ color: "#64748b", fontSize: 12.5, lineHeight: 1.75, margin: 0 }}>
                {issue.isSpeculation && <span style={{ color: ROSE, fontWeight: 700, marginRight: 6 }}>[⚠ 推測]</span>}
                {issue.text}
              </p>
            </div>
          );
        })}
      </div>

      {/* 追加チェックリスト */}
      {(q.seoChecklist || q.affiliateChecklist || q.brandChecklist || q.categoryChecklist || q.techChecklist) && (
        <div style={{ borderTop: "1px solid #1e293b", paddingTop: 24, marginTop: 24 }}>
          <h3 style={{ color: SLATE, fontSize: 11, fontFamily: "monospace", letterSpacing: "0.12em", marginBottom: 16 }}>— 分析詳細（チェックリスト）</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

            {q.seoChecklist && (
              <div style={{ background: "#080f1a", padding: 16, borderRadius: 10, border: "1px solid #1e293b50" }}>
                <h4 style={{ fontSize: 11, color: SLATE, marginBottom: 12, textTransform: "uppercase" }}>SEOチェック状況</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
                  {Object.entries(q.seoChecklist).map(([key, val]) => (
                    <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10.5 }}>
                      <span style={{ color: val ? GRN : ROSE, flexShrink: 0 }}>{val ? "✓" : "×"}</span>
                      <span style={{ color: val ? "#e2e8f0" : SLATE }}>{CHECKLIST_LABELS[key] ?? key}</span>
                      {CHECKLIST_DESCRIPTIONS[key] && <HelpIcon content={CHECKLIST_DESCRIPTIONS[key]} />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {q.affiliateChecklist && (
              <div style={{ background: "#080f1a", padding: 16, borderRadius: 10, border: "1px solid #1e293b50" }}>
                <h4 style={{ fontSize: 11, color: SLATE, marginBottom: 12, textTransform: "uppercase" }}>アフィリエイト設計</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
                  {Object.entries(q.affiliateChecklist).map(([key, val]) => (
                    <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10.5 }}>
                      {typeof val === "boolean" ? (
                        <>
                          <span style={{ color: val ? GRN : ROSE, flexShrink: 0 }}>{val ? "✓" : "×"}</span>
                          <span style={{ color: val ? "#e2e8f0" : SLATE }}>{CHECKLIST_LABELS[key] ?? key}</span>
                          {CHECKLIST_DESCRIPTIONS[key] && <HelpIcon content={CHECKLIST_DESCRIPTIONS[key]} />}
                        </>
                      ) : (
                        <>
                          <span style={{ color: AMBER, flexShrink: 0 }}>■</span>
                          <span style={{ color: "#e2e8f0" }}>{CHECKLIST_LABELS[key] ?? key}: {val}</span>
                          {CHECKLIST_DESCRIPTIONS[key] && <HelpIcon content={CHECKLIST_DESCRIPTIONS[key]} />}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {q.brandChecklist && (
              <div style={{ background: "#080f1a", padding: 16, borderRadius: 10, border: `1px solid ${VIOLET}30` }}>
                <h4 style={{ fontSize: 11, color: VIOLET, marginBottom: 12, textTransform: "uppercase" }}>ブランド品質</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px" }}>
                  {Object.entries(q.brandChecklist).map(([key, val]) => {
                    if (val === null) return null;
                    return (
                      <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10.5 }}>
                        <span style={{ color: val ? GRN : ROSE, flexShrink: 0 }}>{val ? "✓" : "×"}</span>
                        <span style={{ color: val ? "#e2e8f0" : SLATE }}>{CHECKLIST_LABELS[key] ?? key}</span>
                        {CHECKLIST_DESCRIPTIONS[key] && <HelpIcon content={CHECKLIST_DESCRIPTIONS[key]} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {q.categoryChecklist && (
              <div style={{ background: "#080f1a", padding: 16, borderRadius: 10, border: `1px solid ${ORANGE}30` }}>
                <h4 style={{ fontSize: 11, color: ORANGE, marginBottom: 12, textTransform: "uppercase" }}>カテゴリ固有チェック</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px" }}>
                  {Object.entries(q.categoryChecklist).map(([key, val]) => {
                    if (val === null || typeof val === "object") return null;
                    return (
                      <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10.5 }}>
                        <span style={{ color: val ? GRN : ROSE, flexShrink: 0 }}>{val ? "✓" : "×"}</span>
                        <span style={{ color: val ? "#e2e8f0" : SLATE }}>{CHECKLIST_LABELS[key] ?? key}</span>
                        {CHECKLIST_DESCRIPTIONS[key] && <HelpIcon content={CHECKLIST_DESCRIPTIONS[key]} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {q.techChecklist && (
              <div style={{ background: "#080f1a", padding: 16, borderRadius: 10, border: "1px solid #1e293b50" }}>
                <h4 style={{ fontSize: 11, color: SLATE, marginBottom: 12, textTransform: "uppercase" }}>技術実装</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px" }}>
                  {Object.entries(q.techChecklist).map(([key, val]) => (
                    <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10.5 }}>
                      <span style={{ color: val ? GRN : ROSE, flexShrink: 0 }}>{val ? "✓" : "×"}</span>
                      <span style={{ color: val ? "#e2e8f0" : SLATE }}>{CHECKLIST_LABELS[key] ?? key}</span>
                      {CHECKLIST_DESCRIPTIONS[key] && <HelpIcon content={CHECKLIST_DESCRIPTIONS[key]} />}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default QualityTab;
