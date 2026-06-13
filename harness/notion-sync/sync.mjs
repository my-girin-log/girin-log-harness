#!/usr/bin/env node
/**
 * openapi.yaml -> Notion "API 명세" DB 동기화 (결정적, AI 미사용)
 *
 * 동작
 *  - api/openapi.yaml의 모든 operation을 읽어 operationId(opId)를 키로 upsert.
 *  - 스펙이 소유하는 칼럼만 갱신: 메서드 / URL / 내용(제목) / opId.
 *  - 사람이 소유하는 칼럼(API 연결 / 백엔드 진행 / 비고)은 절대 안 건드림.
 *    (신규 endpoint 행을 만들 때만 기본값을 넣음)
 *  - 스펙에서 사라진 opId(=Notion에만 있는 행)는 지우지 않고 "고아"로 리포트만 한다.
 *
 * 사용
 *  node sync.mjs            # = --dry-run (실제로 안 바꾸고 계획만 출력) ← 기본 안전모드
 *  node sync.mjs --apply    # 실제 Notion에 반영
 *
 * 필요 env
 *  NOTION_TOKEN   Notion 내부 인테그레이션 토큰 (절대 커밋 금지, CI Secret으로 주입)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import SwaggerParser from "@apidevtools/swagger-parser";
import { Client } from "@notionhq/client";
import { buildBody } from "./render-body.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const APPLY = process.argv.includes("--apply");
const PRINT_BODY = (() => { const i = process.argv.indexOf("--print-body"); return i >= 0 ? process.argv[i + 1] : null; })();
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), "utf8"));
const P = cfg.properties;
const BODY = cfg.body || { generate: false, fillIfEmpty: true, overwriteExisting: false };
const HTTP_METHODS = ["get", "post", "patch", "put", "delete"];

function log(...a) { console.log(...a); }
function fail(msg) { console.error("❌", msg); process.exit(1); }

const token = process.env.NOTION_TOKEN;
if (APPLY && !token) fail("NOTION_TOKEN 환경변수가 없습니다. (CI Secret 또는 export NOTION_TOKEN=...)");
const notion = token ? new Client({ auth: token }) : null;

// ---- 1) openapi 읽어서 operation 목록 만들기 -------------------------------
const specPath = path.join(REPO_ROOT, cfg.openapiPath);
if (!fs.existsSync(specPath)) fail(`openapi 파일 없음: ${specPath}`);
const api = await SwaggerParser.dereference(specPath);

const ops = [];
for (const [p, item] of Object.entries(api.paths ?? {})) {
  for (const m of HTTP_METHODS) {
    const op = item[m];
    if (!op) continue;
    if (!op.operationId) { log(`⚠️  operationId 없음 → 건너뜀: ${m.toUpperCase()} ${p}`); continue; }
    const tag = op.tags?.[0];
    const dbId = cfg.databaseByTag[tag];
    if (!dbId || String(dbId).startsWith("REPLACE_")) {
      log(`⚠️  tag '${tag}' 의 DB id 미설정 → 건너뜀: ${op.operationId}`);
      continue;
    }
    ops.push({
      opId: op.operationId,
      method: m.toUpperCase(),
      path: p,
      title: (cfg.titleSource === "description" ? op.description : op.summary) || op.operationId,
      dbId,
      op,
      authRequired: !(Array.isArray(op.security) && op.security.length === 0),
    });
  }
}

// ---- 디버그: 특정 operationId의 본문 블록을 출력하고 종료 (Notion 미접근) -------
if (PRINT_BODY) {
  const o = ops.find((x) => x.opId === PRINT_BODY);
  if (!o) fail(`operationId '${PRINT_BODY}' 를 찾을 수 없습니다.`);
  log(`\n=== '${PRINT_BODY}' 본문 블록 미리보기 ===`);
  log(JSON.stringify(buildBody(o.op, { authRequired: o.authRequired }), null, 2));
  process.exit(0);
}
log(`\nopenapi에서 읽은 endpoint: ${ops.length}개  (mode: ${APPLY ? "APPLY ✍️" : "DRY-RUN 👀"})\n`);
if (!APPLY) {
  // dry-run: 토큰 없이도 무엇을 할지 미리보기
  if (!notion) {
    for (const o of ops) log(`PLAN  ${o.method.padEnd(6)} ${o.path}   (opId=${o.opId}, db=${short(o.dbId)})`);
    log(`\n👀 DRY-RUN(토큰 없음): 위 endpoint들을 opId로 찾아 upsert할 예정. NOTION_TOKEN을 넣으면 실제 매칭 결과까지 보여줍니다.`);
    summary(ops);
    process.exit(0);
  }
}

// ---- 2) Notion에서 opId로 찾아 upsert --------------------------------------
const seenByDb = new Map(); // dbId -> Set(opId) (고아 탐지용)
let created = 0, updated = 0, skipped = 0;

for (const o of ops) {
  if (!seenByDb.has(o.dbId)) seenByDb.set(o.dbId, new Set());
  seenByDb.get(o.dbId).add(o.opId);

  // 1차: opId로 매칭. 없으면 2차: 메서드+URL로 매칭(기존 행에 opId backfill).
  let found = notion ? await findByOpId(o.dbId, o.opId) : null;
  let matchedBy = "opId";
  if (!found && notion) {
    found = await findByMethodAndUrl(o.dbId, o.method, o.path);
    if (found) matchedBy = "method+url→opId backfill";
  }

  // 스펙 소유 칼럼만 구성
  const specProps = {
    [P.method]: { select: { name: o.method } },
    [P.url]:    { rich_text: [{ text: { content: o.path } }] },
    [P.opId]:   { rich_text: [{ text: { content: o.opId } }] },
  };
  const wantTitle = !found || cfg.overwriteTitleOnUpdate;
  if (wantTitle) specProps[P.title] = { title: [{ text: { content: o.title } }] };

  const bodyBlocks = BODY.generate ? buildBody(o.op, { authRequired: o.authRequired }) : null;

  if (found) {
    log(`UPDATE ${o.method.padEnd(6)} ${o.path}   (opId=${o.opId}, by ${matchedBy})`);
    if (APPLY) {
      await notion.pages.update({ page_id: found.id, properties: specProps });
      if (bodyBlocks) await maybeWriteBody(found.id, bodyBlocks, o);
    }
    updated++;
  } else {
    log(`CREATE ${o.method.padEnd(6)} ${o.path}   (opId=${o.opId})`);
    if (APPLY) {
      const page = await notion.pages.create({
        parent: { database_id: o.dbId },
        properties: {
          ...specProps,
          [P.title]: { title: [{ text: { content: o.title } }] },
          [P.apiStatus]:     { select: { name: cfg.defaults.apiStatus } },
          [P.backendStatus]: { select: { name: cfg.defaults.backendStatus } },
        },
        ...(bodyBlocks ? { children: bodyBlocks } : {}),
      });
      if (bodyBlocks) log(`        └ 본문 생성됨`);
    }
    created++;
  }
}

// ---- 3) 고아(스펙에서 사라진 Notion 행) 리포트 -------------------------------
const orphans = [];
if (notion) {
  for (const [dbId, specOpIds] of seenByDb) {
    for (const page of await listAllPages(dbId)) {
      const op = readOpId(page);
      if (op && !specOpIds.has(op)) orphans.push({ dbId, op, title: readTitle(page) });
    }
  }
}

log(`\n── 결과 ─────────────────────────`);
log(`created: ${created}  updated: ${updated}  skipped: ${skipped}`);
if (orphans.length) {
  log(`\n⚠️  스펙에서 사라진 Notion 행 ${orphans.length}개 (자동 삭제 안 함 — 사람이 확인):`);
  for (const x of orphans) log(`   - ${x.op}  "${x.title ?? ""}"  (db=${short(x.dbId)})`);
} else if (notion) {
  log(`고아 행 없음 ✅`);
}
if (!APPLY) log(`\n👀 DRY-RUN이었습니다. 실제 반영하려면 --apply 를 붙이세요.`);

// ---- helpers ---------------------------------------------------------------
async function findByOpId(dbId, opId) {
  const res = await notion.databases.query({
    database_id: dbId,
    filter: { property: P.opId, rich_text: { equals: opId } },
    page_size: 1,
  });
  return res.results[0] ?? null;
}
async function findByMethodAndUrl(dbId, method, url) {
  const res = await notion.databases.query({
    database_id: dbId,
    filter: { and: [
      { property: P.method, select: { equals: method } },
      { property: P.url, rich_text: { equals: url } },
    ] },
    page_size: 2,
  });
  return res.results[0] ?? null;
}
// 기존 페이지 본문 처리: 비어있으면 채우고, overwriteExisting면 비우고 새로 씀. 아니면 보존.
async function maybeWriteBody(pageId, blocks, o) {
  const existing = await notion.blocks.children.list({ block_id: pageId, page_size: 1 });
  const hasBody = existing.results.length > 0;
  if (hasBody && !BODY.overwriteExisting) {
    if (!BODY.fillIfEmpty) return;
    return; // 본문 있음 + 덮어쓰기 off → 사람 작성분 보존
  }
  if (hasBody && BODY.overwriteExisting) {
    const all = await listAllChildren(pageId);
    for (const b of all) { try { await notion.blocks.delete({ block_id: b.id }); } catch {} }
  }
  await notion.blocks.children.append({ block_id: pageId, children: blocks });
  log(`        └ 본문 ${hasBody ? "재생성" : "생성"}됨`);
}
async function listAllChildren(pageId) {
  const out = []; let cursor;
  do {
    const r = await notion.blocks.children.list({ block_id: pageId, start_cursor: cursor, page_size: 100 });
    out.push(...r.results); cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);
  return out;
}
async function listAllPages(dbId) {
  const out = [];
  let cursor;
  do {
    const res = await notion.databases.query({ database_id: dbId, start_cursor: cursor, page_size: 100 });
    out.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return out;
}
function readOpId(page) {
  const prop = page.properties?.[P.opId];
  return prop?.rich_text?.map((t) => t.plain_text).join("") || null;
}
function readTitle(page) {
  const prop = page.properties?.[P.title];
  return prop?.title?.map((t) => t.plain_text).join("") || null;
}
function short(id) { return String(id).slice(0, 8); }
function summary(list) {
  const byTag = {};
  for (const o of list) byTag[o.method] = (byTag[o.method] ?? 0) + 1;
  log("\n메서드별:", byTag);
}
