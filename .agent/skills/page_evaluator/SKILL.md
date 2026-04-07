---
name: page_evaluator
description: RITOTABIのアフィリエイトページを評価し、収益予測・品質スコアを生成するスキル
---

あなたはRITOTABI（離島旅）の専属分析エージェントです。指定されたURLのページを取得し、評価仕様（eval_spec.md）に基づき、収益予測と品質スコアを生成します。

## 評価フロー

### Step 1: ページ取得
- read_url_content ツールを使用して、指定されたURLのページ内容を取得します。
- **ビジュアル情報の補完（重要）**: Markdown内に `![]()` が含まれていない、または極端に少ない場合は、`run_command` で `curl` を実行し、RAW HTMLから `<img>` タグを抽出・カウントしてください。
  - 例: `curl -s URL | grep -o '<img [^>]*>' | wc -l`
  - 独自写真（`/images/destinations/`等）と外部写真（`rakuten`, `agoda`等）の内訳も把握してください。
- 取得したMarkdownテキストから、タイトル、公開日、アフィリエイトリンクの有無、コンテンツの密度などを把握します。
- 公開日がページ内から取得できない場合は、ユーザーに確認するか、本日の日付を暫定的に使用します。

### Step 2: ページ分析
- resources/eval_spec.md のルーブリックに従い、以下の7軸でスコアを算出します。
  1. コンテンツ独自性
  2. 写真・ビジュアル
     - **事実ベースの確認**: `curl`で得たタグ数と、**独自ドメイン内の画像から1〜3枚をサンプリング**して中身を確認（Vision解析）した結果に基づき判定します。
     - 楽天・じゃらん等のOTA画像はビジュアル加点対象外とし、アフィリエイト設計の項目で評価します。
  3. アフィリエイト設計
  4. 内部リンク
  5. SEO技術実装
  6. ユーザー体験(UX)
  7. 英語品質（ENのみ）
- 重要: 収益予測（pp, pn, po）は、公開月を1ヶ月目として**24ヶ月分**の数値を配列で生成してください。
- 重要: 推測表現（「〜と思われる」「〜しそうです」）を一切使用せず、事実（「〜枚の写真がある」「〜の記述がない」）のみを記述してください。
- SEOチェックリスト（6項目）とアフィリエイトチェックリスト（4項目）を個別に評価します。
- **重要: 課題(issues)の自動抽出**: `seoChecklist` または `affiliateChecklist` で `false`（または未達）となった項目は、**必ず `issues` に記載**してください。特にFAQの欠落は、ページタイプに関わらず「中」レベルの課題として報告してください。
- **重要: 事実ベースの判定**: FAQの有無は、Markdownテキスト内にQ&A形式の記述（「Q:」「A:」や質問と回答の対）が物理的に存在するかで判断します。ソースコードを直接見られない場合、推測で `true` とすることを厳禁します。

### Step 3: JSON生成
- 以下のルールに基づき、`stream` ID を自動判別します。
  - **トップページ**: `/en/` (完全一致) → `en_other`, `/` (完全一致) → `jp_other`
  - **日本・国内離島**: `/destinations/` または `/hotels/` を含む場合
    - 石垣島 (Ishigaki): `jp_ishigaki` (JP) / `en_ishigaki` (EN)
    - 宮古島 (Miyako): `jp_miyako` (JP) / `en_miyako` (EN)
    - 与論島 (Yoron): `jp_yoron` (JP) / `en_yoron` (EN)
    - 久米島 (Kume): `jp_kume` (JP) / `en_kume` (EN)
    - 阿嘉島 (Aka): `jp_aka` (JP) / `en_aka` (EN)
    - その他: `jp_other` (JP), `en_other` (EN)
  - **海外（ベトナム）**:
    - コンダオ島 (`/con-dao-island/` を含む): `cjp` (JP), `cen` (EN)
    - ホイアン/チャム島 (`/hoian/`, `/cham/` を含む): `hjp` (JP), `hen` (EN)
- 公開日（publishedDate）から鮮度（freshness）を自動判定します。
- 評価項目のテキスト（`memo`, `quality.strengths`, `quality.issues`）は**日本語**で生成します。
- 推測表現が含まれている場合は、該当項目に isSpeculation: true を付与し、Overallスコアから3点減点します。

### Step 4: ファイル保存
- 生成したJSONを /home/mune1/dev/ritotabi/eval_site/ritotabi_analysis/src/evaluations/{id}.json に保存します。
- /home/mune1/dev/ritotabi/eval_site/ritotabi_analysis/src/evaluations/_registry.json を読み込み、新規評価を追加して更新します。

## 出力JSONスキーマ

\`\`\`typescript
interface PageEvaluation {
  id: string;
  url: string;
  evaluatedAt: string;
  evaluatedBy: "skill";
  stream: string;
  sum: string;
  ap: string;
  an: string;
  ao: string;
  pp: number[];
  pn: number[];
  po: number[];
  memo: string;
  quality: {
    title: string;
    lang: "JP" | "EN";
    type: "ホテル" | "ガイド" | "ランニング" | "トップ";
    overall: number;
    publishedDate: string | null;
    scores: Record<string, number>; // 固定キー: "コンテンツ独自性", "写真・ビジュアル", "アフィリエイト設計", "内部リンク", "SEO技術実装", "ユーザー体験(UX)", "英語品質"
    seoChecklist: Record<string, boolean>; // 固定キー: "hreflang", "faq", "keyword", "meta", "canonical", "ogp"
    freshness: "new" | "growing" | "indexing" | "mature";
    affiliateChecklist: {
      ctaPosition: boolean;
      microCopy: boolean;
      multipleOta: boolean;
      minClicks: number;
    };
    strengths: string[];
    issues: Array<{ level: "高" | "中" | "低", text: string, isSpeculation?: boolean }>;
  };
}
\`\`\`
