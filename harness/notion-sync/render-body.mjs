/**
 * openapi operation → Notion 페이지 본문 블록 생성.
 * 1.요청(Header/Query/Request Body) · 2.응답(필드표+JSON 예시) · 3.예외 상황.
 * swagger-parser로 dereference된(=$ref 인라인된) operation을 받는다.
 */

const text = (rt) => ({ rich_text: [{ type: "text", text: { content: String(rt) } }] });
const h2 = (t) => ({ object: "block", type: "heading_2", heading_2: text(t) });
const h3 = (t) => ({ object: "block", type: "heading_3", heading_3: text(t) });
const para = (t) => ({ object: "block", type: "paragraph", paragraph: text(t) });
const bullet = (t) => ({ object: "block", type: "bulleted_list_item", bulleted_list_item: text(t) });
const code = (s, language = "json") => ({
  object: "block", type: "code",
  code: { language, rich_text: [{ type: "text", text: { content: s } }] },
});
function table(headers, rows) {
  const cell = (s) => [{ type: "text", text: { content: s === undefined || s === null ? "" : String(s) } }];
  const trow = (cells) => ({ object: "block", type: "table_row", table_row: { cells: cells.map(cell) } });
  return {
    object: "block", type: "table",
    table: {
      table_width: headers.length, has_column_header: true, has_row_header: false,
      children: [trow(headers), ...rows.map(trow)],
    },
  };
}

function typeLabel(schema) {
  if (!schema) return "";
  let t = schema.type;
  if (Array.isArray(t)) t = t.filter((x) => x !== "null")[0] || "string";
  if (t === "integer" || t === "number") return "Number";
  if (t === "string") return "String";
  if (t === "boolean") return "Boolean";
  if (t === "array") return "Array";
  if (t === "object") return "Object";
  return t ? String(t) : "";
}

// 스키마를 표 행으로 평탄화 (배열/객체는 [].필드 표기, 최대 2단계)
function flattenSchema(schema, prefix = "", depth = 0, rows = []) {
  if (!schema || depth > 2) return rows;
  if (schema.type === "object" || schema.properties) {
    for (const [name, sub] of Object.entries(schema.properties || {})) {
      const key = prefix ? `${prefix}.${name}` : name;
      rows.push([key, typeLabel(sub), sub.description || ""]);
      if (sub.type === "array" && sub.items) flattenSchema(sub.items, `${key}[]`, depth + 1, rows);
      else if (sub.type === "object" && sub.properties) flattenSchema(sub, key, depth + 1, rows);
    }
  } else if (schema.type === "array" && schema.items) {
    rows.push([`${prefix || "items"}`, "Array", schema.description || ""]);
    flattenSchema(schema.items, `${prefix || "items"}[]`, depth + 1, rows);
  }
  return rows;
}

// 스키마로 JSON 예시 합성 (example 우선)
function jsonExample(schema) {
  if (!schema) return null;
  if (schema.example !== undefined) return schema.example;
  let t = schema.type;
  if (Array.isArray(t)) t = t.filter((x) => x !== "null")[0] || "string";
  if (t === "object" || schema.properties) {
    const o = {};
    for (const [k, v] of Object.entries(schema.properties || {})) o[k] = jsonExample(v);
    return o;
  }
  if (t === "array") return [jsonExample(schema.items)];
  if (t === "string") {
    if (schema.format === "date") return "2026-06-06";
    if (schema.format === "date-time") return "2026-06-06T15:00:00+09:00";
    if (schema.enum) return schema.enum[0];
    return "string";
  }
  if (t === "integer" || t === "number") return 0;
  if (t === "boolean") return true;
  if (Array.isArray(schema.type) && schema.type.includes("null")) return null;
  return null;
}

function jsonContent(op, code) {
  return op.responses?.[code]?.content?.["application/json"]?.schema;
}

const ERR_LABEL = {
  "400": "잘못된 요청", "401": "인증 필요", "403": "권한 없음", "404": "리소스 없음",
  "409": "충돌", "422": "검증 실패", "429": "요청이 너무 잦음",
  "500": "서버 오류", "502": "LLM 등 외부 호출 실패", "503": "일시적 사용 불가", "504": "응답 지연",
};
const errLabel = (op, c) => {
  const d = op.responses?.[c]?.description;
  if (d && d !== "에러" && d !== "Error") return d;
  return ERR_LABEL[c] || "오류";
};

export function buildBody(op, { authRequired }) {
  const blocks = [];

  // 1. 요청
  blocks.push(h2("1. 요청"));
  blocks.push(h3("Header"));
  if (authRequired) {
    blocks.push(table(["Name", "Type", "Description"], [
      ["Authorization", "String", "Bearer 인증 토큰. 토큰 방식 사용 시 필요"],
      ["Cookie", "String", "세션 쿠키. 세션 방식 사용 시 필요"],
    ]));
  } else {
    blocks.push(para("별도 인증 헤더 없음"));
  }

  blocks.push(h3("Query Parameter"));
  const qps = (op.parameters || []).filter((p) => p.in === "query");
  if (qps.length) {
    blocks.push(table(["Name", "Type", "Description"],
      qps.map((p) => [p.name, typeLabel(p.schema), (p.description || "") + (p.required ? "" : " (선택값)")])));
  } else {
    blocks.push(para("별도 Query Parameter 없음"));
  }

  const reqSchema = op.requestBody?.content?.["application/json"]?.schema;
  if (reqSchema) {
    blocks.push(h3("Request Body"));
    blocks.push(table(["Name", "Type", "Description"], flattenSchema(reqSchema)));
    blocks.push(code(JSON.stringify(jsonExample(reqSchema), null, 2)));
  }

  // 2. 응답
  blocks.push(h2("2. 응답"));
  const okCode = Object.keys(op.responses || {}).find((c) => /^[23]\d\d$/.test(c));
  const okSchema = okCode ? jsonContent(op, okCode) : null;
  blocks.push(para(`status: ${okCode || "200"} ${op.responses?.[okCode]?.description || "OK"}`));
  if (okSchema) {
    blocks.push(table(["Name", "Type", "Description"], flattenSchema(okSchema)));
    blocks.push(code(JSON.stringify(jsonExample(okSchema), null, 2)));
  } else {
    blocks.push(para("응답 Body 없음"));
    blocks.push(code("{}"));
  }

  // 3. 예외 상황
  const errCodes = Object.keys(op.responses || {}).filter((c) => /^[45]\d\d$/.test(c));
  if (errCodes.length) {
    blocks.push(h2("3. 예외 상황"));
    blocks.push(code(JSON.stringify({ code: "ERROR_CODE", message: "에러 메시지" }, null, 2)));
    blocks.push(para("발생 가능한 상태 코드:"));
    for (const c of errCodes) {
      blocks.push(bullet(`${c} — ${errLabel(op, c)}`));
    }
  }

  return blocks;
}
