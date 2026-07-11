# 데이터 모델

MVP 기획안(2026-06-06)과 결정사항을 반영한 도메인 모델 초안이다.
**`[확정 필요]`는 실제 API 명세 또는 팀 합의가 생기기 전까지 임의로 채우지 않는다.**

> 이 문서는 "엔티티가 무엇이고 무엇을 담는가"를 합의하는 곳이다.
> 정확한 타입/제약/관계는 `api/openapi.yaml`의 `components/schemas`가 최종 진실이다.

---

## User

GitHub OAuth 기반 로그인 사용자.

| 필드 | 설명 | 비고 |
| --- | --- | --- |
| `id` | 내부 식별자 | |
| `githubId` | GitHub 식별자 | OAuth |
| `githubUsername` | GitHub username | |
| `profileImageUrl` | GitHub 프로필 이미지 URL | |
| `nickname` | 서비스 닉네임 | |
| `onboardingCompleted` | 온보딩 완료 여부 | |
| `createdAt` | 가입 시각 | |
| `updatedAt` | 수정 시각 | |

## OnboardingSurvey

말투, 정리 습관, 회고 성향을 수집하는 약 10개 문항의 설문 응답.

| 필드 | 설명 | 비고 |
| --- | --- | --- |
| `id` | 식별자 | |
| `userId` | 소유자 | |
| `answers` | 설문 응답 원문 | JSON 저장 검토 |
| `submittedAt` | 제출 시각 | |

## PersonaSource

Persona 생성을 위한 원천 입력. 블로그 링크, 기존 글 원문, 설문 응답 등을 보관한다.

| 필드 | 설명 | 비고 |
| --- | --- | --- |
| `id` | 식별자 | |
| `userId` | 소유자 | |
| `sourceType` | 입력 종류 | `BLOG_URL` / `TEXT` / `SURVEY` |
| `content` | 원천 내용 | URL 또는 원문 |
| `analysisStatus` | 분석 상태 | `PENDING` / `ANALYZING` / `COMPLETED` / `FAILED` (BLOG_URL만 분석 대상, FAILED여도 설문 기반 Persona 생성 가능) |
| `createdAt` | 생성 시각 | |

## Persona

사용자의 말투, 사고 흐름, 관심사, 정리 습관, 회고 기준을 요약한 정보.
Retrospective 생성 시 "사용자다움"의 근거가 된다. 회고 생성에는 사용자 기록을 바탕으로
주기적으로 갱신되는 `persona.md` 표현을 사용한다.

블로그 링크 분석 결과, 기존 글 원문, 온보딩 설문 응답을 함께 사용하되 일부 입력만 있어도
Persona를 생성할 수 있어야 한다. 초기 Persona는 온보딩 기반으로 만들고, 이후 기록이
쌓이면 사용자 맞춤 기준이 변할 수 있도록 내부 작업으로 갱신한다. 갱신 주기는 매일로
고정하지 않는다.

| 필드 | 설명 | 비고 |
| --- | --- | --- |
| `id` | 식별자 | |
| `userId` | 소유자 | |
| `tone` | 말투 특징 | |
| `thinkingStyle` | 사고 흐름 | |
| `recurringInterests` | 반복 관심사 | |
| `organizingHabit` | 글 정리 습관 | |
| `retrospectionCriteria` | 회고 기준 | |
| `preferredStructure` | 선호 글 구조 | |
| `summary` | 회고 생성용 요약 Persona | |
| `markdown` | `persona.md` 표현 | Retrospective 생성 입력 |
| `lastRefreshedAt` | 마지막 갱신 시각 | 주기적 갱신 기준 |
| `createdAt` | 생성 시각 | |
| `updatedAt` | 수정 시각 | |

## Memo

사용자가 하루 동안 자유롭게 기록하는 작업 메모장 단위. 하루에 여러 개 생성될 수 있다.

`DRAFT` 상태의 Memo만 수정/삭제할 수 있다. `SUMMARIZED` Memo는 이미 MemoSummary의 원천이고,
`ARCHIVED` Memo는 Diary/Retrospective의 근거가 될 수 있으므로 수정/삭제하지 않는다. 삭제된
Memo는 목록 조회, MemoSummary 생성, Diary 생성 입력에서 제외된다.

