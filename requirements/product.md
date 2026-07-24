# 내가그린기린기록 MVP 기능 요구사항

## 1. 개요

내가그린기린기록 MVP는 사용자가 하루 동안 남긴 기록을 기반으로 AI 실록이가 필요한
맥락을 되묻고, 이를 날짜별 Diary와 기간별 Retrospective로 정리해주는 대화형 회고
서비스다.

MVP는 기록 저장소 자체가 아니라 기존 Notion, 블로그, GitHub에 옮겨 쓸 수 있는 회고
초안을 만들어주는 보조 도구로 포지셔닝한다.

## 2. 핵심 사용자 흐름

`GitHub 로그인 → 말투 학습 온보딩 → Persona 생성 → Memo 작성 → Memo 요약 생성 → MemoSummary 생성 → 새로운 Memo 생성 → MemoSummary 선택 → 실록이 역질문 → 날짜별 Diary 자동 정리 → 기간별 Retrospective 생성 → Markdown 복사/다운로드`

## 3. 기능 범위

| 구분 | 기능 | 설명 |
| --- | --- | --- |
| Auth | GitHub OAuth 로그인 | GitHub 계정 기반 로그인 및 사용자 생성 |
| User | 내 정보 조회/수정 | 닉네임, 온보딩 상태 조회 및 수정 |
| Onboarding | 말투 학습 설문 저장/조회 | 설문 문항(목록은 §5)으로 말투, 정리 습관, 회고 성향 수집. 백엔드는 1~10개 응답을 허용하며 FE MVP는 8문항을 사용한다 |
| Persona | Persona 생성/조회/갱신 | 최신 온보딩 설문의 Explicit Preferences, 링크·기존 글·확정 기록의 Observed Traits, 두 영역을 병합한 Effective Guidelines로 persona.md를 구성하고 영역별 책임에 따라 갱신 |
| Memo | Memo 생성/조회/수정/삭제/요약 | 작업 메모장 생성, 조회, DRAFT 상태 수정/삭제 및 MemoSummary 생성 |
| MemoSummary | MemoSummary 조회 | 카테고리별 요약 결과 조회 |
| DailyChatSession | 대화 시작/질문 생성/답변 저장/종료 | MemoSummary 기반 실록이 역질문 세션과 전체 대화 원문 저장 |
| Diary | Diary 자동/수동 생성/조회 | 하루의 Memo 원본과 DailyChatSession을 근거로, MemoSummary가 있으면 보조 힌트로 참고하는 일일 요약 생성 및 조회 |
| Retrospective | 회고 생성/조회/삭제 | 선택 기간의 Diary 또는 DailyContext, DailyChatSession, persona.md를 기반으로 회고 글 생성·조회. 본인 회고는 삭제할 수 있다 |
| Streak | 잔디(스트릭) 조회 | Memo를 작성한 날을 날짜 단위로 1개 기록하고, 오늘 달성 여부·요약·잔디 데이터 조회 |
| EventLog | 이벤트 로깅 | MVP 검증 지표 수집 |

Markdown 복사/다운로드는 별도 서버 API 없이 FE 기능으로 처리한다.

## 4. 기능 요구사항

