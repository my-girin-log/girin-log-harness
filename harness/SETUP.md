# 하네스 설치 가이드

이 폴더는 **강제 장치(hook)** 의 원본이다. CLAUDE.md/conventions는 "지향"이고,
여기 hook들은 "매번 실행되는 강제"다. BE/FE 레포가 이걸 가져다 쓴다.

> 왜 hook인가: 규칙을 프롬프트(CLAUDE.md)에만 두면 에이전트가 "안 따를" 수 있다.
> hook으로 인코딩하면 제안이 **매번 실행되는 코드**가 된다. 종료 코드로 통과/차단을 결정한다.
> ⚠️ hook은 현재 환경의 자격증명으로 자동 실행되므로, 설치 전 스크립트를 반드시 리뷰한다.

## 모델

```
girin-log-harness (이 레포, SSOT)
   ├─ api/openapi.yaml      ← 계약
   ├─ conventions/          ← 규칙 문서
   └─ harness/              ← hook 원본  ┐
                                         │ 복사 또는 submodule
   backend 레포  ── .claude/settings.json ┤
   frontend 레포 ── .claude/settings.json ┘
```

권장: 이 레포를 BE/FE에 **git submodule**로 넣어(`vendor/harness` 등) 항상 최신 계약/hook을 참조.
간단히 가려면 `harness/` 내용을 각 레포의 `.claude/`로 복사해도 된다(대신 동기화는 수동).

## BE/FE 공통 설치

1. 각 레포 루트에 `.claude/settings.json`을 둔다 — `settings.template.json`을 복사 후 경로만 수정.
2. `harness/hooks/`의 스크립트를 각 레포에서 실행 가능하게 둔다(복사 or submodule 경로 참조).
3. 커밋한다. 팀원 전원의 에이전트가 동일 hook을 공유한다.

## 어떤 hook을 거는가 (각 레포별로 조정)

| 이벤트 | 매처 | 동작 | 효과 |
| --- | --- | --- | --- |
| PostToolUse | `Edit\|Write` | `format-and-lint.sh` | 편집한 파일 자동 포맷·린트 |
| PostToolUse | (해당 시) | `check-spec-drift.sh` | 최소 구현은 openapi.yaml 유효성 검사. BE/FE 레포에서 응답/타입 드리프트 검사로 확장 |
| Stop | — | 테스트/빌드 | 그린 아닐 때 "완료" 차단 |
| PreToolUse | `Bash` | (선택) 보호 브랜치 Bash 차단 | 최소 구현은 보호 브랜치에서 Bash 전체를 막는다. 필요하면 git commit/push만 차단하도록 확장 |

- 종료 코드 0 = 통과, 2 = 차단(PreToolUse는 재고 유도, PostToolUse는 에이전트에 에러 전달).
- 이 레포(girin-log-harness) 자체는 `../.claude/settings.json`에서 openapi 유효성만 가볍게 건다.

## 검증

설치 후 BE/FE에서 파일을 하나 수정해 보고, 포맷 hook이 실제로 도는지 로그로 확인한다.
