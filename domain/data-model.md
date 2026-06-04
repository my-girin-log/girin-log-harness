# 데이터 모델

기획안 9절 기준 초안. **`[확정 필요]`는 실제 API 명세를 받은 뒤 확정한다.**
필드명은 `conventions/glossary.md`의 표준 영문명을 따른다.

> 이 문서는 "엔티티가 무엇이고 무엇을 담는가"를 합의하는 곳이다.
> 정확한 타입/제약/관계는 `api/openapi.yaml`의 `components/schemas`가 최종 진실이다.

---

## User

로그인 사용자. GitHub OAuth로 진입.

| 필드 | 설명 | 비고 |
| --- | --- | --- |
| `id` | 내부 식별자 | |
| `githubId` | GitHub 식별자 | OAuth |
| `nickname` | 닉네임 | 첫 진입 시 설정 |
| `createdAt` | 가입 시각 | |

## Persona

사용자의 말투, 사고 흐름, 반복 관심사, 중요하게 여기는 기준.
기존 글 링크/원문을 분석해 생성. 회고 생성 시 "사용자다움"의 근거.

| 필드 | 설명 | 비고 |
| --- | --- | --- |
| `id` | 식별자 | |
| `userId` | 소유자 | |
| `tone` | 말투 특징 | `[확정 필요]` 구조(텍스트/구조화) |
| `thinkingStyle` | 사고 흐름 | |
| `recurringInterests` | 반복 관심사 | |
| `values` | 중요하게 여기는 기준 | |
| `sourceText` | 입력 원문/링크 | fallback: 짧은 자기소개 |

## DailyChatSession

하루 동안의 **원천 대화 로그**. 메모 + 실록이 역질문 + 사용자 답변이 쌓이는 곳.

| 필드 | 설명 | 비고 |
| --- | --- | --- |
| `id` | 식별자 | |
| `userId` | 소유자 | |
| `date` | 대상 날짜(KST) | 일자 경계 06:00 KST |
| `messages` | 메모/질문/답변 시퀀스 | `[확정 필요]` 메시지 모델 |
| `status` | 진행/마감 상태 | 메모만 있고 대화 안 한 경우 처리(기획안 5절) |

> ⚠️ 기획안 5절: "메모만 남기고 당일 대화 안 함"의 정책은 06:00 KST에 당일 메모 삭제(안)로 적혀 있으나 미확정. `[확정 필요]`.

## Diary

DailyChatSession을 **06:00 KST에 자동 정리**한 날짜별 기록. 조회의 기본 단위.

| 필드 | 설명 | 비고 |
| --- | --- | --- |
| `id` | 식별자 | |
| `userId` | 소유자 | |
| `date` | 날짜(KST) | 하루 1개 |
| `content` | 정리된 본문 | 자동 생성 |
| `createdAt` | 생성 시각 | ~06:00 KST |
| `editable` | 수정 가능 여부 | 수정/삭제는 P1 |

## Retrospective

기간을 선택해 Diary + Persona 기반으로 생성한 **완성형 회고 글**.

| 필드 | 설명 | 비고 |
| --- | --- | --- |
| `id` | 식별자 | |
| `userId` | 소유자 | |
| `periodStart` / `periodEnd` | 대상 기간 | |
| `direction` | 회고 방향 | 사용자가 선택 |
| `content` | 생성된 Markdown | 복사/다운로드 대상 |
| `createdAt` | 생성 시각 | |

## Pet (P1)

실록이 성장, EXP, streak 등 보조 리텐션 정보. MVP P1.

| 필드 | 설명 | 비고 |
| --- | --- | --- |
| `id` | 식별자 | |
| `userId` | 소유자 | |
| `exp` | 경험치 | |
| `level` | 레벨 | |
| `streak` | 연속 기록일 | |

---

## 관계 요약

```
User 1 ── 1 Persona
User 1 ── N DailyChatSession ── (06:00 KST 정리) ──> Diary
User 1 ── N Diary
User 1 ── N Retrospective   (기간 선택, Diary들 + Persona 참조)
User 1 ── 1 Pet (P1)
```
