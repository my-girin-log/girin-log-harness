# 용어 사전 (Glossary)

**이 표가 영문 필드명/타입명/엔드포인트명의 단일 진실이다.**
같은 개념을 BE/FE/명세에서 다른 단어로 부르지 않는다. 새 용어가 필요하면 여기 먼저 추가하고 PR.

| 한국어 | 표준 영문 | 쓰는 곳 | 쓰지 말 것 |
| --- | --- | --- | --- |
| 실록이 (AI 캐릭터) | `silok` | 코드/주석 | `bot`, `ai`, `assistant`(혼용 금지) |
| 크루 (사용자) | `User` | 엔티티 | `Member`, `Crew`(엔티티명으론 X) |
| 페르소나 | `Persona` | 엔티티/필드 | `Profile`, `Style` |
| 페르소나 원천 입력 | `PersonaSource` | 엔티티 | `PersonaInput`, `Source`(단독) |
| 온보딩 설문 | `OnboardingSurvey` | 엔티티/필드 | `PersonaSurvey`, `quiz`, `questionnaire` |
| 메모 (작업 메모장) | `Memo` | 엔티티/필드 | `Note`, `Record`(혼용 금지) |
| 메모 요약 | `MemoSummary` | 엔티티/필드 | `Summary`, `MemoCategory` |
| 메모 요약 항목 | `MemoSummaryItem` | 응답 필드 | `Summary`(단독) — 카테고리 묶음의 한 항목 |
| 메모 요약 대화 가능 여부 | `chatAvailable` / `chatDisabledReason` | 필드 | `status`(MemoSummary 상태로 오해 가능) |
| 메모 상태 | `MemoStatus` | enum | `DRAFT`/`SUMMARIZED`/`ARCHIVED` 외 임의 추가 금지 |
| 역질문 (실록이의 되묻기) | `followUpQuestion` | 필드 | `question`(단독은 모호) |
| 역질문 횟수/상한 | `followUpCount` / `maxFollowUpCount` | 필드 | — (상한 기본 10) |
| 세션 끝내기 | `endSession` / `status=ENDED` | 동작/필드 | `close`, `finish`(혼용 금지) |
| 종료 사유 | `endedReason` | 필드 | enum: `USER_ENDED`/`MAX_FOLLOWUP`/`AI_DECIDED`/`SYSTEM_ENDED`(06:00 자동 종료) |
| 일일 대화 세션 | `DailyChatSession` | 엔티티 | `ChatLog`, `Session`(단독) |
| 전체 대화 원문 | `conversation` (DailyChatSession 필드) | 필드 | MVP에서 별도 `ChatMessage`/`Chat` 엔티티로 분리하지 않는다 |
| 다이어리 (날짜별 정리본) | `Diary` | 엔티티 | `Journal`, `DailyNote` |
| 일일 맥락 스냅샷 | `DailyContext` | Retrospective 생성 내부 입력 | 엔티티/저장 스키마가 아니다. 현재 진행 중인 serviceDate에 Diary가 없고 내용 있는 Memo가 있을 때만 당일 Memo 원본으로 임시 구성한다. DailyChatSession 원문은 포함하지 않는다. 과거·미래 날짜에는 만들지 않는다 |
| 회고 (완성형 글) | `Retrospective` | 엔티티 | `Retro`, `Review`, `Reflection` |
| 이벤트 로그 | `EventLog` | 엔티티 | `AnalyticsLog`, `TrackingLog` |
| 펫 (성장/EXP/streak) | `Pet` | MVP 제외 도메인 | `Character`, `Mascot` |
| 우테코 | `wtc` 또는 풀어서 표기 | 주석/문서 | 무분별한 약어 |

## 표기 규칙

- **엔티티/타입명**: `PascalCase` (`Diary`, `Retrospective`)
- **필드/변수**: `camelCase` (`createdAt`, `followUpQuestion`)
- **엔드포인트 경로**: `kebab-case` 복수형 (`/daily-chat-sessions`, `/retrospectives`)
- **enum 값**: `UPPER_SNAKE_CASE` (`status: DRAFT | DONE`)

## 도메인 약속

- "회고를 만든다" = `Retrospective`를 **생성(generate)** 한다. "Diary를 만든다"와 구분.
- "메모를 요약한다" = `Memo` → `MemoSummary` 생성.
- "대화를 시작한다" = 하나 이상의 `MemoSummary`를 선택해 `DailyChatSession`을 생성.
- `MemoSummary`는 수정/삭제하지 않지만, 이미 대화에 사용된 항목은 `chatAvailable=false`로 비활성화하고 재선택을 금지한다.
- `DailyChatSession`은 **하나의 `serviceDate`에만 속한다**(생성 시점 06:00 경계 기준). 서로 다른 날짜의 `MemoSummary`를 한 세션에 섞지 않는다.
- "전체 대화를 저장한다" = `DailyChatSession`의 `conversation` 필드에 실록이 질문·사용자 답변·마무리 멘트를 순서가 드러나게 저장한다(별도 메시지 엔티티 없음).
- "정리한다" = 전날 `Memo` 원본 + `DailyChatSession` 전체 대화 원문 → `Diary` 변환(06:00 KST 자동). `MemoSummary`는 있을 때만 카테고리/압축 힌트로 참고한다. 채팅하지 않은 Memo도 Diary에 반영한다.
- "회고를 생성한다" = 선택 기간에 존재하는 확정 `Diary` 또는 Memo 기반 `DailyContext` + 기간 내 `DailyChatSession` 전체 대화 원문 + `persona.md`로 `Retrospective` 생성. 기록이 없는 과거·현재·미래 날짜는 건너뛰되 요청 기간은 유지한다. 현재 진행 중인 `serviceDate`에 Diary가 없고 내용 있는 `Memo`가 있으면 해당 날짜는 Memo 원본만으로 저장하지 않는 임시 `DailyContext`를 사용한다. DailyChatSession 원문은 DailyContext에 포함하지 않고 기간 단위 직접 입력으로 사용한다. 과거·미래 날짜에는 DailyContext를 만들지 않는다. 전체 기간에 Diary, DailyContext, DailyChatSession 중 하나는 있어야 한다. 원본 `Memo`는 Diary 또는 DailyContext에 흡수된 하루 맥락으로 사용하고, `MemoSummary`는 Diary 생성 시 보조 힌트로만 참고한다.
- 일자 경계는 항상 **06:00 KST**. "오늘"의 정의가 자정이 아님에 주의(`conventions/api.md`).
- Markdown 복사/다운로드는 별도 서버 API가 아니라 FE 기능이다.
