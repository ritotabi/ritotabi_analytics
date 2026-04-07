# 英語トップページのカテゴリ分類修正

英語のトップページ (`/en/`) が「コンダオ (英語)」に誤分類されている問題を修正し、`page_evaluator` スキルの自動判定ロジックを現行のレジストリ定義に合わせて更新します。

## ユーザーレビューが必要な項目
> [!IMPORTANT]
> スキル (`SKILL.md`) の判定ロジックを、従来の簡略化された `r`, `ren` から、現在のレジストリで使われている `jp_ishigaki`, `en_ishigaki` 等の詳細なキーに更新します。

## 変更内容

### 評価データ修正

#### [MODIFY] [top_en.json](file:///home/mune1/dev/ritotabi/eval_site/ritotabi_analysis/src/evaluations/top_en.json)
- `stream` を `cen` から `en_other` に修正します。

#### [MODIFY] [_registry.json](file:///home/mune1/dev/ritotabi/eval_site/ritotabi_analysis/src/evaluations/_registry.json)
- `top_en` エントリの `stream` を `cen` から `en_other` に修正します。

### スキル定義の更新

#### [MODIFY] [SKILL.md](file:///home/mune1/dev/ritotabi/eval_site/ritotabi_analysis/.agent/skills/page_evaluator/SKILL.md)
- `Step 3: JSON生成` の `stream` 判定ロジックを以下のように修正・拡充します。
  - トップページ (`/`, `/en/`) の判定を追加。
  - 日本エリアの判定を詳細化（`jp_ishigaki`, `en_ishigaki` 等）。
  - `/en/` が付いている場合に「コンダオ」が優先されないよう判定順序を調整。

## 検証計画

### 自動テスト
- 特になし（JSONの構造チェックのみ）

### 手動確認
- `npm run dev` で起動しているダッシュボードにおいて、英語トップページが「その他 日本 (英語)」カテゴリに表示されることを確認します。
- 必要に応じて、`page_evaluator` スキルを再度呼び出し、正しい `stream` が提案されるかシミュレーション（または実際に実行）します。
