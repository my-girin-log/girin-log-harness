# 파일 명칭 정리

이 문서는 회의에서 논의한 Markdown 기반 보관 구조의 명칭을 기획안 용어에 맞춰
정리한 공유용 기준이다. API/DB 엔티티의 최종 용어는 `conventions/glossary.md`를 따른다.

## 원칙

- 도메인 개념은 `Memo`, `MemoSummary`, `DailyChatSession`, `Diary`, `Persona`를 사용한다. 전체 대화 원문은 별도 엔티티가 아니라 `DailyChatSession`의 `conversation`이다.
- 파일명은 소문자 `kebab-case`를 사용한다.
- 하루에 여러 개 생기는 데이터는 파일명도 복수형으로 쓴다.
- `journal`은 `Diary`와 혼동될 수 있으므로 디렉터리명으로 쓰지 않는다.
- `chat` 단독 표현은 모호하므로 `daily-chat-sessions`로 쓴다.

## 권장 구조

```text
/daily-records/
  2025-06-05/
    memos.md                  # 원본 Memo 목록
    memo-summaries.md         # Memo 분할 + 카테고리별 MemoSummary
    daily-chat-sessions.md    # DailyChatSession과 전체 대화 원문(conversation)
    diary.md                  # 자동/수동 생성 Diary
  2025-06-06/
    ...
/persona/
  persona.md                  # Persona 세 영역 내부 문서
```

## 명칭 매핑

| 회의 초안 | 권장 명칭 | 이유 |
| --- | --- | --- |
| `/journal/` | `/daily-records/` | `Journal`은 쓰지 않는 용어이고 `Diary`와 혼동된다. |
| `memo.md` | `memos.md` | Memo는 하루에 여러 개 생성될 수 있다. |
| `memoSummary.md` | `memo-summaries.md` | 파일명은 kebab-case, MemoSummary는 여러 개 생성될 수 있다. |
| `chat.md` | `daily-chat-sessions.md` | 대화는 세션 단위이며, 전체 대화 원문이 세션 안에 순서대로 저장된다. |
| `diary.md` | `diary.md` | 날짜별 1개 생성되는 Diary와 대응한다. |
| `/persona/persona.md` | `/persona/persona.md` | Explicit Preferences, Observed Traits, Effective Guidelines를 분리해 담는 내부용 파일로 유지한다. |

## 각 파일의 의미

### `memos.md`

사용자가 하루 동안 작성한 원본 Memo 목록이다.  
Memo는 하루에 여러 개 생성될 수 있고, 요약 전에는 `DRAFT`, 요약 완료 후에는
`SUMMARIZED`, 06:00 KST 이후에는 `ARCHIVED` 상태로 취급한다.

### `memo-summaries.md`

AI가 Memo 전체를 분석해 내용 단위로 분할하고 카테고리별로 묶은 MemoSummary 목록이다.  
하나의 Memo 내용이 여러 MemoSummary에 반영될 수 있고, 여러 Memo 내용이 하나의
MemoSummary로 합쳐질 수 있다.

MVP에서 MemoSummary는 조회만 가능하며 수정/삭제하지 않는다.
이미 대화에 사용된 MemoSummary는 비활성화 상태로 표시하며 재선택하지 않는다.

### `daily-chat-sessions.md`

하나 이상의 MemoSummary를 선택해 시작한 DailyChatSession과, 그 안에서 오간 전체
대화 원문(`conversation`)을 저장한다. 별도 메시지 엔티티 없이 세션 하나에 전체 대화를 담는다.
사용자가 중간에 끝내기를 누르면 해당 세션은 완전히 종료된 상태로 취급하며 다시 이어서 대화하지 않는다.

예시:

```text
## DailyChatSession 3

selectedMemoSummaryIds: [10, 11]
status: OPEN

1. SILOK: 오늘 코드 리뷰에서 가장 신경 쓰였던 지점은 뭐였어?
2. USER: collect를 toList로 바꾸는 리뷰에서 기준을 잘 설명하지 못한 게 아쉬웠어.
3. SILOK: 그럼 다음에는 기준을 먼저 말해보고 싶은 거야?
4. USER: 맞아. 구현 전에 내 판단 기준을 먼저 공유하고 싶어.
```

### `diary.md`

매일 06:00 KST에 전날의 Memo 원본과 DailyChatSession들을 종합해 자동 생성되며,
현재 진행 중인 serviceDate를 포함해 미래가 아닌 날짜는 사용자가 수동 생성할 수도 있는 Diary다. MemoSummary는 있을 때만
카테고리/압축 힌트로 참고한다. 사용자가 날짜별로 조회하는 요약이며, 채팅하지 않은 Memo도
하루 맥락으로 보존한다. Retrospective 생성에는 기간 내 Diary, DailyChatSession 원문,
`persona.md`를 사용한다.

### `/persona/persona.md`

`Explicit Preferences`, `Observed Traits`, `Effective Guidelines` 세 영역을 독립적으로 유지하는
내부 Persona 파일이다. 설문 수정은 Explicit Preferences만 교체하고, 확정 Diary와 종료된
DailyChatSession 기반 주기적 갱신은 Observed Traits만 갱신한다. 두 경우 모두 Effective
Guidelines를 다시 계산한다. 사용자에게 직접 보여주기보다는 실록이 대화와 Retrospective
생성 시 사용자다운 말투와 사고 흐름을 반영하는 기준으로 사용한다.

## 쓰지 않을 명칭

| 쓰지 말 것 | 대신 쓸 것 |
| --- | --- |
| `journal` | `daily-records` 또는 `diary` |
| `memoSummary.md` | `memo-summaries.md` |
| `chat.md` | `daily-chat-sessions.md` |
| `Chat`, `ChatMessage` | `DailyChatSession` (대화 원문은 `conversation` 필드) |
| `Review`, `Retro`, `Reflection` | `Retrospective` |
