# Actor Image Workflow

役者画像は、生成したグリーン背景PNGを透明PNGへ変換して `src/assets/actors/` に配置します。作業用のPythonはプロジェクト内 `.venv` を使います。

## 入力

生成元画像を以下に置きます。

```txt
tmp/actor-sources/
  lead.png
  junior.png
  skilled.png
```

`tmp/` は作業用キャッシュなので、生成元画像は通常コミットしません。

## 変換

```bash
npm run images:actors
```

このコマンドは `scripts/process-actor-images.ps1` 経由で `.venv\Scripts\python.exe` を使い、Pillowで背景を透明化します。出力先は以下です。

```txt
src/assets/actors/
  lead.png
  junior.png
  skilled.png
```

## 調整

境界の抜け方を調整する場合は、以下のオプションを使います。

```bash
npm run images:actors -- --transparent-threshold 18 --opaque-threshold 220
```

画像が大きすぎる場合は高さを指定します。

```bash
npm run images:actors -- --max-height 1200
```
