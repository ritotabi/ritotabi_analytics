import React from "react";

interface OverallGaugeProps {
  score: number;
  color: string;
  size?: number;
}

const OverallGauge: React.FC<OverallGaugeProps> = ({ score, color, size = 72 }) => {
  const r = size * 0.39; // 28 if size = 72
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const strokeWidth = size * 0.083; // 6 if size = 72

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#1e293b"
        strokeWidth={strokeWidth}
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      {/* Score text */}
      <text
        x={size / 2}
        y={size / 2 + size * 0.05} // 40 if size = 72
        textAnchor="middle"
        fill={color}
        fontSize={size * 0.208} // 15 if size = 72
        fontWeight="700"
        fontFamily="monospace"
      >
        {score}
      </text>
    </svg>
  );
};

export default OverallGauge;
