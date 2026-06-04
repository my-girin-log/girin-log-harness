#!/usr/bin/env bash
# 편집된 파일을 자동 포맷·린트하는 hook 골격. 각 레포 스택에 맞게 채운다.
# FE 예: prettier/eslint, BE 예: spotless/ktlint.
set -euo pipefail

# Claude Code는 hook 입력 JSON을 stdin으로 준다. 편집 파일 경로 등을 여기서 파싱.
# 최소 버전: 프로젝트 표준 포맷 명령을 실행만 한다.

# 예시 (주석 해제 후 사용):
# command -v npx >/dev/null 2>&1 && npx prettier --write . >/dev/null 2>&1 || true
# command -v ./gradlew >/dev/null 2>&1 && ./gradlew spotlessApply -q || true

exit 0
