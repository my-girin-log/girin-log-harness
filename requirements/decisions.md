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
