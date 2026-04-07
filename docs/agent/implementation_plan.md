# 石垣島英語ページのPV予測値の正常化および再発防止策の導入

## 目的
石垣島の英語ページ（ガイド・ホテル）のPV予測値が非現実的な立ち上がりとなっている問題を修正し、今後の評価において同様の「過大評価」が発生しないための制約を強化します。

## ユーザー確認事項
- 今回修正する数値は、ホイアン等の他エリアとのバランスを考慮し、「初期は低く、1年後以降にポテンシャルを発揮する」なだらかなカーブに設定します。

## 提出された変更内容

### 1. 石垣島評価データの修正

#### [MODIFY] [ishigaki_en.json](file:///home/mune1/dev/ritotabi/eval_site/ritotabi_analysis/src/evaluations/ishigaki_en.json)
- PV予測（pp, pn, po）を「スロースタート型」に修正。
- 5月（2ヶ月目）の通常ケース（pn）を 1000 → **50** PVに調整。
- 成熟期（24ヶ月目）の到達点を 13000 → **8500** PVに調整。

#### [MODIFY] [ishigaki_hotels_en.json](file:///home/mune1/dev/ritotabi/eval_site/ritotabi_analysis/src/evaluations/ishigaki_hotels_en.json)
- 5月（2ヶ月目）の通常ケース（pn）を 300 → **25** PVに調整。
- 成熟期（24ヶ月目）の到達点を 16000 → **5500** PVに調整。

### 2. 再発防止策（評価仕様の強化）

#### [MODIFY] [eval_spec.md](file:///home/mune1/dev/ritotabi/eval_site/ritotabi_analysis/.agent/skills/page_evaluator/resources/eval_spec.md)
- **PV予測のベンチマーク** セクションを新設。
- ティア（ドメイン/エリアの重要度）別の初期PV目安（月間50-100PV程度）を明記し、AIエージェントの極端な生成を防止します。

## オープンクエスチョン
- **他エリアへの波及**: 石垣島以外のページ（例：西表島、宮古島など）を評価する際も、この新基準（スロースタート型）を適用します。問題ありませんでしょうか。

## 検証プラン
- 数値修正後、ダッシュボードの成長グラフを確認し、他エリアと整合性の取れた推移になっていることを確認します。