| No | 작업 요약 | 요구사항 |
| --- | --- | --- |
| 1-1 | GitHub OAuth 로그인 | 사용자는 GitHub 계정으로 로그인할 수 있어야 한다. 최초 로그인 시 GitHub ID, GitHub username, 프로필 이미지 등 최소 식별 정보를 저장한다. 재로그인 시 기존 User를 조회한다. |
| 2-1 | 말투 학습 입력 | 사용자는 온보딩에서 블로그 링크 또는 기존 회고 글 원문을 입력할 수 있어야 한다. §5 설문 문항(백엔드 허용 1~10개, FE MVP 8문항)을 통해 말투와 정리 습관을 수집할 수 있어야 한다. |
| 2-2 | 온보딩 설문 | 설문은 사용자의 문체, 감정 표현 방식, 글 정리 습관, 회고 관점, 선호하는 글 구조를 파악할 수 있어야 한다. 최신 설문 응답은 사용자가 직접 설정한 기준(Explicit Preferences)으로 사실 그대로 구조화하며, 명시하지 않은 내용을 추측해 추가하지 않는다. |
| 2-3 | Persona 생성 | 최초 온보딩에서 최신 설문으로 Explicit Preferences를 만들고, 블로그 링크 분석 결과와 기존 글 원문에서 반복적으로 확인된 경향을 Observed Traits로 요약한 뒤 Effective Guidelines를 산출해야 한다. 입력이 일부만 있어도 생성할 수 있으며 원문 전체를 persona.md에 복사하지 않는다. |
| 2-4 | Persona 갱신 | 설문 수정 시 Explicit Preferences만 전체 교체하고 기존 Observed Traits는 보존한 채 Effective Guidelines를 다시 계산한다. 주기적 기록 갱신 시 Explicit Preferences는 유지하고 확정 Diary와 종료된 DailyChatSession 전체 대화 원문에서 반복 경향을 추출해 Observed Traits를 갱신한 뒤 Effective Guidelines를 다시 계산한다. 갱신 주기는 매일로 고정하지 않으며, persona.md가 없거나 오래돼도 회고 생성을 차단하지 않는다. |
| 3-1 | Memo 작성 | 사용자는 현재 작업 중인 Memo에 자유롭게 기록을 남길 수 있어야 한다. Memo는 하루 동안 작성되는 기록의 작업 공간 역할을 해야 하며, 하루에 여러 개 생성될 수 있다. |
| 3-2 | Memo 조회 | 사용자는 현재 작업 중인 Memo 내용을 조회할 수 있어야 한다. |
| 3-3 | Memo 수정 | 사용자는 아직 요약되지 않은 `DRAFT` Memo의 내용을 수정할 수 있어야 한다. `SUMMARIZED` 또는 `ARCHIVED` Memo는 MemoSummary, Diary, Retrospective의 근거가 될 수 있으므로 수정할 수 없어야 한다. |
| 3-4 | Memo 삭제 | 사용자는 아직 요약되지 않은 `DRAFT` Memo를 삭제할 수 있어야 한다. 삭제된 Memo는 조회, MemoSummary 생성, Diary 생성 입력에서 제외되어야 한다. `SUMMARIZED` 또는 `ARCHIVED` Memo는 삭제할 수 없어야 한다. |
| 3-5 | Memo 요약 생성 | 사용자는 Memo의 요약하기를 실행할 수 있어야 한다. AI는 현재 DRAFT Memo 전체 내용을 분석하여 카테고리별 MemoSummary를 생성해야 한다. 한 번의 요약 실행 안에서는 하나의 기록이 여러 MemoSummary에 반영될 수 있고, 여러 기록 또는 내용 단위가 하나의 MemoSummary로 그룹핑될 수 있다. 새로운 요약 실행은 이전 실행에서 생성된 MemoSummary를 수정하거나 새 내용을 그 안으로 흡수하지 않으며, 현재 DRAFT Memo만으로 새 id를 가진 MemoSummary 레코드를 생성해야 한다. 따라서 같은 `categoryName`이 여러 실행에 걸쳐 나오더라도 서로 다른 MemoSummary 레코드로 분리하고, 이전 레코드의 `items`와 `chatAvailable` 상태를 그대로 유지해야 한다. 특히 이미 대화에 사용되어 `chatAvailable=false`인 MemoSummary는 변경할 수 없다. |
| 3-6 | 새 Memo 생성 | MemoSummary 생성이 완료되면 요약 대상 Memo는 `SUMMARIZED` 상태가 되어야 한다. 이후 사용자가 계속 기록할 수 있도록 새로운 빈 `DRAFT` Memo를 생성해야 한다. |
| 3-7 | MemoSummary 조회 | 사용자는 생성된 MemoSummary 목록을 조회할 수 있어야 한다. 각 MemoSummary에는 카테고리명, 요약 내용, 생성 시각, 대화 가능 여부가 포함되어야 한다. 이미 대화에 사용된 MemoSummary는 비활성화 상태로 표시되어야 한다. MVP에서 MemoSummary 수정/삭제는 제공하지 않는다. |
| 3-8 | MemoSummary 선택 | 사용자는 하나 이상의 대화 가능한 MemoSummary를 선택하여 대화를 시작할 수 있어야 한다. 이미 대화에 사용된 MemoSummary는 재선택할 수 없어야 한다. |
| 3-9 | 일일 작업 공간 초기화 | 매일 오전 06:00(KST)에 현재 작업 공간의 Memo와 MemoSummary를 초기화해야 한다. 초기화된 데이터는 삭제하지 않고 보관해야 한다. Diary 생성에는 전날 Memo 원본과 DailyChatSession을 활용하고, MemoSummary가 있으면 보조 힌트로 참고한다. 이후 새로운 빈 Memo를 생성해야 한다. |
| 4-1 | 실록이 대화 시작 | 사용자가 선택한 하나 이상의 MemoSummary를 기반으로 DailyChatSession을 시작해야 한다. |
| 4-2 | AI 역질문 생성 | 실록이는 선택된 MemoSummary와 이전 대화 맥락을 기반으로 한 번에 하나의 질문만 생성해야 한다. 질문은 감정, 이유, 판단 기준, 배운 점, 다음 행동 중 하나 이상의 정보를 끌어낼 수 있어야 한다. |
| 4-3 | 전체 대화 저장 | 실록이 질문, 사용자 답변, 마무리 멘트는 하나의 DailyChatSession 안에 전체 대화 원문으로 저장되어야 한다. 메시지 단위의 별도 ChatMessage 엔티티는 두지 않는다. 저장된 전체 대화 원문은 다음 질문 생성과 Diary 생성에 사용되어야 한다. |
| 4-4 | 대화 종료 | 사용자는 대화 중간에 언제든 끝내기 버튼으로 세션을 종료할 수 있어야 한다. 사용자가 끝낸 세션은 완전히 종료된 `ENDED` 상태로 취급하며, 이후 다시 이어서 대화하지 않는다. 실록이는 최대 10번까지만 질문해야 한다. 종료 시 짧은 마무리 멘트를 제공해야 한다. |
| 5-1 | Diary 자동 생성 | 매일 06:00(KST) 기준으로 전날의 Memo 원본과 DailyChatSession 전체 대화 원문을 모아 하나의 Diary로 정리해야 한다. MemoSummary가 있으면 카테고리/압축 힌트로 참고하되, 원본 Memo를 대체하지 않는다. 채팅하지 않은 Memo도 Diary에 반영되어야 한다. 하루에 여러 Memo와 대화 세션이 있어도 Diary는 날짜별 하나만 생성되어야 한다. |
| 5-2 | Diary 구성 | Diary에는 사용자가 하루를 어떻게 보냈는지 요약하는 내용이 포함되어야 한다. Memo 원본은 사실 근거이며, MemoSummary는 구조화를 돕는 보조 힌트다. Memo에만 남은 사실은 기록된 사실로 보존하고, 대화에서 깊어진 감정·이유·판단 기준은 더 강한 회고 신호로 반영한다. 주요 사건, 감정과 맥락, 고민한 지점, 새로 생긴 기준, 다음에 다르게 해보고 싶은 점을 하루 단위로 정리해야 한다. |
| 5-3 | Diary 조회 | 사용자는 날짜별 Diary 목록과 상세 내용을 조회할 수 있어야 한다. Diary가 아직 생성되지 않은 날짜는 생성 전 상태를 안내해야 한다. |
| 5-4 | Diary 수동 생성 | 사용자는 현재 진행 중인 serviceDate를 포함해 미래가 아닌 날짜의 Diary 생성을 요청할 수 있어야 한다. 수동 생성은 자동 생성과 같은 입력 정책을 사용한다. 현재 serviceDate에 이미 Diary가 있으면 최신 Memo와 DailyChatSession 기준으로 같은 날짜 Diary를 갱신하고, 닫힌 과거 serviceDate에 이미 Diary가 있으면 중복 생성하지 않고 기존 Diary를 반환해야 한다. 미래 날짜와 Memo·DailyChatSession이 모두 없는 날짜는 생성할 수 없어야 한다. |
| 6-1 | 회고 생성 | 사용자는 시작 날짜와 종료 날짜를 선택해 Retrospective를 생성할 수 있어야 한다. 선택 기간에 존재하는 확정 Diary 또는 DailyContext와 기간 내 DailyChatSession 전체 대화 원문, persona.md를 기반으로 회고를 생성해야 한다. Diary와 기록이 없는 과거·현재·미래 날짜는 입력에서 건너뛰되 Retrospective의 요청 시작·종료 날짜는 그대로 유지한다. 기간에 현재 진행 중인 serviceDate가 포함되어 있고 Diary가 없으며 내용 있는 당일 Memo가 있다면, 그 날짜는 Diary 대신 당일 Memo 원본만으로 임시 DailyContext를 만들어 사용한다. DailyChatSession 원문은 DailyContext에 포함하지 않고 기간 단위 직접 입력으로 사용한다. 과거·미래 날짜에는 DailyContext를 만들지 않는다. 전체 기간에 Diary, DailyContext, DailyChatSession 중 하나는 있어야 하며, persona.md나 공백 Memo만으로는 생성하지 않는다. DailyContext는 생성 시점의 스냅샷이며 정식 Diary를 대체하지 않는다. 원본 Memo는 Diary 또는 DailyContext에 흡수된 하루 맥락으로 사용하며, MemoSummary는 Diary 생성 시 보조 힌트로만 참고한다. Retrospective 생성의 기본 직접 입력으로 원본 Memo와 MemoSummary를 다시 넣지 않는다. |
| 6-2 | 회고 출력 형식 | 회고에는 제목, 도입, 주요 경험, 고민과 판단 기준, 배운 점, 다음에 다르게 해볼 점, 마무리가 포함되어야 한다. 결과는 Markdown으로 제공되어야 한다. |
| 6-3 | 회고 저장 | 생성된 회고는 Retrospective로 저장되어야 한다. 사용자는 생성된 회고를 다시 조회할 수 있어야 하며, 본인 회고를 삭제할 수 있어야 한다. 삭제는 되돌릴 수 없고 원본 기록(Memo/Diary/DailyChatSession)에는 영향을 주지 않는다. |
| 7-1 | 이벤트 로깅 | MVP 검증을 위해 주요 사용자 행동을 EventLog로 얇게 저장해야 한다. EventLog는 append-only로 저장하며, 복잡한 분석 대시보드는 MVP 범위가 아니다. |

