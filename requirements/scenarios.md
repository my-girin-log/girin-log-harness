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

## 1-1. Persona 영역별 갱신

### 흐름

1. 사용자가 마이페이지에서 온보딩 설문을 수정하면 시스템은 최신 설문으로 Explicit Preferences만 전체 교체한다.
2. 시스템은 기존 Observed Traits를 유지하고 두 영역으로 Effective Guidelines를 다시 계산한다.
3. 기록 기반 주기적 작업은 Explicit Preferences를 유지하고 기존 Observed Traits에 새 확정 Diary와 `ENDED` DailyChatSession의 반복 경향을 병합한다.
4. 시스템은 갱신된 두 영역으로 Effective Guidelines와 노출용 Persona 요약 필드를 다시 계산한다.

### 인수 조건

- 설문 수정만으로 블로그 링크·기존 글 원문·확정 사용자 기록에서 얻은 Observed Traits가 삭제되거나 초기화되지 않아야 한다.
- 기록 기반 갱신만으로 Explicit Preferences가 변경되지 않아야 한다.
- 기록 기반 갱신은 새 기록만으로 Observed Traits 전체를 교체하지 않고 기존 온보딩 원천의 관찰과 누적 경향을 보존·정제해야 한다.
- 단발성 표현이나 사건을 Observed Traits로 확정하지 않고 원문 전체를 persona.md에 복사하지 않아야 한다.
- 명시적 선호와 관찰된 경향이 충돌하면 두 원천을 모두 유지하고, Effective Guidelines는 최신 명시적 의사를 우선한 현실적인 적용 기준을 제공해야 한다.
- Memo는 독립적인 학습 원천에서 제외하고 확정 원천에서 확인된 경향의 보조 근거로만 사용해야 한다. Memo만으로 새 Observed Traits를 만들거나 기존 경향을 변경해서는 안 된다.
- 설문 수정과 기록 기반 갱신 모두 Effective Guidelines를 다시 계산해야 한다.
- `lastRefreshedAt`은 기록 기반 Observed Traits 갱신 때만 변경해야 하며, 설문 수정 시각은 현재 `OnboardingSurvey.submittedAt`으로 추적해야 한다.
- 공개 Persona 응답에 내부 `persona.md` 또는 영역별 내부 필드를 포함하지 않아야 한다.

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

## 4. 06:00 KST Diary 자동 생성

### 흐름

1. 매일 06:00 KST에 시스템이 전날 작업 공간을 정리한다.
2. 전날 Memo 원본과 DailyChatSession들을 종합해 Diary를 생성한다. MemoSummary가 있으면 카테고리/압축 힌트로 참고한다.
3. 하루에 여러 Memo와 DailyChatSession이 있어도 Diary는 날짜별 하나만 생성한다.
4. 기존 데이터는 삭제하지 않고 보관한다.
5. 이후 새로운 빈 Memo를 생성할 수 있는 상태가 된다.

### 인수 조건

- 이 서비스의 하루 경계는 00:00이 아니라 06:00 KST다.
- 06:00 KST 이전 새벽 기록은 전날 기록으로 계산한다.
- 채팅하지 않은 Memo도 Diary 생성 입력에 포함되어 날짜별 정리본에 보존되어야 한다.
- MemoSummary는 Diary 생성의 보조 힌트이며, 원본 Memo를 대체하지 않는다.
- Memo에만 남은 내용은 기록된 사실로 반영하고, DailyChatSession에서 확인된 감정·이유·판단 기준은 더 강한 회고 신호로 반영한다.
- Diary는 사용자가 하루를 어떻게 보냈는지 요약하는 날짜별 정리본이다.
- Diary 수동 생성은 MVP 범위가 아니다.
- Diary가 아직 생성되지 않은 날짜는 생성 전 상태를 안내해야 한다.

## 5. Retrospective 생성

### 흐름

1. 사용자는 시작 날짜와 종료 날짜를 선택한다.
2. 시스템은 선택 기간에 존재하는 Diary 또는 DailyContext, 기간 내 DailyChatSession 전체 대화 원문과 최신 persona.md의 Effective Guidelines를 중심으로 Retrospective를 생성한다.
3. 생성된 Retrospective는 Markdown으로 저장된다.
4. 사용자는 생성된 Retrospective를 조회하고 Markdown을 복사하거나 다운로드한다.

### 인수 조건

- Retrospective에는 제목, 도입, 주요 경험, 고민과 판단 기준, 배운 점, 다음에 다르게 해볼 점, 마무리가 포함되어야 한다.
- Retrospective는 Diary 또는 Memo 기반 DailyContext로 하루 전체 맥락을 받고, DailyChatSession 원문으로 대화에서 깊어진 감정·이유·판단 기준을 보강한다.
- Diary와 기록이 없는 과거·현재·미래 날짜는 건너뛰되, 사용자가 요청한 시작·종료 날짜는 Retrospective 기간으로 유지해야 한다.
- 선택 기간에 현재 진행 중인 serviceDate가 포함되어 있고 Diary가 없으며 내용 있는 당일 Memo가 있다면, 그 날짜는 Diary 대신 당일 Memo 원본만으로 만든 임시 DailyContext를 사용한다.
- 과거·미래 날짜에는 DailyContext나 placeholder를 만들지 않는다. 기간 내 DailyChatSession 원문은 해당 날짜의 Diary 유무와 관계없이 직접 입력에 포함한다.
- 전체 기간에 Diary, DailyContext, DailyChatSession 중 하나는 있어야 한다. persona.md와 공백 Memo만 있는 요청은 `NO_RETROSPECTIVE_SOURCE`로 거부한다.
- 원본 설문이나 Persona 학습 자료 전체를 Retrospective 생성에 직접 입력하지 않는다. persona.md가 없거나 오래돼도 생성을 차단하지 않는다.
- Diary만 있거나 당일 내용 있는 Memo 기반 DailyContext만 있는 기간도 Retrospective를 생성할 수 있어야 한다. DailyChatSession 원문은 DailyContext에 포함하지 않고 기간 단위 직접 입력으로 사용한다.
- 임시 DailyContext는 Retrospective 생성 시점의 스냅샷이며, 저장되거나 정식 Diary를 대체하지 않는다.
- 다음 06:00 KST에는 기존 자동 생성 흐름대로 확정 Diary가 생성되어야 한다.
- 원본 Memo는 Diary 또는 DailyContext에 흡수된 맥락으로 사용하고, MemoSummary는 Diary 생성 시 보조 힌트로만 참고한다. Retrospective 생성의 기본 직접 입력으로 원본 Memo와 MemoSummary를 다시 넣지 않는다.
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
