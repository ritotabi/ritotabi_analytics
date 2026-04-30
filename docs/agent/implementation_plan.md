# コンダオ島 6ページの再評価実施計画

コンダオ島の日本語・英語各3ページ（ガイド、ホテル、ランニング）について、最新の評価仕様（v2.0）に基づき再評価を実施します。

## 目的
- 最新の評価基準（v2.0）への準拠確認
- 実装の最新化に伴うスコアの更新
- 収益予測（PV）の再算出

## 評価対象ページ
1.  **日本語 ガイド**: `/destinations/con-dao-island/`
2.  **日本語 ホテル**: `/hotels/con-dao-island/`
3.  **日本語 ランニング**: `/destinations/con-dao-island/running/`
4.  **英語 ガイド**: `/en/destinations/con-dao-island/`
5.  **英語 ホテル**: `/en/hotels/con-dao-island/`
6.  **英語 ランニング**: `/en/destinations/con-dao-island/running/`

## 実施フロー
各ページに対して以下のステップを順次実行します。

### 1. ソースコード調査
- `src/app` 以下の対応するディレクトリの `page.tsx` および `_data/meta.ts` 等を参照。
- コンポーネント（`_components/`）の実装内容を確認。
- 技術的チェック項目（`nextImage`, `imageAlt`, `affiliateRel`）の判定。

### 2. コンテンツ・ブランド評価
- ブランド品質チェック（`toneAndManner`, `firstPersonInsight` 等）の判定。
- カテゴリ固有の要素（比較表、スペック、バッジ等）の確認。
- アフィリエイト設計（CTA位置、マイクロコピー、複数OTA等）のスコアリング。

### 3. 収益予測の算出
- `eval_spec.md` および `market_data.md` に基づき、コンダオ島の市場規模（ニッチ）と季節性、難易度を考慮した24ヶ月分のPV予測を算出。

### 4. JSON生成・登録
- `src/evaluations/{id}.json` を作成または更新。
- `src/evaluations/_registry.json` を更新。

## 検証計画
- 生成されたJSONがスキーマに準拠しているか。
- スコア算出の根拠（strengths, issues）が事実に基づいているか。
- レジストリの情報が最新の評価結果と一致しているか。
