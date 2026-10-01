// FSSplicer: 管理者用 馬一覧API
// GET /api/admin/horses            -> 全馬一覧
// GET /api/admin/horses?flagged=1  -> 非公開（NGワード検知）馬一覧
// 認証: X-Admin-Key ヘッダを env.FSSPLICER_ADMIN_KEY と厳密一致比較

import { rowToHorse } from "../horses.js";

function checkAdminAuth(context) {
  const { env, request } = context;
  const key = request.headers.get("X-Admin-Key");
  if (!env.FSSPLICER_ADMIN_KEY || !key || key !== env.FSSPLICER_ADMIN_KEY) {
    return false;
  }
  return true;
}

export async function onRequestGet(context) {
  const { env, request } = context;
  try {
    if (!checkAdminAuth(context)) {
      return new Response(JSON.stringify({ error: "認証に失敗しました" }), {
        status: 401,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    const url = new URL(request.url);
    const flagged = url.searchParams.get("flagged");

    const sql = flagged
      ? "SELECT id, name_jp, creator_name, csv_data, ng_flag, like_count, created_at FROM horses WHERE ng_flag IS NOT NULL ORDER BY created_at DESC LIMIT 300"
      : "SELECT id, name_jp, creator_name, csv_data, ng_flag, like_count, created_at FROM horses ORDER BY created_at DESC LIMIT 300";

    const { results } = await env.DB.prepare(sql).all();

    const items = results.map((row) => ({
      ...rowToHorse(row),
      ng_flag: row.ng_flag || null,
    }));

    return new Response(JSON.stringify({ items }), {
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err && err.message ? err.message : err) }), {
      status: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
}
