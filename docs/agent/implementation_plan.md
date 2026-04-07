# 石垣島・竹富島ランニングガイド (EN) 品質評価計画

## 概要
ユーザーから指定されたURL（https://ritotabi.com/en/destinations/ishigaki-island/running/）のコンテンツ品質を評価し、収益予測（PV予測）を含む評価レポート（JSON）を作成します。また、評価レジストリに追加することで、ダッシュボードに反映させます。

## 公開日
- 2026-04-05 (鮮度: new / 2日経過)

## 評価ステータス
- ページ内容取得: 完了
- テクニカルSEO分析: 完了 (curlにて確認済)
  - Title: Ishigaki & Taketomi Island Running Guide: Scenic Coastal & Cat Routes 2026 | RITOTABI
  - h1: (Titleと整合)
  - 独自写真: 18枚確認
  - FAQ JSON-LD: 存在を確認
- アフィリエイトリンク確認: 完了 (Agoda/Booking/Rakutenの複数OTA戦略を確認)

## 提案事項
### 1. 品質スコアリング (案)
- **コンテンツ独自性**: 90 (ランナー視点の具体的かつ実用的な現地情報)
- **写真・ビジュアル**: 85 (独自ドメイン画像18枚、機材の使い分けによるリアルな現地感)
- **アフィリエイト設計**: 95 (石垣島×英語戦略（Agodaメイン、Stay22サブ等）への適合)
- **内部リンク**: 90 (石垣島ガイド、ホテルまとめ等への適切な誘導)
- **SEO技術実装**: 95 (FAQリッチリザルト、タイトルKW、hreflangの設置を確認)
- **ユーザー体験 (UX)**: 92 (コースマップ代わりの詳細説明、利便情報の網羅)
- **英語品質**: 90 (没入感のあるコピー、自然な語彙選択)
- **Overall**: 91

### 2. 収益予測 (PVモデル)
- 公開2ヶ月目: 15 PV/月 (Tier 3 ランニングカテゴリ)
- 12ヶ月後以降: 450 PV/月 (Tier 3 成長上限付近)

## 変更内容

### [新規] [ishigaki_running_en.json](file:///home/mune1/dev/ritotabi/eval_site/ritotabi_analysis/src/evaluations/ishigaki_running_en.json)
- 評価スコア、チェックリスト、PV予測配列を格納。

### [修正] [_registry.json](file:///home/mune1/dev/ritotabi/eval_site/ritotabi_analysis/src/evaluations/_registry.json)
- `ishigaki_running_en` のエントリを追加。

## 検証プラン
### 自動テスト
- `npm run dev` 実行中の環境で、ダッシュボードの「石垣島 (英語)」セクションに評価カードが追加されていることを確認します。
- スコア詳細を開き、レーダーチャートとチェックリストが正しく反映されていることを確認します。
