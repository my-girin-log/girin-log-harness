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
| `analysisStatus` | 분석 상태 | `[확정 필요]` |
| `createdAt` | 생성 시각 | |

## Persona

사용자의 말투, 사고 흐름, 관심사, 정리 습관, 회고 기준을 요약한 정보.
Retrospective 생성 시 "사용자다움"의 근거가 된다.

블로그 링크 분석 결과, 기존 글 원문, 온보딩 설문 응답을 함께 사용하되 일부 입력만 있어도
Persona를 생성할 수 있어야 한다.

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
| `createdAt` | 생성 시각 | |
| `updatedAt` | 수정 시각 | |

## Memo

사용자가 하루 동안 자유롭게 기록하는 작업 메모장 단위. 하루에 여러 개 생성될 수 있다.

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

Memo 전체 내용을 AI가 읽고 카테고리별로 재구성한 요약본.
MVP에서는 조회만 가능하며 수정/삭제하지 않는다.

| 필드 | 설명 | 비고 |
| --- | --- | --- |
| `id` | 식별자 | |
| `userId` | 소유자 | |
| `memoId` | 요약 대상 Memo | |
| `date` | 서비스 기준 날짜(KST) | |
| `categoryName` | 카테고리명 | |
| `summary` | 요약 내용 | |
| `createdAt` | 생성 시각 | |

## DailyChatSession

하나 이상의 MemoSummary를 기반으로 시작되는 실록이 대화 세션.

### 라이프사이클

- 하루에 여러 세션이 생길 수 있다.
- 세션은 Memo가 아니라 사용자가 선택한 하나 이상의 MemoSummary로 시작한다.
- 실록이의 역질문은 최대 10회로 제한한다.
- 사용자는 언제든 끝내기 버튼으로 종료할 수 있다.
- 종료 시 짧은 마무리 멘트를 제공한다.

| 필드 | 설명 | 비고 |
| --- | --- | --- |
| `id` | 식별자 | |
| `userId` | 소유자 | |
| `date` | 서비스 기준 날짜(KST) | |
| `selectedMemoSummaryIds` | 선택된 MemoSummary 목록 | 관계 테이블 검토 |
| `followUpCount` | 누적 역질문 횟수 | 0~10 |
| `maxFollowUpCount` | 역질문 상한 | 기본 10 |
| `status` | 세션 상태 | `OPEN` / `ENDED` |
| `endedReason` | 종료 사유 | `USER_ENDED` / `MAX_FOLLOWUP` / `AI_DECIDED` |
| `closingMessage` | 종료 시 마무리 멘트 | |
| `createdAt` | 생성 시각 | |
| `endedAt` | 종료 시각 | |

## ChatMessage

DailyChatSession 안에 순서대로 저장되는 실록이 질문과 사용자 답변의 raw data.
엔티티명은 `Chat`이 아니라 `ChatMessage`로 통일한다.

| 필드 | 설명 | 비고 |
| --- | --- | --- |
| `id` | 식별자 | |
| `dailyChatSessionId` | 소속 세션 | |
| `sender` | 발화자 | `SILOK` / `USER` |
| `messageType` | 메시지 종류 | `FOLLOW_UP_QUESTION` / `USER_ANSWER` / `CLOSING` |
| `content` | 메시지 내용 | |
| `sequence` | 세션 내 순서 | |
| `createdAt` | 생성 시각 | |

## Diary

하루의 Memo, MemoSummary, ChatMessage를 종합한 일일 기록. 날짜별 하나만 생성된다.

### 06:00 KST 동작

- 매일 06:00 KST에 전날 데이터를 기반으로 자동 생성한다.
- 수동 생성은 MVP 범위가 아니다.
- 기존 Memo, MemoSummary, ChatMessage는 삭제하지 않고 보관한다.
- 06:00 KST 이후 작업 공간에서는 이전 Memo를 `ARCHIVED`로 취급한다.

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
| `retrospectiveSummary` | 회고 생성용 요약 | |
| `content` | 정리된 Markdown 본문 | |
| `createdAt` | 생성 시각 | |

## Retrospective

기간 내 Diary와 Persona를 기반으로 생성한 완성형 회고 글.

| 필드 | 설명 | 비고 |
| --- | --- | --- |
| `id` | 식별자 | |
| `userId` | 소유자 | |
| `periodStart` | 시작 날짜 | |
| `periodEnd` | 종료 날짜 | |
| `title` | 제목 | |
| `content` | 생성된 Markdown | 복사/다운로드 대상 |
| `createdAt` | 생성 시각 | |

## EventLog

MVP 검증 지표 수집을 위한 얇은 append-only 이벤트 로그.

| 필드 | 설명 | 비고 |
| --- | --- | --- |
| `id` | 식별자 | |
| `userId` | 사용자 | 비로그인 이벤트 필요 여부 `[확정 필요]` |
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
MemoSummary N ── N DailyChatSession
DailyChatSession 1 ── N ChatMessage
User 1 ── N Diary       (date 기준 하루 1개)
User 1 ── N Retrospective
User 1 ── N EventLog
```

## MVP 제외 도메인

- `Pet`: 실록이 성장, EXP, streak 등은 MVP 제외.
- Export 서버 모델: Markdown 복사/다운로드는 FE 기능으로 처리한다.
