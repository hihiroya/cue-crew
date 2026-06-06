# AGENTS.md

このリポジトリで作業するエージェント向けの運用メモです。

## 基本方針

- 実装コストは考慮せずに最良の案を提示してください。
- ハング防止のため、コマンドは並列実行せず、可能な限り単独実行してください。
- 確認事項が発生した場合は作業を中断して質問してください。
- GitHub 操作については、gh CLI よりも GitHub コネクタ/プラグインを優先してください。
- `gh` を使う時は、`127.0.0.1:9` の proxy 環境変数を一時的に空にしてから実行してください。
- サプライチェーン攻撃の対策のため、依存を追加・更新する場合は、`package.json` と `package-lock.json` の差分を説明し、新しく入った direct dependency と install script を持つ dependency を報告してください。

## Source of Truth

- 実装構成、変更範囲ごとの担当ファイル、保存キー、確認コマンドは `docs/development-maintenance.md` を最新の source of truth としてください。
- UI確認の詳細は `docs/ui-verification-workflow.md` を参照してください。
- repo 専用 Codex skill は `.codex/skills/cue-crew-maintainer/SKILL.md` を source of truth とします。個人環境の同名 skill と矛盾する場合は repo 内 skill を優先してください。
- この文書、`package.json` の scripts、`docs/development-maintenance.md`、repo 内 skill が矛盾する場合は、より具体的で最新の repo 内ファイルを優先し、必要に応じて矛盾を解消してください。

## 標準確認

- 採点、イベント重み、日替わり補正、型ボーナス、称号/図鑑条件を変更した場合は、`npm run test:logic` に加えて `npm run balance:report -- --samples=48` で主要戦略とイベント分布を確認してください。
- 通常の UI 変更後は `npm run verify:ui` ではなく、PNG を生成しない `npm run check:ui` を標準確認にしてください。
- 軽微な CSS/文言/余白修正では、必要に応じて `npm run check:ui:prep` / `npm run check:ui:response` / `npm run check:ui:result` のように影響範囲だけ確認してください。
- スクリーンショット確認は通常使いません。`npm run verify:ui:full` は共通レイアウト、レスポンシブ全体、状態分岐の大改修、PR前に明示的に必要な場合、またはユーザーが指示した場合だけ使ってください。
- `tmp/screenshots/` は作業用キャッシュで、PNG は原則コミットしません。通常は `tmp/screenshots/ui-critical/` だけ残し、PR には代表画像だけ添付してください。

## ドキュメント更新

- repo 構成、確認コマンド、保存キー、主要責務、UI固定シナリオ、採点/バランス確認の導線を変更した場合は、`docs/development-maintenance.md` と `.codex/skills/cue-crew-maintainer/SKILL.md` の更新要否を確認してください。
- 依存追加・更新を行った場合は、必要に応じて `CONTRIBUTING.md`、README、CI、AGENTS.md の更新要否も確認してください。
