// FSSplicer: 名馬ギャラリー 一覧・新規登録API
// GET /api/horses            -> q無し: { new: [...], ranking: [...] } / q有り: { search: [...] }
// POST /api/horses           -> { id: "<新規id>" }

import ngWords from "../../data/ng_words.json";
import ngWordsEn from "../../data/ng_words_en.json";

export function rowToHorse(row) {
  const cols = row.csv_data.split("\t");
  // csv_data は id を除いた COLUMN_ORDER 順の74列（script.js の COLUMN_ORDER 準拠）。
  // 6=horse_color, 11=turf_rating, 12=dirt_rating
  const horseColor = Number(cols[6]);
  const turfRating = Number(cols[11]);
  const dirtRating = Number(cols[12]);
  const nameEn = cols[1];
  return {
    id: row.id,
    name_jp: row.name_jp,
    name_en: nameEn || null,
    creator_name: row.creator_name,
    horse_color: horseColor,
    turf_rating: Number.isFinite(turfRating) ? turfRating : null,
    dirt_rating: Number.isFinite(dirtRating) ? dirtRating : null,
    like_count: row.like_count,
    created_at: row.created_at,
  };
}

export async function onRequestGet(context) {
  const { env, request } = context;
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q");
    const browse = url.searchParams.get("browse");

    if (browse) {
      const { results } = await env.DB.prepare(
        "SELECT id, name_jp, creator_name, csv_data, like_count, created_at FROM horses WHERE ng_flag IS NULL ORDER BY created_at DESC LIMIT 300"
      ).all();

      return new Response(JSON.stringify({ items: results.map(rowToHorse) }), {
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    if (q) {
      const like = `%${q}%`;
      const { results } = await env.DB.prepare(
        "SELECT id, name_jp, creator_name, csv_data, like_count, created_at FROM horses WHERE (name_jp LIKE ? COLLATE NOCASE OR creator_name LIKE ? COLLATE NOCASE) AND ng_flag IS NULL ORDER BY created_at DESC LIMIT 60"
      ).bind(like, like).all();

      return new Response(JSON.stringify({ search: results.map(rowToHorse) }), {
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    const [newRows, rankingRows] = await Promise.all([
      env.DB.prepare(
        "SELECT id, name_jp, creator_name, csv_data, like_count, created_at FROM horses WHERE ng_flag IS NULL ORDER BY created_at DESC LIMIT 4"
      ).all(),
      env.DB.prepare(
        "SELECT id, name_jp, creator_name, csv_data, like_count, created_at FROM horses WHERE ng_flag IS NULL ORDER BY like_count DESC, created_at DESC LIMIT 10"
      ).all(),
    ]);

    return new Response(
      JSON.stringify({
        new: newRows.results.map(rowToHorse),
        ranking: rankingRows.results.map(rowToHorse),
      }),
      { headers: { "content-type": "application/json; charset=utf-8" } }
    );
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

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// 英語リストは単語境界での完全一致（部分一致だと"Japan"が"jap"に、"Peacock"が"cock"に誤爆するため）
const ngWordsEnPatterns = ngWordsEn.map((w) => ({ word: w, re: new RegExp("\\b" + escapeRegex(w) + "\\b", "i") }));

function findNgWordMatch(name) {
  if (!name) return null;
  for (const word of ngWords) {
    if (name.includes(word)) return word;
  }
  for (const { word, re } of ngWordsEnPatterns) {
    if (re.test(name)) return word;
  }
  return null;
}

async function notifyDiscord(env, message) {
  const webhookUrl = env.FSSPLICER_DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: message }),
    });
  } catch (err) {
    // 通知失敗は登録処理を止めない
  }
}

function truncateCodePoints(str, max) {
  const chars = Array.from(str);
  if (chars.length <= max) return str;
  return chars.slice(0, max).join("") + "…";
}

async function postToBluesky(env, { id, nameJp, nameEn, creatorName }) {
  const handle = env.BLUESKY_HANDLE;
  const appPassword = env.BLUESKY_APP_PASSWORD;
  if (!handle || !appPassword) return;
  try {
    const sessionRes = await fetch("https://bsky.social/xrpc/com.atproto.server.createSession", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identifier: handle, password: appPassword }),
    });
    const session = await sessionRes.json();
    const accessJwt = session && session.accessJwt;
    const did = session && session.did;
    if (!accessJwt || !did) return;

    const name = truncateCodePoints(nameJp, 60);
    const en = (nameEn || "").trim();
    const nameLine = en && en !== nameJp ? `${name} / ${truncateCodePoints(en, 60)}` : name;
    const creator = truncateCodePoints(creatorName, 40);
    const url = `https://fssplicer.pages.dev/detail?id=${id}`;
    const tag = "#FSSuite";
    const text = `【FSSp新着】\n${nameLine}\n製作者: ${creator}\n${url}\n${tag}`;

    const encoder = new TextEncoder();
    const prefixBytes = encoder.encode(text.slice(0, text.lastIndexOf(url))).length;
    const urlBytes = encoder.encode(url).length;
    const byteStart = prefixBytes;
    const byteEnd = prefixBytes + urlBytes;
    const tagStart = encoder.encode(text.slice(0, text.lastIndexOf(tag))).length;
    const tagEnd = tagStart + encoder.encode(tag).length;

    await fetch("https://bsky.social/xrpc/com.atproto.repo.createRecord", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${accessJwt}`,
      },
      body: JSON.stringify({
        repo: did,
        collection: "app.bsky.feed.post",
        record: {
          $type: "app.bsky.feed.post",
          text,
          facets: [
            {
              index: { byteStart, byteEnd },
              features: [{ $type: "app.bsky.richtext.facet#link", uri: url }],
            },
            {
              index: { byteStart: tagStart, byteEnd: tagEnd },
              features: [{ $type: "app.bsky.richtext.facet#tag", tag: tag.slice(1) }],
            },
          ],
          createdAt: new Date().toISOString(),
        },
      }),
    });
  } catch (err) {
    // 投稿失敗は登録処理を止めない
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;
  try {
    const body = await request.json();
    const nameJp = typeof body.name_jp === "string" ? body.name_jp.trim() : "";
    const creatorName = typeof body.creator_name === "string" ? body.creator_name.trim() : "";
    const csvData = typeof body.csv_data === "string" ? body.csv_data : "";
    const parentId = typeof body.parent_id === "string" && body.parent_id ? body.parent_id : null;
    const deletePassword = typeof body.delete_password === "string" ? body.delete_password : "";

    if (!nameJp || !creatorName || !csvData || !deletePassword) {
      return new Response(JSON.stringify({ error: "必須項目が不足しています" }), {
        status: 400,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    if (!/^[A-Za-z0-9]{6}$/.test(deletePassword)) {
      return new Response(JSON.stringify({ error: "削除用パスワードは半角英数字6桁で入力してください" }), {
        status: 400,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    const nameEn = csvData.split("\t")[1] || "";
    const matchedWord = findNgWordMatch(nameJp) || findNgWordMatch(creatorName) || findNgWordMatch(nameEn);
    if (matchedWord) {
      await notifyDiscord(
        env,
        `[FSSp通報] NGワード抵触の可能性があります\n馬名(JP): ${nameJp}\n馬名(EN): ${nameEn}\n製作者名: ${creatorName}\n抵触ワード: ${matchedWord}`
      );
    }

    const id = crypto.randomUUID().slice(0, 8);
    const deletePasswordHash = await sha256Hex(deletePassword);
    const createdAt = Date.now();

    await env.DB.prepare(
      "INSERT INTO horses (id, name_jp, creator_name, csv_data, parent_id, delete_password_hash, like_count, created_at, ng_flag) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)"
    ).bind(id, nameJp, creatorName, csvData, parentId, deletePasswordHash, createdAt, matchedWord || null).run();

    if (!matchedWord) {
      let shouldPost = false;
      try {
        const countRow = await env.DB.prepare(
          "SELECT COUNT(*) AS c FROM horses WHERE created_at > ?"
        ).bind(Date.now() - 3600000).first();
        shouldPost = !!countRow && countRow.c <= 10;
      } catch (err) {
        shouldPost = false;
      }
      if (shouldPost) {
        context.waitUntil(postToBluesky(env, { id, nameJp, nameEn, creatorName }));
      }
    }

    return new Response(JSON.stringify({ id }), {
      status: 201,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err && err.message ? err.message : err) }), {
      status: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
}
