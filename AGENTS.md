# AGENTS.md — girin-log-harness

이 파일은 이 레포에서 작업하는 코딩 에이전트를 위한 컨텍스트다.
**여기 적힌 건 "지향"이고, 반드시 지켜야 하는 건 `harness/`의 hook이 강제한다.**
둘 다 읽고 따른다.

## 이 레포의 정체

- 애플리케이션 코드가 아니다. **요구사항(`requirements/`) + 계약(`api/openapi.yaml`) + 규칙(`conventions/`) + 하네스(`harness/`)** 의 모음이다.
- 여기서의 작업은 거의 항상 "문서/명세를 정확하고 일관되게 다듬는 것"이다. 기능 구현이 아니다.
- 이 레포는 `girin-log-back`, `girin-log-front` 등 제품 레포가 submodule 로 참조하는 **SSOT**다. 계약 변경은 반드시 이 레포에서 별도 브랜치와 PR로 진행한다.
- 제품 레포의 `vendor/harness` 경로 안에서 파일을 직접 수정하지 않는다. 제품 레포에서는 의도한 경우에만 submodule 포인터 갱신을 커밋한다.

## 문서 우선순위

문서가 충돌하면 아래 순서로 판단한다.

1. `api/openapi.yaml`
2. `requirements/product.md`
3. `domain/data-model.md`
4. `conventions/glossary.md`
5. `conventions/api.md`
6. README/기타 문서

## 절대 규칙

1. **작업 시작 전에 먼저 브랜치를 판다.** 파일을 읽고 분석하는 것은 가능하지만, 어떤 파일이든 수정하기 전에는 `main` 최신화 후 별도 작업 브랜치로 전환한다. `main`에서 바로 수정하지 않는다.
2. **명세가 진실이다.** `api/openapi.yaml`을 임의로 추측해서 바꾸지 않는다. 변경은 근거(기획안·합의)가 있을 때만, 변경 후엔 영향 범위를 PR 설명에 남긴다.
3. **용어는 `conventions/glossary.md`를 따른다.** 같은 개념을 다른 단어로 부르지 않는다. 예: 회고는 `Retrospective`이지 `Retro`/`Review`가 아니다.
4. **`[확정 필요]` 표시를 임의로 채우지 않는다.** 팀 합의가 필요한 자리다. 사용자에게 물어보거나 그대로 둔다.
5. **커밋 메시지는 한국어로,** `conventions/git.md` 규칙을 따른다.
6. OpenAPI를 수정하면 유효성(스키마)이 깨지지 않았는지 확인한다. hook이 한 번 더 잡는다.

## 도메인 한 줄 요약

AI 캐릭터 **실록이**와 짧게 대화하며 하루의 사건·감정·고민을 기록하고,
이를 **Diary**(날짜별 정리)와 **Persona**(말투/사고)로 묶어
**Retrospective**(완성형 회고 글)를 생성하는 우테코 크루용 회고 서비스.

핵심 흐름:
`GitHub 로그인 → 말투 학습 온보딩 → Persona 생성 → Memo 작성/수정/삭제 → Memo 요약 생성 → MemoSummary 생성 → MemoSummary 선택 → 실록이 역질문 → 06:00 KST Diary 자동 정리 → 기간 선택 → Retrospective 생성 → Markdown 복사/다운로드`

핵심 규칙(기획 리뷰 반영):
- Memo는 **하루 여러 개** 가능하다.
- Memo 수정/삭제는 **DRAFT Memo만** 가능하다. `SUMMARIZED`/`ARCHIVED` Memo는 수정/삭제하지 않는다.
- Memo 요약하기를 실행하면 카테고리별 **MemoSummary**가 생성된다.
- 대화 세션은 Memo가 아니라 **하나 이상의 MemoSummary 선택**으로 시작한다.
- MemoSummary는 MVP에서 조회만 가능하다. 수정/삭제 API를 추측해 추가하지 않는다.
- 이미 대화에 사용된 MemoSummary는 비활성화하고 재선택할 수 없다.
- 대화 세션은 **하루 여러 개** 가능하다. **역질문 최대 10회**(서버 정책/프롬프트로 강제). '끝내기' 버튼/AI 판단으로 종료.
- 세션이 여러 개여도 **Diary는 하루 1개**.
- **06:00 KST에 Memo 원본·DailyChatSession 기반 Diary 자동 생성 + 일일 작업 공간 초기화**. 현재 진행 중인 serviceDate를 포함해 미래가 아닌 날짜는 사용자가 Diary 수동 생성을 요청할 수 있다. 현재 serviceDate에 이미 Diary가 있으면 최신 Memo와 ENDED DailyChatSession 기준으로 같은 날짜 Diary를 갱신하고, 닫힌 과거 serviceDate에 이미 Diary가 있으면 기존 Diary를 반환한다. 미래 날짜는 수동 생성하지 않는다. 오늘 회고 생성에는 아직 Diary가 없고 내용 있는 Memo가 있는 현재 serviceDate의 Memo 원본을 임시 DailyContext로 사용할 수 있다. MemoSummary는 있을 때만 보조 힌트로 참고한다.
- Persona의 내부 `persona.md`는 최신 설문 기반 Explicit Preferences, 링크·기존 글·확정 기록 기반 Observed Traits, 두 영역을 병합한 Effective Guidelines로 구성한다. 설문 수정은 Explicit Preferences만 교체하고 Observed Traits를 보존하며, 기록 기반 갱신은 그 반대로 처리한 뒤 Effective Guidelines를 다시 계산한다.
- 전체 대화 원문은 별도 `Chat`/`ChatMessage` 엔티티 없이 **DailyChatSession의 `conversation`** 에 순서대로 저장한다.
- Retrospective는 선택 기간에 존재하는 **Diary, DailyChatSession 전체 대화 원문, `persona.md`** 를 기반으로 생성한다. 기록이 없는 과거·현재·미래 날짜는 건너뛰되 요청한 기간 메타데이터는 유지한다. 현재 진행 중인 serviceDate에 Diary가 없고 내용 있는 Memo가 있으면 Memo 원본만으로 저장하지 않는 임시 **DailyContext**를 사용한다. DailyChatSession 원문은 DailyContext에 중복해서 넣지 않고 기간 단위 직접 입력으로만 사용한다. 전체 기간에 Diary, DailyContext, DailyChatSession 중 하나는 있어야 한다. 원본 Memo는 Diary 또는 DailyContext에 흡수된 하루 맥락으로 사용하고, MemoSummary는 Diary 생성 시 보조 힌트로만 참고한다. Retrospective 생성의 기본 직접 입력으로 원본 Memo와 MemoSummary를 다시 넣지 않는다.
- EventLog는 MVP에서 얇은 append-only 로그로 실제 저장한다.

