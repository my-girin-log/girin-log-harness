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
2. 사용자는 요약하기를 실행한다.
3. 시스템은 Memo 전체를 분석하여 카테고리별 MemoSummary를 생성한다.
4. 요약 완료 후 원본 Memo는 `SUMMARIZED` 상태가 된다.
5. 사용자가 계속 기록할 수 있도록 새로운 빈 `DRAFT` Memo를 생성한다.

### 인수 조건

- Memo는 하루에 여러 개 생성될 수 있어야 한다.
- 하나의 기록은 여러 MemoSummary에 반영될 수 있다.
- 여러 기록은 하나의 MemoSummary로 통합될 수 있다.
- MVP에서 MemoSummary는 조회만 가능하며 수정/삭제하지 않는다.

## 3. MemoSummary 기반 대화

### 흐름

1. 사용자는 하나 이상의 MemoSummary를 선택한다.
2. 시스템은 선택된 MemoSummary를 기반으로 DailyChatSession을 시작한다.
3. 실록이는 한 번에 하나의 역질문만 생성한다.
4. 실록이 질문, 사용자 답변, 마무리 멘트는 DailyChatSession 안에 전체 대화 원문으로 저장된다.
5. 사용자는 언제든 끝내기 버튼으로 세션을 종료할 수 있다.

### 인수 조건

- DailyChatSession은 Memo가 아니라 MemoSummary 선택으로 시작해야 한다.
- 전체 대화 내용은 DailyChatSession 하나만으로 복원할 수 있어야 한다.
- 메시지 단위의 별도 ChatMessage 엔티티는 만들지 않는다.
- 한 세션의 역질문은 최대 10회다.
- 종료 시 짧은 마무리 멘트를 제공해야 한다.
- 종료 사유는 사용자 종료, 최대 질문 수 도달, AI 판단 종료를 구분할 수 있어야 한다.

## 4. 06:00 KST Diary 자동 생성

### 흐름

1. 매일 06:00 KST에 시스템이 전날 작업 공간을 정리한다.
2. 전날 DailyChatSession들을 종합해 Diary를 생성한다.
3. 하루에 여러 DailyChatSession이 있어도 Diary는 날짜별 하나만 생성한다.
4. 기존 데이터는 삭제하지 않고 보관한다.
5. 이후 새로운 빈 Memo를 생성할 수 있는 상태가 된다.

### 인수 조건

- 이 서비스의 하루 경계는 00:00이 아니라 06:00 KST다.
- 06:00 KST 이전 새벽 기록은 전날 기록으로 계산한다.
- 원본 Memo와 MemoSummary는 Diary 생성 입력으로 직접 사용하지 않는다.
- Diary는 사용자가 하루를 어떻게 보냈는지 요약하는 날짜별 정리본이다.
- Diary 수동 생성은 MVP 범위가 아니다.
- Diary가 아직 생성되지 않은 날짜는 생성 전 상태를 안내해야 한다.

## 5. Retrospective 생성

### 흐름

1. 사용자는 시작 날짜와 종료 날짜를 선택한다.
2. 시스템은 선택 기간의 DailyChatSession 전체 대화 원문과 persona.md를 기반으로 Retrospective를 생성한다.
3. 생성된 Retrospective는 Markdown으로 저장된다.
4. 사용자는 생성된 Retrospective를 조회하고 Markdown을 복사하거나 다운로드한다.

### 인수 조건

- Retrospective에는 제목, 도입, 주요 경험, 고민과 판단 기준, 배운 점, 다음에 다르게 해볼 점, 마무리가 포함되어야 한다.
- Diary는 Retrospective 생성의 직접 입력이 아니다.
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
