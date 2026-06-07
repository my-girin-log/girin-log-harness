# 코딩 규칙

이 문서는 **코드를 어떻게 쓸지**에 대한 약속이다.
용어(`conventions/glossary.md`)·API(`conventions/api.md`)·테스트(`conventions/testing.md`)와 함께 읽는다.
우테코에서 배운 클린코드·객체지향 원칙을 이 서비스 도메인에 맞춰 정리한 것이며,
"지향"은 이 문서가, "강제"는 `harness/`의 hook이 맡는다.

## 0. 스택

요구사항(`requirements/product.md` 8절)에서 확정된 스택만 가정한다.

| 영역 | 스택 | 비고 |
| --- | --- | --- |
| Backend | Spring Boot + Java 21 + Gradle | DB는 PostgreSQL 우선, ORM은 Spring Data JPA |
| Frontend | Next.js + TypeScript + Emotion + TanStack Query | |
| 타입 생성 | OpenAPI → FE 타입 자동 생성 | `harness/SETUP.md` |
| 테스트 | JUnit 5 + AssertJ + Mockito / 통합은 Testcontainers PostgreSQL | 상세는 `conventions/testing.md` |
| 패키지/모듈 매니저 | `[확정 필요]` | |

## 1. 백엔드 2명 분담 — 레이어가 아니라 도메인으로 자른다

⚠️ **레이어로 나누지 말 것.** (A=컨트롤러 전부, B=리포지토리 전부 → 모든 기능마다 충돌)
**도메인(바운디드 컨텍스트)으로 세로로 나눈다.** 각자 컨트롤러~서비스~리포지토리를 다 가져간다.

분담 예시(`[확정 필요]`, 팀이 합의):

| 담당 | 도메인 |
| --- | --- |
| BE-A | 인증(User/GitHub OAuth), Persona |
| BE-B | 기록(Memo/MemoSummary/DailyChatSession/ChatMessage), Diary, Retrospective |
| 공유 | 실록이 LLM 연동 모듈, 공통 에러/응답, KST 시각 유틸 |

경계가 닿는 부분(실록이 호출, 공통 에러 포맷, 06:00 KST 유틸)은 **먼저 인터페이스만 합의**하고 각자 구현한다.

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

- 한 도메인 안에서만 `controller` / `service` / `domain` / `repository`로 나눈다.
- 도메인 간 직접 의존을 만들지 않는다. 필요하면 공개 서비스 인터페이스로만 호출한다.

## 3. 이름 짓기

- 도메인 명칭은 `conventions/glossary.md` 표준 영문명을 **그대로** 쓴다. 같은 개념을 다른 단어로 부르지 않는다.
- **축약하지 않는다.** `retro`, `msg`, `cnt` 대신 `retrospective`, `message`, `count`. (예외: glossary에 등록된 `silok`, `wtc`.)
- 이름이 의도를 드러내게 한다. `boolean flag`보다 `boolean isEnded`, `List<X> list`보다 `List<X> chatMessages`.
- 표기: 타입/엔티티 `PascalCase`, 필드/변수/메서드 `camelCase`, 상수 `UPPER_SNAKE_CASE`, enum 값 `UPPER_SNAKE_CASE`.

## 4. 객체지향·클린코드 (우테코 기준)

작은 규칙들이지만 코드 일관성과 리뷰 속도를 크게 좌우한다. 새 코드는 아래를 지향한다.

- **메서드는 한 가지 일만.** 길어지면(대략 15줄 초과) 쪼갠다. 클래스도 작게 유지한다.
- **들여쓰기 깊이는 1까지.** 중첩 if/for가 2단 이상이면 메서드 추출 신호다.
- **`else`를 피한다.** early return / guard clause로 먼저 빠져나간다.
- **매직 넘버·매직 스트링 금지.** 정책 값은 상수/설정으로. (예: `MAX_FOLLOW_UP_COUNT = 10`, 일자 경계 `06:00`, `ZoneId.of("Asia/Seoul")`.)
- **원시값·문자열을 포장한다.** 의미 있는 제약이 붙는 값은 값 객체로. (예: `FollowUpCount`가 0~10 범위를 스스로 보장.)
- **일급 컬렉션을 쓴다.** `List<ChatMessage>`를 그대로 넘기기보다 `ChatMessages`로 감싸 정렬·상한 같은 규칙을 그 안에 둔다.
- **getter/setter를 습관적으로 열지 않는다.** 객체에게 묻지 말고 시키도록(Tell, Don't Ask). 엔티티는 가능한 한 불변·캡슐화.
- **도메인 정책은 도메인 객체 안에 둔다.** "역질문은 10회까지", "Diary는 하루 1개", "일자 경계는 06:00 KST" 같은 규칙이 컨트롤러/서비스 곳곳에 흩어지지 않게 한다.

## 5. 공통 규칙

- **에러:** `conventions/api.md`의 envelope를 `common/`에서 한 번만 정의하고 재사용한다. 도메인 예외는 커스텀 예외 → 공통 핸들러에서 `code`로 매핑한다. 메시지 문자열로 분기하지 않는다.
- **시각:** 일자 계산은 반드시 공통 KST 유틸을 통한다. 곳곳에서 `LocalDate.now()`를 타임존 없이 쓰지 않는다. 테스트 가능하도록 `Clock`을 주입한다(`conventions/testing.md`).
- **시각 경계:** 이 서비스의 "하루"는 **06:00 KST**다. Diary 자동 생성·"오늘의 메모"·기간 선택 모두 이 경계를 공유한다(`conventions/api.md` 2절).
- **상태 enum은 glossary 고정값만.** `MemoStatus`(`DRAFT`/`SUMMARIZED`/`ARCHIVED`), `endedReason`(`USER_ENDED`/`MAX_FOLLOWUP`/`AI_DECIDED`) 등에 임의 값을 추가하지 않는다.
- **AI 금지 작업:** AI는 사용자 승인 없이 DB 스키마 변경, 인증/인가 정책 변경, OpenAPI 변경, 도메인 정책 변경, 운영 설정 변경을 하지 않는다.

## 6. LLM 호출 (실록이)

- LLM 호출은 `silok/` 모듈 뒤로 감춘다. 도메인 코드가 모델·프롬프트를 직접 알지 못하게 한다.
- 프롬프트·모델 선택은 한 곳에서 관리한다(기획안 13절: 비용/호출 구조 분리).
- 실록이 톤은 기획안 10절을 따른다(상담사 X, 한 번에 한 질문, 담백하게).
- 역질문 상한(최대 10회)은 **서버 정책과 프롬프트 양쪽**에서 보장한다. 프롬프트만 믿지 않는다.

## 7. "완료"의 정의

코드가 "됐다"는 건 다음을 모두 만족할 때다. 자세한 기준은 `conventions/testing.md`.

1. 도메인 로직과 핵심 정책에 대한 테스트가 통과한다.
2. 응답이 `api/openapi.yaml` 명세와 일치한다(명세 준수 테스트).
3. glossary 용어를 따르고, 위 규칙에서 크게 벗어나지 않는다.

이 중 명세 일치는 `harness/`의 hook이 한 번 더 강제한다.
