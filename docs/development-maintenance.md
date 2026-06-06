# 開発・保守メモ

この文書は、`本番中 x 舞台裏` を今後変更するときの入口です。詳細仕様は各専門ドキュメントへ寄せ、この文書では変更範囲、担当ファイル、確認コマンドをまとめます。

## 主要ドキュメント

| 文書 | 用途 |
| --- | --- |
| `docs/game-system-spec.md` | ターン進行、採点、履歴、保存キー、日替わり挑戦の現行仕様。 |
| `docs/roguelite-score-attack-design.md` | 同seed再演、日替わり挑戦、図鑑、称号、公演ビルドの方針と保守ルール。 |
| `docs/score-attack-affinity-design.md` | 将来的な相性4軸、対人スコアアタック拡張の設計メモ。 |
| `docs/prep-phase-ui-design-guide.md` | 準備フェーズの情報整理とUI方針。 |
| `docs/ui-verification-workflow.md` | UI固定シナリオ、DOM検査、スクリーンショット運用。 |

## 実装マップ

| 変更対象 | 主なファイル |
| --- | --- |
| ターン進行、状態遷移 | `src/game/gameReducer.ts`、`src/game/domainTypes.ts` |
| 採点、対応結果、公演の色ボーナス | `src/game/scoreRules.ts`、`src/game/scoreEngine.ts` |
| 役者イベント、イベント重み | `src/game/actorLogic.ts`、`src/game/ruleTables.ts` |
| 日替わりseed、日替わり補正 | `src/game/dailyRun.ts` |
| 図鑑、称号、発見点、再演比較 | `src/game/rogueliteProgress.ts` |
| ルール表、初期値、表示ラベルの入口 | `src/game/ruleTables.ts`、`src/game/initialGameData.ts`、`src/game/gameSettings.ts`、`src/game/contentLabels.ts`、`src/game/constants.ts` |
| 履歴、図鑑、日替わり自己ベスト保存 | `src/app/usePerformanceHistory.ts`、`src/app/storage/performanceHistoryStorage.ts`、`src/game/rogueliteProgress.ts` |
| タイトル、図鑑、日替わり導線 | `src/app/TitleScreen.tsx` |
| 終演報告、ポスター、発見表示 | `src/app/ResultScreen.tsx` |
| ゲーム画面の準備/対応/結果UI | `src/components/game/`、対応UIの部品は `src/components/game/ResponsePanelParts.tsx` |
| 固定UIシナリオ | `src/game/uiScenarioRegistry.json`、`src/game/uiScenarios.ts`、`src/game/uiScenarioBuilders.ts` |
| UI確認、スクリーンショットpreset | `src/game/uiScenarioRegistry.json`、`scripts/ui-scenario-registry.mjs`、`scripts/check-ui-layout.mjs`、`scripts/capture-screenshot.mjs` |
| バランス集計 | `scripts/balance-report.mjs` |
| 変更範囲から確認コマンドを推定 | `scripts/verify-agent.mjs` |
| ルール表、カタログ、UIシナリオ網羅テスト | `tests/rule-coverage.test.ts`、`tests/ui-scenario-coverage.test.ts` |

## 変更別の確認

| 変更 | 標準確認 |
| --- | --- |
| 採点、イベント重み、日替わり補正、公演の色ボーナス | `npm run test:logic` と `npm run balance:report -- --samples=48` |
| Reducer、ターン進行、保存処理 | `npm run test:logic` |
| UIレイアウト、文言密度、カード表示 | `npm run check:ui` |
| UI固定シナリオ名、preset、viewport、coverageタグ | `npm run test:logic` と必要に応じて `npm run check:ui` |
| 準備/対応/結果の一部だけの軽微なUI変更 | `npm run check:ui:prep`、`npm run check:ui:response`、`npm run check:ui:result` の該当範囲 |
| PR前、共通レイアウト大改修、レスポンシブ全体変更 | 必要な場合のみ `npm run verify:ui:full` |

確認コマンドに迷う場合は `npm run verify:agent` で、作業ツリーとステージ済み差分から推奨確認を表示できます。比較対象を明示したい場合は `npm run verify:agent -- --base=<ref>` を使ってください。

## 保存データ

| キー | 内容 |
| --- | --- |
| `honban.performance.history.v1` | 最新8件の公演履歴。履歴再演と前回比に使う。 |
| `honban.collection.v1` | 場面図鑑と称号。性能上昇には使わない。 |
| `honban.daily.best.v1` | 日替わり挑戦の自己ベスト。 |

保存データは壊れていてもゲームを開始できる必要があります。読み込み処理を変更する場合は、壊れたJSON、古いJSON、キー未作成の状態を空データとして扱ってください。

## バランス保守

`balance:report` は、依存を増やさずに固定戦略を複数seedへ流し、平均スコア、負荷、準備ヒット率、ランク分布、型分布、イベント分布を出します。

採点やイベント重みを変更した場合は、少なくとも以下を見る。

- 1つの固定戦略だけが常に最強になっていないか。
- `backstageLoad` が高止まりしすぎていないか。
- 日替わり補正が通常seedへ漏れていないか。
- 型分布が追加した報酬に引っ張られすぎていないか。
- 新しいイベントや称号が、図鑑/ヒント/UI固定シナリオに反映されているか。

`tests/rule-coverage.test.ts` は、ルール表、イベント重み、準備対応、称号、図鑑ヒントの参照先が欠けていないかを守ります。新しいイベント、対応、準備、称号、図鑑ヒントを追加した場合は、このテストの期待値も更新してください。

`tests/ui-scenario-coverage.test.ts` は、`src/game/uiScenarioRegistry.json` のシナリオ名、preset、viewport、coverageタグ、builder の整合性を守ります。固定 UI シナリオを追加・削除する場合は、registry の coverage タグも更新してください。

## 公平性ルール

このゲームの永続要素は、記録、発見、ヒント、再挑戦動機に限定します。称号、図鑑、日替わり自己ベストはプレイヤー性能を上げません。

オンラインランキングや共有機能を追加する場合も、`PerformanceResult.insight.totalScore` と `PerformanceResult.insight.discoveryScore` は分けて扱ってください。図鑑初回解放の気持ちよさは `discoveryScore`、同seed再演やランキングの比較は `totalScore` が担当します。