## 5. 온보딩 설문 문항

| No | 문항 | 목적 |
| --- | --- | --- |
| 1 | 회고 글을 쓸 때 보통 어떤 순서로 정리하나요? | 글 전개 방식 파악 |
| 2 | 감정을 글에 얼마나 직접적으로 드러내는 편인가요? | 감정 표현 강도 파악 |
| 3 | 회고에서 가장 자주 다루는 주제는 무엇인가요? | 반복 관심사 파악 |
| 4 | 글을 쓸 때 자주 쓰는 표현이나 말버릇이 있나요? | 사용자 고유 표현 수집 |
| 5 | 문제 상황을 적을 때 감정, 원인, 해결 과정 중 무엇을 먼저 쓰나요? | 사고 흐름 파악 |
| 6 | 회고 글의 톤은 담백한 편, 분석적인 편, 감성적인 편 중 어디에 가까운가요? | 선호 톤 파악 |
| 7 | 성장 포인트를 정리할 때 중요하게 보는 기준은 무엇인가요? | 회고 기준 파악 |
| 8 | 긴 글과 짧은 글 중 어떤 형식을 선호하나요? | 출력 분량 선호 파악 |
| 9 | 예시 문장 중 본인 말투와 가까운 문장을 선택해 주세요. | 문체 선택형 데이터 수집 |
| 10 | 최근 기억나는 학습 경험을 평소 말투로 짧게 적어 주세요. | 실제 문장 샘플 수집 |

