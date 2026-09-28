// FSSplicer: 名馬ギャラリー いいねAPI
// POST /api/horses/:id/like -> { like_count, already_liked }

export async function onRequestPost(context) {
  const { env, params, request } = context;
  try {
    const horseId = params.id;
    const body = await request.json();
    const likerToken = typeof body.liker_token === "string" ? body.liker_token.trim() : "";

    if (!likerToken) {
      return new Response(JSON.stringify({ error: "liker_tokenが必要です" }), {
        status: 400,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    const insertResult = await env.DB.prepare(
      "INSERT OR IGNORE INTO likes (horse_id, liker_token, created_at) VALUES (?, ?, ?)"
    ).bind(horseId, likerToken, Date.now()).run();

    const alreadyLiked = insertResult.meta.changes === 0;

    if (!alreadyLiked) {
      await env.DB.prepare("UPDATE horses SET like_count = like_count + 1 WHERE id = ?").bind(horseId).run();
    }

    const row = await env.DB.prepare("SELECT like_count FROM horses WHERE id = ?").bind(horseId).first();

    return new Response(
      JSON.stringify({ like_count: row ? row.like_count : null, already_liked: alreadyLiked }),
      { headers: { "content-type": "application/json; charset=utf-8" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err && err.message ? err.message : err) }), {
      status: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
}
