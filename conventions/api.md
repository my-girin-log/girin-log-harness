# API 규칙

`api/openapi.yaml`이 개별 엔드포인트의 진실이라면, 이 문서는 **모든 엔드포인트가 공유하는 약속**이다.
명세를 쓰거나 구현할 때 여기에 어긋나면 안 된다.

## 1. 베이스

- 베이스 prefix: `/api` (별도 버전 세그먼트 `/v1`은 두지 않는다 — 실제 경로는 `/api/...`)
- 응답 본문: JSON, `Content-Type: application/json; charset=utf-8`
- 시각 표기: **ISO 8601 + 오프셋** (예: `2026-06-04T09:00:00+09:00`). UTC 가정 금지.

## 2. 일자 경계 — 06:00 KST (중요)

이 서비스의 "하루"는 자정이 아니라 **06:00 KST**에 바뀐다.
Diary 자동 정리, "오늘의 메모", 기간 선택 모두 이 경계를 따른다.

- `date` 필드는 **KST 기준 캘린더 날짜**(`YYYY-MM-DD`)로 표기한다.
- 서버는 `Asia/Seoul`로 일자를 계산한다. 클라이언트 로컬 타임존에 의존하지 않는다.
- 예: 6/5 04:00 KST에 남긴 메모는 **6/4의 메모**다(아직 06:00 안 지남).

**[리뷰 반영] 06:00 KST에 일어나는 일**
1. 아직 `OPEN`인 전날 **DailyChatSession을 시스템이 자동 종료**한다(`status=ENDED`, `endedReason=SYSTEM_ENDED`). (2026-06-09 결정)
2. 전날 **Memo 원본과 `ENDED` DailyChatSession들**(자동 종료분 포함)을 모아 **Diary 1개**를 자동 생성/정리한다. MemoSummary가 있으면 카테고리/압축 힌트로 참고하되 원본 Memo를 대체하지 않는다. 채팅하지 않은 Memo도 Diary에 반영한다.
3. 아직 `DRAFT`인 전날 Memo는 `ARCHIVED`로 전환한다. 일일 작업 공간을 초기화하되 기존 데이터(Memo·MemoSummary·DailyChatSession)는 삭제하지 않고 보관한다.
4. 이후 사용자가 새로 기록할 수 있도록 새로운 작업 흐름을 시작할 수 있어야 한다.

**Diary 생성 대상 (2026-07-09 결정)**
- 전날 `serviceDate`의 Memo 원본과 `ENDED` DailyChatSession을 입력한다. (위 1번으로 06:00엔 모든 세션이 `ENDED`)
- MemoSummary는 존재할 경우 카테고리/압축 힌트로만 참고한다. 원본 Memo를 대체하거나 사실 근거로 우선하지 않는다.
- Memo에만 남은 내용은 기록된 사실로 보존하고, DailyChatSession에서 확인된 감정·이유·판단 기준은 더 강한 회고 신호로 반영한다.
- 그날 Memo와 DailyChatSession이 **모두 없으면 Diary를 생성하지 않는다.** 빈 Diary를 만들지 않는다(조회 시 `404` → FE가 "생성 전" 안내).
- 이미 Diary가 있는 날짜에 재생성이 들어오면 **멱등 처리(중복 생성 금지)**. Diary는 날짜당 1개 unique.

## 2-1. Memo 라이프사이클

