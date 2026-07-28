// Vercel Routing Middleware
// Runs only for requests matching /articolo/:slug (see `config.matcher` below).
//
// IMPORTANT: on a plain static project (no framework like Next.js), returning
// `undefined` from middleware does NOT reliably fall through to the normal
// static/rewrite handling — it can produce a 404. So every branch below
// returns an explicit Response:
//   - Known social-preview bots (WhatsApp, Facebook, Telegram, Twitter/X,
//     LinkedIn, Slack, Discord...) get a tiny static HTML page with the
//     correct per-article title/description/image in its
//     <meta property="og:..."> tags, fetched directly from the article's
//     markdown file on GitHub (bots never run JavaScript, so they can't see
//     content injected client-side).
//   - Everyone else gets the real single-page app (index.html) served
//     directly, exactly as if this middleware didn't exist. The app's own
//     client-side router then reads location.pathname and opens the right
//     article.

export const config = {
  matcher: '/articolo/:slug*',
};

const BOT_UA = /facebookexternalhit|WhatsApp|Twitterbot|TelegramBot|LinkedInBot|Slackbot|Discordbot|Pinterest|redditbot|Googlebot|Applebot|SkypeUriPreview|vkShare|W3C_Validator/i;

const REPO_RAW_BASE = 'https://raw.githubusercontent.com/fraamira/amira-magazine/main/_articoli/';
const SITE_ORIGIN = 'https://www.amiravisionmagazine.com';
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

async function serveApp(request) {
  // Serve the real SPA for this request, regardless of the /articolo/:slug
  // path — same as a normal visit to "/". The client-side router in
  // index.html reads location.pathname to open the correct article.
  const appUrl = new URL('/index.html', request.url);
  return fetch(appUrl, { headers: { 'user-agent': request.headers.get('user-agent') || '' } });
}

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') || '';
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/articolo\/([^/]+)\/?$/);

  if (!match || !BOT_UA.test(ua)) {
    // Real visitor (or an unmatched path, just in case): serve the app.
    return serveApp(request);
  }

  const slug = decodeURIComponent(match[1]);

  try {
    const res = await fetch(REPO_RAW_BASE + encodeURIComponent(slug) + '.md');
    if (!res.ok) return serveApp(request);

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
    return serveApp(request);
  }
}
