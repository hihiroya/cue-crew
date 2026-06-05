# Balance Tuning

この文書は、舞台裏ローグライト・スコアアタックとしてのバランス調整方針と、機械的な確認方法をまとめる。数値は `npm run balance:report -- --samples=48` の戦略シミュレーションで確認する。ばらつきを抑えたい時は `npm run balance:report:stable` で256 seedを確認する。

## 目指す体験

- 初回プレイでも、予定外を拾って得点が入る快感を得られる。
- 固定戦略でも遊べるが、最高点には届かない。
- 兆候を読み、準備と対応を変えるほど明確に伸びる。
- 高得点狙いには上振れとリスクがあり、毎回の公演に揺れが残る。
- `catch` は高リスク高リターン、`wait` は安全寄り、`arrange` は負荷管理、`cut` は高負荷/ほころび時の守り手として直感的に働く。
- 図鑑、称号、日替わり自己ベストは記録と再挑戦動機であり、通常公演の性能強化にはしない。

## 評価戦略

| 戦略 | 役割 |
| --- | --- |
| `random` | 初見に近い下限。準備の主対応を70%選び、残りは迷う。完走はできるが安定しない。 |
| `catch` | 拾う固定。攻め手の上振れと負荷を見る。 |
| `wait` | 待つ固定。安全手が万能化していないかを見る。 |
| `arrange` | 整える固定。安定と負荷管理の基準。 |
| `cut` | 切る固定。守り手として最低限成立しているかを見る。 |
| `cycle` | 固定ローテ。読まずに回す戦略が強すぎないかを見る。 |
| `lowLoad` | 負荷管理重視。安全高評価の上限を見る。 |
| `omen` | 兆候読み。高負荷/保留ほころびでは安全に寄せ、それ以外は見えている兆しから通常プレイで目指したい強さを出す。 |
| `expectedScore` | 期待値重視。システム理解プレイの強さ。 |
| `styleHeat` | 熱量を狙う戦略。上振れ型の色が成立しているかを見る。 |
| `styleBreath` | 余韻を狙う戦略。一体感と終盤伸びが成立しているかを見る。 |
| `styleControl` | 段取りを狙う戦略。安定型の色が成立しているかを見る。 |
| `styleClosure` | 収束を狙う戦略。高負荷/ほころび回収型が成立しているかを見る。 |
| `styleCommit` | 公演の色へ寄せる戦略。色ボーナスの効き方を見る。 |
| `oracle` | 発生イベントを知る理論上限。通常プレイとの差を見る。 |

## 目標レンジ

### 総合スコア

| 戦略 | avgScore | p90 | 意図 |
| --- | ---: | ---: | --- |
| `random` | 16-28 | 35-48 | 初回でも完走でき、たまにAが見える。 |
| `catch` | 14-32 | 40-65 | 高リスク。初日若手固定を外した後は、固定拾いの平均より上振れを見る。 |
| `wait` | 20-38 | 45-58 | 安全だが、役者や出来事を読まない固定待ちは下振れもある。 |
| `arrange` | 24-36 | 42-55 | 安定手。低事故・中得点。 |
| `cut` | 12-28 | 35-50 | 守り手として最低限成立する。 |
| `cycle` | 22-42 | 45-60 | 読まずに回すと伸びにくいが、噛み合えば場面は作れる。 |
| `lowLoad` | 38-50 | 52-62 | 安定高評価。ただし最高火力は低い。 |
| `omen` | 48-60 | 60-72 | 兆候読みの主報酬。 |
| `expectedScore` | 52-64 | 64-76 | システム理解プレイの報酬。 |
| `styleHeat` | 40-58 | 56-74 | 熱量の上振れ型。 |
| `styleBreath` | 38-56 | 52-68 | 余韻の終盤伸び型。 |
| `styleControl` | 34-54 | 48-64 | 段取りの安定型。平均は低めでも事故を抑える。 |
| `styleClosure` | 36-54 | 52-68 | 収束の回収型。 |
| `oracle` | 66-80 | 76-90 | 理論上限。到達不能気味でよい。 |

### 相対条件

| 条件 | 目標 |
| --- | --- |
| `omen.avgScore - cycle.avgScore` | +8以上 |
| `expectedScore.avgScore - omen.avgScore` | 0-10 |
| `oracle.avgScore - expectedScore.avgScore` | 5-22 |
| `wait.avgScore - arrange.avgScore` | -10から+8 |
| `catch.p90 - catch.avgScore` | +18以上 |
| `cycle.p50` | S+しきい値52未満 |
| `cycle.frayOrAccidentRate` | 18%以上 |
| `omen.frayOrAccidentRate` | 6%以上 |
| `omen/expectedScore/oracle` のheat比率 | 72%以下 |
| 色別戦略の狙い色外れ率 | 28%以下 |

