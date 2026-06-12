# notion-sync — openapi.yaml → Notion 자동 동기화

`api/openapi.yaml`(이 레포의 API 계약 SSOT)이 바뀌면 Notion **API 명세** 데이터베이스를
**코드로(결정적, AI 미사용)** 자동 갱신한다. operationId를 키로 upsert한다.

## 무엇이 동기화되나 (칼럼 소유권)

| 칼럼 | 소유자 | 스크립트 동작 |
| --- | --- | --- |
| 내용(제목), 메서드, URL, opId | **openapi.yaml** | 덮어씀 |
| API 연결, 백엔드 진행, 비고 | **사람(QA/개발자)** | **절대 안 건드림** (신규 행 생성 때 기본값만) |

- 스펙에서 사라진 endpoint는 **자동 삭제하지 않고** "고아"로 리포트만 한다.

## 처음 1회 셋업

1. **Notion 인테그레이션 생성**
   notion.so/profile/integrations → New integration(Internal) → **Internal Integration Secret** 복사 (`ntn_...`)
2. **API 명세 페이지 공유**
   해당 Notion 페이지(7개 DB가 들어있는 곳) → 우측 상단 ··· → **Connections → 만든 인테그레이션 추가**
3. **각 DB에 `opId` 칼럼 추가** (Text 타입, 숨김 처리 권장)
4. **DB id 채우기**
   각 DB를 "전체 페이지로 열기" → URL의 `notion.so/<여기32자>?v=...` 부분이 database id.
   `config.json`의 `databaseByTag`의 `REPLACE_...`를 그 id로 교체.
5. **토큰 등록 (커밋 금지!)**
   GitHub repo → Settings → Secrets and variables → Actions → **New secret** → 이름 `NOTION_TOKEN`

## 로컬 실행

```bash
cd harness/notion-sync
npm install

# 1) 미리보기 (실제로 안 바꿈) — 토큰 없이도 계획 출력 가능
npm run sync:dry

# 2) 토큰 넣고 실제 매칭까지 미리보기
NOTION_TOKEN=ntn_xxx npm run sync:dry

# 3) 실제 반영
NOTION_TOKEN=ntn_xxx npm run sync:apply
```

> ⚠️ 토큰은 **절대 파일/커밋에 넣지 말 것.** 항상 환경변수(`NOTION_TOKEN=...`) 또는 GitHub Secret으로만 주입한다.

## 자동 실행 (CI)

`.github/workflows/notion-sync.yml`:
- `api/openapi.yaml` 변경이 main에 머지되면 → 자동 `--apply`
- Actions 탭에서 수동 실행(workflow_dispatch) 시 `apply` 입력으로 dry-run/실반영 선택

## 설정 (config.json)

- `titleSource`: 제목을 openapi의 `summary`/`description` 중 무엇에서 가져올지
- `overwriteTitleOnUpdate`: 기존 행 제목도 덮어쓸지 (false면 신규 생성 때만)
- `properties`: Notion 칼럼명이 다르면 여기만 수정
- `databaseByTag`: openapi `tags[0]` → database id
