# MVP 시나리오

이 문서는 주요 사용자 흐름과 인수 조건을 정리한다. 상세 API 계약은 `api/openapi.yaml`을
최종 진실로 따른다.

## 1. 첫 진입과 Persona 생성

### 흐름

1. 사용자는 GitHub OAuth로 로그인한다.
2. 최초 로그인 사용자는 온보딩 상태가 미완료로 표시된다.
3. 사용자는 블로그 링크 또는 기존 회고 글 원문을 입력할 수 있다.
4. 사용자는 약 10개 문항의 온보딩 설문에 답한다.
5. 시스템은 입력 가능한 PersonaSource와 설문 응답을 기반으로 Persona를 생성한다.

### 인수 조건

- GitHub 재로그인 시 기존 User를 조회해야 한다.
- 블로그 링크 분석에 실패해도 설문 응답만으로 기본 Persona를 생성할 수 있어야 한다.
- 입력 일부가 없어도 Persona 생성 요청이 실패하지 않아야 한다. 단, 최소 입력 기준은 API 명세에서 확정한다.

## 2. Memo 작성과 MemoSummary 생성

### 흐름

1. 사용자는 현재 작업 중인 `DRAFT` Memo에 자유롭게 기록한다.
2. 사용자는 요약 전 `DRAFT` Memo의 내용을 수정하거나 삭제할 수 있다.
3. 사용자는 요약하기를 실행한다.
4. 시스템은 남아 있는 `DRAFT` Memo 전체를 분석하여 카테고리별 MemoSummary를 생성한다.
5. 요약 완료 후 원본 Memo는 `SUMMARIZED` 상태가 된다.
6. 사용자가 계속 기록할 수 있도록 새로운 빈 `DRAFT` Memo를 생성한다.

### 인수 조건

- Memo는 하루에 여러 개 생성될 수 있어야 한다.
- `DRAFT` Memo만 수정/삭제할 수 있어야 한다.
- `SUMMARIZED` 또는 `ARCHIVED` Memo를 수정/삭제하려 하면 거부해야 한다.
- 삭제된 Memo는 조회, MemoSummary 생성, Diary 생성 입력에서 제외되어야 한다.
- 하나의 기록은 여러 MemoSummary에 반영될 수 있다.
- 여러 기록은 하나의 MemoSummary로 통합될 수 있다.
- 이미 대화에 사용된 MemoSummary는 비활성화 상태로 표시되어야 한다.
- 비활성화된 MemoSummary는 재선택할 수 없어야 한다.
- MVP에서 MemoSummary는 조회만 가능하며 수정/삭제하지 않는다.

## 3. MemoSummary 기반 대화

### 흐름

1. 사용자는 하나 이상의 대화 가능한 MemoSummary를 선택한다.
2. 시스템은 선택된 MemoSummary를 기반으로 DailyChatSession을 시작한다.
3. 실록이는 한 번에 하나의 역질문만 생성한다.
4. 실록이 질문, 사용자 답변, 마무리 멘트는 DailyChatSession 안에 전체 대화 원문으로 저장된다.
5. 사용자는 대화 중간에 언제든 끝내기 버튼으로 세션을 종료할 수 있다.

### 인수 조건

- DailyChatSession은 Memo가 아니라 MemoSummary 선택으로 시작해야 한다.
- 이미 대화에 사용된 MemoSummary로는 DailyChatSession을 새로 시작할 수 없어야 한다.
- 전체 대화 내용은 DailyChatSession 하나만으로 복원할 수 있어야 한다.
- 메시지 단위의 별도 ChatMessage 엔티티는 만들지 않는다.
- 한 세션의 역질문은 최대 10회다.
- 사용자가 끝내기 버튼으로 종료한 세션은 `ENDED` 상태가 되며 다시 이어서 대화하지 않는다.
- 종료 시 짧은 마무리 멘트를 제공해야 한다.
- 종료 사유는 사용자 종료, 최대 질문 수 도달, AI 판단 종료를 구분할 수 있어야 한다.

