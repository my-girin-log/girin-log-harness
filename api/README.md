# api/

이 폴더의 `openapi.yaml`이 **계약(Contract)**, 곧 이 프로젝트의 단일 진실이다.

## 규칙

- 엔드포인트/스키마 변경은 여기 **먼저** 반영하고, 그 다음 BE 구현 / FE 호출을 맞춘다.
- 모든 변경은 PR. 머지되면 의존 레포는 타입 재생성 / submodule 업데이트.
- 작성 규칙은 `../conventions/api.md` 8절을 따른다.

## 유효성 검사

```bash
# Redocly CLI (검증 도구로 확정. harness hook도 동일하게 사용)
npx @redocly/cli lint openapi.yaml
```

## FE 타입 생성 (예시)

```bash
# openapi-typescript 예시
npx openapi-typescript openapi.yaml -o types/api.d.ts
```

구체 도구/명령은 `../harness/SETUP.md`에서 BE/FE 레포 기준으로 확정한다.
