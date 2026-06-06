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
| 메모 상태 | `MemoStatus` | enum | `DRAFT`/`SUMMARIZED`/`ARCHIVED` 외 임의 추가 금지 |
| 역질문 (실록이의 되묻기) | `followUpQuestion` | 필드 | `question`(단독은 모호) |
| 역질문 횟수/상한 | `followUpCount` / `maxFollowUpCount` | 필드 | — (상한 기본 10) |
| 세션 끝내기 | `endSession` / `status=ENDED` | 동작/필드 | `close`, `finish`(혼용 금지) |
| 종료 사유 | `endedReason` | 필드 | enum: `USER_ENDED`/`MAX_FOLLOWUP`/`AI_DECIDED` |
| 일일 대화 세션 | `DailyChatSession` | 엔티티 | `ChatLog`, `Session`(단독) |
| 대화 메시지 | `ChatMessage` | 엔티티 | `Chat`, `Message`(단독), 요약 데이터로 오해 금지 |
| 다이어리 (날짜별 정리본) | `Diary` | 엔티티 | `Journal`, `DailyNote` |
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
- "전체 대화를 저장한다" = `DailyChatSession`에 속한 여러 `ChatMessage`를 순서대로 저장한다.
- "정리한다" = MemoSummary, ChatMessage → Diary 변환(06:00 KST 자동).
- 일자 경계는 항상 **06:00 KST**. "오늘"의 정의가 자정이 아님에 주의(`conventions/api.md`).
- Markdown 복사/다운로드는 별도 서버 API가 아니라 FE 기능이다.
