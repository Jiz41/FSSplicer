// FSSplicer: 管理者用 操作ログAPI
// GET /api/admin/log -> 直近300件の操作ログ
// 認証: X-Admin-Key ヘッダを env.FSSPLICER_ADMIN_KEY と厳密一致比較

function checkAdminAuth(context) {
  const { env, request } = context;
  const key = request.headers.get("X-Admin-Key");
  if (!env.FSSPLICER_ADMIN_KEY || !key || key !== env.FSSPLICER_ADMIN_KEY) {
    return false;
  }
  return true;
}

export async function onRequestGet(context) {
  const { env } = context;
  try {
    if (!checkAdminAuth(context)) {
      return new Response(JSON.stringify({ error: "認証に失敗しました" }), {
        status: 401,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    const { results } = await env.DB.prepare(
      "SELECT at, kind, horse_id, name_jp, creator_name FROM event_log ORDER BY at DESC LIMIT 300"
    ).all();

    return new Response(JSON.stringify({ items: results }), {
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err && err.message ? err.message : err) }), {
      status: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
}
