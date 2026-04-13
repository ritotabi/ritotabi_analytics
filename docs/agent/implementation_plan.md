# 宮古島ランニングガイド（英語版）の再評価

https://ritotabi.com/en/destinations/miyako-island/running/ の品質評価を更新し、最新のSEO改善状況と収益予測（PV予測）を反映します。

## ユーザーレビュー必須

特にありません。今回の再評価では、技術的な改善（絶対パス化、バッジ実装）の確認と、過大だったPV予測の下方修正を主目的としています。

## 変更内容

### 分析・データ更新

#### [MODIFY] [miyako_running_en.json](file:///home/mune1/dev/ritotabi/ritotabi_analytics/src/evaluations/miyako_running_en.json)
- `evaluatedAt` を `2026-04-13` に更新。
- **SEO技術実装スコアの向上**: 前回課題だった `hreflang` / `canonical` の絶対パス化が確認されたため、スコアを 65 → 96 に引き上げ。
- **実走バッジの実装確認**: `categoryChecklist.runBadge` を `true` に変更。
- **PV予測の下方修正**: `market_data.md` の基準（宮古島ENはJPの約1/4、Tier 2/3相当）に基づき、成熟期の数値を現実的な範囲（成熟期 Optimistic で 1600 程度）に調整。
- **課題(issues)の解消**: 解決済みのSEOおよびバッジに関する課題を削除。
- **総合スコア(overall)**: 84 → 92 に引き上げ。

#### [MODIFY] [_registry.json](file:///home/mune1/dev/ritotabi/ritotabi_analytics/src/evaluations/_registry.json)
- レジストリ内の要約情報を最新の評価に基づき更新。

## 検習プラン

### 手動検証
- 生成されたJSONファイルが `PageEvaluation` スキーマに準拠しているか確認。
- `pp`, `pn`, `po` の配列が24ヶ月分であることを確認。
- レジストリへの反映を確認。
