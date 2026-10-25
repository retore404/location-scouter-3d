#!/usr/bin/env bash
# Stop hook: エージェントの応答完了時に、コードに変更があればルートの pnpm check を実行する
# exit 0 = エージェントを停止させる（問題なし）
# exit 2 = エージェントを停止させず、stderrをフィードバックとして渡す（問題あり→修正を促す）
set -euo pipefail

REPO_ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"

ALL_FILES=$(
  {
    git -C "$REPO_ROOT" diff --name-only HEAD 2>/dev/null || true
    git -C "$REPO_ROOT" ls-files --others --exclude-standard 2>/dev/null || true
  } | sort -u
)

CODE_CHANGED=$(printf '%s\n' "$ALL_FILES" | grep -E '\.(ts|tsx|js|jsx|mjs|cjs)$' || true)

if [[ -z "$CODE_CHANGED" ]]; then
  exit 0
fi

if ! output=$(bash -lc "cd \"$REPO_ROOT\" && pnpm check" 2>&1); then
  printf '[pnpm check failed]\n%s\n\n' "$output" >&2
  printf '%s\n' "上記のエラーを修正してください。" >&2
  exit 2
fi
