# 石垣島・竹富島ガイド（英語版）のページ評価実装計画

https://ritotabi.com/en/destinations/ishigaki-island/ の評価結果をシステムに登録します。

## ユーザーレビュー要求事項

> [!IMPORTANT]
> 収益ストリームの選択について：ユーザー様からのフィードバックに基づき、日本エリアの英語ページには `ren`（日本離島 英語）という新しいストリームを定義します。
> 構成：メイン Agoda / サブ1 Booking.com（Stay22経由）、サブ2 楽天。
> 予測パラメータは、既存の英語ストリーム（cen/hen）に近い値（CVR 0.008, 単価 2000）を暫定的に設定します。

## 提案される変更

### 評価データコンポーネント

#### [NEW] [ishigaki_en.json](file:///home/mune1/dev/ritotabi/eval_site/ritotabi_analysis/src/evaluations/ishigaki_en.json)
- 指定されたURLの分析結果（スコア、チェックリスト、課題）を格納した新規JSONファイル。
- 公開日（2026-04-06）に基づき、鮮度を `new` として評価。

#### [MODIFY] [_registry.json](file:///home/mune1/dev/ritotabi/eval_site/ritotabi_analysis/src/evaluations/_registry.json)
- 新しい収益ストリーム `ren`（日本離島 英語）を `streams` に追加します。
- `ishigaki_en` を `evaluations` オブジェクトに追加し、`stream` を `ren` に設定します。

## 検証計画

### 自動テスト / 手動検証
- `npm run dev` で起動中のダッシュボードを確認し、石垣島のデータが表示され、収益予測が「公開直後」のカーブ（ほぼ0から開始）に沿っていることを確認します。
- JSON のスキーマが適切であることを確認します。
