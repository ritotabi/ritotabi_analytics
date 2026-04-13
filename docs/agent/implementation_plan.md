# An Bang Running Guide (EN) 再評価

## 概要
`https://ritotabi.com/en/destinations/an-bang/running/` の品質評価および収益予測を、最新の評価仕様（v2.0）および季節性バイアスモデルに基づいて更新します。以前の評価から、ブランド品質チェックリスト、カテゴリ固有チェックリスト（ランニング）、および技術実装チェックリストの項目を精査し、より詳細な評価データに更新します。

## ユーザーレビュー必須事項
> [!NOTE]
> 特になし。既存の評価（92点）をベースに、最新のチェックリスト項目を埋める形での更新となります。

## 提案される変更点

### 評価データ (JSON)

#### [MODIFY] [anbang_running_en.json](file:///home/mune1/dev/ritotabi/ritotabi_analytics/src/evaluations/anbang_running_en.json)
- `evaluatedAt` を `2026-04-13` に更新。
- `brandChecklist`、`categoryChecklist`、`techChecklist` を新規仕様に基づき追加。
- 季節性バイアスモデルを適用した 24ヶ月分の PV 予測（pp, pn, po）を再計算。
- 強み(strengths)と課題(issues)を、最新の事実（画像枚数、マイクロコピーの具体性など）に基づいて記述。

#### [MODIFY] [_registry.json](file:///home/mune1/dev/ritotabi/ritotabi_analytics/src/evaluations/_registry.json)
- `anbang_running_en` のエントリを最新の評価データ（sum, ap, an, ao 等）で更新。

## オープンな質問
- なし。

## 確認計画

### 修正内容の確認
- JSON ファイルが最新のスキーマに準拠しているか。
- `src/evaluations/_registry.json` に正しく反映されているか。
- `npm run dev` でローカルサーバーを起動し、評価一覧画面で数値が正しく更新されていることを確認する。
