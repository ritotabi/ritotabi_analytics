# UI表示の微調整（月表示・フォント・配色）計画

### ユーザーレビューが必要な項目

> [!IMPORTANT]
> - 合計列の色を `PINK` から `TEAL` または `SLATE` に変更します。これにより「ホイアン/チャム 英語」ストリームの色と重複しなくなり、視認性が向上します。
> - 数字フォントにはオリジナル (v8) で多用されていた `monospace` を適用し、読みやすさを向上させます。

## 提案される変更点

### UI/UX の改善

#### [MODIFY] [TableTab.tsx](file:///home/mune1/dev/ritotabi/eval_site/ritotabi_analysis/src/components/TableTab.tsx)
- 表の左端の月表示を `{row.m}` (英語) から `{row.mp}` (日本語) に変更します。
- 金額、PV数、スコアなどの数値セルに `fontFamily: "monospace"` を適用します。
- 「月次合計」「累計合計」「フッターの合計」の色を `PINK` から変更します。

#### [MODIFY] [OverviewTab.tsx](file:///home/mune1/dev/ritotabi/eval_site/ritotabi_analysis/src/components/OverviewTab.tsx)
- 収益額やPV数などの数値表示部分に `fontFamily: "monospace"` を追加します。

#### [MODIFY] [QualityTab.tsx](file:///home/mune1/dev/ritotabi/eval_site/ritotabi_analysis/src/components/QualityTab.tsx)
- サマリー統計やカード内のスコア表示に `fontFamily: "monospace"` を徹底します。
