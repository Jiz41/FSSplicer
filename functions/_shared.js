export const PLACEHOLDER_HTML = `<!doctype html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>FSSplicer</title>
<style>
  body { font-family: sans-serif; background: #111; color: #eee; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
</style>
</head>
<body>
<p>このツールは招待制です。</p>
</body>
</html>
`;

function parseCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    if (key === name) {
      return part.slice(idx + 1).trim();
    }
  }
  return null;
}

async function sendLog(env, request, nickname) {
  if (!env.GAS_LOG_URL) return;
  try {
    const url = new URL(request.url);
    await fetch(env.GAS_LOG_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nickname,
        path: url.pathname,
        country: request.cf?.country,
        region: request.cf?.region,
        timestamp: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('Z', '+09:00'),
      }),
    });
  } catch (e) {
    // fail-open: ログ送信の失敗はアクセス可否に影響させない
  }
}

export async function checkAndLog(request, env, ctx) {
  const cookieHeader = request.headers.get('Cookie');
  const code = parseCookie(cookieHeader, 'fssp_code');
  if (!code) return false;

  const record = await env.CODES.get(`code:${code}`, { type: 'json' });
  if (!record || record.active !== true) return false;

  if (request.headers.get('Sec-Fetch-Dest') === 'document') {
    ctx.waitUntil(sendLog(env, request, record.nickname));
  }
  return true;
}
