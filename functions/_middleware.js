// FSSplicer: detail.html の OGP(title/description)をリクエスト時にエッジで動的書き換え
// SNSクローラーはJSを実行しないため、detail.js側でのdocument.title書き換えは
// og:title/og:description/twitterタグには効かない。ここでHTML本文を直接差し替える。

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (url.pathname !== "/detail.html" && url.pathname !== "/detail") {
    return context.next();
  }

  const id = url.searchParams.get("id");
  if (!id) {
    return context.next();
  }

  try {
    const row = await env.DB
      .prepare("SELECT name_jp, creator_name FROM horses WHERE id = ?")
      .bind(id)
      .first();

    if (!row) {
      return context.next();
    }

    let assetResponse;
    if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
      assetResponse = await env.ASSETS.fetch(request);
    } else {
      assetResponse = await fetch(new URL("/detail.html", url.origin));
    }

    if (!assetResponse || !assetResponse.ok) {
      return context.next();
    }

    let html = await assetResponse.text();

    const horseName = escapeHtml(row.name_jp);
    const creatorName = escapeHtml(row.creator_name);

    html = html.replace(
      "<title>馬詳細 | FSSplicer</title>",
      `<title>${horseName} | FSSplicer</title>`
    );
    html = html.replace(
      '<meta property="og:title" content="馬詳細 | FSSplicer">',
      `<meta property="og:title" content="${horseName} | FSSplicer">`
    );
    html = html.replace(
      '<meta name="twitter:title" content="馬詳細 | FSSplicer">',
      `<meta name="twitter:title" content="${horseName} | FSSplicer">`
    );
    html = html.replace(
      '<meta property="og:description" content="みんなが作った馬データの詳細を見られます">',
      `<meta property="og:description" content="${creatorName}さんが作った「${horseName}」の詳細ページです">`
    );
    html = html.replace(
      '<meta name="twitter:description" content="みんなが作った馬データの詳細を見られます">',
      `<meta name="twitter:description" content="${creatorName}さんが作った「${horseName}」の詳細ページです">`
    );

    return new Response(html, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    return context.next();
  }
}
