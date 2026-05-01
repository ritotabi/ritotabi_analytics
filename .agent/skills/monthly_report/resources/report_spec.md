# レポート仕様書

## レポート出力先

```
src/reports/YYYYMM.json
```

## 型定義

`src/types/report.ts` の `MonthlyReport` インターフェースに準拠。

## セクション別の算出ルール

### 1. サマリー (summary)

- **totalPageviews**: GA4全行の `表示回数` 合計
- **totalUsers**: GA4全行の `アクティブ ユーザー` 合計
- **totalKeyEvents**: GA4全行の `キーイベント` 合計
- **totalRevenue**: GA4全行の `合計収益` 合計 + ユーザー提供の売上情報
- **highlights**: データの特徴的な3ポイントを自然言語で記述
  - PV/ユーザーの規模
  - 最もアクセスの多いページ
  - CV/キーイベントの状況
- **momComparison**: 前月レポートが存在する場合、`(当月値 / 前月値 - 1) * 100` で変化率を算出

### 2. トラフィック (traffic)

- **byStream**: GA4の各行をストリームマッピングルール（stream_mapping.md参照）で分類し、PV/ユーザー/ページ数を集約
- **byLanguage**: `/en/` で始まるパスをEN、それ以外をJPとして分類
- **topPages**: PV降順のTop 10ページ
- **newPages**: 前月レポートに存在しなかったページパスのリスト

### 3. 検索パフォーマンス (search)

- **画像除外**: `/images/` を含むURLは除外してから集計
- **google**: GSC全行からクリック/表示回数/CTR/掲載順位を集計。加重平均順位 = Σ(順位×表示回数) / Σ表示回数
- **bing**: Bing全行から同様に集計
- **zeroCtrPages**: 表示回数 >= 50 かつ クリック = 0 のページ（改善機会）
- **engineComparison**: Google/Bingのクリック数占有率

### 4. エンゲージメント (engagement)

- **topEngagedPages**: ユーザー >= 2 のページを平均エンゲージメント時間の降順でTop 10
- **lowEngagementPages**: ユーザー >= 2 かつ 平均エンゲージメント時間 < 30秒のページ
- **keyEventPages**: キーイベント > 0 のページ、cvRate = keyEvents / users * 100

### 5. コンバージョン (conversion)

- **topCvPages**: キーイベント降順のTop 10ページ
- **hotelCvSummary**: `/hotels/` を含むページのみに限定したCV集計

### 6. 予実対比 (forecastComparison)

- 最新ビンテージの該当月予測値 vs GA4実績値
- ストリーム別に `accuracy = actualPv / forecastPv * 100` を算出
- `overallAccuracy = 総実績PV / 総予測PV * 100`

### 7. アクションアイテム (actionItems)

データから自動生成するルール:

| カテゴリ | 条件 | 優先度 |
|---|---|---|
| `ctr` | GSCで表示回数 >= 50 かつ CTR = 0% のページが存在 | 高 |
| `engagement` | エンゲージメント時間 < 15秒 かつ ユーザー >= 3 のページが存在 | 中 |
| `conversion` | PV >= 50 かつ キーイベント = 0 のページが存在 | 高 |
| `content` | 新規ページが検出された場合のフォローアップ | 低 |
