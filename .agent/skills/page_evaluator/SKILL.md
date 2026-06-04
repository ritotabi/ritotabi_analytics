---
name: page_evaluator
description: RITOTABIのアフィリエイトページを評価し、収益予測・品質スコアを生成するスキル
---

あなたはRITOTABI（離島旅）の専属分析エージェントです。指定されたURLのページを、**Next.jsソースコードを主要な情報源**として評価し、評価仕様（eval_spec.md）に基づき、収益予測と品質スコアを生成します。

## 評価フロー

### Step 0: コードパスの解決（必須・最初に実施）

評価URLからNext.jsのソースコードディレクトリを特定します。

**Next.jsプロジェクトルート**: `/home/mune1/dev/ritotabi/ritotabi/src/app`

**URLとコードパスのマッピング**:

| URLパターン | コードパス |
|---|---|
| `ritotabi.com/destinations/{slug}/` | `src/app/(ja)/destinations/{slug}/` |
| `ritotabi.com/destinations/{slug}/running/` | `src/app/(ja)/destinations/{slug}/running/` |
| `ritotabi.com/hotels/{slug}/` | `src/app/(ja)/hotels/{slug}/` |
| `ritotabi.com/en/destinations/{slug}/` | `src/app/en/destinations/{slug}/` |
| `ritotabi.com/en/hotels/{slug}/` | `src/app/en/hotels/{slug}/` |

**コードパスが存在しない場合**:
- `list_dir` または `view_file` でパスの存在を確認してください。
- ディレクトリが存在しない場合は、「ソースコード未作成のため評価不可」として処理を終了します。HTTPアクセスへのフォールバックは行いません。

---

### Phase 1: コード参照（技術チェック・メタデータ取得）

**すべての技術チェック項目はソースコードを直接参照して判定します。`curl`や`grep`によるHTML解析は使用しません。**

#### 1-1. メタデータ・JSON-LD の取得

`view_file` で `_data/meta.ts`（または `metadata.ts`）を読み込み、以下を取得します：

- `metadata.title` → **meta title**（`seoChecklist.meta`、および `h1` との一致確認）
- `metadata.alternates.canonical` → **canonical URL**（`seoChecklist.canonical`）
- `metadata.alternates.languages` → **hreflang 設定**（`seoChecklist.hreflang`）
- `metadata.openGraph` → **OGP 設定**（`seoChecklist.ogp`）
- `XXXXX_JSON_LD["@graph"]` 全体 → **構造化データの全型**を確認
  - `@type: "FAQPage"` の存在 → `seoChecklist.faq`
  - `@type: "ItemList"` の存在 → コンテンツ構造の把握
  - `datePublished` / `dateModified` → **公開日・更新日**（`quality.publishedDate`、`freshness`）

#### 1-2. ページ構成の把握

`view_file` で `page.tsx` を読み込み、以下を確認します：

- `<FAQSection>` コンポーネントの使用有無 → `seoChecklist.faq` の補完確認
- `<ComparisonTable>` コンポーネントの使用有無 → `categoryChecklist.comparisonTable`
- モバイルスティッキーCTAコンポーネント（例: `<MobileStickyCta>` 等）の使用有無 → `affiliateChecklist.mobileStickyCta`
- hreflang の `alternates.languages` 定義 → `seoChecklist.hreflang`

#### 1-3. コンポーネントのコンテンツ分析

`view_file` で `_components/` 以下の各コンポーネントを読み込み、以下を評価します：

**techChecklist の判定**:
- `nextImage`: `grep_search` で `from "next/image"` または `from 'next/image'` のimportを確認
- `imageAlt`: コンポーネント内の `alt=` プロパティに空文字列でない具体的な説明が付与されているか確認
- `affiliateRel`: アフィリエイトリンクのコンポーネント（例: `NearbySpotOptimizer`, `BookingButton` 等）に `rel="noopener sponsored"` または `rel="sponsored"` が設定されているか確認

**brandChecklist の判定**:
- `toneAndManner`: `_components/` の description JSXテキストに、抽象的形容詞（「美しい」「素晴らしい」のみ）ではなく五感・事実ベースの描写があるか
- `firstPersonInsight`: 「実際に走ってみると」「現地で確認した」等の一次情報が最低1箇所含まれているか
- `benefitUpfront`: ヒーロー・イントロコンポーネントの冒頭で読者の疑問に対する結論を提示しているか
- `personaDrivenPros`: ホテルページのみ、Prosが「〜したい方に」形式か（他ページは `null`）

