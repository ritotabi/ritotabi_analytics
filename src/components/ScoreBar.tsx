import React from "react";
import { SLATE, scoreColor } from "../utils/colors";

interface ScoreBarProps {
  label: string;
  value: number | null;
}

const ScoreBar: React.FC<ScoreBarProps> = ({ label, value }) => {
  if (value === null) {
    return (
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
          <span style={{ fontSize: 11, color: SLATE }}>{label}</span>
          <span style={{ fontSize: 11, color: "#334155", fontFamily: "monospace" }}>—</span>
        </div>
        <div style={{ height: 4, background: "#1e293b", borderRadius: 2 }} />
      </div>
    );
  }

  const c = scoreColor(value);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: SLATE }}>{label}</span>
        <span style={{ fontSize: 11, color: c, fontFamily: "monospace", fontWeight: 700 }}>
          {value}
        </span>
      </div>
      <div style={{ height: 4, background: "#1e293b", borderRadius: 2 }}>
        <div
          style={{
            height: "100%",
            width: `${value}%`,
            background: c,
            borderRadius: 2,
            transition: "width 0.5s ease-out",
          }}
        />
      </div>
    </div>
  );
};

export default ScoreBar;
