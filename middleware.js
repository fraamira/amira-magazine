// Vercel Edge Middleware
// Runs only for requests matching /articolo/:slug (see `config.matcher` below).
// Regular visitors (real browsers) are passed straight through to the normal
// single-page app, unchanged. Only known social-preview bots (WhatsApp,
// Facebook, Telegram, Twitter/X, LinkedIn, Slack, Discord...) get back a tiny
// static HTML page with the correct per-article title/description/image in
// its <meta property="og:..."> tags, because those bots never execute
// JavaScript and can't see content injected client-side.

export const config = {
  matcher: '/articolo/:slug*',
};

const BOT_UA = /facebookexternalhit|WhatsApp|Twitterbot|TelegramBot|LinkedInBot|Slackbot|Discordbot|Pinterest|redditbot|Googlebot|Applebot|SkypeUriPreview|vkShare|W3C_Validator/i;

const REPO_RAW_BASE = 'https://raw.githubusercontent.com/fraamira/amira-magazine/main/_articoli/';
const SITE_ORIGIN = 'https://amiravisionmagazine.com';
const DEFAULT_IMAGE = SITE_ORIGIN + '/immagini/amira-cover.jpg';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function readField(frontmatter, name) {
  const m = frontmatter.match(new RegExp('^' + name + ':\\s*(.+)$', 'm'));
  if (!m) return '';
  return m[1].trim().replace(/^["']|["']$/g, '');
}

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') || '';
  if (!BOT_UA.test(ua)) {
    // Not a known preview bot: let the normal SPA handle this request.
    return;
  }

  const url = new URL(request.url);
  const match = url.pathname.match(/^\/articolo\/([^/]+)\/?$/);
  if (!match) return;

  const slug = decodeURIComponent(match[1]);

  try {
    const res = await fetch(REPO_RAW_BASE + encodeURIComponent(slug) + '.md');
    if (!res.ok) return; // fall back to default SPA/meta if article not found

    const text = await res.text();
    const fmMatch = text.match(/^---\n([\s\S]*?)\n---/);
    const fm = fmMatch ? fmMatch[1] : '';

    const titoloBase = readField(fm, 'titolo') || 'AMIRA vision';
    const titoloEm = readField(fm, 'titolo_em');
    const titolo = (titoloBase + (titoloEm ? ' ' + titoloEm : '')) + ' — AMIRA vision';
    const estratto = readField(fm, 'estratto') || 'A story on AMIRA vision Magazine.';
    let copertina = readField(fm, 'copertina') || DEFAULT_IMAGE;
    if (copertina && !/^https?:\/\//.test(copertina)) {
      copertina = SITE_ORIGIN + (copertina.startsWith('/') ? '' : '/') + copertina;
    }

    const pageUrl = SITE_ORIGIN + '/articolo/' + encodeURIComponent(slug);

    const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(titolo)}</title>
<meta property="og:type" content="article" />
<meta property="og:title" content="${escapeHtml(titolo)}" />
<meta property="og:description" content="${escapeHtml(estratto)}" />
<meta property="og:image" content="${escapeHtml(copertina)}" />
<meta property="og:url" content="${escapeHtml(pageUrl)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(titolo)}" />
<meta name="twitter:description" content="${escapeHtml(estratto)}" />
<meta name="twitter:image" content="${escapeHtml(copertina)}" />
<meta http-equiv="refresh" content="0; url=${escapeHtml(pageUrl)}" />
</head>
<body></body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  } catch (e) {
    // Any failure (network, parsing...): don't break the site, just fall
    // through to the normal SPA response.
    return;
  }
}
