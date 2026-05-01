import React, { useState } from "react";
import { TEAL, CYAN, PINK, SLATE, AMBER, GRN, ROSE, VIOLET } from "../utils/colors";
import type { MonthlyReport } from "../types/report";

interface ReportTabProps {
  reports: Record<string, MonthlyReport>;
}

const PRIORITY_COLOR: Record<string, string> = { 高: ROSE, 中: AMBER, 低: CYAN };
const CATEGORY_LABEL: Record<string, string> = {
  ctr: "CTR改善", engagement: "エンゲージメント", conversion: "コンバージョン", content: "コンテンツ"
};

const ReportTab: React.FC<ReportTabProps> = ({ reports }) => {
  const months = Object.keys(reports).sort().reverse();
  const [selectedMonth, setSelectedMonth] = useState(months[0] || "");
  const [expandedSection, setExpandedSection] = useState<string | null>("summary");

  const report = reports[selectedMonth];
  if (!report) {
    return <div style={{ color: SLATE, textAlign: "center", padding: 40 }}>レポートデータがありません</div>;
  }

  const toggleSection = (id: string) => setExpandedSection(expandedSection === id ? null : id);

  const SectionHeader = ({ id, icon, title, subtitle }: { id: string; icon: string; title: string; subtitle?: string }) => (
    <div
      onClick={() => toggleSection(id)}
      style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        cursor: "pointer", padding: "14px 20px",
        background: expandedSection === id ? "rgba(45,212,191,0.05)" : "transparent",
        borderBottom: "1px solid #1e293b", transition: "background 0.2s"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 13 }}>{title}</span>
        {subtitle && <span style={{ color: SLATE, fontSize: 11, fontFamily: "monospace" }}>{subtitle}</span>}
      </div>
      <span style={{ color: SLATE, fontSize: 11 }}>{expandedSection === id ? "▲" : "▼"}</span>
    </div>
  );

  const ChangeIndicator = ({ value, suffix = "%" }: { value: number; suffix?: string }) => {
    const color = value > 0 ? GRN : value < 0 ? ROSE : SLATE;
    const arrow = value > 0 ? "↑" : value < 0 ? "↓" : "→";
    return (
      <span style={{ color, fontSize: 11, fontFamily: "monospace", fontWeight: 700 }}>
        {arrow} {value > 0 ? "+" : ""}{value.toFixed(1)}{suffix}
      </span>
    );
  };

  return (
    <div>
      {/* Month Selector */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
        <select
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          style={{
            background: "#0f172a", color: TEAL, border: `1px solid ${TEAL}40`,
            borderRadius: 6, padding: "8px 14px", fontSize: 14, fontWeight: 700,
            cursor: "pointer", outline: "none"
          }}
        >
          {months.map(m => (
            <option key={m} value={m}>{reports[m].reportMonth} レポート</option>
          ))}
        </select>
        <span style={{ color: SLATE, fontSize: 11, fontFamily: "monospace" }}>
          期間: {report.periodStart} 〜 {report.periodEnd}
        </span>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        {/* 1. Summary */}
        <SectionHeader id="summary" icon="📋" title="サマリー" />
        {expandedSection === "summary" && (
          <div style={{ padding: "16px 20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
              {[
                { label: "総PV", value: report.summary.totalPageviews, change: report.summary.momComparison?.pageviewsChange, color: TEAL },
                { label: "ユーザー", value: report.summary.totalUsers, change: report.summary.momComparison?.usersChange, color: CYAN },
                { label: "キーイベント", value: report.summary.totalKeyEvents, change: report.summary.momComparison?.keyEventsChange, color: AMBER },
                { label: "売上", value: report.summary.totalRevenue, color: PINK, prefix: "¥" },
              ].map(item => (
                <div key={item.label} style={{ background: "#0a1628", borderRadius: 8, padding: "14px 16px", borderLeft: `3px solid ${item.color}` }}>
                  <p style={{ color: SLATE, fontSize: 10, margin: "0 0 6px", fontFamily: "monospace" }}>{item.label}</p>
                  <p style={{ color: item.color, fontSize: 22, fontWeight: 700, margin: "0 0 4px", fontFamily: "monospace" }}>
                    {item.prefix || ""}{item.value.toLocaleString()}
                  </p>
                  {item.change !== undefined && <ChangeIndicator value={item.change} />}
                </div>
              ))}
            </div>
            {report.summary.highlights.map((h, i) => (
              <p key={i} style={{ color: "#cbd5e1", fontSize: 12, margin: "4px 0", paddingLeft: 8, borderLeft: `2px solid ${TEAL}30` }}>{h}</p>
            ))}
          </div>
        )}

        {/* 2. Traffic */}
        <SectionHeader id="traffic" icon="📊" title="トラフィック" subtitle={`JP ${report.traffic.byLanguage.jp.pageviews} / EN ${report.traffic.byLanguage.en.pageviews}`} />
        {expandedSection === "traffic" && (
          <div style={{ padding: "16px 20px" }}>
            <p style={{ color: TEAL, fontSize: 10, fontFamily: "monospace", letterSpacing: "0.08em", marginBottom: 10 }}>ストリーム別PV</p>
            {report.traffic.byStream.map(s => {
              const maxPv = report.traffic.byStream[0]?.pageviews || 1;
              return (
                <div key={s.stream} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ color: SLATE, fontSize: 10, fontFamily: "monospace", minWidth: 140, flexShrink: 0 }}>{s.label}</span>
                  <div style={{ flex: 1, height: 10, background: "#1e293b", borderRadius: 5, overflow: "hidden" }}>
                    <div style={{ width: `${(s.pageviews / maxPv) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${TEAL}, ${CYAN})`, borderRadius: 5, transition: "width 0.3s" }} />
                  </div>
                  <span style={{ color: TEAL, fontSize: 11, fontFamily: "monospace", minWidth: 60, textAlign: "right" }}>{s.pageviews} PV</span>
                  <span style={{ color: SLATE, fontSize: 10, fontFamily: "monospace", minWidth: 50, textAlign: "right" }}>{s.users}人</span>
                </div>
              );
            })}

            <p style={{ color: TEAL, fontSize: 10, fontFamily: "monospace", letterSpacing: "0.08em", margin: "18px 0 10px" }}>Top 10 ページ</p>
            {report.traffic.topPages.map((p, i) => (
              <div key={p.path} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid #0f172a" }}>
                <span style={{ color: "#334155", fontSize: 10, fontFamily: "monospace", minWidth: 20 }}>#{i + 1}</span>
                <span style={{ color: "#e2e8f0", fontSize: 11, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.path}</span>
                <span style={{ color: TEAL, fontSize: 11, fontFamily: "monospace" }}>{p.pageviews} PV</span>
                <span style={{ color: AMBER, fontSize: 10, fontFamily: "monospace" }}>{p.keyEvents} CV</span>
              </div>
            ))}
          </div>
        )}

        {/* 3. Search */}
        <SectionHeader id="search" icon="🔍" title="検索パフォーマンス" subtitle={`G:${report.search.google.totalClicks} / B:${report.search.bing.totalClicks} クリック`} />
        {expandedSection === "search" && (
          <div style={{ padding: "16px 20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              {/* Google */}
              <div style={{ background: "#0a1628", borderRadius: 8, padding: 14, borderLeft: `3px solid ${GRN}` }}>
                <p style={{ color: GRN, fontSize: 12, fontWeight: 700, margin: "0 0 10px" }}>Google Search Console</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div><p style={{ color: SLATE, fontSize: 9, margin: 0 }}>クリック</p><p style={{ color: "#e2e8f0", fontSize: 16, fontWeight: 700, margin: 0, fontFamily: "monospace" }}>{report.search.google.totalClicks}</p></div>
                  <div><p style={{ color: SLATE, fontSize: 9, margin: 0 }}>表示回数</p><p style={{ color: "#e2e8f0", fontSize: 16, fontWeight: 700, margin: 0, fontFamily: "monospace" }}>{report.search.google.totalImpressions.toLocaleString()}</p></div>
                  <div><p style={{ color: SLATE, fontSize: 9, margin: 0 }}>CTR</p><p style={{ color: GRN, fontSize: 14, fontWeight: 700, margin: 0, fontFamily: "monospace" }}>{report.search.google.avgCtr}%</p></div>
                  <div><p style={{ color: SLATE, fontSize: 9, margin: 0 }}>平均順位</p><p style={{ color: AMBER, fontSize: 14, fontWeight: 700, margin: 0, fontFamily: "monospace" }}>{report.search.google.avgPosition}</p></div>
                </div>
              </div>
              {/* Bing */}
              <div style={{ background: "#0a1628", borderRadius: 8, padding: 14, borderLeft: `3px solid ${CYAN}` }}>
                <p style={{ color: CYAN, fontSize: 12, fontWeight: 700, margin: "0 0 10px" }}>Bing Webmaster</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div><p style={{ color: SLATE, fontSize: 9, margin: 0 }}>クリック</p><p style={{ color: "#e2e8f0", fontSize: 16, fontWeight: 700, margin: 0, fontFamily: "monospace" }}>{report.search.bing.totalClicks}</p></div>
                  <div><p style={{ color: SLATE, fontSize: 9, margin: 0 }}>表示回数</p><p style={{ color: "#e2e8f0", fontSize: 16, fontWeight: 700, margin: 0, fontFamily: "monospace" }}>{report.search.bing.totalImpressions.toLocaleString()}</p></div>
                  <div><p style={{ color: SLATE, fontSize: 9, margin: 0 }}>CTR</p><p style={{ color: CYAN, fontSize: 14, fontWeight: 700, margin: 0, fontFamily: "monospace" }}>{report.search.bing.avgCtr}%</p></div>
                  <div><p style={{ color: SLATE, fontSize: 9, margin: 0 }}>平均順位</p><p style={{ color: AMBER, fontSize: 14, fontWeight: 700, margin: 0, fontFamily: "monospace" }}>{report.search.bing.avgPosition}</p></div>
                </div>
              </div>
            </div>

            {/* Search share bar */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ color: SLATE, fontSize: 10, fontFamily: "monospace", marginBottom: 6 }}>検索エンジン比率（クリック数ベース）</p>
              <div style={{ display: "flex", height: 12, borderRadius: 6, overflow: "hidden" }}>
                <div style={{ width: `${report.search.engineComparison.googleShare}%`, background: GRN, transition: "width 0.3s" }} />
                <div style={{ width: `${report.search.engineComparison.bingShare}%`, background: CYAN, transition: "width 0.3s" }} />
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
                <span style={{ fontSize: 10, color: GRN, fontFamily: "monospace" }}>Google {report.search.engineComparison.googleShare}%</span>
                <span style={{ fontSize: 10, color: CYAN, fontFamily: "monospace" }}>Bing {report.search.engineComparison.bingShare}%</span>
              </div>
            </div>

            {/* Zero CTR pages */}
            {report.search.google.zeroCtrPages.length > 0 && (
              <div>
                <p style={{ color: ROSE, fontSize: 10, fontFamily: "monospace", letterSpacing: "0.08em", marginBottom: 8 }}>⚠ 改善機会（表示あり・クリックゼロ）</p>
                {report.search.google.zeroCtrPages.map(p => (
                  <div key={p.url} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: "1px solid #0f172a" }}>
                    <span style={{ color: "#cbd5e1", fontSize: 11, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.url.replace("https://ritotabi.com", "")}
                    </span>
                    <span style={{ color: AMBER, fontSize: 10, fontFamily: "monospace" }}>{p.impressions} imp</span>
                    <span style={{ color: SLATE, fontSize: 10, fontFamily: "monospace" }}>順位 {p.position.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. Engagement */}
        <SectionHeader id="engagement" icon="⏱" title="エンゲージメント" />
        {expandedSection === "engagement" && (
          <div style={{ padding: "16px 20px" }}>
            <p style={{ color: TEAL, fontSize: 10, fontFamily: "monospace", letterSpacing: "0.08em", marginBottom: 10 }}>高エンゲージメント Top 10</p>
            {report.engagement.topEngagedPages.map((p, i) => (
              <div key={p.path} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid #0f172a" }}>
                <span style={{ color: "#334155", fontSize: 10, fontFamily: "monospace", minWidth: 20 }}>#{i + 1}</span>
                <span style={{ color: "#e2e8f0", fontSize: 11, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.path}</span>
                <span style={{ color: TEAL, fontSize: 11, fontFamily: "monospace" }}>{p.avgEngagementTime}s</span>
                <span style={{ color: SLATE, fontSize: 10, fontFamily: "monospace" }}>{p.users}人</span>
              </div>
            ))}

            {report.engagement.keyEventPages.length > 0 && (
              <>
                <p style={{ color: AMBER, fontSize: 10, fontFamily: "monospace", letterSpacing: "0.08em", margin: "18px 0 10px" }}>キーイベント発生ページ</p>
                {report.engagement.keyEventPages.map(p => (
                  <div key={p.path} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid #0f172a" }}>
                    <span style={{ color: "#e2e8f0", fontSize: 11, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.path}</span>
                    <span style={{ color: AMBER, fontSize: 11, fontFamily: "monospace" }}>{p.keyEvents} CV</span>
                    <span style={{ color: TEAL, fontSize: 10, fontFamily: "monospace" }}>率 {p.cvRate}%</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* 5. Conversion */}
        <SectionHeader id="conversion" icon="💰" title="コンバージョン" subtitle={`${report.conversion.totalKeyEvents} CV / ¥${report.conversion.totalRevenue}`} />
        {expandedSection === "conversion" && (
          <div style={{ padding: "16px 20px" }}>
            {report.conversion.hotelCvSummary.pages.length > 0 && (
              <>
                <p style={{ color: PINK, fontSize: 10, fontFamily: "monospace", letterSpacing: "0.08em", marginBottom: 10 }}>ホテルページ CV サマリー（計 {report.conversion.hotelCvSummary.totalKeyEvents} CV）</p>
                {report.conversion.hotelCvSummary.pages.map(p => (
                  <div key={p.path} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid #0f172a" }}>
                    <span style={{ color: "#e2e8f0", fontSize: 11, flex: 1 }}>{p.path}</span>
                    <span style={{ color: PINK, fontSize: 11, fontFamily: "monospace" }}>{p.keyEvents} CV</span>
                    <span style={{ color: TEAL, fontSize: 10, fontFamily: "monospace" }}>率 {p.cvRate}%</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* 6. Forecast Comparison */}
        <SectionHeader id="forecast" icon="📈" title="予実対比" subtitle={`精度 ${report.forecastComparison.overallAccuracy}%`} />
        {expandedSection === "forecast" && (
          <div style={{ padding: "16px 20px" }}>
            <p style={{ color: VIOLET, fontSize: 10, fontFamily: "monospace", marginBottom: 10 }}>
              比較ビンテージ: {report.forecastComparison.vintageId} → 全体精度: {report.forecastComparison.overallAccuracy}%
            </p>
            {report.forecastComparison.byStream.filter(s => s.forecastPv > 0 || s.actualPv > 0).map(s => {
              const maxVal = Math.max(s.forecastPv, s.actualPv) || 1;
              return (
                <div key={s.stream} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ color: SLATE, fontSize: 10, fontFamily: "monospace" }}>{s.label}</span>
                    <span style={{ color: s.actualPv > s.forecastPv ? GRN : ROSE, fontSize: 10, fontFamily: "monospace" }}>
                      {s.accuracy !== null ? `${s.accuracy}%` : "N/A"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 6, background: "#1e293b", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${(s.forecastPv / maxVal) * 100}%`, height: "100%", background: VIOLET + "80", borderRadius: 3 }} />
                      </div>
                      <span style={{ color: VIOLET, fontSize: 9, fontFamily: "monospace" }}>予測 {s.forecastPv}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 6, background: "#1e293b", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${(s.actualPv / maxVal) * 100}%`, height: "100%", background: GRN + "80", borderRadius: 3 }} />
                      </div>
                      <span style={{ color: GRN, fontSize: 9, fontFamily: "monospace" }}>実績 {s.actualPv}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 7. Action Items */}
        <SectionHeader id="actions" icon="🎯" title="アクションアイテム" subtitle={`${report.actionItems.length}件`} />
        {expandedSection === "actions" && (
          <div style={{ padding: "16px 20px" }}>
            {report.actionItems.map((item, i) => (
              <div key={i} style={{ background: "#0a1628", borderRadius: 8, padding: "12px 16px", marginBottom: 8, borderLeft: `3px solid ${PRIORITY_COLOR[item.priority] || SLATE}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{
                    fontSize: 10, color: PRIORITY_COLOR[item.priority],
                    border: `1px solid ${PRIORITY_COLOR[item.priority]}40`,
                    borderRadius: 3, padding: "1px 6px", fontFamily: "monospace"
                  }}>{item.priority}</span>
                  <span style={{ fontSize: 10, color: TEAL, fontFamily: "monospace" }}>{CATEGORY_LABEL[item.category] || item.category}</span>
                </div>
                <p style={{ color: "#cbd5e1", fontSize: 12, margin: "0 0 6px" }}>{item.description}</p>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {item.targetPages.map(p => (
                    <span key={p} style={{ fontSize: 9, color: SLATE, background: "#1e293b", borderRadius: 3, padding: "2px 6px", fontFamily: "monospace" }}>
                      {p.replace("https://ritotabi.com", "")}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportTab;
