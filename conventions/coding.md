# 코딩 규칙

## 0. 스택 `[확정 필요]`

팀이 시작 전에 확정하고 이 표를 채운다. 에이전트는 여기 적힌 스택만 가정한다.

| 영역 | 스택 | 비고 |
| --- | --- | --- |
| Backend | Spring Boot + Java 21 + Gradle | DB는 PostgreSQL 우선 |
| Frontend | Next.js + TypeScript + Emotion + TanStack Query | |
| 타입 생성 | OpenAPI → FE 타입 자동 생성 | `harness/SETUP.md` |
| 패키지/모듈 매니저 | `[확정 필요]` | |
| 테스트 DB | Testcontainers PostgreSQL 우선 | H2는 대안 |

## 1. 백엔드 2명 분담 — 레이어가 아니라 도메인으로 자른다

⚠️ **레이어로 나누지 말 것.** (A=컨트롤러 전부, B=리포지토리 전부 → 모든 기능마다 충돌)
**도메인(바운디드 컨텍스트)으로 세로로 나눈다.** 각자 컨트롤러~서비스~리포지토리를 다 가져간다.

분담 예시(`[확정 필요]`, 팀이 합의):

| 담당 | 도메인 |
| --- | --- |
| BE-A | 인증(User/GitHub OAuth), Persona |
| BE-B | 기록(Memo/MemoSummary/DailyChatSession/ChatMessage), Diary, Retrospective |
| 공유 | 실록이 LLM 연동 모듈, 공통 에러/응답 |

경계가 닿는 부분(실록이 호출, 공통 에러 포맷)은 **먼저 인터페이스만 합의**하고 각자 구현한다.

## 2. 디렉터리 (도메인 우선)

```
src/
  auth/        # 컨트롤러+서비스+리포지토리 한 묶음
  persona/
  memo/
  conversation/
  diary/
  retrospective/
  event/
  silok/       # LLM 연동 공유 모듈
  common/      # 에러 envelope, 시각(KST) 유틸 등
```

## 3. 공통 규칙

- 명명: `conventions/glossary.md` 표준 영문명을 그대로 쓴다.
- 에러: `conventions/api.md`의 envelope를 공통 모듈에서 한 번만 정의하고 재사용.
- 시각: 일자 계산은 공통 KST 유틸을 통해서만. 곳곳에서 `now()`를 직접 타임존 없이 쓰지 않는다.
- 매직 넘버 금지: `06:00` 같은 정책 값은 상수/설정으로.
- AI는 사용자 승인 없이 DB 스키마 변경, 인증/인가 정책 변경, OpenAPI 변경, 도메인 정책 변경, 운영 설정 변경을 하지 않는다.

## 4. 테스트

- BE: 각 도메인은 명세 준수 테스트를 가진다(응답이 `openapi.yaml`과 일치하는지).
- FE: 목 서버(MSW 등) 기준으로 화면 단위 동작 확인.
- "완료"의 정의 = 테스트 통과 + 명세 일치. 이건 hook(`harness/`)이 한 번 더 강제한다.

## 5. LLM 호출 (실록이)

- LLM 호출은 `silok/` 모듈 뒤로 감춘다. 도메인 코드가 모델/프롬프트를 직접 알지 못하게.
- 프롬프트·모델 선택은 한 곳에서 관리(기획안 13절: 비용/호출 구조 분리).
- 실록이 톤은 기획안 10절을 따른다(상담사 X, 한 번에 한 질문, 담백하게).
