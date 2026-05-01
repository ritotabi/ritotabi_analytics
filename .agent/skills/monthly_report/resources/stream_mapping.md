# ストリームマッピングルール

GA4のページパスおよびGSC/BingのURLから、RITOTABIのストリーム（収益分析単位）を判定するルールです。

## マッピング優先順

URLに含まれるスラッグ（島名・地名）で判定します。`/en/` で始まるパスは英語版として扱います。

### 日本国内離島

| スラッグ | JP ストリーム | EN ストリーム |
|---|---|---|
| `ishigaki-island` | `jp_ishigaki` | `en_ishigaki` |
| `miyako-island` | `jp_miyako` | `en_miyako` |
| `yoron-island` | `jp_yoron` | — |
| `kume-island` | `jp_kume` | — |
| `aka-island` | `jp_aka` | — |
| `amami-island` | `jp_amami` | `en_amami` |
| `okinawa-main` | `jp_other` | `en_other` |

### ベトナム

| スラッグ | JP ストリーム | EN ストリーム |
|---|---|---|
| `con-dao-island` | `cjp` | `cen` |
| `cham-island` | `hjp` | `hen` |
| `hoian-old-town` | `hjp` | `hen` |
| `hoi-an` | `hjp` | `hen` |
| `an-bang` | `hjp` | `hen` |

### フォールバック

| パス | ストリーム |
|---|---|
| `/` (完全一致) | `jp_other` |
| `/en/` (完全一致) | `en_other` |
| `/en/` で始まるその他 | `en_other` |
| その他すべて | `jp_other` |

## GSC/Bing URL の処理

- フルURL（`https://ritotabi.com/...`）のドメイン部分を除去してパスのみで判定
- `/images/` を含むURL（画像検索結果）は検索パフォーマンス分析から除外