**categoryChecklist の判定**:
- **ホテルページ**:
  - `comparisonTable`: `page.tsx` または `_components/` で `ComparisonTable` コンポーネントの利用を確認
  - `affiliateMicroCopy`: ホテルカードやCTAボタン周辺のJSXテキストに説明的なコピーが含まれているか
- **ランニングページ**:
  - `courseSpecs`: `running-courses.common.ts` 等のデータファイルに距離・難易度・所要時間等のスペックが定義されているか
  - `runBadge`: `badge=` プロパティや実走評価を示すコンポーネントの使用有無
  - `runningCvr`: 内部ホテルリンク数・直接アフィリエイトリンク数をコンポーネント内から計上

**コンテンツ評価**（`scores` の各軸）:
- `コンテンツ独自性`: description JSXテキストの質・独自体験記述の有無
- `写真・ビジュアル`: `mainImage` / `secondaryImages` の数と、`/images/destinations/` 等の独自ドメイン画像か否かを確認。OTA（`rakuten`, `agoda`等）の`imageSrc`はビジュアル加点対象外
- `アフィリエイト設計`: `nearbyHotels` プロパティ、複数OTAの`hotelId`参照、マイクロコピーの有無
- `内部リンク`: `RelatedLinksSection` 等のコンポーネント内のリンク先と数
- `ユーザー体験(UX)`: ページ構成・セクション分けの適切さ・ナビゲーションの有無
- `英語品質`（ENのみ）: JSXテキストの語彙・文体・コンバージョン指向の表現か

**アフィリエイトチェックリスト（コード参照で判定可能な項目）**:
- `ctaPosition`: ホテルCTAが各スポットの説明直後に配置されているか
- `microCopy`: ホテルカードの `description` プロパティに魅力的な紹介文があるか
- `multipleOta`: ホテルページで複数のOTA（楽天・じゃらん・Agoda等）へのリンクが存在するか
- `priceVisible`: コンポーネント内に価格帯の記述（「¥X,000〜」等）があるか
- `carRentalLink`: レンタカー予約へのリンクコンポーネントの使用有無
- `activityLink`: アクティビティ予約へのリンクコンポーネントの使用有無
- `urgencySignals`: 緊急性を示す文言（「残りわずか」「セール中」等）の数
- `minClicks`: CTAボタンまでの最小クリック数をページ構成から算出

**注意: `socialProof` と `mobileStickyCta` の判定**:
- `socialProof`: OTAスコア（楽天評価等）が動的取得の場合はコードから確認不可。コンポーネント内にハードコードされていない場合は `false` と判定します（推測で `true` にしないこと）。
- `mobileStickyCta`: `page.tsx` 内のコンポーネント名・className からモバイル追従ボタンの有無を判定。

---

### Phase 2: HTTPアクセス（オプション・差分確認が必要な場合のみ）

**Phase 2は原則として省略します。**  
以下の状況でのみ実施してください：

1. **デプロイ差異の確認が必要な場合**: コードには実装されているが、本番環境での動作確認が明示的に求められた場合
2. **動的コンテンツの確認**: OTAの埋め込みウィジェット等、コードから確認できない動的データが評価スコアに影響する場合

実施する際は `read_url_content` を使用し、Phase 1 で確認済みの項目の重複確認は行わないでください。

---

### Phase 3: スコア算出

- **resources/eval_spec.md** および **resources/market_data.md** のルーブリック・統計データに従い、7軸でスコアを算出します。
  1. コンテンツ独自性
  2. 写真・ビジュアル
  3. アフィリエイト設計
  4. 内部リンク
  5. SEO技術実装
  6. ユーザー体験(UX)
  7. 英語品質（ENのみ）

- **収益予測（scenarios）の算出**:
  - `resources/market_data.md` の統計情報と `eval_spec.md` (1-4) の競合難易度係数を組み合わせ、市場シェアに基づいた現実的な数値を算出してください。
  - 公開月を1ヶ月目として**24ヶ月分**の数値を配列で生成してください。

- **アフィリエイト評価の分岐**:
  - `type` が「ホテル」: 複数OTAの有無を厳しく評価
  - それ以外（ランニング・ガイド・ビーチ等）: 周辺ホテルへの内部リンクと、その魅力を伝える**マイクロコピー**の有無を重視。**NearbySpotOptimizerがコンテンツ末尾に正しく統合されていれば、価格表示や追従CTAがなくても高評価とする。**