### 상태

| 상태 | 설명 |
| --- | --- |
| `DRAFT` | 작성 중 |
| `SUMMARIZED` | MemoSummary 생성 완료 |
| `ARCHIVED` | 06:00 KST 이후 일일 작업 공간에서 제외 |

| 필드 | 설명 | 비고 |
| --- | --- | --- |
| `id` | 식별자 | |
| `userId` | 소유자 | |
| `date` | 서비스 기준 날짜(KST) | 일자 경계 06:00 KST |
| `content` | 기록 본문 | 긴 텍스트 |
| `status` | Memo 상태 | `DRAFT` / `SUMMARIZED` / `ARCHIVED` |
| `createdAt` | 생성 시각 | |
| `updatedAt` | 수정 시각 | |

## MemoSummary

Memo 전체 내용을 AI가 읽고 **카테고리별로 재구성한 요약본**. 한 카테고리(MemoSummary)는
여러 원본 Memo 조각을 묶을 수 있고, 각 조각은 `MemoSummaryItem`으로 표현된다.
MVP에서는 조회만 가능하며 수정/삭제하지 않는다.

이미 대화에 사용된 MemoSummary는 비활성화 상태로 표시하고 재선택할 수 없다. 목록 조회에서는
프론트가 카테고리 선택 UI를 비활성화할 수 있도록 대화 가능 여부를 함께 제공한다.

| 필드 | 설명 | 비고 |
| --- | --- | --- |
| `id` | 식별자 | |
| `userId` | 소유자 | |
| `date` | 서비스 기준 날짜(KST) | |
| `categoryName` | 카테고리명 | |
| `summary` | 요약 내용 | |
| `itemCount` | 묶인 항목 수 | `items` 길이 |
| `items` | 카테고리에 묶인 요약 항목 목록 | `MemoSummaryItem[]` |
| `chatAvailable` | 대화 시작에 선택 가능한지 여부 | 이미 대화에 사용되면 `false` |
| `chatDisabledReason` | 비활성화 사유 | 예: `ALREADY_CHATTED` |
| `createdAt` | 생성 시각 | |

### MemoSummaryItem

한 카테고리에 묶인 개별 요약 항목.

| 필드 | 설명 | 비고 |
| --- | --- | --- |
| `id` | 식별자 | |
| `memoId` | 원본 Memo 연결 | **서버 내부 추적용. API 응답에는 포함하지 않는다**(2026-06-09 결정) |
| `content` | 항목 내용 | 사용자 노출 |

## DailyChatSession

하나 이상의 MemoSummary를 기반으로 시작되는 실록이 대화 세션.
MVP에서는 메시지 단위의 별도 ChatMessage 엔티티를 두지 않고, 하나의
DailyChatSession 안에 전체 대화 원문을 저장한다.
Diary와 Retrospective 생성의 핵심 입력이다.

### 라이프사이클

- 하루에 여러 세션이 생길 수 있다.
- 세션은 Memo가 아니라 사용자가 선택한 하나 이상의 MemoSummary로 시작한다.
- 실록이의 역질문은 최대 10회로 제한한다.
- 사용자는 언제든 끝내기 버튼으로 종료할 수 있다.
- 사용자가 중간에 끝내기로 종료한 세션도 완전히 종료된 `ENDED` 상태로 취급하며 다시 이어서 대화하지 않는다.
- 종료 시 짧은 마무리 멘트를 제공한다.
- 실록이 질문, 사용자 답변, 마무리 멘트는 `conversation`에 순서가 드러나도록 저장한다.

