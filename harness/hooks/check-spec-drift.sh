#!/usr/bin/env bash
# openapi.yaml 유효성을 검사하는 hook의 최소 구현.
# exit 0 = 통과, exit 2 = 차단(에이전트에 stderr 메시지 전달 → 자가 수정 유도).
#
# 실제로는 각 레포 스택에 맞게:
#   - 응답 DTO가 openapi 스키마와 일치하는지
#   - 생성된 FE 타입이 최신 openapi와 같은지
# 를 검사하도록 채운다. 아래는 "스펙이 valid한가"만 거는 최소 버전이며,
# 실제 DTO/타입 드리프트 검사는 BE/FE 레포별로 확장한다.
set -euo pipefail

SPEC="${SPEC_PATH:-api/openapi.yaml}"

if [ ! -f "$SPEC" ]; then
  # 이 레포 컨텍스트가 아니면 조용히 통과
  exit 0
fi

# 도구는 팀 합의 [확정 필요]. 예: redocly. 미설치면 통과시키되 경고.
if command -v npx >/dev/null 2>&1; then
  if ! npx --yes @redocly/cli lint "$SPEC" >/tmp/spec-lint.log 2>&1; then
    echo "OpenAPI 명세가 유효하지 않습니다. 코드보다 명세가 먼저 옳아야 합니다." >&2
    echo "----" >&2
    tail -n 30 /tmp/spec-lint.log >&2
    exit 2
  fi
fi

exit 0
