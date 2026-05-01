// baseline-pv.tsの内容をJSONとして抽出し、キャリブレーション係数を算出
const baseline = [
  {"m": "Apr'26", "mp": "4月", "pv": {"jp_ishigaki": 84, "jp_miyako": 75, "jp_yoron": 7, "jp_kume": 7, "jp_aka": 5, "jp_other": 9, "cjp": 7, "cen": 0, "hjp": 0, "hen": 0, "en_ishigaki": 28, "en_miyako": 23, "en_yoron": 2, "en_kume": 2, "en_aka": 2, "en_other": 4}},
  {"m": "May'26", "mp": "5月", "pv": {"jp_ishigaki": 169, "jp_miyako": 150, "jp_yoron": 14, "jp_kume": 14, "jp_aka": 9, "jp_other": 19, "cjp": 7, "cen": 2, "hjp": 19, "hen": 7, "en_ishigaki": 56, "en_miyako": 46, "en_yoron": 5, "en_kume": 5, "en_aka": 3, "en_other": 10}},
  {"m": "Jun'26", "mp": "6月", "pv": {"jp_ishigaki": 394, "jp_miyako": 350, "jp_yoron": 33, "jp_kume": 33, "jp_aka": 22, "jp_other": 44, "cjp": 27, "cen": 11, "hjp": 51, "hen": 43, "en_ishigaki": 130, "en_miyako": 108, "en_yoron": 11, "en_kume": 11, "en_aka": 7, "en_other": 22}},
];

// 4月の実績
const actual_apr = {
  jp_yoron: 185, jp_miyako: 352, jp_ishigaki: 181, jp_kume: 56, jp_aka: 72,
  jp_amami: 88, en_ishigaki: 169, en_miyako: 87, en_amami: 48,
  cjp: 147, cen: 129, hjp: 290, hen: 236, jp_other: 454, en_other: 165
};

// 4月の予測
const forecast_apr = baseline[0].pv;

// 各streamの補正係数 = 実績 / 予測
const factors = {};
const streamAccuracy = {};
let totalForecast = 0;
let totalActual = 0;

for (const [stream, actual] of Object.entries(actual_apr)) {
  const forecast = forecast_apr[stream] || 0;
  totalForecast += forecast;
  totalActual += actual;
  if (forecast > 0) {
    factors[stream] = Math.round((actual / forecast) * 100) / 100;
    streamAccuracy[stream] = { forecastPv: forecast, actualPv: actual, accuracy: Math.round((actual / forecast) * 10000) / 100 };
  } else {
    // 予測がゼロだったストリームは、近似ストリームから推定するか、実績値をそのまま使う
    factors[stream] = actual > 0 ? 999 : 1; // マーカー値
    streamAccuracy[stream] = { forecastPv: 0, actualPv: actual, accuracy: actual > 0 ? 99900 : 100 };
  }
}

console.log("=== Calibration Factors ===");
console.log(JSON.stringify(factors, null, 2));
console.log("\n=== Stream Accuracy ===");
console.log(JSON.stringify(streamAccuracy, null, 2));
console.log("\nOverall: forecast=" + totalForecast + " actual=" + totalActual + " accuracy=" + Math.round((totalActual / totalForecast) * 10000) / 100 + "%");