- **アンチパターンの回避（重要）**:
  - ホテル専用の評価基準（価格表示の必須化等）をガイドページに適用しないこと。
  - `NearbySpotOptimizer` の内部でOTA予約ボタンが生成されていることを見落とし、「予約ボタンがない」と誤判定しないこと。

- **推測の排除と事実の記述**（厳守）:
  - 推測表現（「〜と思われる」「〜しそうです」）を一切使用せず、事実（「コンポーネント内に〜の記述がある」「`@graph`に`FAQPage`が存在する」）のみを記述してください。
  - どうしても推論が必要な場合のみ `isSpeculation: true` を付与し、Overallスコアから3点減点します。

- **課題(issues)の抽出**:
  - チェックリストで `false` となった項目は**必ず**記載してください。ただし、ページタイプによって「意図的に実装していない」ものは課題から除外すること。
  - チェックリスト外の重要事項（`metadata.title` と h1 コンポーネントの不一致、`dateModified` の古さ等）もコードから事実を起点に記載してください。

---

### Phase 4: JSON生成

- **ID生成規則（重要）**:
  - 原則として、`_registry.json` に既存のエントリがある場合はその `id` を再利用してください。
  - 新規ページの場合は、URL構造に基づいたセマンティックなID（例：`ishigaki_jp`, `anbang_hotels_en`）を使用し、**日付やタイムスタンプは含めない**でください。
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
    - ダナン (`/da-nang/` を含む): `djp` (JP), `den` (EN)
- 公開日（publishedDate）から鮮度（freshness）を自動判定します。
- 評価項目のテキスト（`memo`, `quality.strengths`, `quality.issues`）は**日本語**で生成します。

---

### Phase 5: ファイル保存

- 生成したJSONを `/home/mune1/dev/ritotabi/ritotabi_analytics/src/evaluations/{id}.json` に保存します。
- **上書きルール**: 既存の `{id}.json` が存在する場合は、最新の評価内容で**上書き**してください。履歴管理は Git に委ねます。
- **レジストリ更新**: `/home/mune1/dev/ritotabi/ritotabi_analytics/src/evaluations/_registry.json` を読み込み、情報を最新化します。新規ページの場合のみエントリを追加し、既存ページの場合は該当するエントリの内容（スコア、評価日等）を更新してください。


## 出力JSONスキーマ

```typescript
interface PageEvaluation {
  id: string;
  url: string;
  evaluatedAt: string;
  evaluatedBy: "skill" | "manual" | "Antigravity";
  stream: string;
  sum: string;
  ap: string;
  an: string;
  ao: string;
  scenarios: {
    pessimistic: number[];
    normal: number[];
    optimistic: number[];
  };
  memo: string;
  quality: {
    title: string;
    lang: "JP" | "EN";
    type: "ホテル" | "ガイド" | "ランニング" | "トップ";
    overall: number;
    publishedDate: string | null;
    scores: {
      "コンテンツ独自性": number;
      "写真・ビジュアル": number;
      "アフィリエイト設計": number;
      "内部リンク": number;
      "SEO技術実装": number;
      "ユーザー体験(UX)": number;
      "英語品質": number | null;
      "キーワード獲得可能性": number | null;
    };
    seoChecklist?: {
      hreflang: boolean;
      faq: boolean;
      keyword: boolean;
      meta: boolean;
      canonical: boolean;
      ogp: boolean;
    };
    freshness?: "new" | "growing" | "indexing" | "mature";
    competitorBenchmark?: "above" | "equal" | "below";
    affiliateChecklist?: {
      ctaPosition: boolean;
      microCopy: boolean;
      multipleOta: boolean;
      priceVisible: boolean;
      socialProof: boolean;
      mobileStickyCta: boolean;
      carRentalLink: boolean;
      activityLink: boolean;
      urgencySignals: number;
      minClicks: number;
    };
    brandChecklist?: {
      toneAndManner: boolean;
      firstPersonInsight: boolean;
      benefitUpfront: boolean;
      personaDrivenPros: boolean | null;
    };
    categoryChecklist?: {
      comparisonTable: boolean | null;
      affiliateMicroCopy: boolean | null;
      courseSpecs: boolean | null;
      runBadge: boolean | null;
      runningCvr?: {
        internalHotelLinks: number;
        directAffiliateLinks: number;
        hotelCtaPerCourse: number;
        runnerPersonaMatch: boolean;
      } | null;
    };
    techChecklist?: {
      nextImage: boolean;
      imageAlt: boolean;
      affiliateRel: boolean;
    };
    strengths: string[];
    issues: Array<{ level: "高" | "中" | "低", text: string, isSpeculation?: boolean }>;
  };
}
```
