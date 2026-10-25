#!/bin/bash
# Read JSON input from stdin
input=$(cat)

# ANSI colors (actual escape chars via $'...')
C_RESET=$'\033[0m'
C_GREEN=$'\033[38;5;77m'
C_YELLOW=$'\033[38;5;220m'
C_ORANGE=$'\033[38;5;208m'
C_RED=$'\033[38;5;196m'
C_CYAN=$'\033[38;5;81m'
C_GRAY=$'\033[38;5;240m'

# Render a progress bar: make_bar <pct_int> [width]
make_bar() {
    local pct=$1
    local width=${2:-10}
    local filled=$(( pct * width / 100 ))
    [ "$filled" -gt "$width" ] && filled=$width
    local empty=$(( width - filled ))

    local color
    if   [ "$pct" -lt 50 ]; then color=$C_GREEN
    elif [ "$pct" -lt 75 ]; then color=$C_YELLOW
    elif [ "$pct" -lt 90 ]; then color=$C_ORANGE
    else                          color=$C_RED
    fi

    local bar="" i
    for i in $(seq 1 "$filled"); do bar="${bar}█"; done
    for i in $(seq 1 "$empty");  do bar="${bar}░"; done

    printf "%s%s%s" "$color" "$bar" "$C_RESET"
}

# Colorize a percentage number based on its value
color_pct() {
    local pct=$1
    local color
    if   [ "$pct" -lt 50 ]; then color=$C_GREEN
    elif [ "$pct" -lt 75 ]; then color=$C_YELLOW
    elif [ "$pct" -lt 90 ]; then color=$C_ORANGE
    else                          color=$C_RED
    fi
    printf "%s%d%%%s" "$color" "$pct" "$C_RESET"
}

# ── Workspace ────────────────────────────────────────────────────────────────
user=$(whoami)
cwd=$(echo "$input" | jq -r '.workspace.current_dir // empty')
[ -z "$cwd" ] && cwd=$(pwd)
short_dir=$(basename "$cwd")

# ── Git branch ───────────────────────────────────────────────────────────────
branch_part=""
if git rev-parse --git-dir > /dev/null 2>&1; then
    BRANCH=$(git branch --show-current 2>/dev/null)
    if [ -n "$BRANCH" ]; then
        if ! git diff-index --quiet HEAD -- 2>/dev/null; then
            branch_part=" (${C_ORANGE}🌿 ${BRANCH}*${C_RESET})"
        else
            branch_part=" (${C_GREEN}🌿 ${BRANCH}${C_RESET})"
        fi
    fi
fi

# ── Model ────────────────────────────────────────────────────────────────────
model=$(echo "$input" | jq -r '.model.display_name // "Claude"')
case "$model" in
    *Opus*)   model_colored=$'\033[38;5;183m'"${model}"$'\033[0m' ;;  # 薄紫
    *Sonnet*) model_colored=$'\033[38;5;75m'"${model}"$'\033[0m'  ;;  # 水色
    *Haiku*)  model_colored=$'\033[38;5;114m'"${model}"$'\033[0m' ;;  # 薄緑
    *)        model_colored="${model}" ;;
esac

# ── Context window ───────────────────────────────────────────────────────────
ctx_pct=$(echo "$input" | jq -r '.context_window.used_percentage // 0')
ctx_int=$(printf "%.0f" "$ctx_pct")
ctx_bar=$(make_bar "$ctx_int" 8)
ctx_pct_str=$(color_pct "$ctx_int")

# ── Rate limits (Pro/Max only) ───────────────────────────────────────────────
h5_raw=$(echo "$input" | jq -r '.rate_limits.five_hour.used_percentage // empty')
d7_raw=$(echo "$input" | jq -r '.rate_limits.seven_day.used_percentage // empty')

# ── Assemble usage section ───────────────────────────────────────────────────
SEP="${C_GRAY} │ ${C_RESET}"

usage="${C_CYAN}ctx${C_RESET} ${ctx_bar} ${ctx_pct_str}"

if [ -n "$h5_raw" ]; then
    h5_int=$(printf "%.0f" "$h5_raw")
    h5_bar=$(make_bar "$h5_int" 8)
    h5_str=$(color_pct "$h5_int")
    usage="${usage}${SEP}${C_CYAN}5h${C_RESET} ${h5_bar} ${h5_str}"
fi

if [ -n "$d7_raw" ]; then
    d7_int=$(printf "%.0f" "$d7_raw")
    d7_bar=$(make_bar "$d7_int" 8)
    d7_str=$(color_pct "$d7_int")
    usage="${usage}${SEP}${C_CYAN}7d${C_RESET} ${d7_bar} ${d7_str}"
fi

# ── Final output ─────────────────────────────────────────────────────────────
printf "%s%s%s%s%s%s\n" \
    "${user} ➜ ${short_dir}${branch_part}" \
    "${SEP}" \
    "${model_colored}" \
    "${SEP}" \
    "${usage}"
