// FSSplicer: 管理者用 馬個別操作API
// POST   /api/admin/horses/:id -> 公開復帰（ng_flagをNULLに戻す）
// DELETE /api/admin/horses/:id -> 強制削除（delete_password不要）
// 認証: X-Admin-Key ヘッダを env.FSSPLICER_ADMIN_KEY と厳密一致比較

function checkAdminAuth(context) {
  const { env, request } = context;
  const key = request.headers.get("X-Admin-Key");
  if (!env.FSSPLICER_ADMIN_KEY || !key || key !== env.FSSPLICER_ADMIN_KEY) {
    return false;
  }
  return true;
}

export async function onRequestPost(context) {
  const { env, params } = context;
  try {
    if (!checkAdminAuth(context)) {
      return new Response(JSON.stringify({ error: "認証に失敗しました" }), {
        status: 401,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    const horseId = params.id;
    const existing = await env.DB.prepare("SELECT id FROM horses WHERE id = ?").bind(horseId).first();
    if (!existing) {
      return new Response(JSON.stringify({ error: "対象の馬が見つかりません" }), {
        status: 404,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    await env.DB.prepare("UPDATE horses SET ng_flag = NULL WHERE id = ?").bind(horseId).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err && err.message ? err.message : err) }), {
      status: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
}

export async function onRequestDelete(context) {
  const { env, params } = context;
  try {
    if (!checkAdminAuth(context)) {
      return new Response(JSON.stringify({ error: "認証に失敗しました" }), {
        status: 401,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    const horseId = params.id;
    const existing = await env.DB.prepare("SELECT id FROM horses WHERE id = ?").bind(horseId).first();
    if (!existing) {
      return new Response(JSON.stringify({ error: "対象の馬が見つかりません" }), {
        status: 404,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    await env.DB.prepare("DELETE FROM likes WHERE horse_id = ?").bind(horseId).run();
    await env.DB.prepare("DELETE FROM horses WHERE id = ?").bind(horseId).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err && err.message ? err.message : err) }), {
      status: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
}