> `questionId↔문구` 매핑(1~10)이 계약이며, 제출 문항 수는 고정이 아니다. 백엔드는 `1~10`개 응답을 허용하고, FE MVP는 현재 8문항을 제출한다.

## 6. 설문 결과 활용

### 6-1. Persona 구조

내부 `persona.md`는 다음 세 영역을 독립적으로 유지한다.

1. **사용자가 직접 설정한 기준(Explicit Preferences)**: 최신 온보딩 설문을 사실 그대로 구조화한다. 사용자가 명시하지 않은 내용은 추측하지 않는다.
2. **기록에서 관찰된 경향(Observed Traits)**: 온보딩 블로그/회고 링크 분석 결과, 온보딩 기존 글 원문, 확정된 Diary, 종료된 DailyChatSession 전체 대화 원문에서 반복적으로 확인된 말투, 사고 흐름, 관심사, 글 정리 습관, 회고 기준을 요약한다. 단발성 표현이나 사건을 성향으로 단정하지 않고 원문 전체를 복사하지 않는다. Memo는 미완성·즉흥 기록이므로 독립적인 학습 원천에서는 제외하고, 확정 원천에서 이미 확인된 경향의 보조 근거로만 사용한다.
3. **통합 적용 기준(Effective Guidelines)**: 앞의 두 영역을 병합해 실록이 대화와 Retrospective 생성에 바로 적용할 말투·작성 지침을 만든다. 최신 명시적 의사를 우선하되 충돌하는 관찰을 삭제하지 않고 현실적인 적용 기준으로 보존한다. 예를 들어 짧은 글을 선호하지만 판단 맥락을 길게 설명하는 경향이 있으면, 결과는 짧게 구성하되 판단에 필요한 핵심 맥락은 생략하지 않는다.

