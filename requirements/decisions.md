# 요구사항 결정 이력

요구사항 변경은 날짜 / 결정 / 이유 / 영향 범위를 남긴다.

| 날짜 | 결정 | 이유 | 영향 범위 |
| --- | --- | --- | --- |
| 2026-06-05 | 기존 통합 기획안에서 MVP 범위를 추렸다. | 핵심 회고 생성 흐름에 집중하기 위해서. | `requirements/product.md`, `domain/data-model.md`, `api/openapi.yaml` |
| 2026-06-06 | MemoSummary 및 작업 공간 구조를 MVP 흐름에 반영했다. | Memo 전체를 바로 대화로 넘기기보다 카테고리별 요약을 선택해 대화하는 흐름이 더 명확하기 때문. | `Memo`, `MemoSummary`, `DailyChatSession`, `Diary` |
| 2026-06-08 | 별도 ChatMessage 엔티티를 두지 않고 DailyChatSession에 전체 대화 원문을 저장한다. | MVP에서는 메시지 단위 저장보다 하나의 대화 세션 전체를 보관하는 모델이 더 단순하고 충분하기 때문. | 요구사항, 데이터 모델 |
| 2026-06-08 | Diary는 하루의 DailyChatSession들을 기반으로 생성한다. | 사용자가 하루를 어떻게 보냈는지 요약하는 날짜별 정리본이므로 대화 세션 전체 맥락만 사용하기 때문. | 요구사항, 데이터 모델, Diary 생성 정책 |
| 2026-06-08 | Retrospective는 선택 기간의 DailyChatSession들과 persona.md를 기반으로 생성한다. | 회고는 기간 내 대화 원문과 누적 Persona 신호를 사용해 사용자다운 완성형 글을 만드는 것이 목적이기 때문. | 요구사항, 데이터 모델, Retrospective 생성 정책 |
| 2026-06-06 | Diary는 06:00 KST 자동 생성만 MVP 범위로 둔다. | 초기 MVP에서는 수동 생성보다 일일 자동 정리 흐름을 우선 검증하기 위해서. | Diary API, 배치/스케줄러, 테스트 |
| 2026-06-06 | Export 서버 API는 MVP에서 만들지 않는다. | Markdown 복사/다운로드는 FE에서 처리할 수 있기 때문. | API 목록, FE 기능 요구사항 |
| 2026-06-06 | EventLog는 MVP에서 얇은 append-only 로그로 실제 저장한다. | 사용자 행동 기반 MVP 검증 지표를 초기부터 수집하기 위해서. | DB 모델, 이벤트 저장 로직 |
| 2026-06-06 | 백엔드 기본 DB는 PostgreSQL 우선으로 둔다. | 관계형 데이터와 긴 텍스트, 유연한 JSON 메타데이터를 함께 다루기 좋기 때문. | 백엔드 인프라, JPA 매핑, Testcontainers |
| 2026-06-09 | **MemoSummary에 상태/큐(PENDING/USED/EXPIRED)를 두지 않는다.** 조회 전용·무상태로 두고, "오늘 목록"은 `serviceDate`로 필터링한다. 대화에 써도 제외하지 않고 여러 세션이 재사용한다. | `MemoSummary N──N DailyChatSession` 재사용 모델과 상태 큐가 충돌하고, 상태머신은 06:00 전환·동시성 부담을 키우기 때문. | `MemoSummary`, `conventions/api.md`, `domain/data-model.md` |
| 2026-06-09 | **Memo 요약은 전체성공/전체실패(원자적).** 실패 시 Memo는 `DRAFT` 유지. 대상 DRAFT가 없으면 `422`(`NO_SUMMARIZABLE_MEMO`). | 부분 성공은 FE UX와 상태 추론을 복잡하게 만들고, 형식은 맞고 규칙 위반인 케이스는 422가 맞기 때문. | `api/openapi.yaml`(요약 422), `conventions/api.md` |
| 2026-06-09 | **MemoSummaryItem.memoId를 API 응답에서 제외**(서버 내부 추적용으로만 유지). | 프론트는 원본 Memo 연결이 필요 없고, 응답은 노출 최소값(id·categoryName·itemCount·items.content)으로 충분하기 때문. | `api/openapi.yaml`(MemoSummaryItem), `domain/data-model.md` |
| 2026-06-09 | **06:00 KST에 OPEN 세션을 자동 종료**한다(`endedReason=SYSTEM_ENDED` 신설). DRAFT Memo는 `ARCHIVED` 전환. | Diary 입력(전날 ENDED 세션)을 확정적으로 만들고 미처리 데이터의 상태를 명확히 하기 위해서. | `EndedReason` enum, `conventions/api.md`, `domain/data-model.md`, 배치/스케줄러 |
| 2026-06-09 | **DailyChatSession은 하나의 `serviceDate`에만 속한다**(생성 시점 기준). 다른 날짜 MemoSummary 혼합 금지(`422`). | Diary 날짜별 집계를 단순·명확하게 하기 위해서. | `conventions/api.md`, `domain/data-model.md` |
| 2026-06-09 | **세션 시작 시 선택 MemoSummary 내용을 snapshot으로 저장**(`selectedSummariesSnapshot`, jsonb). | 원본 상태/내용 변화와 무관하게 대화 기록의 맥락을 보존하기 위해서. | `domain/data-model.md`, 영속성 |
| 2026-06-09 | **ConversationTurn에 `createdAt`(선택) 추가, `sequence`는 두지 않는다.** | 순서는 배열 순서가 계약이므로 sequence는 중복이고, 시간 표시 대비 createdAt만 선택 제공하면 충분하기 때문. | `api/openapi.yaml`(ConversationTurn) |
| 2026-06-09 | **Diary는 대화가 있는 날만 생성**(빈 Diary 금지, 없는 날 404). 재생성은 **멱등**. | 날짜당 1개 unique 제약과 배치 재실행 안전성을 위해서. | `conventions/api.md`, Diary 생성 배치 |
| 2026-06-09 | **회고 생성 입력은 선택 기간의 `DailyChatSession.conversation` + `persona.md`로 고정**한다. 원본 Memo·MemoSummary·Diary는 회고 입력에 넣지 않는다. 기간 기준은 `serviceDate`. | conversation에 이미 회고에 필요한 정제된 내용(질문·답변)이 담겨 있어 원본 Memo는 노이즈·비용만 키우기 때문. 2026-06-08 결정과 일관. (프론트 가정 "Memo 포함"을 본 결정으로 정리) | `requirements/product.md`, `conventions/api.md`, Retrospective 생성 |
| 2026-06-09 | **달력용 경량 엔드포인트 `GET /api/diaries/calendar`를 추가**한다(Diary 있는 `serviceDate` 목록만, 본문 제외). 없는 날짜는 `404` 유지. | full Diary 목록을 달력에 쓰면 본문까지 과하게 전송되기 때문. | `api/openapi.yaml`(diaries calendar), FE 달력 |
| 2026-06-09 | **Persona는 온보딩 1회 생성으로 한정**(매일/주기 자동 갱신은 MVP 제외). 회고 생성 시 persona가 없거나 오래돼도 **차단하지 않고 graceful**하게 진행한다. 노출용 Persona와 내부 `markdown`(persona.md)은 이미 분리돼 있어 유지. | 매일 갱신은 비용·복잡도가 크고 MVP 검증 가치가 낮으며, persona는 회고의 보강 신호이지 필수 차단 요소가 아니기 때문. | `requirements/product.md`, Persona 생성, Retrospective 생성 |
| 2026-06-09 | **스트릭은 MVP에서 별도 API/스키마로 두지 않는다.** 필요 시 `EventLog.CHAT_SESSION_STARTED`에서 파생(같은 `serviceDate`는 1일 1회). | Pet/스트릭은 MVP 제외 도메인이고, 표시가 필요해지면 이미 쌓는 EventLog로 충분히 계산되기 때문. | `domain/data-model.md`(EventLog), (스키마 변경 없음) |
