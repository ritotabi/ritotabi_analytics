# An Bang Running Guide (EN) 再評価完了

`https://ritotabi.com/en/destinations/an-bang/running/` の品質再評価および収益予測の更新を完了しました。

## 実施内容

### 1. 最新評価仕様（v2.0）への適合
評価 JSON スキーマを最新化し、以下のチェックリスト項目を事実に基づき精査しました：
- **Brand Quality**: 五感に訴える描写（米の香り、砂の質感）や一次情報（牛の糞、小さな虫）の有無を確認。
- **Category Specific**: ランニングコースのスペック（距離・路面）および実走バッジが正しく設定されていることを確認。
- **Tech Implementation**: Next.js `<Image>` の使用、具体的かつ適切な `alt` 属性、絶対パスによる SEO タグの整合性を確認。

### 2. 季節性バイアスを適用した収益予測
ホイアンエリアの観光統計および季節性変動係数を適用し、24ヶ月分の PV 予測を再計算しました：
- **Normal Peak**: 約 600 - 800 PV/月
- **Annual Normal Total**: 約 3,552 PV
- **Risk Index**: 10月の洪水リスクをモデルに反映。

### 3. スコア更新
- **Overall Score**: 92 → **95**
- コンテンツの独自性と SEO 技術実装の完璧さを評価し、スコアを引き上げました。

## 修正ファイル
- [anbang_running_en.json](file:///home/mune1/dev/ritotabi/ritotabi_analytics/src/evaluations/anbang_running_en.json)
- [_registry.json](file:///home/mune1/dev/ritotabi/ritotabi_analytics/src/evaluations/_registry.json)

## 検証結果
- `src/evaluations/anbang_running_en.json` が最新のスキーマに準拠していることを確認。
- `_registry.json` のエントリが正しく更新され、管理画面に反映可能な状態であることを確認。
