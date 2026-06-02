# AGENTS.md

このリポジトリで作業するエージェント向けの運用メモです。

- 実装コストは考慮せずに最良の案を提示してください。
- ハング防止のため、コマンドは並列実行せず、可能な限り単独実行してください。
- GitHub 操作については、gh CLI よりも GitHub コネクタ/プラグインを優先してください。
- `gh` を使う時は、`127.0.0.1:9` の proxy 環境変数を一時的に空にしてから実行してください。
- サプライチェーン攻撃の対策のため、依存を追加・更新する場合は、`package.json` と `package-lock.json` の差分を説明し、新しく入った direct dependency と install script を持つ dependency を報告してください。
- UI変更後は `npm run verify:ui` を標準確認にしてください。Browserプラグインが `windows sandbox failed: spawn setup refresh` などで使えない場合も、CDPベースのスクリーンショット確認を代替導線として使います。詳細は `docs/ui-verification-workflow.md` を参照してください。
- `tmp/screenshots/` は作業用キャッシュで、PNGは原則コミットしません。通常は `tmp/screenshots/ui-critical/` だけ残し、PRには代表画像だけ添付してください。