- Memo는 하루에 여러 개 생성될 수 있다.
- 작성 중 Memo는 `DRAFT` 상태다.
- `DRAFT` Memo는 수정/삭제할 수 있다.
- `SUMMARIZED` 또는 `ARCHIVED` Memo 수정은 `422`(`code=MEMO_NOT_EDITABLE`), 삭제는 `422`(`code=MEMO_NOT_DELETABLE`)로 거부한다.
- 삭제된 Memo는 목록 조회, MemoSummary 생성, Diary 생성 입력에서 제외한다.
- Memo 요약하기를 실행하면 카테고리별 MemoSummary를 생성하고 원본 Memo는 `SUMMARIZED` 상태가 된다.
- **요약은 전체 성공/전체 실패(원자적)로만 처리한다.** 부분 성공을 두지 않는다. AI 요약이 실패하면 어떤 Memo도 `SUMMARIZED`로 바꾸지 않고 **`DRAFT` 그대로 유지**한다(트랜잭션 롤백). (2026-06-09 결정)
- **요약 대상 `DRAFT` Memo가 하나도 없으면 `422`**(`code=NO_SUMMARIZABLE_MEMO`). 형식은 맞지만 비즈니스 규칙상 처리 불가이기 때문(5절 코드 선택 순서).
- 06:00 KST 이후 이전 작업 공간의 Memo는 `ARCHIVED` 상태로 취급한다.
- MemoSummary는 MVP에서 조회만 가능하다. 수정/삭제 엔드포인트를 추측해 추가하지 않는다.
- 이미 대화에 사용된 MemoSummary는 비활성화 상태로 표시하고 재선택할 수 없다. 목록 응답은 `chatAvailable=false`, `chatDisabledReason=ALREADY_CHATTED`로 이 상태를 표현한다.

## 2-2. 대화 세션 라이프사이클

- 하나 이상의 MemoSummary 선택 → DailyChatSession 시작. 하루에 여러 세션 가능.
- **한 세션은 하나의 `serviceDate`에만 속한다**(생성 시점 06:00 경계 기준). 선택한 MemoSummary가 서로 다른 `serviceDate`에 걸치거나 이미 대화에 사용된 MemoSummary를 포함하면 거부한다(`422`). 시작 시점의 선택 내용은 snapshot으로 보존한다. (2026-06-09 결정)
- 역질문은 **최대 10회**. 서버/프롬프트 양쪽에서 상한을 보장한다.
- 종료: 사용자가 '끝내기' → 실록이 마무리 멘트 후 `status=ENDED`. 사용자가 중간에 끝낸 세션도 완전히 종료된 상태로 취급하며 다시 이어서 대화하지 않는다. AI 판단으로도 종료할 수 있다.
- 종료 사유는 `endedReason`(`USER_ENDED`/`MAX_FOLLOWUP`/`AI_DECIDED`/`SYSTEM_ENDED`)으로 남긴다. `SYSTEM_ENDED`는 06:00 자동 종료.
- 관련 엔드포인트(예: 세션 시작/메시지/끝내기)는 `api/openapi.yaml`에서 확정한다.

## 3. 인증

- GitHub OAuth로 로그인 → 서버가 자체 **JWT**를 발급한다(stateless 검증).
- 보호된 요청: `Authorization: Bearer <token>`
- 미인증: `401`, 권한 없음: `403`.

## 4. 에러 응답 (envelope 고정)

모든 에러는 같은 구조로 내려간다. FE는 이 구조 하나만 파싱하면 된다.

```json
{
  "error": {
    "code": "DIARY_NOT_FOUND",
    "message": "해당 날짜의 다이어리가 없습니다.",
    "details": null
  }
}
```

- `code`: `UPPER_SNAKE_CASE` 도메인 에러 코드. 클라이언트 분기는 `code`로만 한다(메시지 문자열로 분기 금지).
- `message`: 사람이 읽는 한국어 메시지. UI 노출 가능.
- `details`: 검증 실패 등 부가 정보(없으면 `null`). 필드별 검증 실패는 `details`에 필드→사유로 담는다.
- HTTP 상태코드와 `code`는 함께 쓴다. 상태코드 200에 에러 바디를 싣지 않는다.

