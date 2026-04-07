# RITOTABI ページ評価：Hoi An Old Town Hotels (EN) [再評価]

提供されたスクリーンショット（Google リッチリザルトテスト）に基づき、JSON-LD の評価を修正し、データを更新します。また、AI モデル（Claude 等）が JSON-LD を検出できない技術的な課題について解説します。

## User Review Required
> [!IMPORTANT]
> 前回の評価では検出されなかった「よくある質問 (FAQ)」等の構造化データが実在することが判明したため、SEO スコアおよび総合スコアを引き上げます。

## Proposed Changes

### [Evaluation Data]

#### [MODIFY] [hoian_hotels_en.json](file:///home/mune1/dev/ritotabi/eval_site/ritotabi_analysis/src/evaluations/hoian_hotels_en.json)
JSON-LD に関するチェックリスト（faq: true）と SEO スコアを更新します。

#### [MODIFY] [_registry.json](file:///home/mune1/dev/ritotabi/eval_site/ritotabi_analysis/src/evaluations/_registry.json)
更新された総合スコアをレジストリに反映します。

## 評価プロトコル（修正）
- スクリーンショットにより「記事」「パンくずリスト」「カルーセル」「よくある質問」の有効性が確認されたため、これを反映。
- AI モデルが JSON-LD を見落とす原因（Markdown 変換時のタグ削除、動的レンダリング等）の分析。

## Open Questions
- 現時点で不明な点はありません。

## Verification Plan

### Automated Tests
- `hoian_hotels_en.json` の `seoChecklist.faq` が `true` になっているかの確認。
- 総合スコアが加算されているかの確認。
