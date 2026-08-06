import { PLACEHOLDER_HTML } from '../_shared.js';

export async function onRequest(context) {
  const { env, params } = context;
  const code = params.code;

  const record = await env.CODES.get(`code:${code}`, { type: 'json' });

  if (record && record.active === true) {
    const cookieValue = encodeURIComponent(code);
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/',
        'Set-Cookie': `fssp_code=${cookieValue}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=31536000`,
      },
    });
  }

  return new Response(PLACEHOLDER_HTML, {
    status: 403,
    headers: { 'Content-Type': 'text/html; charset=UTF-8' },
  });
}
