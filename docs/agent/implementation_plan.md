# SKILLへの評価ロジック・統計データの組み込み計画

今回定義した「市場規模 × 競合難易度」に基づくPV予測ロジックを `page_evaluator` スキルに統合し、今後の評価作業で高い精度を維持できるようにします。

## 変更の目的
これまでの評価はエージェントの一般的な知識や限定的な基準に基づいていましたが、今回の石垣島やホイアンの統計情報、および競合性を考慮した「妥当な予測係数」をスキル内に明文化することで、誰が（あるいはどのエージェントが）実行しても一貫した予測を出せるようにします。

## 提案される変更

### [Component Name] `page_evaluator` スキル

#### [MODIFY] [SKILL.md](file:///home/mune1/dev/ritotabi/ritotabi_analytics/.agent/skills/page_evaluator/SKILL.md)
- `Step 2: ページ分析` において、`resources/market_data.md` を参照してシミュレーション値を算出するよう、指示文を強化します。

#### [MODIFY] [eval_spec.md](file:///home/mune1/dev/ritotabi/ritotabi_analytics/.agent/skills/page_evaluator/resources/eval_spec.md)
- PV予測（pp, pn, po）の算出ロジックとして、「ベースラインに対する期待貢献度」と「市場浸透率（Penetration Rate）」の概念を追記します。

#### [MODIFY] [baseline_pv.json](file:///home/mune1/dev/ritotabi/ritotabi_analytics/.agent/skills/page_evaluator/resources/baseline_pv.json)
- 今回修正した `src/data/baseline-pv.ts` と内容を同期させ、最新のベースラインをスキルが把握できるようにします。

#### [MODIFY] [streams.json](file:///home/mune1/dev/ritotabi/ritotabi_analytics/.agent/skills/page_evaluator/resources/streams.json)
- `jp_ishigaki`, `en_ishigaki` 等の実際のストリームキーを含むよう、最新のレジストリと同期させます。

#### [NEW] [market_data.md](file:///home/mune1/dev/ritotabi/ritotabi_analytics/.agent/skills/page_evaluator/resources/market_data.md)
- 石垣島、宮古島、ホイアン、コンダオ島の観光統計（入域数、日英比率）を記録し、評価の根拠として利用可能にします。

## 検証プラン

- スキルを適用して、テスト的に石垣島の評価値を再算出させ、今回修正した数値と矛盾がないかを確認します。
