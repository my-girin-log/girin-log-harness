# 용어 사전 (Glossary)

**이 표가 영문 필드명/타입명/엔드포인트명의 단일 진실이다.**
같은 개념을 BE/FE/명세에서 다른 단어로 부르지 않는다. 새 용어가 필요하면 여기 먼저 추가하고 PR.

| 한국어 | 표준 영문 | 쓰는 곳 | 쓰지 말 것 |
| --- | --- | --- | --- |
| 실록이 (AI 캐릭터) | `silok` | 코드/주석 | `bot`, `ai`, `assistant`(혼용 금지) |
| 크루 (사용자) | `User` | 엔티티 | `Member`, `Crew`(엔티티명으론 X) |
| 페르소나 | `Persona` | 엔티티/필드 | `Profile`, `Style` |
| 메모 (대화 전 짧은 기록) | `Memo` | 엔티티/필드 | `Note`, `Record`(혼용 금지) |
| 역질문 (실록이의 되묻기) | `followUpQuestion` | 필드 | `question`(단독은 모호) |
| 역질문 횟수/상한 | `followUpCount` / `maxFollowUpCount` | 필드 | — (상한 기본 10) |
| 세션 끝내기 | `endSession` / `status=ENDED` | 동작/필드 | `close`, `finish`(혼용 금지) |
| 종료 사유 | `endedReason` | 필드 | enum: `USER_ENDED`/`MAX_FOLLOWUP`/`AI_DECIDED` |
| 온보딩 페르소나 설문 | `PersonaSurvey` | 엔티티/필드 | `quiz`, `questionnaire`(혼용 금지) |
| 하루 원천 대화 로그 | `DailyChatSession` | 엔티티 | `ChatLog`, `Session`(단독) |
| 다이어리 (날짜별 정리본) | `Diary` | 엔티티 | `Journal`, `DailyNote` |
| 회고 (완성형 글) | `Retrospective` | 엔티티 | `Retro`, `Review`, `Reflection` |
| 펫 (성장/EXP/streak) | `Pet` | 엔티티 | `Character`, `Mascot` |
| 우테코 | `wtc` 또는 풀어서 표기 | 주석/문서 | 무분별한 약어 |

## 표기 규칙

- **엔티티/타입명**: `PascalCase` (`Diary`, `Retrospective`)
- **필드/변수**: `camelCase` (`createdAt`, `followUpQuestion`)
- **엔드포인트 경로**: `kebab-case` 복수형 (`/daily-chat-sessions`, `/retrospectives`)
- **enum 값**: `UPPER_SNAKE_CASE` (`status: DRAFT | DONE`)

## 도메인 약속

- "회고를 만든다" = `Retrospective`를 **생성(generate)** 한다. "Diary를 만든다"와 구분.
- "정리한다" = DailyChatSession → Diary 변환(06:00 KST 자동). 동사는 `summarize`/`compile` 중 `[확정 필요]`.
- 일자 경계는 항상 **06:00 KST**. "오늘"의 정의가 자정이 아님에 주의(`conventions/api.md`).
- 마크다운 표현 파일명(리뷰 반영, `[확정 필요]`): 페르소나=`persona.md`, 사실 로그=`log.md`, 다이어리=`diary.md`. 임의 변형 금지.
