import { PLACEHOLDER_HTML, checkAndLog } from './_shared.js';

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  if (url.pathname.startsWith('/k/') || url.pathname === '/links.html' || url.pathname === '/links' || url.pathname === '/intro.html' || url.pathname === '/intro' || url.pathname === '/manifest.json' || url.pathname.startsWith('/images/') || url.pathname.startsWith('/data/')) {
    return next();
  }

  const ok = await checkAndLog(request, env, context);
  if (ok) {
    return next();
  }

  return new Response(PLACEHOLDER_HTML, {
    status: 403,
    headers: { 'Content-Type': 'text/html; charset=UTF-8' },
  });
}