**에러 응답은 BE↔FE의 계약이다.** "에러가 안 나는 것 자체가 버그"인 경우를 만들지 않는다(예: 과거 날짜로 회고 기간을 요청했는데 `200`이 나오면 안 된다).
BE는 **무엇이 왜 틀렸는지(원인)** 를 상태코드+`code`+`message`로 정확히 내려주고, 그걸 사용자에게 어떻게 보여줄지는 맥락을 아는 FE가 정한다. BE가 표현(UI 문구·흐름)까지 결정하려 하지 않는다. 단, **FE를 신뢰하지 않는다** — 서버는 모든 입력을 스스로 검증한다.

**가능하면 "다음 행동"을 알려준다.** 재시도가 즉시 가능하면 구체적 행동을 `message`에 담는다(예: "잠시 후 다시 시도해주세요", "다른 기간을 선택해주세요"). 즉시 재시도로 풀리지 않으면 행동을 억지로 제시하지 않는다.

## 5. 상태 코드

| 상황 | 코드 |
| --- | --- |
| 조회 성공 | `200` |
| 생성 성공 | `201` |
| 본문 없는 성공(삭제 등) | `204` |
| 형식·필수값 검증 실패 | `400` |
| 미인증 | `401` |
| 권한 없음 | `403` |
| 리소스 없음 | `404` |
| 충돌(DB 제약 위반: 중복 등) | `409` |
| 비즈니스 규칙 위반(형식은 맞음) | `422` |
| LLM(실록이) 호출 지연·실패 — 재시도 가능 | `429`/`502`/`503`/`504` (7-3) |
| 서버 오류 | `500` |

**코드 선택 순서(위에서부터 먼저 본다):**

1. 요청 **형식·필수값**이 잘못됐는가? → `400`
2. 대상 **리소스가 없는가**? → `404` (예: 없는 Diary 조회 → `DIARY_NOT_FOUND`)
3. **DB 제약과 직결된 위반**인가(중복·참조 중 삭제)? → `409` — 동시성까지 DB가 보장해야 하므로 애플리케이션과 DB가 같은 이유로 거부한다.
4. 형식은 맞지만 **나머지 비즈니스 규칙 위반**인가? → `422` (예: 기간 내 DailyChatSession이 없는데 회고 생성, 06:00 경계상 아직 없는 "오늘" 데이터 요청)

`400`(형식 오류)과 `422`(규칙 위반)를 구분해 FE가 원인을 정확히 알 수 있게 한다.

## 5-1. 서버/클라이언트 책임

- **무엇을 보낼지는 서버가, 어떻게 표현할지는 클라이언트가 정한다.** 응답은 특정 화면 구조·흐름을 가정하지 않는 **순수한 데이터 원형**으로 준다. 웹·앱·다른 클라이언트가 추가 협의 없이 같은 응답을 쓸 수 있어야 한다.
- 화면 편의를 위한 가공 응답의 유혹을 경계한다. 가공·조합은 FE의 책임이다(예: Markdown 복사/다운로드는 FE 기능, 별도 Export API 금지).

## 6. 페이지네이션 (커서 기반)

목록(예: Diary 목록, Retrospective 목록)은 **커서 기반 페이지네이션**을 쓴다. 무한 스크롤·시간순(최신부터)에 강하고, 중간에 데이터가 끼어도 항목이 밀리지 않기 때문이다. offset 방식은 쓰지 않는다.

```
GET /api/diaries?cursor=<opaque>&limit=20
→ { "items": [...], "nextCursor": "..." | null }
```

- `cursor`는 **opaque**(불투명) 토큰이다. 클라이언트는 내용을 해석·조립하지 않고 서버가 준 값을 그대로 돌려보낸다.
- 첫 요청은 `cursor` 없이 보낸다. `nextCursor`가 `null`이면 마지막 페이지다.
- `limit` 기본/최대값은 `api/openapi.yaml`에서 확정한다.

## 7. LLM 생성 응답 (동기 방식)

회고 생성·Persona 생성처럼 LLM을 호출하는 작업은 **동기 방식**으로 처리한다. 요청을 받으면 LLM 호출이 끝날 때까지 기다렸다가 완성 결과를 한 번에 응답한다(생성은 `201`).