| 필드 | 설명 | 비고 |
| --- | --- | --- |
| `id` | 식별자 | |
| `userId` | 소유자 | |
| `date` | 서비스 기준 날짜(KST) | **생성 시점 06:00 경계 기준. 한 세션은 하나의 serviceDate에만 속한다**(2026-06-09 결정) |
| `selectedMemoSummaryIds` | 선택된 MemoSummary 목록 | 관계 테이블 검토. 모두 같은 serviceDate여야 한다 |
| `selectedSummariesSnapshot` | 시작 시점 선택 Summary 내용 스냅샷 | **대화 기록 보존용 snapshot**(jsonb). 원본 변경과 무관하게 대화 맥락 고정(2026-06-09 결정) |
| `followUpCount` | 누적 역질문 횟수 | 0~10 |
| `maxFollowUpCount` | 역질문 상한 | 기본 10 |
| `conversation` | 전체 대화 원문 | 실록이 질문, 사용자 답변, 마무리 멘트를 순서대로 포함 |
| `status` | 세션 상태 | `OPEN` / `ENDED` |
| `endedReason` | 종료 사유 | `USER_ENDED` / `MAX_FOLLOWUP` / `AI_DECIDED` / `SYSTEM_ENDED`(06:00 자동 종료) |
| `closingMessage` | 종료 시 마무리 멘트 | |
| `createdAt` | 생성 시각 | |
| `endedAt` | 종료 시각 | |

DailyChatSession 예시:

```text
selectedMemoSummaryIds: [10, 11]
status: OPEN
followUpCount: 2

1. SILOK: ~~을 할 때는 무슨 감정이었어?
2. USER: ~~이었어.
3. SILOK: 그럼 ~~ 이런 부분에서는 ~~이랬던 거야?
4. USER: 아니야. 나는 이렇게 느꼈어.
```

## Diary

하루의 Memo 원본과 DailyChatSession들을 모아 사용자가 하루를 어떻게 보냈는지 요약한
날짜별 정리본. 날짜별 하나만 생성된다.

채팅하지 않은 Memo도 Diary에 반영되어야 한다. Memo 원본은 사실 근거이고, MemoSummary는
있을 때만 카테고리/압축 힌트로 참고한다. MemoSummary는 원본 Memo를 대체하지 않는다.
Memo에만 남은 내용은 기록된 사실로 보존하고, DailyChatSession에서 확인된 감정, 이유,
판단 기준은 더 강한 회고 신호로 반영한다.

### 06:00 KST 동작

- 매일 06:00 KST에 전날 데이터를 기반으로 자동 생성한다.
- 자동 생성이 누락되었거나 아직 Diary가 없는 과거 서비스 날짜는 사용자가 수동 생성을 요청할 수 있다.
- 수동 생성은 현재 진행 중인 서비스 날짜와 미래 날짜에는 허용하지 않는다.
- 이미 Diary가 있는 날짜의 수동 생성 요청은 기존 Diary를 반환하는 멱등 동작이다.
- 기존 Memo, MemoSummary, DailyChatSession은 삭제하지 않고 보관한다.
- 06:00 KST 이후 작업 공간에서는 이전 Memo를 `ARCHIVED`로 취급한다.
- 생성 대상 날짜에 Memo와 DailyChatSession이 모두 없으면 빈 Diary를 생성하지 않는다.

| 필드 | 설명 | 비고 |
| --- | --- | --- |
| `id` | 식별자 | |
| `userId` | 소유자 | |
| `date` | 서비스 기준 날짜(KST) | 하루 1개 unique |
| `mainEvents` | 하루 주요 사건 | |
| `emotionContext` | 감정과 맥락 | |
| `concerns` | 고민한 지점 | |
| `newCriteria` | 새로 생긴 기준 | |
| `nextActions` | 다음에 다르게 해보고 싶은 점 | |
| `summary` | 회고 생성용 하루 요약 | Retrospective 생성 입력 |
| `markdown` | 정리된 Markdown 본문 | 사용자 노출 및 Retrospective 생성 입력 |
| `createdAt` | 생성 시각 | |

## StreakDay

GitHub 잔디처럼 "사용자가 그 날 Memo를 작성했는가"를 날짜 단위로 1개만 기록한다.
누적 카운트가 아니라 `사용자 + 스트릭 날짜` 단위 Boolean 도달 기록이다.

### 동작

- 스트릭 날짜는 Memo의 서비스 날짜(`serviceDate`, 06:00 KST 경계)와 동일하다.
  - 즉 `2026-06-12 05:59`에 속한 활동은 `2026-06-11` 스트릭, `06:00` 이후는 `2026-06-12` 스트릭.
- 내용 있는 Memo가 작성될 때 **백엔드 내부 로직**으로 upsert한다
  (사용자가 직접 누르는 공개 API 아님 → 조작 방지). 기록 실패가 Memo 저장을 막지 않는다.
