# 月次レポート生成 & 予測キャリブレーションシステム — 実装ウォークスルー

## 変更概要

GA4 / Google Search Console / Bing WebMaster の月次データから自動でパフォーマンスレポートを生成し、予測のキャリブレーション（実績反映）を行うシステムを実装しました。予測の履歴を「ビンテージ」として保存し、予測精度の推移を追跡できます。

## 作成・変更ファイル

### 新規ファイル (12件)

| ファイル | 内容 |
|---|---|
| [report.ts](file:///home/mune1/dev/ritotabi/ritotabi_analytics/src/types/report.ts) | MonthlyReport 型定義 |
| [forecast.ts](file:///home/mune1/dev/ritotabi/ritotabi_analytics/src/types/forecast.ts) | ForecastVintage, ForecastHistory 型定義 |
| [forecast-vintages.json](file:///home/mune1/dev/ritotabi/ritotabi_analytics/src/data/forecast-vintages.json) | 予測履歴（v0初期 + v1キャリブレーション済み） |
| [202603.json](file:///home/mune1/dev/ritotabi/ritotabi_analytics/src/reports/202603.json) | 3月レポート |
| [202604.json](file:///home/mune1/dev/ritotabi/ritotabi_analytics/src/reports/202604.json) | 4月レポート |
| [ReportTab.tsx](file:///home/mune1/dev/ritotabi/ritotabi_analytics/src/components/ReportTab.tsx) | 月次レポート表示UI |
| [ForecastTab.tsx](file:///home/mune1/dev/ritotabi/ritotabi_analytics/src/components/ForecastTab.tsx) | 予実推移・ビンテージ比較UI |
| [SKILL.md](file:///home/mune1/dev/ritotabi/ritotabi_analytics/.agent/skills/monthly_report/SKILL.md) | レポート生成SKILL |
| [report_spec.md](file:///home/mune1/dev/ritotabi/ritotabi_analytics/.agent/skills/monthly_report/resources/report_spec.md) | レポート仕様書 |
| [stream_mapping.md](file:///home/mune1/dev/ritotabi/ritotabi_analytics/.agent/skills/monthly_report/resources/stream_mapping.md) | ストリームマッピングルール |
| [calibration_logic.md](file:///home/mune1/dev/ritotabi/ritotabi_analytics/.agent/skills/monthly_report/resources/calibration_logic.md) | キャリブレーション算出ロジック |
| [monthly_report_system.md](file:///home/mune1/dev/ritotabi/ritotabi_analytics/docs/agent/monthly_report_system.md) | 設計書 |

### 変更ファイル (2件)

| ファイル | 変更内容 |
|---|---|
| [actual-pv.ts](file:///home/mune1/dev/ritotabi/ritotabi_analytics/src/data/actual-pv.ts) | 4月の実績データ追加 |
| [App.tsx](file:///home/mune1/dev/ritotabi/ritotabi_analytics/src/App.tsx) | 月次レポート・予実推移タブ追加 |

## データ分析結果

### 4月 vs 3月（前月比）

| 指標 | 3月 | 4月 | 変化率 |
|---|---|---|---|
| 総PV | 1,437 | 2,679 | **+86.4%** |
| ユーザー | 329 | 548 | **+66.6%** |
| キーイベント | 36 | 393 | **+991.7%** |
| 売上 | ¥0 | ¥0 | — |

### キャリブレーション結果

初期予測（v0）は実績に対して**大幅に過小評価**（全体精度: 1067%）。主な乖離：

| ストリーム | v0予測 | 実績 | 乖離率 |
|---|---|---|---|
| jp_yoron | 7 | 185 | 26.4倍 |
| cjp (コンダオ) | 7 | 147 | 21倍 |
| jp_aka | 5 | 72 | 14.4倍 |
| jp_kume | 7 | 56 | 8倍 |
| jp_miyako | 75 | 352 | 4.7倍 |
| jp_ishigaki | 84 | 181 | 2.2倍 |

**ダンピング補正**（√factor）適用後のv1予測で、5月以降の予測値をより現実的な水準に更新。

## 検証結果

- ✅ `npx tsc --noEmit` — 型エラーなし
- ✅ `npm run build` — ビルド成功（422ms）
- ⏳ ダッシュボード動作確認 — ユーザーによるブラウザ確認待ち
