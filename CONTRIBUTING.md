# Contributing

## 開発環境

```bash
npm install
npm run dev
```

Node.js は 24.x LTS、npm は 11.10.0 以上を使用します。依存バージョンは exact pin と lockfile で管理します。

## 変更前後の確認

Pull request を作る前に、少なくとも次を実行してください。

```bash
npm run verify
```

UI を大きく変更した場合は、スクリーンショット確認も行います。

```bash
npm run screenshot -- --scenario=game --out=tmp/game.png
```

## 依存関係の変更

依存を追加・更新した場合は、`package.json` と `package-lock.json` の差分を確認し、Pull request に次を記載してください。

- 追加された direct dependency
- install script を持つ dependency
- 依存変更の理由