- 같은 `(userId, streakDate)`가 이미 있으면 무시한다(하루 1회만 인정).
- 작성 개수에 따른 명암 차이는 두지 않고, 해당 날짜 작성 여부만 표시한다.

| 필드 | 설명 | 비고 |
| --- | --- | --- |
| `id` | 식별자 | |
| `userId` | 소유자 | |
| `streakDate` | 스트릭 날짜(서비스 날짜, KST) | `(userId, streakDate)` unique |
| `diaryId` | (선택) 연결된 Diary | nullable. Memo 작성 기준 스트릭에선 보통 비어있음 |
| `completedAt` | 달성 시각(Memo 작성 시각) | |
| `createdAt` | 행 생성 시각 | |
| `updatedAt` | 행 수정 시각 | |

조회 API는 `GET /api/streaks/me/today`(오늘 달성 여부), `GET /api/streaks/me`(요약+잔디).
요약 수치(currentStreak/longestStreak/totalCompletedDays)는 전체 기록 기준, days 배열은 조회 범위 기준이다.

## Retrospective

선택 기간의 Diary, DailyChatSession 전체 대화 원문, `persona.md`를 기반으로 생성한 완성형
회고 글. 원본 Memo는 Diary에 흡수된 하루 맥락으로 사용하고, MemoSummary는 Diary 생성 시
보조 힌트로만 참고한다. 원본 Memo와 MemoSummary는 Retrospective 생성의 기본 직접 입력으로
다시 넣지 않는다. (2026-07-09 결정)

| 필드 | 설명 | 비고 |
| --- | --- | --- |
| `id` | 식별자 | |
| `userId` | 소유자 | |
| `periodStart` | 시작 날짜 | |
| `periodEnd` | 종료 날짜 | |
| `sourceDailyChatSessionIds` | 회고 생성에 사용한 DailyChatSession 목록 | |
| `title` | 제목 | |
| `content` | 생성된 Markdown | 복사/다운로드 대상 |
| `createdAt` | 생성 시각 | |

## EventLog

MVP 검증 지표 수집을 위한 얇은 append-only 이벤트 로그.
**기록 주체는 100% 백엔드 내부**다(도메인 동작 시 서버가 append). 별도 생성 API를 두지 않으며,
프론트 클릭/노출 이벤트는 MVP에서 수집하지 않는다(2026-06-10 결정).

| 필드 | 설명 | 비고 |
| --- | --- | --- |
| `id` | 식별자 | |
| `userId` | 사용자 | **필수(NOT NULL)**. 비로그인 이벤트는 MVP에서 저장하지 않는다. |
| `eventType` | 이벤트 종류 | 예: `MEMO_CREATED` |
| `occurredAt` | 발생 시각 | |
| `metadataJson` | 부가 정보 | PostgreSQL `jsonb` 검토 |

초기 이벤트 후보:

- `USER_SIGNED_IN`
- `ONBOARDING_COMPLETED`
- `PERSONA_CREATED`
- `MEMO_CREATED`
- `MEMO_SUMMARIZED`
- `CHAT_SESSION_STARTED`
- `CHAT_SESSION_ENDED`
- `DIARY_CREATED`
- `RETROSPECTIVE_CREATED`

## 관계 요약

```text
User 1 ── N OnboardingSurvey
User 1 ── N PersonaSource
User 1 ── 1 Persona
User 1 ── N Memo
Memo 1 ── N MemoSummary
MemoSummary N ── 0..1 DailyChatSession
Memo N ──> Diary
MemoSummary N ──> Diary  (보조 힌트)
DailyChatSession N ──> Diary
Diary N ──> Retrospective
DailyChatSession N ──> Retrospective
Persona 1 ──> Retrospective
User 1 ── N Diary       (date 기준 하루 1개)
Memo N ──> StreakDay  (Memo 작성 시 해당 서비스 날짜 스트릭 기록)
User 1 ── N StreakDay   (streakDate 기준 하루 1개)
User 1 ── N Retrospective
User 1 ── N EventLog
```

## MVP 제외 도메인

- `Pet`: 실록이 성장, EXP 등은 MVP 제외. (단, Memo 작성 기반 streak은 `StreakDay`로 도입됨)
- Export 서버 모델: Markdown 복사/다운로드는 FE 기능으로 처리한다.
