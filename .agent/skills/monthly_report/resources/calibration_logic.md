# キャリブレーション算出ロジック

## 概要

GA4の実績PVとforecast-vintagesの予測PVを比較し、補正係数を算出して将来の予測を更新する。

## 算出手順

### 1. ストリーム別の予実比（Raw Factor）

```
raw_factor[stream] = actual_pv[stream] / forecast_pv[stream]
```

- `forecast_pv` が 0 のストリーム: 類似ストリームの係数を参考に設定（下記参照）
- `actual_pv` が 0 のストリーム: `raw_factor = 0`（そのまま）

### 2. ゼロ予測ストリームのフォールバック

予測がゼロだったストリームには、以下の類似性ルールで係数を設定：

| ストリーム | 類似ストリーム | 参考係数の目安 |
|---|---|---|
| `jp_amami` | `jp_aka` | `jp_aka` の係数の 70% |
| `en_amami` | `en_ishigaki` | `en_ishigaki` の係数の 50% |
| `cen` | `cjp` | `cjp` の係数の 60% |
| `hjp` | `cjp` | `cjp` と同等 |
| `hen` | `cen` | `cen` と同等 |

### 3. ダンピング係数の適用

初期予測の大幅な乖離は、成長曲線の**開始点のずれ**が主因であり、成熟期に近づくほど乖離は縮まる。
そのため、raw_factor をそのまま適用すると将来月の予測が過大になる。

**ダンピング式**:
```
dampened_factor[stream] = sqrt(raw_factor[stream])
```

- これにより、例えば raw_factor が 25 の場合、dampened_factor は 5 になる。
- 成熟期の予測に対する過剰な補正を防ぐ。

### 4. 予測値の更新

v0（初期予測）の各月の各ストリームの値に dampened_factor を乗算：

```
v1_forecast[month][stream] = round(v0_forecast[month][stream] * dampened_factor[stream])
```

### 5. 精度メトリクスの記録

```
streamAccuracy[stream] = {
  forecastPv: v0の対象月予測値,
  actualPv: 実績値,
  accuracy: (actualPv / forecastPv) * 100  // forecastPvが0の場合はnull
}

overallAccuracy = (総実績PV / 総予測PV) * 100
```

### 6. ビンテージの命名規則

```
id: "v{N}_{YYYYMM}"
例: "v1_202604", "v2_202605"
```

`N` は `forecast-vintages.json` 内の既存ビンテージ数。

## 注意事項

- 実績データが2ヶ月分以上蓄積されると、トレンド（成長率）も考慮した補正が可能になる
- 現時点ではシンプルなsqrt補正を採用し、データ蓄積後に線形回帰等の高度なモデルに移行する余地を残す
