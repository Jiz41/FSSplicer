// FSSplicer: 名馬ギャラリー一覧API
// GET /api/horses -> { horses: [...] }

export async function onRequestGet(context) {
  const { env } = context;
  try {
    const { results } = await env.DB.prepare(
      "SELECT id, name_jp, creator_name, csv_data, created_at FROM horses ORDER BY created_at DESC LIMIT 60"
    ).all();

    const horses = results.map((row) => {
      const cols = row.csv_data.split("\t");
      // csv_data は id を除いた COLUMN_ORDER 順の74列（script.js の COLUMN_ORDER 準拠）。
      // 6=horse_color, 11=turf_rating, 12=dirt_rating
      const horseColor = Number(cols[6]);
      const turfRating = Number(cols[11]);
      const dirtRating = Number(cols[12]);
      return {
        id: row.id,
        name_jp: row.name_jp,
        creator_name: row.creator_name,
        horse_color: horseColor,
        turf_rating: Number.isFinite(turfRating) ? turfRating : null,
        dirt_rating: Number.isFinite(dirtRating) ? dirtRating : null,
      };
    });

    return new Response(JSON.stringify({ horses }), {
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err && err.message ? err.message : err) }), {
      status: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
}
