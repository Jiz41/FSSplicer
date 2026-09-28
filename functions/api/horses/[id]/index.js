// FSSplicer: 名馬ギャラリー 詳細取得API・削除API
// GET /api/horses/:id -> { id, name_jp, creator_name, parent_id, like_count, created_at, ...74列 }
// DELETE /api/horses/:id -> { success: true }

// csv_data(74列、idを除いたCOLUMN_ORDER順）の列名。script.jsのCOLUMN_ORDERからidを除いたものと完全一致させること。
const CSV_COLUMNS = [
  "name_jp", "name_en", "gender", "birth_year", "birth_month", "birth_day",
  "horse_color", "physical", "owner", "main_jockey", "region",
  "turf_rating", "dirt_rating", "min_distance", "max_distance", "optimal_distance",
  "acceleration", "start_score", "cornering_score", "hill_score", "heavy_track_score",
  "fighting_spirit", "consistency", "health",
  "preferred_pace", "direction_aptitude", "running_style", "growth_curve",
  "peak_age", "retire_age",
  "head_mark", "right_front_leg_mark", "left_front_leg_mark", "right_hind_leg_mark", "left_hind_leg_mark",
  "bridle_type", "bridle_color_1", "bridle_color_2", "bridle_design", "bridle_design_color_1", "bridle_design_color_2",
  "bit_type", "bit_guard_type", "bit_guard_color",
  "mask_type", "mask_pattern", "mask_color_1", "mask_color_2",
  "ear_cover_type", "ear_cover_color_1", "ear_cover_color_2",
  "blinker_pacifier_type", "blinker_pacifier_color",
  "shadow_roll_type", "shadow_roll_color",
  "cheek_pieces_type", "cheek_pieces_color",
  "brow_band_type", "brow_band_color",
  "breast_girth_type", "neck_strap_type", "chest_color_1", "chest_color_2", "breast_girth_fur_color",
  "front_bandage_type", "front_bandage_color_1", "front_bandage_color_2",
  "hind_bandage_type", "hind_bandage_color_1", "hind_bandage_color_2",
  "front_mane_type", "back_mane_type", "mane_color_1", "mane_color_2"
];

// 数値であるべき列（それ以外は文字列のまま返す）
const NUMERIC_CSV_COLUMNS = new Set([
  "birth_year", "birth_month", "birth_day", "horse_color", "physical",
  "turf_rating", "dirt_rating", "min_distance", "max_distance", "optimal_distance",
  "acceleration", "start_score", "cornering_score", "hill_score", "heavy_track_score",
  "fighting_spirit", "consistency", "health",
  "preferred_pace", "direction_aptitude", "peak_age", "retire_age"
]);

export async function onRequestGet(context) {
  const { env, params } = context;
  try {
    const row = await env.DB.prepare(
      "SELECT id, name_jp, creator_name, csv_data, parent_id, like_count, created_at FROM horses WHERE id = ?"
    ).bind(params.id).first();

    if (!row) {
      return new Response(JSON.stringify({ error: "対象の馬が見つかりません" }), {
        status: 404,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    const cols = row.csv_data.split("\t");
    const horse = {
      id: row.id,
      name_jp: row.name_jp,
      creator_name: row.creator_name,
      parent_id: row.parent_id,
      like_count: row.like_count,
      created_at: row.created_at,
    };

    CSV_COLUMNS.forEach((colName, i) => {
      const raw = cols[i];
      if (NUMERIC_CSV_COLUMNS.has(colName)) {
        const n = Number(raw);
        horse[colName] = Number.isNaN(n) ? null : n;
      } else {
        horse[colName] = raw !== undefined ? raw : "";
      }
    });

    const [parentRow, childrenResult] = await Promise.all([
      row.parent_id
        ? env.DB.prepare("SELECT id, name_jp, creator_name FROM horses WHERE id = ?").bind(row.parent_id).first()
        : Promise.resolve(null),
      env.DB.prepare("SELECT id, name_jp, creator_name FROM horses WHERE parent_id = ? ORDER BY created_at ASC").bind(params.id).all(),
    ]);

    horse.parent = parentRow || null;
    horse.children = (childrenResult && childrenResult.results) || [];

    return new Response(JSON.stringify(horse), {
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err && err.message ? err.message : err) }), {
      status: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
}

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