## 4. 06:00 KST Diary 자동 생성과 수동 생성

### 흐름

1. 매일 06:00 KST에 시스템이 전날 작업 공간을 정리한다.
2. 전날 Memo 원본과 DailyChatSession들을 종합해 Diary를 생성한다. MemoSummary가 있으면 카테고리/압축 힌트로 참고한다.
3. 하루에 여러 Memo와 DailyChatSession이 있어도 Diary는 날짜별 하나만 생성한다.
4. 기존 데이터는 삭제하지 않고 보관한다.
5. 이후 새로운 빈 Memo를 생성할 수 있는 상태가 된다.
6. 사용자는 자동 생성이 누락된 과거 서비스 날짜에 대해 Diary 수동 생성을 요청할 수 있다.

### 인수 조건

- 이 서비스의 하루 경계는 00:00이 아니라 06:00 KST다.
- 06:00 KST 이전 새벽 기록은 전날 기록으로 계산한다.
- 채팅하지 않은 Memo도 Diary 생성 입력에 포함되어 날짜별 정리본에 보존되어야 한다.
- MemoSummary는 Diary 생성의 보조 힌트이며, 원본 Memo를 대체하지 않는다.
- Memo에만 남은 내용은 기록된 사실로 반영하고, DailyChatSession에서 확인된 감정·이유·판단 기준은 더 강한 회고 신호로 반영한다.
- Diary는 사용자가 하루를 어떻게 보냈는지 요약하는 날짜별 정리본이다.
- Diary 수동 생성은 이미 종료된 과거 서비스 날짜에만 허용한다. 현재 진행 중인 서비스 날짜와 미래 날짜는 수동 생성할 수 없다.
- 이미 Diary가 있는 날짜의 수동 생성 요청은 기존 Diary를 반환하는 멱등 동작이어야 한다.
- 생성 대상 날짜에 Memo와 DailyChatSession이 모두 없으면 빈 Diary를 생성하지 않는다.
- Diary가 아직 생성되지 않은 날짜는 생성 전 상태를 안내해야 한다.

## 5. Retrospective 생성

### 흐름

1. 사용자는 시작 날짜와 종료 날짜를 선택한다.
2. 시스템은 선택 기간의 Diary, DailyChatSession 전체 대화 원문, persona.md를 기반으로 Retrospective를 생성한다.
3. 생성된 Retrospective는 Markdown으로 저장된다.
4. 사용자는 생성된 Retrospective를 조회하고 Markdown을 복사하거나 다운로드한다.

### 인수 조건

- Retrospective에는 제목, 도입, 주요 경험, 고민과 판단 기준, 배운 점, 다음에 다르게 해볼 점, 마무리가 포함되어야 한다.
- Retrospective는 Diary로 하루 전체 맥락을 받고, DailyChatSession 원문으로 대화에서 깊어진 감정·이유·판단 기준을 보강한다.
- 원본 Memo는 Diary에 흡수된 맥락으로 사용하고, MemoSummary는 Diary 생성 시 보조 힌트로만 참고한다. Retrospective 생성의 기본 직접 입력으로 원본 Memo와 MemoSummary를 다시 넣지 않는다.
- Markdown 복사/다운로드는 별도 서버 API 없이 FE 기능으로 처리한다.

## 6. EventLog 저장

### 흐름

1. 주요 사용자 행동이 발생한다.
2. 시스템은 EventLog를 append-only로 저장한다.

### 초기 이벤트 후보

- `USER_SIGNED_IN`
- `ONBOARDING_COMPLETED`
- `PERSONA_CREATED`
- `MEMO_CREATED`
- `MEMO_SUMMARIZED`
- `CHAT_SESSION_STARTED`
- `CHAT_SESSION_ENDED`
- `DIARY_CREATED`
- `RETROSPECTIVE_CREATED`

### 인수 조건

- EventLog는 MVP 검증 지표 수집을 위한 최소 데이터만 저장한다.
- 복잡한 분석 대시보드는 MVP 범위가 아니다.
