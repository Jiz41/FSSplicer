// FSSplicer: 名馬ギャラリー 削除API
// DELETE /api/horses/:id -> { success: true }

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function onRequestDelete(context) {
  const { env, params, request } = context;
  try {
    const horseId = params.id;
    const body = await request.json();
    const deletePassword = typeof body.delete_password === "string" ? body.delete_password : "";

    const row = await env.DB.prepare("SELECT delete_password_hash FROM horses WHERE id = ?").bind(horseId).first();

    if (!row) {
      return new Response(JSON.stringify({ error: "対象の馬が見つかりません" }), {
        status: 404,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    const inputHash = await sha256Hex(deletePassword);
    if (inputHash !== row.delete_password_hash) {
      return new Response(JSON.stringify({ error: "パスワードが一致しません" }), {
        status: 403,
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
