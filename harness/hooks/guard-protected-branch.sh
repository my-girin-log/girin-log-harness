#!/usr/bin/env bash
# main 등 보호 브랜치에서 Bash 호출을 차단하는 PreToolUse hook의 최소 구현.
# exit 2 = 차단. (원격 브랜치 보호와 병행할 것.)
set -euo pipefail

PROTECTED_REGEX='^(main|master|develop)$'
CURRENT="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '')"

# stdin의 hook 입력에서 실행될 명령을 읽어 git commit/push만 판별하도록 확장 가능.
# 현재 최소 버전: 보호 브랜치에서 Bash 전체를 차단.
if [[ "$CURRENT" =~ $PROTECTED_REGEX ]]; then
  echo "보호 브랜치($CURRENT)에서의 직접 작업이 감지되었습니다. 작업 브랜치를 만들어 진행하세요." >&2
  exit 2
fi

exit 0
