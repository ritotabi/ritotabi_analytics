import React, { useState, useEffect } from "react";
import "./App.css";
import { BASE_PV_OBJ } from "./data/baseline-pv";
import { ACTUAL_PV_OBJ } from "./data/actual-pv";
import { calcData, sumRevDyn, addEvalsToPv, scaleBasePv } from "./utils/calc";
import type { PageEvaluation, EvalRegistry } from "./types/evaluation";
import type { MonthlyReport } from "./types/report";
import type { ForecastHistory } from "./types/forecast";
import { TEAL, CYAN, PINK, SLATE, VIOLET, GRN } from "./utils/colors";

// Components
import Header from "./components/Header";
import ModeBanner from "./components/ModeBanner";
import OverviewTab from "./components/OverviewTab";
import ChartTab from "./components/ChartTab";
import TableTab from "./components/TableTab";
import EvalTab from "./components/EvalTab";
import QualityTab from "./components/QualityTab";
import ReportTab from "./components/ReportTab";
import ForecastTab from "./components/ForecastTab";

// Static Data
import _registry from "./evaluations/_registry.json";
const registry = _registry as EvalRegistry;

import _forecastHistory from "./data/forecast-vintages.json";
const forecastHistory = _forecastHistory as ForecastHistory;

// Load all evaluation JSONs and report JSONs
const evaluationModules = import.meta.glob("./evaluations/*.json");
const reportModules = import.meta.glob("./reports/*.json");

const App: React.FC = () => {
  const [tab, setTab] = useState("overview");
  const [scenario, setScenario] = useState<"pessimistic" | "normal" | "optimistic">("normal");
  const [baselineMode, setBaselineMode] = useState<"standard" | "conservative">("standard");
  const [streams] = useState(registry.streams);
  const [useAccumulated, setUseAccumulated] = useState(true);
  const [evaluations, setEvaluations] = useState<Record<string, PageEvaluation>>({});
  const [reports, setReports] = useState<Record<string, MonthlyReport>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      // Load evaluations
      const loadedEvals: Record<string, PageEvaluation> = {};
      for (const registryKey in registry.evaluations) {
        const entry = registry.evaluations[registryKey as keyof typeof registry.evaluations];
        const path = `./evaluations/${entry.file}`;
        
        if (evaluationModules[path]) {
          const module = (await evaluationModules[path]()) as { default: PageEvaluation };
          loadedEvals[registryKey] = module.default;
        }
      }
      setEvaluations(loadedEvals);

      // Load reports
      const loadedReports: Record<string, MonthlyReport> = {};
      for (const path in reportModules) {
        const fileName = path.split('/').pop()?.replace('.json', '') || '';
        const module = (await reportModules[path]()) as { default: MonthlyReport };
        loadedReports[fileName] = module.default;
      }
      setReports(loadedReports);

      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return <div style={{ background: "#080f1a", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", color: SLATE }}>Loading...</div>;
  }

  // Filter streams to only show those with evaluations
  const activeStreams = streams.filter(s => 
    Object.values(evaluations).some(ev => ev.stream === s.key)
  );

  // Derive PV and Revenue Data
  // Merge Actuals and Baseline (apply conservative scaling to forecast portion only)
  const scaledBasePv = baselineMode === "conservative"
    ? scaleBasePv(BASE_PV_OBJ, 0.7)
    : BASE_PV_OBJ;
  const mergedBasePv = [
    ...ACTUAL_PV_OBJ.map(row => ({ ...row, isActual: true })),
    ...scaledBasePv.map(row => ({ ...row, isActual: false }))
  ];

  const baseData = calcData(mergedBasePv, streams);
  const baseSum = sumRevDyn(baseData, streams);

  const accPvObj = addEvalsToPv(mergedBasePv, evaluations, scenario, streams);
  const currentPvObj = useAccumulated ? accPvObj : mergedBasePv;
  
  const data = calcData(currentPvObj, streams);
  const sum = sumRevDyn(data, streams);

  const diffTotal = sum.total - baseSum.total;

  return (
    <div className="app-container" style={{ minHeight: "100vh", background: "#080f1a", color: "#e2e8f0", paddingBottom: 60 }}>
      <Header streamCount={activeStreams.length} evalCount={Object.keys(evaluations).length} />
      
      <ModeBanner
        scenario={scenario}
        setScenario={setScenario}
        useAccumulated={useAccumulated}
        setUseAccumulated={setUseAccumulated}
        baselineMode={baselineMode}
        setBaselineMode={setBaselineMode}
        totalRevenue={sum.total}
        diffTotal={diffTotal}
        baseTotal={baseSum.total}
      />

      {/* Tabs Navigation */}
      <div style={{ display: "flex", gap: 2, padding: "10px 24px 0", borderBottom: "1px solid #1e293b", overflowX: "auto" }}>
        {[
          { id: "overview", label: "📋 概要", color: PINK },
          { id: "chart", label: "📊 グラフ", color: PINK },
          { id: "table", label: "📅 月次一覧", color: PINK },
          { id: "eval", label: "🔍 ページ評価", color: CYAN },
          { id: "quality", label: "📊 品質評価", color: TEAL },
          { id: "report", label: "📋 月次レポート", color: GRN },
          { id: "forecast", label: "📈 予実推移", color: VIOLET }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`btn-tab ${tab === t.id ? "active" : ""}`}
            style={{ borderBottomColor: tab === t.id ? t.color : "transparent" }}
          >
            {t.label}
            {t.id === "quality" && ` (${Object.keys(evaluations).length})`}
            {t.id === "report" && ` (${Object.keys(reports).length})`}
          </button>
        ))}
      </div>

      <div style={{ padding: "18px 24px" }}>
        {tab === "overview" && <OverviewTab streams={activeStreams} sum={sum} baseSum={baseSum} evaluations={evaluations} scenario={scenario} />}
        {tab === "chart" && <ChartTab data={data} streams={activeStreams} />}
        {tab === "table" && <TableTab data={data} streams={activeStreams} sum={sum} />}
        {tab === "eval" && <EvalTab lastUpdated={registry.lastUpdated} evalCount={Object.keys(evaluations).length} />}
        {tab === "quality" && <QualityTab evaluations={Object.values(evaluations)} streams={activeStreams} />}
        {tab === "report" && <ReportTab reports={reports} />}
        {tab === "forecast" && <ForecastTab forecastHistory={forecastHistory} actuals={ACTUAL_PV_OBJ} />}
      </div>
    </div>
  );
};

export default App;
