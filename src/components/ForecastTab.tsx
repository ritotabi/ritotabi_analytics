import React, { useState } from "react";
import { TEAL, CYAN, PINK, SLATE, AMBER, GRN, VIOLET, ROSE } from "../utils/colors";
import type { ForecastHistory } from "../types/forecast";
import type { BasePVRow } from "../utils/calc";

interface ForecastTabProps {
  forecastHistory: ForecastHistory;
  actuals: BasePVRow[];
}

const VINTAGE_COLORS = [VIOLET, CYAN, PINK, AMBER, TEAL];

const ForecastTab: React.FC<ForecastTabProps> = ({ forecastHistory, actuals }) => {
  const allStreams = new Set<string>();
  forecastHistory.vintages.forEach(v => v.forecasts.forEach(f => Object.keys(f.pv).forEach(k => allStreams.add(k))));
  actuals.forEach(a => Object.keys(a.pv).forEach(k => allStreams.add(k)));

  const streamList = Array.from(allStreams).sort();
  const [selectedStream, setSelectedStream] = useState<string | null>(null); // null = 全体
  const [enabledVintages, setEnabledVintages] = useState<Set<string>>(
    new Set(forecastHistory.vintages.map(v => v.id))
  );

  const toggleVintage = (id: string) => {
    const next = new Set(enabledVintages);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setEnabledVintages(next);
  };

  // Collect all months across vintages and actuals
  const allMonths = new Map<string, { actual?: number; forecasts: Record<string, number> }>();

  // Add actuals
  actuals.forEach(row => {
    const val = selectedStream ? (row.pv[selectedStream] || 0) : Object.values(row.pv).reduce((a, v) => a + v, 0);
    allMonths.set(row.m, { actual: val, forecasts: {} });
  });

  // Add forecasts
  forecastHistory.vintages.forEach(v => {
    if (!enabledVintages.has(v.id)) return;
    v.forecasts.forEach(f => {
      if (!allMonths.has(f.m)) allMonths.set(f.m, { forecasts: {} });
      const entry = allMonths.get(f.m)!;
      const val = selectedStream ? (f.pv[selectedStream] || 0) : Object.values(f.pv).reduce((a, v) => a + v, 0);
      entry.forecasts[v.id] = val;
    });
  });

  // Sort months chronologically
  const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const sortedMonths = Array.from(allMonths.entries()).sort((a, b) => {
    const [aName, aYear] = a[0].split("'");
    const [bName, bYear] = b[0].split("'");
    const aIdx = parseInt(aYear) * 12 + monthOrder.indexOf(aName);
    const bIdx = parseInt(bYear) * 12 + monthOrder.indexOf(bName);
    return aIdx - bIdx;
  });

  // Find max value for scaling
  let maxVal = 1;
  sortedMonths.forEach(([, data]) => {
    if (data.actual && data.actual > maxVal) maxVal = data.actual;
    Object.values(data.forecasts).forEach(v => { if (v > maxVal) maxVal = v; });
  });

  // Calibration details for current vintage
  const currentVintage = forecastHistory.vintages.find(v => v.id === forecastHistory.currentVintageId);

  // Stream labels
  const streamLabels: Record<string, string> = {
    jp_ishigaki: "石垣島 JP", en_ishigaki: "石垣島 EN",
    jp_miyako: "宮古島 JP", en_miyako: "宮古島 EN",
    jp_yoron: "与論島 JP", jp_kume: "久米島 JP",
    jp_aka: "阿嘉島 JP", jp_amami: "奄美大島 JP", en_amami: "奄美大島 EN",
    cjp: "コンダオ JP", cen: "コンダオ EN",
    hjp: "ホイアン JP", hen: "ホイアン EN",
    jp_other: "その他 JP", en_other: "その他 EN"
  };

  return (
    <div>
      {/* Controls */}
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 18, flexWrap: "wrap" }}>
        <select
          value={selectedStream || ""}
          onChange={e => setSelectedStream(e.target.value || null)}
          style={{
            background: "#0f172a", color: TEAL, border: `1px solid ${TEAL}40`,
            borderRadius: 6, padding: "8px 14px", fontSize: 12, fontWeight: 700,
            cursor: "pointer", outline: "none"
          }}
        >
          <option value="">全ストリーム合計</option>
          {streamList.map(s => (
            <option key={s} value={s}>{streamLabels[s] || s}</option>
          ))}
        </select>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {forecastHistory.vintages.map((v, i) => (
            <button
              key={v.id}
              onClick={() => toggleVintage(v.id)}
              style={{
                background: enabledVintages.has(v.id) ? `${VINTAGE_COLORS[i % VINTAGE_COLORS.length]}20` : "transparent",
                border: `1px solid ${VINTAGE_COLORS[i % VINTAGE_COLORS.length]}${enabledVintages.has(v.id) ? '60' : '30'}`,
                color: enabledVintages.has(v.id) ? VINTAGE_COLORS[i % VINTAGE_COLORS.length] : SLATE,
                borderRadius: 4, padding: "4px 10px", cursor: "pointer",
                fontSize: 10, fontFamily: "monospace", fontWeight: 700,
                transition: "all 0.2s"
              }}
            >
              {enabledVintages.has(v.id) ? "✓ " : ""}{v.label}
            </button>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 8 }}>
            <div style={{ width: 12, height: 4, background: GRN, borderRadius: 2 }} />
            <span style={{ fontSize: 10, color: GRN, fontFamily: "monospace" }}>実績</span>
          </div>
        </div>
      </div>

      {/* Chart Area - Bar Chart */}
      <div className="card" style={{ padding: "20px", marginBottom: 20 }}>
        <p style={{ color: TEAL, fontSize: 10, fontFamily: "monospace", letterSpacing: "0.08em", marginBottom: 16 }}>
          予測 vs 実績 推移 {selectedStream ? `— ${streamLabels[selectedStream] || selectedStream}` : "— 全体"}
        </p>
        <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 240, paddingBottom: 30, position: "relative" }}>
          {sortedMonths.map(([month, data]) => {
            const barWidth = Math.max(20, Math.floor(800 / sortedMonths.length) - 4);
            const vintageEntries = Object.entries(data.forecasts);
            const subBarWidth = Math.max(4, Math.floor((barWidth - (data.actual ? 6 : 0)) / Math.max(vintageEntries.length, 1)));

            return (
              <div key={month} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 1, alignItems: "flex-end", height: 210 }}>
                  {/* Vintage forecast bars */}
                  {vintageEntries.map(([vid, val]) => {
                    const vIdx = forecastHistory.vintages.findIndex(v => v.id === vid);
                    const height = Math.max(1, (val / maxVal) * 200);
                    return (
                      <div
                        key={vid}
                        title={`${forecastHistory.vintages[vIdx]?.label}: ${val}`}
                        style={{
                          width: subBarWidth,
                          height,
                          background: VINTAGE_COLORS[vIdx % VINTAGE_COLORS.length] + "60",
                          borderRadius: "2px 2px 0 0",
                          transition: "height 0.3s"
                        }}
                      />
                    );
                  })}
                  {/* Actual bar */}
                  {data.actual !== undefined && (
                    <div
                      title={`実績: ${data.actual}`}
                      style={{
                        width: subBarWidth + 2,
                        height: Math.max(1, (data.actual / maxVal) * 200),
                        background: GRN,
                        borderRadius: "2px 2px 0 0",
                        transition: "height 0.3s",
                        border: `1px solid ${GRN}`
                      }}
                    />
                  )}
                </div>
                <span style={{
                  color: SLATE, fontSize: 8, fontFamily: "monospace", marginTop: 4,
                  writingMode: "vertical-rl", textOrientation: "mixed", height: 30
                }}>
                  {month}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Calibration Details */}
      {currentVintage?.calibration && (
        <div className="card" style={{ padding: "20px", marginBottom: 20 }}>
          <p style={{ color: VIOLET, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>
            📐 キャリブレーション詳細 — {currentVintage.label}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div style={{ background: "#0a1628", borderRadius: 8, padding: 12 }}>
              <p style={{ color: SLATE, fontSize: 10, margin: "0 0 4px" }}>基準月</p>
              <p style={{ color: VIOLET, fontSize: 16, fontWeight: 700, margin: 0, fontFamily: "monospace" }}>{currentVintage.calibration.baseMonth}</p>
            </div>
            <div style={{ background: "#0a1628", borderRadius: 8, padding: 12 }}>
              <p style={{ color: SLATE, fontSize: 10, margin: "0 0 4px" }}>全体予測精度</p>
              <p style={{ color: currentVintage.calibration.overallAccuracy > 100 ? AMBER : GRN, fontSize: 16, fontWeight: 700, margin: 0, fontFamily: "monospace" }}>
                {currentVintage.calibration.overallAccuracy}%
              </p>
            </div>
          </div>

          <p style={{ color: SLATE, fontSize: 10, fontFamily: "monospace", letterSpacing: "0.08em", marginBottom: 10 }}>ストリーム別 補正係数</p>
          {Object.entries(currentVintage.calibration.factors)
            .sort((a, b) => b[1] - a[1])
            .map(([stream, factor]) => {
              const acc = currentVintage.calibration!.streamAccuracy[stream];
              const maxFactor = Math.max(...Object.values(currentVintage.calibration!.factors).filter(f => f < 100));
              return (
                <div key={stream} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ color: SLATE, fontSize: 10, fontFamily: "monospace", minWidth: 100 }}>{streamLabels[stream] || stream}</span>
                  <div style={{ flex: 1, height: 8, background: "#1e293b", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{
                      width: `${Math.min(100, (factor / maxFactor) * 100)}%`,
                      height: "100%",
                      background: factor > 10 ? ROSE : factor > 3 ? AMBER : GRN,
                      borderRadius: 4, transition: "width 0.3s"
                    }} />
                  </div>
                  <span style={{ color: AMBER, fontSize: 10, fontFamily: "monospace", minWidth: 50, textAlign: "right" }}>×{factor < 100 ? factor.toFixed(1) : "∞"}</span>
                  {acc && (
                    <span style={{ color: SLATE, fontSize: 9, fontFamily: "monospace", minWidth: 80, textAlign: "right" }}>
                      {acc.forecastPv}→{acc.actualPv}
                    </span>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* Vintage History */}
      <div className="card" style={{ padding: "20px" }}>
        <p style={{ color: TEAL, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>📚 予測ビンテージ履歴</p>
        {forecastHistory.vintages.map((v, i) => (
          <div key={v.id} style={{
            padding: "12px 16px", borderBottom: i < forecastHistory.vintages.length - 1 ? "1px solid #1e293b" : "none",
            borderLeft: `3px solid ${VINTAGE_COLORS[i % VINTAGE_COLORS.length]}`,
            marginBottom: 4, background: v.id === forecastHistory.currentVintageId ? "rgba(45,212,191,0.03)" : "transparent"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ color: VINTAGE_COLORS[i % VINTAGE_COLORS.length], fontSize: 12, fontWeight: 700 }}>{v.label}</span>
                {v.id === forecastHistory.currentVintageId && (
                  <span style={{ color: GRN, fontSize: 9, border: `1px solid ${GRN}40`, borderRadius: 3, padding: "1px 6px", marginLeft: 8, fontFamily: "monospace" }}>ACTIVE</span>
                )}
              </div>
              <span style={{ color: SLATE, fontSize: 10, fontFamily: "monospace" }}>{v.createdAt.split("T")[0]}</span>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
              <span style={{ color: SLATE, fontSize: 10, fontFamily: "monospace" }}>ID: {v.id}</span>
              <span style={{ color: SLATE, fontSize: 10, fontFamily: "monospace" }}>トリガー: {v.trigger}</span>
              {v.calibration && (
                <span style={{ color: AMBER, fontSize: 10, fontFamily: "monospace" }}>精度: {v.calibration.overallAccuracy}%</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ForecastTab;
