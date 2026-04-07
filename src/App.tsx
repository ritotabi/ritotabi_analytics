import React, { useState, useEffect } from "react";
import "./App.css";
import { BASE_PV_OBJ } from "./data/baseline-pv";
import { calcData, sumRevDyn, addEvalsToPv } from "./utils/calc";
import type { PageEvaluation, EvalRegistry } from "./types/evaluation";
import { TEAL, CYAN, PINK, SLATE } from "./utils/colors";

// Components
import Header from "./components/Header";
import ModeBanner from "./components/ModeBanner";
import OverviewTab from "./components/OverviewTab";
import ChartTab from "./components/ChartTab";
import TableTab from "./components/TableTab";
import EvalTab from "./components/EvalTab";
import QualityTab from "./components/QualityTab";

// Static Data
import _registry from "./evaluations/_registry.json";
const registry = _registry as EvalRegistry;

// Load all evaluation JSONs
const evaluationModules = import.meta.glob("./evaluations/*.json");

const App: React.FC = () => {
  const [tab, setTab] = useState("overview");
  const [scenario, setScenario] = useState<"pessimistic" | "normal" | "optimistic">("normal");
  const [streams] = useState(registry.streams);
  const [useAccumulated, setUseAccumulated] = useState(true);
  const [evaluations, setEvaluations] = useState<Record<string, PageEvaluation>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvaluations = async () => {
      const loadedEvals: Record<string, PageEvaluation> = {};
      for (const path in evaluationModules) {
        if (path.includes("_registry.json")) continue;
        const module = (await evaluationModules[path]()) as { default: PageEvaluation };
        loadedEvals[module.default.id] = module.default;
      }
      setEvaluations(loadedEvals);
      setLoading(false);
    };
    loadEvaluations();
  }, []);

  if (loading) {
    return <div style={{ background: "#080f1a", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", color: SLATE }}>Loading...</div>;
  }

  // Derive PV and Revenue Data
  const baseData = calcData(BASE_PV_OBJ, streams);
  const baseSum = sumRevDyn(baseData, streams);

  const accPvObj = addEvalsToPv(BASE_PV_OBJ, evaluations, scenario, streams);
  const currentPvObj = useAccumulated ? accPvObj : BASE_PV_OBJ;
  
  const data = calcData(currentPvObj, streams);
  const sum = sumRevDyn(data, streams);

  const diffTotal = sum.total - baseSum.total;

  return (
    <div className="app-container" style={{ minHeight: "100vh", background: "#080f1a", color: "#e2e8f0", paddingBottom: 60 }}>
      <Header streamCount={streams.length} evalCount={Object.keys(evaluations).length} />
      
      <ModeBanner 
        scenario={scenario} 
        setScenario={setScenario} 
        useAccumulated={useAccumulated} 
        setUseAccumulated={setUseAccumulated}
        totalRevenue={sum.total}
        diffTotal={diffTotal}
        baseTotal={baseSum.total}
      />

      {/* Tabs Navigation */}
      <div style={{ display: "flex", gap: 2, padding: "10px 24px 0", borderBottom: "1px solid #1e293b", overflowX: "auto" }}>
        {[
          { id: "overview", label: "📋 概要" },
          { id: "chart", label: "📊 グラフ" },
          { id: "table", label: "📅 月次一覧" },
          { id: "eval", label: "🔍 ページ評価" },
          { id: "quality", label: "📊 品質評価" }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`btn-tab ${tab === t.id ? "active" : ""}`}
            style={{ borderBottomColor: tab === t.id ? (t.id === "quality" ? TEAL : t.id === "eval" ? CYAN : PINK) : "transparent" }}
          >
            {t.label}
            {t.id === "quality" && ` (${Object.keys(evaluations).length})`}
          </button>
        ))}
      </div>

      <div style={{ padding: "18px 24px" }}>
        {tab === "overview" && <OverviewTab streams={streams} sum={sum} baseSum={baseSum} evaluations={evaluations} />}
        {tab === "chart" && <ChartTab data={data} streams={streams} />}
        {tab === "table" && <TableTab data={data} streams={streams} sum={sum} />}
        {tab === "eval" && <EvalTab lastUpdated={registry.lastUpdated} evalCount={Object.keys(evaluations).length} />}
        {tab === "quality" && <QualityTab evaluations={Object.values(evaluations)} />}
      </div>
    </div>
  );
};

export default App;
