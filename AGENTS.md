# AGENTS.md — girin-codex

이 파일은 이 레포에서 작업하는 코딩 에이전트를 위한 컨텍스트다.
**여기 적힌 건 "지향"이고, 반드시 지켜야 하는 건 `harness/`의 hook이 강제한다.**
둘 다 읽고 따른다.

## 이 레포의 정체

- 애플리케이션 코드가 아니다. **요구사항(`requirements/`) + 계약(`api/openapi.yaml`) + 규칙(`conventions/`) + 하네스(`harness/`)** 의 모음이다.
- 여기서의 작업은 거의 항상 "문서/명세를 정확하고 일관되게 다듬는 것"이다. 기능 구현이 아니다.

## 문서 우선순위

문서가 충돌하면 아래 순서로 판단한다.

1. `api/openapi.yaml`
2. `requirements/product.md`
3. `domain/data-model.md`
4. `conventions/glossary.md`
5. `conventions/api.md`
6. README/기타 문서

## 절대 규칙

1. **명세가 진실이다.** `api/openapi.yaml`을 임의로 추측해서 바꾸지 않는다. 변경은 근거(기획안·합의)가 있을 때만, 변경 후엔 영향 범위를 PR 설명에 남긴다.
2. **용어는 `conventions/glossary.md`를 따른다.** 같은 개념을 다른 단어로 부르지 않는다. 예: 회고는 `Retrospective`이지 `Retro`/`Review`가 아니다.
3. **`[확정 필요]` 표시를 임의로 채우지 않는다.** 팀 합의가 필요한 자리다. 사용자에게 물어보거나 그대로 둔다.
4. **커밋 메시지는 한국어로,** `conventions/git.md` 규칙을 따른다.
5. OpenAPI를 수정하면 유효성(스키마)이 깨지지 않았는지 확인한다. hook이 한 번 더 잡는다.

## 도메인 한 줄 요약

AI 캐릭터 **실록이**와 짧게 대화하며 하루의 사건·감정·고민을 기록하고,
이를 **Diary**(날짜별 정리)와 **Persona**(말투/사고)로 묶어
**Retrospective**(완성형 회고 글)를 생성하는 우테코 크루용 회고 서비스.

핵심 흐름:
`GitHub 로그인 → 말투 학습 온보딩 → Persona 생성 → Memo 작성 → Memo 요약 생성 → MemoSummary 생성 → MemoSummary 선택 → 실록이 역질문 → 06:00 KST Diary 자동 정리 → 기간 선택 → Retrospective 생성 → Markdown 복사/다운로드`

핵심 규칙(기획 리뷰 반영):
- Memo는 **하루 여러 개** 가능하다.
- Memo 요약하기를 실행하면 카테고리별 **MemoSummary**가 생성된다.
- 대화 세션은 Memo가 아니라 **하나 이상의 MemoSummary 선택**으로 시작한다.
- MemoSummary는 MVP에서 조회만 가능하다. 수정/삭제 API를 추측해 추가하지 않는다.
- 이미 대화에 사용된 MemoSummary는 비활성화하고 재선택할 수 없다.
- 대화 세션은 **하루 여러 개** 가능하다. **역질문 최대 10회**(서버 정책/프롬프트로 강제). '끝내기' 버튼/AI 판단으로 종료.
- 세션이 여러 개여도 **Diary는 하루 1개**.
- **06:00 KST에 Diary 자동 생성 + 일일 작업 공간 초기화**. 자동 생성만 MVP 범위다.
- Persona는 **블로그 링크 또는 기존 글 원문 + 온보딩 ~10문항 설문**으로 초기 생성한다. 이후 사용자 기록을 바탕으로 `persona.md`를 주기적으로 갱신해 사용자 맞춤 기준이 변할 수 있어야 한다.
- 전체 대화 원문은 별도 `Chat`/`ChatMessage` 엔티티 없이 **DailyChatSession의 `conversation`** 에 순서대로 저장한다.
- Retrospective는 선택 기간의 **DailyChatSession 전체 대화 원문과 `persona.md`** 를 기반으로 생성한다. 원본 Memo, MemoSummary, Diary는 직접 입력이 아니다.
- EventLog는 MVP에서 얇은 append-only 로그로 실제 저장한다.

자세한 기능 요구사항은 `requirements/product.md`, 엔티티는 `domain/data-model.md`를 본다.

## 자주 하는 실수 (하지 말 것)

- 명세에 없는 필드/엔드포인트를 "있을 법해서" 추가하기 → 금지. 명세에 먼저 합의·반영.
- 영어/한국어 용어 혼용(`diary`와 `journal`을 같이 쓰는 등) → glossary 단일화.
- 시간을 UTC로 가정 → 이 서비스의 일자 경계는 **06:00 KST**다. `conventions/api.md` 참고.
- 역질문을 무한정 생성 → **최대 10회**. 상한은 정책 상수/프롬프트로.
- 하루에 Diary를 여러 개 만들기 → **하루 1개**(여러 세션을 합쳐 정리).
- Memo에서 바로 대화를 시작시키기 → 대화는 **MemoSummary 선택** 후 시작한다.
- MemoSummary 수정/삭제를 추가하기 → MVP에서는 조회만 가능하다.
- 이미 대화한 MemoSummary를 다시 선택 가능하게 만들기 → 한 번 대화한 카테고리는 비활성화한다.
- Retrospective 생성에 Diary, 원본 Memo, MemoSummary를 직접 입력으로 쓰기 → 회고 생성 입력은 **DailyChatSession conversation + persona.md** 다.
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
