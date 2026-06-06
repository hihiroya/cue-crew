# 開発・保守メモ

この文書は、`本番中 x 舞台裏` を変更するときの入口です。詳細仕様は専門ドキュメントへ寄せ、この文書では現在の実装構造、変更範囲、確認コマンド、保存キーをまとめます。

## 作業の入口

1. 変更対象に近い行を、この文書の「変更別マップ」から探す。
2. 迷う場合は `npm run verify:agent` で推奨確認コマンドを見る。
3. ゲームルールやUI固定シナリオを増やした場合は、網羅テストの期待値も更新する。
4. 構成、確認コマンド、保存キー、主要責務を変えた場合は、この文書と `.codex/skills/cue-crew-maintainer/SKILL.md` の更新要否を見る。

## 主要ドキュメント

| 文書 | 用途 |
| --- | --- |
| `docs/game-system-spec.md` | ターン進行、採点、履歴、保存キー、日替わり挑戦の現行仕様。 |
| `docs/roguelite-score-attack-design.md` | 同seed再演、日替わり挑戦、図鑑、称号、公演ビルドの方針と保守ルール。 |
| `docs/score-attack-affinity-design.md` | 将来的な相性4軸、対人スコアアタック拡張の設計メモ。 |
| `docs/prep-phase-ui-design-guide.md` | 準備フェーズの情報整理とUI方針。 |
| `docs/ui-verification-workflow.md` | UI固定シナリオ、DOM検査、スクリーンショット運用。 |

## 現在の構造

```txt
src/
  app/                  Reactアプリの接続層、画面分岐、hooks
    storage/            app層のlocalStorage読み書き
  components/           UIコンポーネント
    game/               準備、対応、結果プレビューなどゲーム画面
  content/ja/           日本語コピー、ラベル、UI文言
  game/                 純ロジック、状態、採点、ルール表、UI固定シナリオ
  styles/               CSS入口、base/components/screensごとの分割
scripts/                UI確認、スクリーンショット、バランス、agent確認
tests/                  Node標準テスト、網羅テスト
```

`src/game/constants.ts` は互換用の barrel です。新規のルール表は `src/game/ruleTables.ts`、初期値は `src/game/initialGameData.ts`、固定設定は `src/game/gameSettings.ts`、表示ラベル入口は `src/game/contentLabels.ts` へ寄せてください。

`GameState` は `src/game/domainTypes.ts` で phase 別 union として定義しています。UI固定シナリオで必要な例外は型に明示してください。

## 変更別マップ

| 変更対象 | 主なファイル |
| --- | --- |
| ターン進行、状態遷移 | `src/game/gameReducer.ts`、`src/game/domainTypes.ts` |
| 採点、対応結果、公演の色ボーナス | `src/game/scoreRules.ts`、`src/game/scoreEngine.ts`、`src/game/scoring.ts`、`src/game/resultPreview.ts`、`src/game/responseInsight.ts` |
| 役者イベント、イベント重み | `src/game/actorLogic.ts`、`src/game/ruleTables.ts` |
| ルール表、初期値、表示ラベルの入口 | `src/game/ruleTables.ts`、`src/game/initialGameData.ts`、`src/game/gameSettings.ts`、`src/game/contentLabels.ts`、`src/game/constants.ts` |
| 日替わりseed、日替わり補正 | `src/game/dailyRun.ts` |
| 図鑑、称号、発見点、再演比較 | `src/game/rogueliteProgress.ts` |
| 履歴、図鑑、日替わり自己ベスト保存 | `src/app/usePerformanceHistory.ts`、`src/app/storage/performanceHistoryStorage.ts`、`src/game/rogueliteProgress.ts` |
| タイトル、図鑑、日替わり導線 | `src/app/TitleScreen.tsx`、`src/app/title/` |
| 終演報告、ポスター、発見表示 | `src/app/ResultScreen.tsx`、`src/app/result/` |
| ゲーム画面の準備/対応/結果UI | `src/components/game/`、対応UIの部品は `src/components/game/ResponsePanelParts.tsx` |
| 固定UIシナリオ | `src/game/uiScenarioRegistry.json`、`src/game/uiScenarios.ts`、`src/game/uiScenarioBuilders.ts`、`src/game/uiScenarioStorage.ts` |
| UI確認、スクリーンショットpreset | `src/game/uiScenarioRegistry.json`、`scripts/ui-scenario-registry.mjs`、`scripts/check-ui-layout.mjs`、`scripts/capture-screenshot.mjs` |
| バランス集計 | `scripts/balance-report.mjs` |
| 変更範囲から確認コマンドを推定 | `scripts/verify-agent.mjs` |
| ルール表、カタログ、UIシナリオ網羅テスト | `tests/rule-coverage.test.ts`、`tests/ui-scenario-coverage.test.ts` |

## 確認コマンド

