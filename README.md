# location-scouter-3d
3D地図で撮影地ロケハンをするアプリ

# 開発環境

- 開発環境は DevContainer を使うことを前提としている。
- Node.js / Claude Code / Codex は mise（`mise.toml`）、pnpm は `package.json#packageManager` で版数を固定する。
- 依存パッケージは公開から7日以上経ったものだけを入れる（`minimumReleaseAge`）。npm/npx は使わず pnpm を使う。

## コマンド

```
pnpm install
pnpm check   # lint + format:check + typecheck + knip + test
pnpm fix     # lint:fix + format
```

## ローカル開発で使用するポート

| 種別 | 用途 | Port |
| --- | --- | --- |
| Frontend | dev server | `5173` |
| Frontend | preview | `4173` |