### 負荷

| 戦略 | avgLoad | 意図 |
| --- | ---: | --- |
| `catch` | 2.5-4.5 | 攻めの代償として高め。 |
| `wait` | 0.8-2.0 | 低めだがゼロ付近で安定しすぎない。 |
| `arrange` | 0.0-1.0 | 負荷管理の専門家。 |
| `cut` | 0.0-1.5 | 崩れを閉じる役割。 |
| `cycle` | 0.4-2.2 | 固定ローテは最終負荷が低くても、ほころび/事故で揺れを見る。 |
| `omen` | 0.4-2.0 | 読めば抑えられるが、ほころび/事故が消えない程度にする。 |
| `expectedScore` | 0.8-2.5 | 高得点狙いで多少負荷を背負う。 |
| `oracle` | 0.0-1.0 | 理論上限なので低くてよい。 |

## 警告条件

`scripts/balance-report.mjs` は通常実行では警告表示だけを行う。`--fail-on-warn` を付けると、警告が1件以上ある場合に終了コード1を返す。

警告条件の実値は `scripts/balance-report.mjs` の `BALANCE_TARGETS` に集約する。文書を更新する時は、表と `BALANCE_TARGETS` の両方を同時に確認する。

特に重要な警告は以下。

- `cycle.avgScore >= 50`
- `cycle.avgScore >= omen.avgScore - 5`
- `wait.avgLoad < 0.8 && wait.avgScore > 34`
- `cut.avgScore < 12`
- `catch.p90 < 40`
- `oracle.avgScore - expectedScore.avgScore < 5`
- `cycle.frayOrAccidentRate < 18`
- `omen.frayOrAccidentRate < 6`
- `omen/expectedScore/oracle` のheat比率が72%を超える
- 色別戦略が狙い色から28%以上外れる
- `omen.sceneOrBetterPerRun >= 5.9`
- `expectedScore.accidentRate === 0 && expectedScore.frayOrAccidentRate === 0`

## 運用

標準確認。

```bash
npm run balance:report -- --samples=48
```

安定確認。

```bash
npm run balance:report:stable
```

JSONを保存する。

```bash
npm run balance:report -- --samples=48 --out=tmp/balance-report.json
```

ベースラインと比較する。

```bash
npm run balance:report -- --samples=48 --compare=scripts/balance-baseline.json
```

警告を失敗扱いにする。

```bash
npm run balance:report -- --samples=48 --fail-on-warn
```

採点、イベント重み、日替わり補正、公演の色ボーナス、称号/図鑑条件を変更した場合は、`npm run test:logic` とこのレポートを両方確認する。

調整が一段落した時は、`npm run balance:report -- --samples=48 --out=scripts/balance-baseline.json` で現行値を保存する。PR前や大きな数値変更では `--compare=scripts/balance-baseline.json` と `--fail-on-warn` を併用する。

## レポートの見方

| 出力 | 意味 |
| --- | --- |
| `avgScore` | その戦略の平均終演点。 |
| `p10/p50/p90` | 下振れ、中央値、上振れ。`catch` はp90の伸びを重視する。 |
| `gapToOracle` | 理論上限との差。小さすぎると通常戦略が綺麗すぎる。 |
| `masterpiece/run` | 1公演あたりの名場面数。 |
| `scene+/run` | 1公演あたりの場面化以上の数。高すぎると揺れが弱い。 |
| `fray+accident` | ほころび/事故率。高すぎても低すぎても問題。 |
| `final load` | 終演時の負荷分布。安全戦略が0に寄りすぎていないかを見る。 |
| `turns` | ターン別の上位結果ランク。特定ターンだけ強すぎ/弱すぎを確認する。 |
| `choice reasons` | 戦略が準備/対応を選んだ理由の簡易集計。戦略実装の偏りを見る。 |
| `Balance checks` | 目標レンジに対する `OK` / `WARN`。通常は警告表示のみ。 |
| `Comparison` | `--compare` 使用時の前回JSONとの差分。 |

## 現状の注目点

- `cycle` が強い場合、固定ローテが「読む」体験を上回る危険がある。
- `wait` が低負荷かつ高得点すぎる場合、安全手が万能化している。
- `cut` が低すぎる場合、高負荷/ほころび時の守り手としての価値が足りない。
- `catch` のp90が低い場合、攻め手の上振れ快感が足りない。
- `omen` や `expectedScore` の事故/ほころびがゼロに近い場合、公演ごとの揺れが薄くなる。
