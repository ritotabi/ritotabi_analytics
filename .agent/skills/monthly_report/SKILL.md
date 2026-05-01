---
name: monthly_report
description: 毎月のGA4/GSC/Bingデータから月次パフォーマンスレポートを生成し、予測のキャリブレーションを行うスキル
---

あなたはRITOTABI（離島旅）の専属分析エージェントです。毎月月初に、前月のパフォーマンスデータを分析し、月次レポートの生成と予測のキャリブレーションを行います。

## 前提条件

ユーザーから以下の情報が提供されます：
- 対象月（例: "202605"）
- 売上金額（円）
- `src/data/actual_dl/` に以下の3ファイルが配置済み:
  - `YYYYMM.csv` (GA4)
  - `YYYYMM_google.csv` (GSC)
  - `YYYYMM_bing.csv` (Bing)

## 実行フロー

### Step 1: データ読み込みと検証

以下のファイルを `view_file` で読み込み、内容を確認します：

```
src/data/actual_dl/YYYYMM.csv        ← GA4（ページパス、PV、ユーザー、エンゲージメント時間、キーイベント、収益）
src/data/actual_dl/YYYYMM_google.csv  ← GSC（ページURL、クリック数、表示回数、CTR、掲載順位）
src/data/actual_dl/YYYYMM_bing.csv    ← Bing（ページURL、Impressions、Clicks、CTR、Avg Position）
```

また、以下を参照します：
- `src/data/forecast-vintages.json` — 最新ビンテージの予測値（予実対比用）
- `src/reports/前月.json` — 前月レポート（前月比計算用、存在する場合のみ）

### Step 2: ストリームマッピング

GA4のページパスを以下のルールでストリームに分類します（詳細は `resources/stream_mapping.md` を参照）：

| URLパターン | ストリーム |
|---|---|
| `/destinations/ishigaki-island/*` | `jp_ishigaki` |
| `/en/destinations/ishigaki-island/*` | `en_ishigaki` |
| `/destinations/miyako-island/*` | `jp_miyako` |
| `/en/destinations/miyako-island/*` | `en_miyako` |
| `/destinations/yoron-island/*` | `jp_yoron` |
| `/destinations/kume-island/*` | `jp_kume` |
| `/destinations/aka-island/*` | `jp_aka` |
| `/destinations/amami-island/*` | `jp_amami` |
| `/en/destinations/amami-island/*` | `en_amami` |
| `/destinations/con-dao-island/*`, `/hotels/con-dao-island/*` | `cjp` |
| `/en/destinations/con-dao-island/*`, `/en/hotels/con-dao-island/*` | `cen` |
| `/destinations/cham-island/*`, `/hotels/hoian-old-town/*`, `/hotels/an-bang/*`, `/destinations/hoi-an/*`, `/destinations/an-bang/*` | `hjp` |
| `/en/` 始まりの上記ベトナム系 | `hen` |
| `/` (トップ), `/hotels/okinawa-main/*`, その他JP | `jp_other` |
| `/en/`, その他EN | `en_other` |

**注意**: GSC/Bingデータの `/images/` パスは検索パフォーマンス分析から除外すること。

### Step 3: レポートJSON生成

`resources/report_spec.md` に従い、以下の7セクションを算出してレポートJSONを生成します：

1. **サマリー**: 総PV/ユーザー/キーイベント/売上、前月比（前月データがあれば）、ハイライト3項目
2. **トラフィック**: ストリーム別PV、言語別内訳、Top 10ページ、新規ページ検出
3. **検索パフォーマンス**: Google/Bing各サマリー、検索エンジン比較、CTR 0%改善機会ページ
4. **エンゲージメント**: 高/低エンゲージメントページ、キーイベント発生ページ
5. **コンバージョン**: CV発生ページ、ホテルCV集中度
6. **予実対比**: forecast-vintages.jsonの最新予測 vs 実績、予測精度
7. **アクションアイテム**: CTR改善/エンゲージメント改善/CVポテンシャルの自動生成

**出力先**: `src/reports/YYYYMM.json`

**型定義**: `src/types/report.ts` の `MonthlyReport` インターフェースに準拠

### Step 4: キャリブレーション（予測更新）

`resources/calibration_logic.md` に従い、予測のキャリブレーションを行います：

1. **補正係数の算出**: ストリーム別に `actual_pv / forecast_pv` を計算
2. **ダンピング係数の適用**: 初期の大幅な乖離は成長曲線の開始点のずれが主因のため、`sqrt(factor)` で中間的な補正を適用
3. **新ビンテージの生成**: `src/data/forecast-vintages.json` に新しいビンテージを追加
4. **baseline-pv.ts の更新**: 最新ビンテージの予測値で上書き（既存ロジックとの互換性維持）

### Step 5: actual-pv.ts 更新

`src/data/actual-pv.ts` に当月の実績データを追加します：

```typescript
{
  m: "MonYY",  // 例: "May'26"
  mp: "N月",   // 例: "5月"
  pv: {
    jp_yoron: XXX,
    jp_miyako: XXX,
    // ... ストリーム別PV
  },
  rev: {
    // ... 全ストリーム: 売上額（売上がない場合は0）
  }
}
```

### Step 6: ビルド検証

```bash
npm run build
```

でビルドエラーがないことを確認します。

---

## 出力ファイル一覧

| ファイル | アクション |
|---|---|
| `src/reports/YYYYMM.json` | 新規作成 |
| `src/data/forecast-vintages.json` | ビンテージ追加 |
| `src/data/actual-pv.ts` | 実績データ追加 |
| `src/data/baseline-pv.ts` | 最新予測で更新 |

## 注意事項

- **推測の排除**: データに基づかない推測は行わない。不明な値は `null` とする。
- **ハイライトの自然言語**: `summary.highlights` は分析者の視点で、データの背景にある意味を簡潔に記述する。
- **前月比較**: 前月レポートが存在しない場合、`momComparison` は省略する。
- **新規ストリーム**: v0予測にないストリーム（例: `jp_amami`）が実績に現れた場合、類似ストリームの係数を参考に控えめな補正係数を設定する。
