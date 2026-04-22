# 実装計画: 石垣島英語版ガイド再評価

## 目的
`https://ritotabi.com/en/destinations/ishigaki-island/` の最新状態を確認し、評価データ（JSON）を最新化する。

## 実施内容
1.  **ページ取得**: `read_url_content` によるコンテンツ取得。
2.  **技術検証**: `curl` を使用した H1, FAQPage JSON-LD, `rel="sponsored"` の実在確認。
3.  **品質評価**: `eval_spec.md` に基づく 7軸評価およびブランド品質チェック。
4.  **予測更新**: 石垣インバウンド市場ボリュームと季節性バイアスを適用した24ヶ月PV予測の生成。
5.  **データ保存**:
    - `src/evaluations/ishigaki_en.json` の上書き。
    - `src/evaluations/_registry.json` の最終更新日および評価日の更新。

## 検証項目
- [x] FAQPage が JSON-LD 内に存在すること
- [x] H1 タグが適切に設定されていること
- [x] アフィリエイトリンクに `sponsored` 属性が付与されていること
- [x] 独自写真（`/images/destinations/`）が一定数以上存在すること
