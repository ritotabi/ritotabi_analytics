# 月間PVの実績値（Actual）取り込みと評価への活用

ユーザーがGoogle Analytics（GA4）等から取得した実績PVをシステムに取り込み、現在の予測値（Forecast）と突き合わせて表示・分析できるようにします。

## ユーザーへの確認事項

> [!IMPORTANT]
> 実績値の取り込み方法について、まずは以下のような**手動入力（TSファイルへの記述）**をベースとした基盤作成を提案しますが、よろしいでしょうか？
> 
> 1. `src/data/actual-pv.ts` というファイルを用意し、そこに月ごとの実数値を書き込む。
> 2. システムがその値を読み込み、予測値との比較（「実績」と「予測」の乖離など）を自動計算する。
> 
> ※ Google Analytics APIを用いた完全自動取得も可能ですが、これにはGoogle Cloudでのプロジェクト作成や認証情報（JSON）の発行など、ユーザー側での環境構築が必要になります。まずは「実績値を表示できる器」を先に作ることをお勧めします。

## 提案する変更点

### 1. データ構造の拡張

#### [NEW] [actual-pv.ts](file:///home/mune1/dev/ritotabi/ritotabi_analytics/src/data/actual-pv.ts)
- 月ごとの実績PVを保持するオブジェクトを定義します。
- `baseline-pv.ts` と同じフォーマット、または日付をキーとしたシンプルな構造を採用します。

#### [MODIFY] [calc.ts](file:///home/mune1/dev/ritotabi/ritotabi_analytics/src/utils/calc.ts)
- `CalculatedRow` インターフェースを拡張し、`actualTotal` や `isActual`（その月が実績期間かどうか）を追加します。
- 計算ロジックの中で、実績値がある月は実績値を優先し、予測値との差分（Variance）を算出するようにします。

### 2. UIの更新

#### [MODIFY] [ChartTab.tsx](file:///home/mune1/dev/ritotabi/ritotabi_analytics/src/components/ChartTab.tsx)
- Rechartsのグラフに「実績値」のプロットを追加します。
- 実績期間は「実線」、将来の予測期間は「点線」や透過度の変更などで視覚的に区別します。

#### [MODIFY] [TableTab.tsx](file:///home/mune1/dev/ritotabi/ritotabi_analytics/src/components/TableTab.tsx)
- 表の中に「実績値」列を追加。
- 予測（Target）との達成率や乖離を表示し、評価のフィードバックに使えるようにします。

#### [MODIFY] [App.tsx](file:///home/mune1/dev/ritotabi/ritotabi_analytics/src/App.tsx)
- 新しく作成する `actual-pv.ts` をインポートし、計算エンジンに渡すようにします。

## 開封の質問

> [!NOTE]
> 1. Google Analyticsから実績値を取得する際、どの期間（月単位、日単位など）で比較したいなどのご希望はありますか？
> 2. 現在の予測値（`baseline-pv.ts`）は2026年4月から始まっていますが、過去の実績値も遡って表示したいでしょうか？

## 検証計画

### 自動テスト
- `calc.ts` のロジックに対して、実績値が含まれる場合の合計値や乖離計算が正しいかテストします。

### 手動確認
- `actual-pv.ts` にダミーの実績データを入力し、グラフと表に正しく反映される（実績と予測が併記される）ことをブラウザで確認します。
