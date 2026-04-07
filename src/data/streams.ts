import { AMBER, VIOLET, TEAL, CYAN, PINK } from "../utils/colors";
import type { StreamDef } from "../utils/calc";

export const DEFAULT_STREAMS: StreamDef[] = [
  { key: "r", label: "楽天（日本離島）", color: AMBER, cvr: 0.0032, unit: 750 },
  { key: "cjp", label: "コンダオ 日本語", color: VIOLET, cvr: 0.0035, unit: 1500 },
  { key: "cen", label: "コンダオ 英語", color: TEAL, cvr: 0.008, unit: 2500 },
  { key: "hjp", label: "ホイアン/チャム 日本語", color: CYAN, cvr: 0.004, unit: 1000 },
  { key: "hen", label: "ホイアン/チャム 英語", color: PINK, cvr: 0.009, unit: 2000 },
];
