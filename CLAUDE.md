# CLAUDE.md — girin-codex

이 레포의 공통 AI 작업 지침은 `AGENTS.md`를 따른다.

Claude Code는 작업 전 아래 순서로 문서를 확인한다.

1. `AGENTS.md`
2. `requirements/product.md`
3. `requirements/scenarios.md`
4. `requirements/decisions.md`
5. `domain/data-model.md`
6. `api/openapi.yaml`
7. `conventions/glossary.md`
8. `conventions/api.md`

충돌 시 `api/openapi.yaml`이 API 계약의 최종 진실이다. 기능 요구사항은
`requirements/product.md`를 기준으로 보되, `[확정 필요]`는 임의로 채우지 않는다.
