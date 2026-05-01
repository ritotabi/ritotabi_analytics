export interface ForecastVintage {
  id: string;
  createdAt: string;
  label: string;
  trigger: "initial" | "calibration";

  calibration?: {
    baseMonth: string;
    factors: Record<string, number>;
    streamAccuracy: Record<string, {
      forecastPv: number;
      actualPv: number;
      accuracy: number;
    }>;
    overallAccuracy: number;
  };

  forecasts: Array<{
    m: string;
    mp: string;
    pv: Record<string, number>;
  }>;
}

export interface ForecastHistory {
  currentVintageId: string;
  vintages: ForecastVintage[];
}
