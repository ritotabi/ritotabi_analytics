import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import type { StreamDef, CalculatedRow } from "../utils/calc";
import { PINK, SLATE } from "../utils/colors";

interface ChartTabProps {
  data: CalculatedRow[];
  streams: StreamDef[];
}

const ChartTab: React.FC<ChartTabProps> = ({ data, streams }) => {
  return (
    <div>
      <h3 style={{ color: PINK, fontSize: 11, fontFamily: "monospace", letterSpacing: "0.12em", marginBottom: 16 }}>
        📊 収益シミュレーション（24ヶ月推移）
      </h3>
      
      <div className="card" style={{ padding: "24px 12px 12px", marginBottom: 24, height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="mp" axisLine={false} tickLine={false} tick={{ fill: SLATE, fontSize: 10 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: SLATE, fontSize: 10 }} tickFormatter={(v) => `¥${v / 1000}k`} />
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12, color: "#e2e8f0" }}
              itemStyle={{ fontSize: 11, padding: "2px 0" }}
              formatter={(v: any) => `¥${Number(v).toLocaleString()}`}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
            {streams.map((s) => (
              <Bar key={s.key} dataKey={`rev_${s.key}`} name={s.label} stackId="a" fill={s.color} radius={[0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h3 style={{ color: PINK, fontSize: 11, fontFamily: "monospace", letterSpacing: "0.12em", marginBottom: 16 }}>
        📈 累積収益カーブ
      </h3>
      <div className="card" style={{ padding: "24px 12px 12px", height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCum" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={PINK} stopOpacity={0.2} />
                <stop offset="95%" stopColor={PINK} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="mp" axisLine={false} tickLine={false} tick={{ fill: SLATE, fontSize: 10 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: SLATE, fontSize: 10 }} tickFormatter={(v) => `¥${v / 1000}k`} />
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12, color: "#e2e8f0" }}
              formatter={(v: any) => `¥${Number(v).toLocaleString()}`}
            />
            <Area type="monotone" dataKey="cumTotal" name="累計収益" stroke={PINK} fillOpacity={1} fill="url(#colorCum)" strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <h3 style={{ color: PINK, fontSize: 11, fontFamily: "monospace", letterSpacing: "0.12em", marginBottom: 16, marginTop: 32 }}>
        🎯 PV実績 vs 予測比較
      </h3>
      <div className="card" style={{ padding: "24px 12px 12px", height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="mp" axisLine={false} tickLine={false} tick={{ fill: SLATE, fontSize: 10 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: SLATE, fontSize: 10 }} />
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12, color: "#e2e8f0" }}
              formatter={(v: any) => v.toLocaleString() + " PV"}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
            <Bar dataKey="actualPvTotal" name="実績PV" fill={PINK} radius={[4, 4, 0, 0]} barSize={20} />
            <Bar dataKey="forecastPvTotal" name="予測PV" fill="#1e293b" stroke={SLATE} strokeDasharray="2 2" radius={[4, 4, 0, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartTab;
