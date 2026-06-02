# 本番中につき！ 〜舞台裏の一手〜

ブラウザで遊べる、1人用の舞台裏マネジメントゲームです。役者を直接命令するのではなく、兆候を読み、構えを決め、本番中の予想外を裏方の一手で名場面に変える縦スライスです。

## ローカル起動

```bash
npm install
npm run dev
```

Node.js は 24.x LTS、npm は 11.10.0 以上を使用します。
Cloudflare Pages ではルートの `.node-version` により Node.js 24.16.0 を指定しています。

## ビルド

```bash
npm run build
```

ビルド成果物は `dist/` に出力されます。

## リポジトリ運用

- 生成物の `dist/`、一時ファイルの `tmp/`、依存ディレクトリの `node_modules/` は Git 管理対象外です。
- Pull request では GitHub Actions が `npm ci --ignore-scripts`、`npm audit signatures`、`npm run build` を実行します。
- 依存関係を変更する場合は [CONTRIBUTING.md](CONTRIBUTING.md) の確認項目に従ってください。

## スクリーンショット確認

Chrome DevTools Protocol を使い、指定viewportでPNGを保存できます。外部依存はありません。

```bash
npm run build
npm run screenshot -- --out=tmp/title.png
```

起動中の開発サーバーを撮る場合は `--url=http://127.0.0.1:5173` を指定します。
既定の撮影サイズは iPhone 17 Pro Max 相当の `440x956` です。

本編状態も撮れます。

```bash
npm run screenshot -- --scenario=game --out=tmp/game.png
npm run screenshot -- --scenario=response --out=tmp/response.png
npm run screenshot -- --scenario=preview --out=tmp/preview.png
npm run screenshot -- --scenario=result --out=tmp/result.png
```

UI変更の確認では、固定シナリオをまとめ撮りできます。Browserプラグインが使えない環境では、このCDPベースの確認を標準の代替導線にします。

```bash
npm run verify:ui
```

対象を絞る場合は以下を使います。

```bash
npm run screenshot:prep
npm run screenshot:response
npm run screenshot:result
```

これらのコマンドは順番にスクリーンショットを撮り、横スクロール、ボタン内テキストのはみ出し、カード重なり、準備/本番の選択マーカー混入などを検出します。出力先は `tmp/screenshots/` 配下です。

詳細な運用、固定シナリオの追加方針、スクショ成果物の扱いは [UI検証ワークフロー](docs/ui-verification-workflow.md) を参照してください。

## Cloudflare Pages デプロイ

Cloudflare Pages では `wrangler.jsonc` を設定ファイルとして使います。

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- Node.js version: `24`

バックエンド、外部API、ランタイム画像生成は使用していません。

### Wrangler でローカル確認

```bash
npm run cf:preview
```

`dist/` を Cloudflare Pages 相当のローカル環境で配信します。

### Wrangler で直接デプロイ

初回のみ Cloudflare にログインします。

```bash
npx wrangler login
```

Pages プロジェクトを作成します。

```bash
npx wrangler pages project create cue-crew --production-branch main
```

ビルドして Cloudflare Pages にデプロイします。

```bash
npm run cf:deploy -- --branch main
```

以後は同じコマンドで更新できます。GitHub 連携で自動デプロイする場合も、Cloudflare 側の設定は `npm run build` と `dist` を指定してください。

## ゲームルール概要

全3日、各日マチネ/ソワレの合計6ターンで1公演が終わります。毎ターン、焦点役者の兆候を読み、準備を1つ決めます。その後に役者が半自律的に行動し、プレイヤーは本対応を1つ選んで場面成立を狙います。

管理するスコアは `評判`、`段取り`、`座組信頼`、`裏方負荷` です。裏方負荷が高まるとほころびが起き、次のターン以降にうまく拾うと場面名へ影響します。

詳細な現行仕様は [ゲームシステム仕様](docs/game-system-spec.md) を参照してください。

将来的なスコアアタック対人戦を見据えた相性4軸の拡張案は [スコアアタック向け相性設計メモ](docs/score-attack-affinity-design.md) にまとめています。

## このゲームで大事にしている面白さ

このゲームが大事にしている一点は、役者の予想外を、裏方の一手で名場面に変える感覚です。強いカードを出すのではなく、若手を拾う、主役を待つ、技巧派のズレを整える、といった判断の手触りを重視しています。

## 主要ディレクトリ

```txt
src/
  app/                 アプリ構成
  components/          UI、ゲーム画面、役者シルエット
  game/                型、定数、乱数、役者ロジック、採点、Reducer
  styles/              デザイントークンとグローバルCSS
```

## 今後の拡張候補

- 演目ごとの幕テーマと場面テンプレート追加
- 役者ごとの癖や信頼イベント追加
- ほころび回収の専用演出
- 公演ログの詳細リプレイ
- 音声なしでも成立する、軽量な舞台照明アニメーション強化
