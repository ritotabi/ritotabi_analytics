# プロジェクト名変更の実装計画 (ritotabi_analytics -> ritotabi_analytics)

プロジェクトの名称を `ritotabi_analytics` から `ritotabi_analytics` に統一し、設定ファイルおよびドキュメント内の記述を更新します。

## User Review Required

> [!IMPORTANT]
> **ディレクトリ名の変更について**
> エージェントは現在の作業ディレクトリを直接リネームすることができません。ファイル内容の修正完了後、ユーザー様ご自身でディレクトリ名を `ritotabi_analytics` から `ritotabi_analytics` に変更していただく必要があります。

> [!WARNING]
> **GitHub リポジトリ名の変更**
> GitHub上のリポジトリ名も変更される場合は、リモートURLの更新（`git remote set-url origin ...`）が必要になります。

## Proposed Changes

### Configuration Files

#### [MODIFY] [package.json](file:///home/mune1/dev/ritotabi/ritotabi_analytics/package.json)
- `name` フィールドを `ritotabi_analytics` に変更します。

#### [MODIFY] [package-lock.json](file:///home/mune1/dev/ritotabi/ritotabi_analytics/package-lock.json)
- `name` フィールド（2箇所）を `ritotabi_analytics` に変更します。

#### [MODIFY] [index.html](file:///home/mune1/dev/ritotabi/ritotabi_analytics/index.html)
- `<title>` タグの内容を `ritotabi_analytics` に変更します。

### Documentation

#### [MODIFY] [docs/agent/implementation_plan.md](file:///home/mune1/dev/ritotabi/ritotabi_analytics/docs/agent/implementation_plan.md)
- ファイルパスに含まれる `ritotabi_analytics` を `ritotabi_analytics` に置換します。

#### [MODIFY] [docs/agent/walkthrough.md](file:///home/mune1/dev/ritotabi/ritotabi_analytics/docs/agent/walkthrough.md)
- ファイルパスに含まれる `ritotabi_analytics` を `ritotabi_analytics` に置換します。

## Open Questions

- GitHubリポジトリ側の名称変更は既にお済みでしょうか？（未完了の場合、ファイル修正後に変更することをお勧めします）

## Verification Plan

### Automated Tests
- `grep -r "ritotabi_analytics" .` を実行し、想定外の箇所に古い名称が残っていないか確認します。

### Manual Verification
- `npm install` (または `npm list`) を実行し、`package-lock.json` が正しく整合しているか確認していただきます。
- ブラウザで `index.html` を開き、タイトルが更新されていることを確認します。
