#!/usr/bin/env bash
# PreToolUse hook: コーディングエージェントがコミットメッセージやPR本文へ自身の署名行を書き込むのを実行前に止める
# settings.json の attribution 設定はClaude Code本体が付ける署名だけを空にするため、
# エージェントがコマンドへ直接書き込んだ署名はこのhookで検査する。
# exit 0 = そのまま実行する
# exit 2 = 実行を止め、stderrをエージェントへのフィードバックとして渡す
set -euo pipefail

COMMAND=$(jq -r '.tool_input.command // empty')

# 署名を書き込めるのはコミットとPRの作成・編集だけなので、それ以外のコマンドは検査しない
if ! grep -qE '(^|[^[:alnum:]_-])(git[^;&|]*[[:space:]]commit|gh[[:space:]]+pr[[:space:]]+(create|edit))([^[:alnum:]_-]|$)' <<<"$COMMAND"; then
  exit 0
fi

# -F/--file/--body-file で渡されたメッセージ・本文ファイルの中身も検査対象に含める
CONTENT=$COMMAND
while IFS= read -r file; do
  file=${file#\"}
  file=${file%\"}
  file=${file#\'}
  file=${file%\'}
  if [[ -f "$file" ]]; then
    CONTENT+=$'\n'$(cat "$file")
  fi
done < <(grep -oE '(^|[[:space:]])(-F|--file|--body-file)(=|[[:space:]]+)("[^"]+"|'"'"'[^'"'"']+'"'"'|[^[:space:]]+)' <<<"$COMMAND" |
  sed -E 's/^[[:space:]]*(-F|--file|--body-file)(=|[[:space:]]+)//')

if grep -qiE 'co-authored-by:[^[:cntrl:]]*claude|noreply@anthropic\.com|generated with[^[:cntrl:]]*claude code' <<<"$CONTENT"; then
  echo "コミットメッセージまたはPR本文にコーディングエージェントの署名行が含まれています。署名行（Co-Authored-By: Claude、Generated with Claude Code 等）を除き、issue-driven skill の規約どおりの内容で実行し直してください。" >&2
  exit 2
fi

exit 0