- 별도의 생성 작업 리소스(`202` + 상태 폴링)는 MVP에서 두지 않는다. 클라이언트는 응답이 올 때까지 로딩 상태를 보여준다.
- LLM 호출이 길어질 수 있으므로 서버/게이트웨이 타임아웃을 넉넉히 잡는다(구체값은 운영 설정에서 확정).
- MemoSummary 생성·Diary 자동 생성도 같은 동기 방식을 따른다.
- 추후 LLM 지연이 사용자 경험을 해치면 그때 비동기(`202`+폴링)로 전환을 검토한다(기획안 13절: LLM 비용/호출 구조 분리와 연결).

**Retrospective 생성 입력 (2026-07-12 결정)**
- 입력은 **선택 기간에 존재하는 확정 `Diary` + 기간 내 `DailyChatSession.conversation` + `persona.md`** 다. 기간 기준은 `serviceDate`.
- Diary와 기록이 없는 과거·현재·미래 날짜는 입력에서 건너뛴다. 요청한 시작·종료 날짜는 Retrospective의 기간 메타데이터로 그대로 유지하며, 누락 날짜를 채우는 placeholder나 DailyContext를 합성하지 않는다.
- 선택 기간에 현재 진행 중인 `serviceDate`가 포함되어 있고 Diary가 없으며 내용 있는 당일 `Memo` 또는 `DailyChatSession`이 있다면, 해당 날짜는 Diary 대신 당일 Memo 원본과 DailyChatSession.conversation으로 만든 임시 DailyContext를 사용한다. 공백 Memo는 입력 존재 여부와 DailyContext 내용에서 제외한다.
- 임시 DailyContext는 Retrospective 생성 시점의 스냅샷이며, 저장되거나 정식 Diary를 대체하지 않는다. 다음 06:00 KST에는 기존 자동 생성 흐름대로 확정 Diary가 생성된다.
- 과거·미래 날짜에는 Diary가 없어도 DailyContext를 만들지 않는다. 해당 날짜에 DailyChatSession이 있으면 그 전체 대화 원문은 날짜별 Diary 유무와 관계없이 직접 입력에 포함한다.
- 전체 기간에 Diary, DailyContext, DailyChatSession 중 하나도 없으면 `422`(`NO_RETROSPECTIVE_SOURCE`)로 거부한다. Diary만, 당일 내용 있는 Memo 기반 DailyContext만, DailyChatSession만 있는 경우는 모두 생성할 수 있다. persona.md와 공백 Memo는 최소 입력으로 세지 않는다.
- `Diary`는 채팅하지 않은 Memo까지 포함한 하루 전체 맥락이고, `DailyChatSession.conversation`은 대화에서 깊어진 감정·이유·판단 기준을 보강하는 입력이다.
- 원본 `Memo`는 Diary에 흡수된 하루 맥락으로 사용하고, `MemoSummary`는 Diary 생성 시 보조 힌트로만 참고한다. Retrospective 생성의 기본 직접 입력으로 원본 Memo와 MemoSummary를 다시 넣지 않는다.
- `persona.md`가 없거나 오래돼도 **차단하지 않고 graceful**하게 생성한다(persona는 보강 신호이지 필수 차단 요소가 아니다).

**Persona 갱신 (2026-06-09 결정)**
- Persona는 **온보딩으로 초기 생성**하고, 이후 사용자 기록을 바탕으로 `persona.md`를 주기적으로 갱신한다.
- 갱신 주기는 매일로 고정하지 않는다. 비용과 품질을 보며 배치/내부 작업 기준으로 조정한다.
- 회고 생성 시 `persona.md`가 없거나 오래돼도 **차단하지 않고 graceful**하게 생성한다. 노출용 Persona와 내부 `markdown`(persona.md)은 분리 유지한다.

