# 実装計画：コンダオ島関連ページ（計6件）の再評価と分析JSONの更新

コンダオ島の日本語・英語各3ページ（計6ページ）について、RITOTABI 評価仕様 v2.0 に基づいた詳細な再評価を実施し、分析データを最新化します。

## ユーザーレビューが必要な事項

> [!IMPORTANT]
> - 今回の評価は、ソースコードから抽出した「事実（テクニカルSEOの実装状況、独自写真の有無、CVR向上のための施策等）」に基づき、最新の市場データ（ニッチ市場）を適用して算出します。
> - 収益予測は、コンダオ島の高級リゾート（シックスセンシズ等）の高い客単価を考慮した重み付けを行います。

## 対象ページ
1.  [日本語] 総合ガイド: `/destinations/con-dao-island/`
2.  [日本語] ホテルガイド: `/hotels/con-dao-island/`
3.  [日本語] ランニングガイド: `/destinations/con-dao-island/running/`
4.  [英語] 総合ガイド: `/en/destinations/con-dao-island/`
5.  [英語] ホテルガイド: `/en/hotels/con-dao-island/`
6.  [英語] ランニングガイド: `/en/destinations/con-dao-island/running/`

## 提案される変更内容

### [分析データの生成と更新]

#### [MODIFY] [condao_guide_jp.json](file:///home/mune1/dev/ritotabi/ritotabi_analytics/src/evaluations/condao_guide_jp.json)
- v2.0仕様に合わせたスコアリング（技術SEO: 100, コンテンツ: 100, マネタイズ: 95）。
- ニッチ市場向けPV予測（24ヶ月で1,200PV/月）の反映。

#### [MODIFY] [condao_hotels_jp.json](file:///home/mune1/dev/ritotabi/ritotabi_analytics/src/evaluations/condao_hotels_jp.json)
- 比較表、複数OTA対応、マイクロコピー実装状況に基づきマネタイズスコアを100に設定。
- 高単価アフィリエイトを想定した収益曲線の生成。

#### [MODIFY] [condao_running_jp.json](file:///home/mune1/dev/ritotabi/ritotabi_analytics/src/evaluations/condao_running_jp.json)
- 実走データに基づく独自性を評価。ニッチ特化型の集客予測。

#### [MODIFY] [condao_guide_en.json](file:///home/mune1/dev/ritotabi/ritotabi_analytics/src/evaluations/condao_guide_en.json)
- 英語コピーの品質とテクニカルSEO（Hreflang等）の完璧な実装を評価。

#### [MODIFY] [condao_hotels_en.json](file:///home/mune1/dev/ritotabi/ritotabi_analytics/src/evaluations/condao_hotels_en.json)
- 英語圏ユーザー向けの高単価ホテル予約導線を評価。

#### [MODIFY] [condao_running_en.json](file:///home/mune1/dev/ritotabi/ritotabi_analytics/src/evaluations/condao_running_en.json)
- インバウンドランナー向けの希少情報を評価。

#### [MODIFY] [_registry.json](file:///home/mune1/dev/ritotabi/ritotabi_analytics/src/evaluations/_registry.json)
- 各エントリの `lastEvaluated` を更新し、`v2.0` フラグを付与。

## 検証計画

### 手動検証
- 生成されたJSONファイルが `eval_spec.md` のスキーマに準拠しているか確認。
- `_registry.json` との整合性（ID、ファイル名）を確認。
- 各ページのスコアが、調査したソースコードの品質（画像枚数、SEO実装）と矛盾していないか論理チェック。
