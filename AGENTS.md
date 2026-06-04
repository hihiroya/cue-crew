# AGENTS.md

このリポジトリで作業するエージェント向けの運用メモです。

- 実装コストは考慮せずに最良の案を提示してください。
- ハング防止のため、コマンドは並列実行せず、可能な限り単独実行してください。
- GitHub 操作については、gh CLI よりも GitHub コネクタ/プラグインを優先してください。
- `gh` を使う時は、`127.0.0.1:9` の proxy 環境変数を一時的に空にしてから実行してください。
- サプライチェーン攻撃の対策のため、依存を追加・更新する場合は、`package.json` と `package-lock.json` の差分を説明し、新しく入った direct dependency と install script を持つ dependency を報告してください。
- 採点、イベント重み、日替わり補正、型ボーナス、称号/図鑑条件を変更した場合は、`npm run test:logic` に加えて `npm run balance:report -- --samples=48` で主要戦略とイベント分布を確認してください。
- 通常のUI変更後は `npm run verify:ui` ではなく、PNGを生成しない `npm run check:ui` を標準確認にしてください。
- 軽微なCSS/文言/余白修正では、必要に応じて `npm run check:ui:prep` / `npm run check:ui:response` / `npm run check:ui:result` のように影響範囲だけ確認してください。
- スクリーンショット確認は通常使いません。`npm run verify:ui:full` は共通レイアウト、レスポンシブ全体、状態分岐の大改修、PR前に明示的に必要な場合、またはユーザーが指示した場合だけ使ってください。詳細は `docs/ui-verification-workflow.md` を参照してください。
- `tmp/screenshots/` は作業用キャッシュで、PNGは原則コミットしません。通常は `tmp/screenshots/ui-critical/` だけ残し、PRには代表画像だけ添付してください。
- 変更範囲ごとの実装マップ、保存キー、確認コマンドは `docs/development-maintenance.md` を参照してください。