노출용 Persona와 내부 `persona.md`는 분리한다. 기존 `tone`, `thinkingStyle`, `recurringInterests`, `organizingHabit`, `retrospectionCriteria`, `preferredStructure`, `summary`는 사용자 조회용 요약을 유지하고, 내부 `markdown`은 위 세 영역을 모두 담는다. 공개 `Persona` 응답에서는 `markdown`을 제거하고 새 내부 영역별 필드도 추가하지 않는다.

### 6-2. Persona 갱신 정책

- **최초 온보딩**: Explicit Preferences와 온보딩 링크/원문 기반 Observed Traits를 생성하고 Effective Guidelines를 산출한다. 블로그 링크 분석에 실패해도 설문 등 사용 가능한 입력으로 기본 Persona를 생성한다.
- **온보딩 설문 수정**: Explicit Preferences만 최신 설문으로 전체 교체한다. Observed Traits는 삭제하거나 초기화하지 않고 Effective Guidelines만 다시 계산한다.
- **사용자 기록 기반 주기적 갱신**: Explicit Preferences는 변경하지 않는다. 기존 온보딩 링크·원문에서 얻은 Observed Traits를 초기화하지 않고, 기존 Observed Traits와 새로 확정된 Diary 및 `ENDED` DailyChatSession 전체 대화 원문을 함께 고려해 반복 경향을 보강·정제한다. 새 기록만으로 Observed Traits 전체를 교체하지 않으며 Effective Guidelines 재계산도 두 원천 영역을 변경하지 않는다.
- **Retrospective 생성**: 원본 설문이나 학습 자료 전체를 직접 입력하지 않고 최신 `persona.md`의 Effective Guidelines를 중심으로 사용한다. persona.md가 없거나 오래돼도 생성을 차단하지 않는다.
- `OnboardingSurvey`와 `PersonaSource`는 원천 이력으로 누적 저장하며 사용자당 Persona 1개 원칙을 유지한다.
- Persona 학습과 생성은 해당 원천을 소유한 사용자 경계 안에서만 수행하고, 원문 전체를 persona.md나 Retrospective 입력으로 복제하지 않는다. `OnboardingSurvey`와 `PersonaSource`는 계정 생명주기 동안 보존하며 계정 삭제 시 함께 삭제한다.
- 블로그 URL은 최초 요청과 매 redirect 대상 모두 `http`/`https`만 허용한다. 각 요청마다 DNS를 다시 해석하고 검증된 IP로 연결한 뒤 실제 socket peer IP도 확인해 DNS rebinding·TOCTOU를 방지하며, loopback·link-local·private·클라우드 metadata 주소를 차단한다. timeout, redirect 횟수, 응답 크기, 허용 content-type 상한을 서버 정책으로 강제한다.

## 7. MVP 제외 범위

- 블로그 자동 업로드
- 외부 링크 자동 파싱 고도화
- Diary 수정/삭제
- 질문 만족도 피드백
- 실록이 성장, EXP
- 레벨별/미션별 질문 템플릿
- 성장 리포트
- 관리자 대시보드
- 복잡한 푸시 알림
- 소셜 공유
- 로컬 LLM 또는 파인튜닝
- 실록이 톤 선택 기능
- MemoSummary 수정/삭제
- Export 서버 API
- EventLog 분석 대시보드

## 8. 백엔드 결정사항

- Backend: Spring Boot + Java 21 + Gradle.
- DB: PostgreSQL 우선.
- ORM: Spring Data JPA 사용을 우선 검토한다.
- 테스트 DB: Testcontainers PostgreSQL 우선, H2는 대안.
- 인증: GitHub OAuth.
- 패키지 구조: 도메인 중심.
- AI 금지 작업: 사용자 승인 없는 DB 스키마 변경, 인증/인가 정책 변경, OpenAPI 변경, 도메인 정책 변경, 운영 설정 변경.
