# Git 규칙

## 커밋 메시지 (한국어)

형식: `type: 한국어 설명`

```
feat: 회고 생성 엔드포인트 추가
fix: Diary 날짜 경계가 자정으로 계산되던 문제 수정
docs: API 에러 envelope 규칙 정리
chore: openapi 타입 생성 스크립트 추가
```

- `type`은 영어, 본문 설명은 **한국어**.
- 한 커밋은 한 가지 일만. "이것저것 수정"은 쪼갠다.

| type | 용도 |
| --- | --- |
| `feat` | 기능 추가 |
| `fix` | 버그 수정 |
| `docs` | 문서/명세(이 레포에선 대부분 이것) |
| `refactor` | 동작 변화 없는 구조 개선 |
| `test` | 테스트 |
| `chore` | 빌드/설정/도구 |

## 브랜치

- `main`: 항상 배포/머지 가능한 상태. **직접 push 금지.**
- 작업 브랜치: `type/도메인-요약` (예: `feat/retrospective-generate`, `fix/diary-kst-boundary`)
- 백엔드 2명은 도메인으로 나뉘어 있으니(coding.md 1절) 브랜치도 도메인 단위로 떨어져 충돌이 적다.

## PR

- 모든 변경은 PR. 최소 1명 리뷰 후 머지.
- **이 레포(girin-codex)의 PR은 영향 범위를 반드시 적는다.** 명세/용어 변경은 BE·FE 양쪽에 파급되기 때문.
  - 예: "`Diary.content` 필드명 변경 → FE 타입 재생성 필요, BE 직렬화 수정 필요"
- 명세(`api/`)가 바뀐 PR이 머지되면, 의존하는 레포는 타입 재생성 / submodule 업데이트를 돌린다.

## 보호 규칙 (hook으로 강제)

- `main` 직접 커밋/푸시 차단은 `harness/`의 PreToolUse hook + 원격 브랜치 보호 둘 다로 막는다.
