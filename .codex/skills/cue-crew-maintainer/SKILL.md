---
name: cue-crew-maintainer
description: Use when working in the cue-crew repository, identified by package.json name "cue-crew", a repository path ending in github/cue-crew, or project docs for "本番中 x 舞台裏". Guides Codex through Japanese maintenance workflows for this Vite/React/TypeScript browser game, including scoring, balance, UI scenarios, storage compatibility, dependency safety, Cloudflare Pages, and GitHub workflow.
---

# Cue Crew Maintainer

この skill は、`cue-crew` リポジトリで Codex が作業するときの入口です。絶対パスには依存しないでください。repo root は、現在の作業ディレクトリ、`package.json` の `name: "cue-crew"`、または `github/cue-crew` で終わるパスから判断してください。

## 優先順位

1. ユーザーの最新指示を最優先する。
2. `AGENTS.md` の運用ルールを守る。
3. `package.json` の scripts と repo 内 docs を最新の source of truth として扱う。
4. この skill が `AGENTS.md`、`package.json`、`docs/development-maintenance.md` と矛盾する場合は、それらを優先し、この skill の更新要否を確認する。

## 最初に読むもの

- 作業ルール: `AGENTS.md`
- 実装マップ、保存キー、確認コマンド: `docs/development-maintenance.md`
- UI固定シナリオと確認方針: `docs/ui-verification-workflow.md`
- ゲーム仕様: `docs/game-system-spec.md`
- バランス調整: `docs/balance-tuning.md`
- 依存追加・更新の注意: `CONTRIBUTING.md`

必要な範囲だけ読む。広く読む前に、ユーザー依頼の変更対象を特定する。

## 主要な担当ファイル

- アプリ入口と画面分岐: `src/app/App.tsx`
- タイトル画面: `src/app/TitleScreen.tsx`, `src/app/title/`
- 終演結果画面: `src/app/ResultScreen.tsx`, `src/app/result/`
- ゲーム画面 UI: `src/components/game/`
- 共通 UI: `src/components/ui/`, `src/components/layout/`
- 日本語コピー: `src/content/ja/`
- 状態遷移: `src/game/gameReducer.ts`
- 採点、対応結果、insight: `src/game/scoreRules.ts`, `src/game/scoring.ts`, `src/game/resultPreview.ts`, `src/game/responseInsight.ts`
- 役者イベントと重み: `src/game/actorLogic.ts`, `src/game/constants.ts`
- 日替わり、図鑑、称号、再演比較: `src/game/rogueliteProgress.ts`, `src/game/dailyRun.ts`
- 固定 UI シナリオ: `src/game/uiScenarios.ts`, `src/game/uiScenarioBuilders.ts`, `src/game/uiScenarioStorage.ts`
- UI確認スクリプト: `scripts/check-ui-layout.mjs`, `scripts/capture-screenshot.mjs`
- バランス集計: `scripts/balance-report.mjs`

## 変更別ワークフロー

### 採点、イベント、バランス

`src/game/scoreRules.ts`、`src/game/scoring.ts`、`src/game/resultPreview.ts`、`src/game/actorLogic.ts`、`src/game/constants.ts`、`src/game/dailyRun.ts` を変更する場合は、仕様とテストへの波及を確認する。

- 確認: `npm run test:logic`
- 追加確認: `npm run balance:report -- --samples=48`
- 見る観点: 主要戦略の偏り、イベント分布、型分布、裏方負荷、日替わり補正の漏れ、図鑑/称号/ヒントへの波及。

### 保存データ

`src/app/usePerformanceHistory.ts`、`src/game/rogueliteProgress.ts`、保存キー、保存形式を変更する場合は、壊れた JSON、古い JSON、キー未作成状態でゲーム開始できることを守る。

保存キーの現状は `docs/development-maintenance.md` を source of truth とする。

### UI変更

UI変更では、対象 component、CSS、copy、固定 UI シナリオの更新要否をセットで考える。

- 通常確認: `npm run check:ui`
- 軽微な準備UI: `npm run check:ui:prep`
- 軽微な対応UI: `npm run check:ui:response`
- 軽微な結果UI: `npm run check:ui:result`
- 大規模な共通レイアウト、レスポンシブ、状態分岐、PR前の明示確認: 必要な場合だけ `npm run verify:ui:full`

PNG は通常生成しない。`tmp/screenshots/` は作業用キャッシュであり、原則コミットしない。

### 文言変更

日本語コピーは `src/content/ja/` を優先して探す。文言を component に直書きしない。文言変更でもレイアウト密度が変わる場合は UI 確認を行う。

### Cloudflare Pages

Cloudflare Pages 関連は `wrangler.jsonc`、`package.json` の `cf:*` scripts、README のデプロイ記述を確認する。通常のフロントエンド変更では Cloudflare の実デプロイは不要。

### 依存追加・更新

依存を追加・更新する場合は安全性確認をためらわずに行う。ただし、完了報告では必ず以下を説明する。

- `package.json` の差分
- `package-lock.json` の差分概要
- 新しく入った direct dependency
- install script を持つ dependency

CI やローカル確認で `npm ci --ignore-scripts`、`npm audit signatures` との整合も見る。

## 作業ルール

- コマンドはハング防止のため、可能な限り単独実行する。
- GitHub 操作は GitHub コネクタ/プラグインを優先する。
- `gh` を使う場合は、`127.0.0.1:9` の proxy 環境変数を一時的に空にしてから実行する。
- Python 依存はプロジェクト内の `.venv` を前提にする。
- ユーザーが作った変更を revert しない。
- 確認事項が発生したら作業を止めて質問する。

## 設計方針

- ゲームロジックは可能な限り pure に保ち、React、localStorage、日本語コピーへの依存を増やしすぎない。
- 採点ロジック、説明文生成、UI表示用 view model の責務を混ぜすぎない。
- `constants.ts` にラベル、初期値、数値ルールが集まりすぎた場合は分離を検討する。
- 状態遷移の変更では、phase ごとの nullable な値を減らせるか検討する。
- UI固定シナリオは、表示崩れや長い文言、危険状態、多効果状態、保存データ互換を守るための資産として扱う。
- 大きな再設計では、`domain / application / ui / content / scenarios` の層分けに近づける。ただし一度に全面移行せず、各段階でテストと UI 確認を通す。

## 自己更新

repo 構成、確認コマンド、保存キー、主要責務、UI固定シナリオ、採点/バランス確認の導線を変更した場合は、次を確認する。

- `docs/development-maintenance.md` は最新か。
- `AGENTS.md` の不変ルールと矛盾しないか。
- この skill の「主要な担当ファイル」「変更別ワークフロー」「設計方針」を更新すべきか。

個人環境に同名 skill がある場合でも、repo 内の `.codex/skills/cue-crew-maintainer/SKILL.md` を正本として扱う。
