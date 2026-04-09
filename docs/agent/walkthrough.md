# 修正内容の確認 (Walkthrough) - プロジェクト名変更

プロジェクト名を `ritotabi_analysis` から `ritotabi_analytics` に変更する作業が完了しました。

## 実施内容

以下のファイルにおいて、古い名称 `ritotabi_analysis` を `ritotabi_analytics` に置換しました。

### 1. 設定ファイルの更新
- **[package.json](file:///home/mune1/dev/ritotabi/ritotabi_analytics/package.json)**: `name` フィールドを更新しました。
- **[package-lock.json](file:///home/mune1/dev/ritotabi/ritotabi_analytics/package-lock.json)**: 内部のプロジェクト名参照を更新しました。
- **[index.html](file:///home/mune1/dev/ritotabi/ritotabi_analytics/index.html)**: `<title>` タグの内容を更新しました。

### 2. スキル定義の更新
- **[.agent/skills/page_evaluator/SKILL.md](file:///home/mune1/dev/ritotabi/ritotabi_analytics/.agent/skills/page_evaluator/SKILL.md)**: 評価データの保存先パスに含まれるプロジェクト名を更新しました。

### 3. ドキュメントの更新
- **[docs/agent/implementation_plan.md](file:///home/mune1/dev/ritotabi/ritotabi_analytics/docs/agent/implementation_plan.md)**: ファイルパスの記述を更新しました。
- **[docs/agent/walkthrough.md](file:///home/mune1/dev/ritotabi/ritotabi_analytics/docs/agent/walkthrough.md)**: 過去のログに含まれる絶対パスを更新しました。

## 検証結果

- `grep` コマンドによる全体走査を行い、`dist/` フォルダ（ビルド生成物）以外のソースコードおよびドキュメント内に `ritotabi_analysis` が残っていないことを確認しました。

## ユーザー様へのお願い（重要）

> [!IMPORTANT]
> **ディレクトリ名のリネーム**
> エージェントは現在の物理ディレクトリ名を変更できません。本作業完了後、ターミナル等で以下のコマンドを実行し、ディレクトリ名を変更してください。
> ```bash
> mv ritotabi_analysis ritotabi_analytics
> ```

> [!TIP]
> **GitHub での作業**
> GitHub 上のリポジトリ名も変更される場合は、以下のコマンドでリモートURLを更新してください。
> ```bash
> git remote set-url origin https://github.com/ritotabi/ritotabi_analytics.git
> ```
