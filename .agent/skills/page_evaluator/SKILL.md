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
- **SEO技術の精査（重要）**: Markdownだけでは `<head>` 内の `meta title` と `h1` の不一致等を確認できないため、必要に応じて `curl -s URL | grep -E '<title>|<h1'` を実行し、RAW HTMLレベルで整合性を確認してください。
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
- **アフィリエイト評価の分岐**: `type` が「ホテル」の場合は複数OTAの有無を厳しく評価し、それ以外（ランニング・ガイド等）の場合は、周辺ホテルへの適切な内部リンクと、その魅力を伝える**マイクロコピー**の有無を重視してください。
- **マイクロコピーの検出（重要）**: リンクのテキスト内（例：`[ホテル名 + 説明文](URL)`）に魅力的な紹介文が含まれている場合も、マイクロコピーありと判定してください。
- **ブランド品質チェックリスト（brandChecklist）**: eval_spec.md のセクション 2b に従い、`toneAndManner`, `firstPersonInsight`, `benefitUpfront`, `personaDrivenPros` の4項目を boolean で評価します。`false` と判定した場合は、具体的な箇所をページ内の文章から引用して `issues` に記載してください。`personaDrivenPros` はホテルページのみ評価し、それ以外は `null` とします。
- **カテゴリ固有チェックリスト（categoryChecklist）**: eval_spec.md のセクション 2c に従い、ページの `type` に応じた構成要素の有無をチェックします。ホテルページでは `comparisonTable`, `affiliateMicroCopy` を、ランニングページでは `courseSpecs`, `runBadge` を評価します。該当しないキーは `null` とします。
- **技術実装チェックリスト（techChecklist）**: eval_spec.md のセクション 2c の Tech Implementation に従い、`nextImage`, `imageAlt`, `affiliateRel` の3項目を boolean で評価します。`curl` で RAW HTML を確認して判定してください。
- **重要: 課題(issues)の抽出**: 
  - チェックリストで `false` となった項目は**必ず**記載してください（特にFAQ欠落は「中」レベル）。
  - **チェックリスト外の重要事項**: タイトルとh1の不一致、情報の古さ、構成上の矛盾など、ページ特有の品質課題も「事実」を起点に記載してください。
- **重要: 事実ベースの判定**: FAQの有無は、以下の基準で判定してください。ソースコードを直接見られない場合、推測で `true` とすることを厳禁します。
  - **ランニングページ以外**: Markdownテキスト内にQ&A形式の記述（「Q:」「A:」や質問と回答の対）が物理的に存在する場合に `true` とする。
  - **ランニングページ**: JSON-LDにFAQPageの定義が存在する場合に `true` とする（情報の重複を避けるため、視覚的なQ&Aセクションは任意とする）。


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
- **推測の排除と事実の記述**: 
  - 「〜の可能性がある」ではなく「AとBが異なっている（事実）」と記述してください。
  - どうしても推論が必要な場合のみ `isSpeculation: true` を付与し、Overallスコアから3点減点します（怠慢な未確認を防ぐため）。

### Step 4: ファイル保存
- 生成したJSONを /home/mune1/dev/ritotabi/eval_site/ritotabi_analytics/src/evaluations/{id}.json に保存します。
- /home/mune1/dev/ritotabi/eval_site/ritotabi_analytics/src/evaluations/_registry.json を読み込み、新規評価を追加して更新します。

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
    brandChecklist?: {                      // ブランド品質チェック（定性的審査）
      toneAndManner: boolean;               // 抽象的形容詞を避け、五感・事実ベースの描写ができているか
      firstPersonInsight: boolean;           // 一次情報（現場の質感）が最低1つ含まれているか
      benefitUpfront: boolean;               // 冒頭で読者の疑問に対する結論を提示しているか
      personaDrivenPros: boolean | null;     // Prosが「〜したい方」形式か（ホテルのみ、他はnull）
    };
    categoryChecklist?: {                   // カテゴリ固有チェック
      comparisonTable: boolean | null;      // 比較表の設置（ホテルのみ、他はnull）
      affiliateMicroCopy: boolean | null;   // マイクロコピーの有無（ホテルのみ、他はnull）
      courseSpecs: boolean | null;           // コーススペックの明記（ランニングのみ、他はnull）
      runBadge: boolean | null;             // 実走評価バッジの設定（ランニングのみ、他はnull）
    };
    techChecklist?: {                       // 技術実装チェック（全ページ共通）
      nextImage: boolean;                   // Next.js <Image> の使用
      imageAlt: boolean;                    // 具体的なalt属性の付与
      affiliateRel: boolean;                // rel="noopener sponsored" の設定
    };
    strengths: string[];
    issues: Array<{ level: "高" | "中" | "低", text: string, isSpeculation?: boolean }>;
  };
}
\`\`\`
