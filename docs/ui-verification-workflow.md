# UI Verification Workflow

UI変更後の確認コストを下げるための運用メモです。準備フェーズと本番フェーズは見た目の影響範囲が広く、画面幅や状態によって崩れ方が変わるため、固定シナリオのスクリーンショット確認を標準にします。

## 標準確認

UIを変更したら、まず以下を実行します。

```bash
npm run verify:ui
```

このコマンドは `npm run build` の後に `ui-critical` プリセットを撮影します。撮影は並列ではなく順番に実行されます。

対象を絞る場合は以下を使います。

```bash
npm run screenshot:prep
npm run screenshot:response
npm run screenshot:result
```

個別シナリオを撮る場合は以下の形式です。

```bash
npm run screenshot -- --scenario=ui:response-primary --width=440 --height=956 --out=tmp/screenshots/check.png
```

## 固定シナリオ

`scripts/capture-screenshot.mjs` は `--scenario=ui:<name>` でゲーム進行をクリックせずに固定状態へ入れます。固定状態は `src/game/uiScenarios.ts` で定義します。

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

スクリーンショット撮影時は、既定で軽量なDOMチェックも実行します。

- 横スクロールの発生
- 空画面
- フレームワークエラー表示
- ボタン内テキストのはみ出し
- 選択カード同士の重なり
- 本番カードの最小高さ
- 準備/本番の選択マーカー混入

必要な場合だけ `--check=false` で無効化できます。

## Browserプラグイン不調時

Browserプラグインが `windows sandbox failed: spawn setup refresh` などで使えない場合は、Browser復旧待ちにせず、CDPベースの `npm run verify:ui` を標準代替にします。

このリポジトリでは `scripts/capture-screenshot.mjs` がChrome/Edgeを直接起動してスクリーンショットを撮るため、BrowserプラグインなしでもUI確認を継続できます。

## スクショ成果物の扱い

`tmp/screenshots/` は作業用キャッシュで、Git管理対象外です。PNGは原則コミットしません。

推奨運用:

- 通常は `tmp/screenshots/ui-critical/` だけ残す
- PRには `npm run verify:ui` の実行結果を書く
- PR説明に必要な代表画像だけ添付する
- 古い単発PNG、ログ、Chromeプロファイルキャッシュは削除する

整理後の基本形:

```txt
tmp/
  screenshots/
    ui-critical/
```

CIに組み込む場合は、成功時はスクショを保存せず、失敗時のみartifactとして保存するのが推奨です。
