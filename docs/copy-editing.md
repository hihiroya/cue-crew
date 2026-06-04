# Copy Editing Workflow

アプリ内文言は、原則として `src/content/ja/` に集約します。UIやゲームロジックから直接日本語文字列を増やすと、表記揺れやレビュー漏れが起きやすくなるためです。

## 配置先

- `src/content/ja/gameLabels.ts`
  - 役者、状態、出来事、準備、対応、結果ランクなどの短いラベル
  - 公演スロットや公演スタイルの説明
- `src/content/ja/sceneCopy.ts`
  - 場面タイトル
  - 結果フレーバーテキスト
  - 準備回収メッセージ
- `src/content/ja/appCopy.ts`
  - 画面見出し、ボタン、aria-label、リザルト画面の補助文
  - 点数メモや履歴表示など、UI表示用の小さな文言生成関数

## 新しい文言を追加するとき

1. まず `src/content/ja/` の既存ファイルに置けるか確認する。
2. 既存カテゴリに合わない場合だけ、新しい copy ファイルを追加する。
3. React コンポーネントやゲームロジック側では、copy 定数または copy 関数を import して使う。
4. 表示対象の型がある文言は `Record<SomeType, string>` や `satisfies` を使い、キー漏れを型で検出できる形にする。

## 確認

通常の文言修正では次を使います。

```bash
npm run check:copy
npm run build
```

UIの見た目に影響する長さ変更をした場合は、影響範囲に応じて `npm run check:ui` または `npm run check:ui:prep` / `npm run check:ui:response` / `npm run check:ui:result` を使います。

## レガシー許可リスト

`scripts/check-copy-literals.mjs` には、まだ直接日本語文言が残っているファイルを明示的に許可しています。新しく移行したファイルはこの許可リストから外し、再混入を防いでください。

優先して移行する候補:

- `src/game/scoreRules.ts`
- `src/game/performanceReport.ts`
- `src/game/fray.ts`
- `src/components/game/ActionPanel.tsx`
- `src/components/game/ActorStage.tsx`
- `src/components/game/ScoreBar.tsx`
- `src/components/layout/GameHeader.tsx`
