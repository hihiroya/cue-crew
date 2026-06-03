# UI Verification Workflow

UI変更後の確認コストを下げるための運用メモです。通常はスクリーンショットを撮らず、固定シナリオをブラウザで開いてDOM上のレイアウト不変条件を検査します。スクリーンショット確認は、目視が必要な大きめのUI変更やPR前の追加確認だけに限定します。

## 標準確認

通常のUI変更では、まず以下を実行します。

```bash
npm run check:ui
```

このコマンドは `npm run build` の後に `scripts/check-ui-layout.mjs` を実行します。PNGは生成しません。Chrome/Edgeと静的サーバーを1回だけ起動し、各固定シナリオを同じブラウザセッションで順番に開いて検査します。

対象を絞る場合は以下を使います。

```bash
npm run check:ui:prep
npm run check:ui:response
npm run check:ui:result
```

個別シナリオだけ確認する場合は以下の形式です。

```bash
npm run build
node scripts/check-ui-layout.mjs --scenario=ui:response-primary --width=440 --height=956
```

軽微なCSS/文言/余白修正では、変更箇所に対応するパネル別チェックまたは個別シナリオチェックで十分です。`verify:ui:full` は通常使いません。

## 固定シナリオ

`scripts/check-ui-layout.mjs` と `scripts/capture-screenshot.mjs` は `--scenario=ui:<name>` でゲーム進行をクリックせずに固定状態へ入れます。固定状態は `src/game/uiScenarios.ts` で定義します。

現在の主要シナリオ:

- `prep-default`
- `prep-selected-space`
- `response-primary`
- `response-alternate`
- `response-danger`
- `response-many-effects`
- `response-long-label`
- `response-fray`
- `result-preview`
- `result-fray`
- `finished-heat`
- `finished-rough`

新しいUI分岐を追加した場合は、クリック進行のE2Eシナリオを増やす前に固定シナリオを増やしてください。

## 機械チェック

`check:ui` は以下を機械的に検査します。

- 横スクロールの発生
- 空画面
- フレームワークエラー表示
- Runtime/console error
- ボタン内テキストのはみ出し
- アクティブボタンの極端な縮小
- 主要UI要素の極端な縮小、または表示中viewportからの大きな逸脱
- 選択カード同士の重なり
- 本番カードの最小高さ
- 準備/本番の選択マーカー混入

このチェックは画像比較ではありません。人間の目視を完全に代替するものではなく、頻出するレイアウト事故を高速に落とすための通常ゲートです。

## スクリーンショット確認

スクリーンショット確認は通常使いません。必要な場合だけ以下を実行します。

```bash
npm run verify:ui:full
```

このコマンドは `npm run build` の後に `ui-critical` プリセットを撮影します。撮影は並列ではなく順番に実行されます。プリセット撮影時はChrome/Edgeと静的サーバーを1回だけ起動し、各シナリオを同じブラウザセッションで順番に撮ります。

パネル別に撮る場合は以下を使います。

```bash
npm run screenshot:prep
npm run screenshot:response
npm run screenshot:result
```

個別シナリオを撮る場合は以下の形式です。

```bash
npm run screenshot -- --scenario=ui:response-primary --width=440 --height=956 --out=tmp/screenshots/check.png
```

## Browserプラグイン不調時

Browserプラグインが `windows sandbox failed: spawn setup refresh` などで使えない場合は、Browser復旧待ちにせず、CDPベースの `npm run check:ui` を標準代替にします。

このリポジトリでは `scripts/check-ui-layout.mjs` と `scripts/capture-screenshot.mjs` がChrome/Edgeを直接起動するため、BrowserプラグインなしでもUI確認を継続できます。

## スクショ成果物の扱い

`tmp/screenshots/` は作業用キャッシュで、Git管理対象外です。PNGは原則コミットしません。

推奨運用:

- 通常はスクリーンショットを作らず、PRには `npm run check:ui` の実行結果を書く
- スクリーンショット確認をした場合だけ `tmp/screenshots/ui-critical/` を残す
- PR説明に必要な代表画像だけ添付する
- 古い単発PNG、ログ、Chromeプロファイルキャッシュは削除する

整理後の基本形:

```txt
tmp/
  screenshots/
    ui-critical/
```

CIに組み込む場合は、成功時はスクショを保存せず、失敗時のみartifactとして保存するのが推奨です。