## 7-1. Diary 달력 조회 (2026-06-09 결정)

- 마이페이지 달력은 본문 없이 **Diary가 있는 날짜만** 필요하므로 경량 엔드포인트 `GET /api/diaries/calendar`(serviceDate 목록)를 쓴다. full `GET /api/diaries`를 달력에 쓰지 않는다.
- 특정 날짜 상세는 `GET /api/diaries/{date}`. Diary 없는 날짜는 `404`(FE가 "생성 전" 안내). `Diary.markdown`은 사용자 노출용 최종 본문이므로 그대로 렌더링한다.

## 7-2. 온보딩 재제출 · EventLog · 설문 SSOT (2026-06-10 결정)

**온보딩 재제출**
- 이미 온보딩한 사용자가 `POST /api/onboarding/submissions`를 다시 보내도 **허용**한다(차단하지 않는다 — `409`/`403` 아님).
- Persona는 **사용자당 1개**를 **덮어쓰기(갱신)**한다. 별도 버전을 만들지 않는다.
- `OnboardingSurvey`·`PersonaSource`는 원천 이력으로 **누적 저장**한다. `onboardingCompleted`는 true로 유지된다.

**EventLog 기록 주체**
- EventLog는 **100% 백엔드 내부에서 자동 기록**한다(도메인 동작 발생 시 서버가 append). **별도 생성 API를 두지 않는다.**
- 프론트 클릭/노출 이벤트 수집은 **MVP 제외**. 필요해지면 그때 별도 수집 경로를 논의한다.

**온보딩 설문 SSOT**
- MVP에서 설문 문항은 **고정**이다. `questionId ↔ 문구` 매핑의 단일 진실은 `requirements/product.md` 5절이다.
- 프론트는 문구를 하드코딩할 수 있으나 `questionId`는 product.md의 번호를 그대로 쓴다. **문항 조회 API는 두지 않는다.**
- 문항이 자주 바뀌게 되면 그때 `GET /api/onboarding/questions`를 추가한다(후속).

## 7-3. LLM 호출 실패 응답 (2026-06-10 결정)

LLM(실록이=Gemini) 호출이 실패하면 **불투명한 `500`으로 묻지 않고**, 실패 사유를 **재시도 가능한 상태코드 + 전용 `code`**로 내려준다. FE는 `code`로 분기해 "잠시 후 다시 시도" 류의 재시도 UI로 묶어 처리한다(§4 "다음 행동").

| 사유 | HTTP | `code` |
| --- | --- | --- |
| 호출 한도 초과(rate limit) | `429` | `SILOK_LLM_RATE_LIMITED` |
| 응답 지연(timeout) | `504` | `SILOK_LLM_TIMEOUT` |
| 응답 형식 오류(파싱 불가) | `502` | `SILOK_LLM_INVALID_RESPONSE` |
| 그 외 일시적 사용 불가(provider 오류·인증 등) | `503` | `SILOK_LLM_UNAVAILABLE` |

- 적용 대상은 **LLM을 동기 호출하는 엔드포인트**다: Memo 요약 생성, 대화 세션 시작/답변/종료, 회고 생성.
- **온보딩(Persona 생성)은 예외** — LLM 실패 시에도 기본 Persona로 **graceful 폴백**하므로 위 코드를 내지 않는다(7절·product 2-3).
- 이 코드들은 모두 일시적/재시도 가능 성격이다. 입력 자체가 잘못된 경우(`400`)나 비즈니스 규칙 위반(`422`)과는 구분한다.

## 8. 명세 작성 규칙

- 새 엔드포인트는 반드시 `api/openapi.yaml`에 **먼저** 정의하고, 그 다음 구현한다.
- 모든 스키마는 `components/schemas`에 두고 `$ref`로 참조(중복 정의 금지).
- 에러 응답은 공통 컴포넌트(`#/components/responses/Error`)를 재사용한다.
