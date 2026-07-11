# Git · 브랜치 · 이슈 · PR 규칙

내가그린기린기록의 **모든 레포**(`girin-log-back` · `girin-log-front` · `girin-log-harness`)가 공유하는 규칙이다.
사람과 AI 작업자 모두 따른다. 브랜치·이슈·PR을 같은 형식으로 맞춰 추적을 쉽게 한다.

## 1. 커밋 메시지 (한국어)

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
| `docs` | 문서/명세(harness 레포에선 대부분 이것) |
| `refactor` | 동작 변화 없는 구조 개선 |
| `test` | 테스트 |
| `chore` | 빌드/설정/도구/CI |
| `hotfix` | 운영 긴급 수정 |

## 2. 기본 브랜치

- `main`: 기본 개발 브랜치. 항상 머지 가능한 상태로 둔다. **직접 push 금지.**
- `release-1.0`: 운영 배포 브랜치. *(배포 파이프라인 연동 여부는 `[확정 필요]` — girin-log CI 구성 시 확정)*

작업은 **항상 별도 브랜치를 만들어** 진행하고, 완료 후 `main`으로 PR을 올린다.

### 작업 시작 순서

파일 수정이 필요한 작업은 아래 순서를 먼저 지킨다. 사람과 AI 작업자 모두 예외 없이 따른다.

1. `git status -sb`로 현재 작업트리를 확인한다.
2. `main`에서 `git pull --ff-only`로 최신 원격을 받는다.
3. 작업 성격에 맞는 브랜치를 `type/english-task-name` 형식으로 만든다.
4. 새 브랜치로 전환된 것을 확인한 뒤 파일을 수정한다.

즉, `main`에서 바로 수정하지 않는다. `main`에 변경을 시작했다면 커밋하지 말고 즉시 새 브랜치를 만든 뒤 계속 작업한다.

## 3. 브랜치 네이밍

형식: `type/english-task-name`

```
feat/retrospective-generate-api
fix/diary-kst-boundary
refactor/memo-summary-response
chore/sentry-monitoring-setup
test/silok-prompt
docs/branch-convention
```

사용 가능한 `type`:

| type | 의미 | 예시 |
| --- | --- | --- |
| `feat` | 새로운 기능 추가 | `feat/persona-generate-api` |
| `fix` | 버그 수정 | `fix/session-followup-limit` |
| `refactor` | 동작 변경 없는 구조 개선 | `refactor/remove-unused-memo-status` |
| `test` | 테스트 추가/수정 | `test/silok-prompt` |
| `docs` | 문서 작성/수정 | `docs/branch-convention` |
| `chore` | 설정·빌드·CI·기타 | `chore/sentry-monitoring-setup` |
| `hotfix` | 운영 긴급 수정 | `hotfix/diary-duplicate` |

작성 규칙:

- 브랜치명은 **영어**로 작성한다.
- 단어 구분은 `_`가 아니라 **`-`**(케밥)를 쓴다.
- **소문자**를 기본으로 한다.
- 핵심만 짧게. 작업 내용을 길게 쓰지 않는다.
- 좋은 예: `fix/diary-kst-boundary`, `feat/check-service-period`, `refactor/basket-response`
- 피할 예: `fix/DiaryKstBoundary`, `feat/add_diary_api`, `bugfix/다이어리수정`

## 4. 이슈 컨벤션

이슈는 **각 레포의 GitHub Issues**에서 생성한다. (예: `https://github.com/my-girin-log/girin-log-back/issues`)

### 제목 형식

기본: `type: 내용`

```
feat: 회고 생성 엔드포인트 추가
fix: Diary 날짜 경계 06:00 보정
refactor: MemoSummary 응답 정리
chore: CI 트리거 브랜치 패턴 확장
```

이슈 `type` 기준은 커밋 type(1절)과 동일하다.

### GitHub Label 기준

| 라벨 | 의미 |
| --- | --- |
| `기능` | 새로운 기능 개발 |
| `버그` | 버그 수정 |
| `개선` | 프로덕트 개선 |
| `테스트` | 테스트 수정 필요 |
| `기타` | 성격이 명확하지 않은 작업 |
| `ai-generated` | AI가 생성한 이슈/PR |
| `ai-follow-up` | AI 작업 제한으로 후속 PR이 필요한 작업 |
| `manual-required` | 사람이 직접 수정해야 하는 작업 |

## 5. 이슈 본문 템플릿

간단하되, 작업자가 바로 이해할 정도로 적는다.

```markdown
## Summary
작업 요약을 적는다.

## TODO
- [ ] 해야 할 일 1
- [ ] 해야 할 일 2

## 참고
관련 PR, 문서, 기존 이슈 링크를 적는다.
```

## 6. PR 컨벤션

PR 제목도 기본적으로 이슈와 같은 형식을 따른다.

```
feat: 회고 생성 엔드포인트 추가
fix: 세션 역질문 상한 처리 수정
```

규칙:

- 모든 변경은 PR. 최소 1명 리뷰 후 머지. `main` 직접 push 금지.
- **AI가 생성한 PR**은 제목에 `[AI]`를 포함하고 `ai-generated` 라벨을 붙인다.
  - 예: `feat: [AI] 잔여 역질문 횟수 응답 추가`
- **`girin-log-harness`(SSOT)의 PR은 영향 범위를 반드시 적는다.** 명세/용어 변경은 BE·FE 양쪽에 파급되기 때문.
  - 예: "`Diary.content` 필드명 변경 → FE 타입 재생성 필요, BE 직렬화 수정 필요"
- 명세(`api/`)가 바뀐 PR이 머지되면 의존 레포는 **타입 재생성 / submodule 업데이트**를 돌린다.
- PR 작업 단위와 분할 기준은 [`conventions/pr.md`](pr.md)를 따른다. Codex 코드 리뷰가 한 번에 이해하고 검증할 수 있는 크기로 나눈다.

## 7. 빠른 선택 기준

- 브랜치명은 `type/english-task-name` 형식을 쓴다.
- 이슈/PR 제목은 `type: 내용` 형식을 쓴다.
- 커밋 메시지는 `type: 한국어 설명` 형식을 쓴다.
- PR 작업 단위가 커지면 [`conventions/pr.md`](pr.md)의 분할 기준을 먼저 확인한다.

## 8. 보호 규칙 (hook으로 강제)

- `main` 직접 커밋/푸시 차단은 `harness/`의 PreToolUse hook + 원격 브랜치 보호 둘 다로 막는다.
