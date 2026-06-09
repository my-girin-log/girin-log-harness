# Git · 브랜치 · 이슈 · PR 규칙

내가그린기린기록의 **모든 레포**(`girin-log-back` · `girin-log-front` · `girin-codex`)가 공유하는 규칙이다.
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
| `docs` | 문서/명세(codex 레포에선 대부분 이것) |
| `refactor` | 동작 변화 없는 구조 개선 |
| `test` | 테스트 |
| `chore` | 빌드/설정/도구/CI |
| `hotfix` | 운영 긴급 수정 |

## 2. 기본 브랜치

- `main`: 기본 개발 브랜치. 항상 머지 가능한 상태로 둔다. **직접 push 금지.**
- `release-1.0`: 운영 배포 브랜치. *(배포 파이프라인 연동 여부는 `[확정 필요]` — girin-log CI 구성 시 확정)*

작업은 **항상 별도 브랜치를 만들어** 진행하고, 완료 후 `main`으로 PR을 올린다.

## 3. 브랜치 네이밍

두 가지 방식 중 하나로 관리한다. 한 레포 안에서는 한 방식으로 통일하는 것을 권장한다.

### 버전 1. 작업 타입 기반

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

### 버전 2. Notion TSK 기반

형식: `작업자/TSK-번호`

```
haeyoon1/TSK-90
boyekim/TSK-72
2Jin1031/TSK-56-150
```

사용 기준: Notion 작업 관리 페이지에서 **TSK ID로 업무를 관리하는 경우** 이 방식을 쓴다.

작업 흐름:

1. Notion에서 내 작업의 TSK ID를 확인한다.
2. 그 TSK ID로 브랜치를 만든다.
3. 작업이 여러 하위 이슈로 쪼개져 있으면 세부 번호까지 포함한다(예: `2Jin1031/TSK-56-150`).

작성 규칙:

- 앞부분은 **GitHub username**(또는 팀에서 쓰는 작업자명)을 쓴다.
- `TSK`는 **대문자** 권장.
- Notion의 TSK 번호와 브랜치 번호가 **일치**해야 한다.
- GitHub Issue·PR 제목에도 같은 TSK ID를 넣으면 추적이 쉽다.

```
브랜치: haeyoon1/TSK-90
Issue:  [TSK-90] 실록이 모니터링 셋업
PR:     [TSK-90] 실록이 모니터링 셋업
```

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

Notion TSK 기반 작업이면: `[TSK-번호] 내용`

```
[TSK-90] 실록이 모니터링 셋업
[TSK-72] 회고 기간 선택 검증 추가
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
관련 Notion(TSK), PR, 문서, 기존 이슈 링크를 적는다.
```

## 6. PR 컨벤션

PR 제목도 기본적으로 이슈와 같은 형식을 따른다.

```
feat: 회고 생성 엔드포인트 추가
fix: 세션 역질문 상한 처리 수정
```

TSK 기반 작업이면: `[TSK-90] 실록이 모니터링 셋업`

규칙:

- 모든 변경은 PR. 최소 1명 리뷰 후 머지. `main` 직접 push 금지.
- **AI가 생성한 PR**은 제목에 `[AI]`를 포함하고 `ai-generated` 라벨을 붙인다.
  - 예: `feat: [AI] 잔여 역질문 횟수 응답 추가`
- **`girin-codex`(SSOT)의 PR은 영향 범위를 반드시 적는다.** 명세/용어 변경은 BE·FE 양쪽에 파급되기 때문.
  - 예: "`Diary.content` 필드명 변경 → FE 타입 재생성 필요, BE 직렬화 수정 필요"
- 명세(`api/`)가 바뀐 PR이 머지되면 의존 레포는 **타입 재생성 / submodule 업데이트**를 돌린다.

## 7. 빠른 선택 기준

- GitHub 중심의 작고 독립적인 작업 → **타입 기반**: `feat/persona-generate-api`, `fix/diary-kst-boundary`
- Notion에서 TSK로 관리되는 작업 → **TSK 기반**: `haeyoon1/TSK-90`
- 이슈/PR 제목은 간단히 `type: 내용`, TSK 추적이 필요하면 `[TSK-번호] 내용`

## 8. 보호 규칙 (hook으로 강제)

- `main` 직접 커밋/푸시 차단은 `harness/`의 PreToolUse hook + 원격 브랜치 보호 둘 다로 막는다.