| 変更 | 標準確認 |
| --- | --- |
| TypeScript/React/スクリプト/設定ファイルの静的品質 | `npm run check:lint` |
| 採点、イベント重み、日替わり補正、公演の色ボーナス | `npm run test:logic` と `npm run balance:report -- --samples=48` |
| Reducer、ターン進行、保存処理 | `npm run test:logic` |
| ルール表、称号、図鑑ヒント | `npm run test:logic` |
| UIレイアウト、文言密度、カード表示 | `npm run check:ui` |
| UI固定シナリオ名、preset、viewport、coverageタグ | `npm run test:logic` と必要に応じて `npm run check:ui` |
| 準備/対応/結果の一部だけの軽微なUI変更 | `npm run check:ui:prep`、`npm run check:ui:response`、`npm run check:ui:result` の該当範囲 |
| PR前、共通レイアウト大改修、レスポンシブ全体変更 | 必要な場合のみ `npm run verify:ui:full` |

確認コマンドに迷う場合は `npm run verify:agent` で、作業ツリーとステージ済み差分から推奨確認を表示できます。比較対象を明示したい場合は `npm run verify:agent -- --base=<ref>` を使ってください。

## テストの守備範囲

| テスト | 守るもの |
| --- | --- |
| `tests/scoring.test.ts` | 採点の代表例、対応 insight、ほころび回収、役者信頼。 |
| `tests/fray.test.ts` | ほころびの相性、負荷蓄積、持ち越し。 |
| `tests/reducer.test.ts` | 状態遷移、履歴正規化、日替わり、図鑑、再演分析。 |
| `tests/balance.test.ts` | 固定戦略の相対強度、主要バランスの範囲。 |
| `tests/roguelite-progress.test.ts` | 図鑑、称号、日替わりベスト、次回挑戦導線。 |
| `tests/rule-coverage.test.ts` | ルール表、イベント重み、準備対応、称号、図鑑ヒントの参照先。 |
| `tests/ui-scenario-coverage.test.ts` | UIシナリオ registry、preset、viewport、coverageタグ、builder整合性。 |
| `eslint.config.mjs` | 未使用コード、React Hooks、game層の依存方向などの静的品質。 |

新しいイベント、対応、準備、称号、図鑑ヒントを追加した場合は、`tests/rule-coverage.test.ts` の期待値を更新してください。

固定UIシナリオを追加・削除する場合は、`src/game/uiScenarioRegistry.json` の `coverage` タグと `tests/ui-scenario-coverage.test.ts` の必須タグを確認してください。

## UI固定シナリオ

`src/game/uiScenarioRegistry.json` を、シナリオ名、preset、viewport、coverageタグの source of truth とします。`scripts/check-ui-layout.mjs` と `scripts/capture-screenshot.mjs` へ同じ一覧を直書きしないでください。

coverageタグは「なぜそのシナリオが必要か」を示します。例:

- `long-label`: 長い文言、長いイベント名。
- `danger`: 危険状態、悪い見通し。
- `many-effects`: 効果表示が多い状態。
- `legacy-storage`: 古い保存データの表示。
- `achievements` / `scene-hints`: 称号、図鑑、ヒント。
- `fray` / `load-strain`: ほころび、内部負荷。

通常のUI変更では `npm run check:ui` を標準確認にしてください。PNGを生成する `npm run verify:ui:full` は、大きな共通レイアウト変更、レスポンシブ全体変更、状態分岐の大改修、PR前に明示的に必要な場合、またはユーザーが指示した場合だけ使います。

## 保存データ

| キー | 内容 | 主な読み書き |
| --- | --- | --- |
| `honban.performance.history.v1` | 最新8件の公演履歴。履歴再演と前回比に使う。 | `src/app/storage/performanceHistoryStorage.ts` |
| `honban.collection.v1` | 場面図鑑と称号。性能上昇には使わない。 | `src/game/rogueliteProgress.ts` |
| `honban.daily.best.v1` | 日替わり挑戦の自己ベスト。 | `src/game/rogueliteProgress.ts` |

保存データは壊れていてもゲームを開始できる必要があります。読み込み処理を変更する場合は、壊れたJSON、古いJSON、キー未作成の状態を空データとして扱ってください。

## バランス保守

`balance:report` は、依存を増やさずに固定戦略を複数seedへ流し、平均スコア、負荷、準備ヒット率、ランク分布、型分布、イベント分布を出します。

採点やイベント重みを変更した場合は、少なくとも以下を見る。

- 1つの固定戦略だけが常に最強になっていないか。
- `backstageLoad` が高止まりしすぎていないか。
- 日替わり補正が通常seedへ漏れていないか。
- 型分布が追加した報酬に引っ張られすぎていないか。
- 新しいイベントや称号が、図鑑/ヒント/UI固定シナリオに反映されているか。

## 公平性ルール

このゲームの永続要素は、記録、発見、ヒント、再挑戦動機に限定します。称号、図鑑、日替わり自己ベストはプレイヤー性能を上げません。

オンラインランキングや共有機能を追加する場合も、`PerformanceResult.insight.totalScore` と `PerformanceResult.insight.discoveryScore` は分けて扱ってください。図鑑初回解放の気持ちよさは `discoveryScore`、同seed再演やランキングの比較は `totalScore` が担当します。