자세한 기능 요구사항은 `requirements/product.md`, 엔티티는 `domain/data-model.md`를 본다.

## 자주 하는 실수 (하지 말 것)

- 명세에 없는 필드/엔드포인트를 "있을 법해서" 추가하기 → 금지. 명세에 먼저 합의·반영.
- 영어/한국어 용어 혼용(`diary`와 `journal`을 같이 쓰는 등) → glossary 단일화.
- 시간을 UTC로 가정 → 이 서비스의 일자 경계는 **06:00 KST**다. `conventions/api.md` 참고.
- 역질문을 무한정 생성 → **최대 10회**. 상한은 정책 상수/프롬프트로.
- 하루에 Diary를 여러 개 만들기 → **하루 1개**(여러 세션을 합쳐 정리).
- Memo에서 바로 대화를 시작시키기 → 대화는 **MemoSummary 선택** 후 시작한다.
- `SUMMARIZED`/`ARCHIVED` Memo를 수정/삭제하기 → Memo 수정/삭제는 **DRAFT** 에서만 가능하다.
- MemoSummary 수정/삭제를 추가하기 → MVP에서는 조회만 가능하다.
- 이미 대화한 MemoSummary를 다시 선택 가능하게 만들기 → 한 번 대화한 카테고리는 비활성화한다.
- 채팅하지 않은 Memo를 Diary에서 누락하기 → Diary 생성의 근거 입력은 **Memo 원본 + DailyChatSession conversation** 이고, MemoSummary는 있을 때만 보조 힌트다.
- Retrospective 생성에 원본 Memo, MemoSummary를 다시 직접 넣기 → 회고 생성 입력은 **Diary 또는 DailyContext + DailyChatSession conversation + persona.md** 다. `DailyContext`는 현재 진행 중인 serviceDate에 아직 Diary가 없고 내용 있는 Memo가 있을 때 Memo 원본만으로 만든 임시 입력이다. DailyChatSession conversation은 DailyContext에 넣지 않고 기간 단위 직접 입력으로 사용한다. 기록이 없는 날짜는 건너뛰며, 과거·미래 날짜에 DailyContext를 만들지 않는다.
- Export API를 추가하기 → Markdown 복사/다운로드는 FE 기능으로 처리한다.
- Persona를 글 입력으로만 만들기 → **블로그 링크/기존 글 원문/온보딩 설문**을 함께 고려하되 일부 입력만으로도 생성 가능하다.
- 실록이를 "상담사/치료자"처럼 묘사 → 옆자리 크루처럼 담백하게(기획안 10절).

## 백엔드 기준

- Backend: Spring Boot + Java 21 + Gradle.
- DB: PostgreSQL 우선. 긴 텍스트와 유연한 메타데이터는 PostgreSQL `jsonb` 사용을 검토한다.
- 테스트 DB: Testcontainers PostgreSQL 우선, H2는 대안.
- 패키지는 도메인 중심으로 나눈다.
- AI는 사용자 승인 없이 DB 스키마 변경, 인증/인가 정책 변경, OpenAPI 변경, 도메인 정책 변경, 운영 설정 변경을 하지 않는다.

## 빌드/검증 명령

```bash
# OpenAPI 유효성 검사 (도구는 conventions/api.md 참고)
bash harness/hooks/check-spec-drift.sh
```
