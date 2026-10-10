// Server pro nasazení (Railway): servíruje sestavenou hru z dist/ a pustí
// dovnitř jen toho, kdo zná přístupový kód. Zařízení si přihlášení pamatuje
// (podepsaná cookie), takže dítě kód nezadává. Bez závislostí, jen Node.
//
// Proměnné prostředí:
//   ACCESS_CODE     rodinný přístupový kód (povinný – bez něj server nenastartuje)
//   GUEST_CODES     další kódy oddělené čárkou (nepovinné), např. pro kamarády
//                   nebo pro příspěvek. Každý kód má vlastní cookie: kód, který
//                   ze seznamu odeberete, odhlásí jen zařízení přihlášená jím.
//   SESSION_SECRET  tajemství pro podpis cookie (doporučené). Změna tajemství
//                   odhlásí všechna zařízení.
//   PORT            port (Railway nastavuje sám)
//   AZURE_SPEECH_KEY     klíč služby Azure Speech (nepovinný). Zapne mluvení
//                        na Školním ostrově: nahrávka se přepíše na text
//                        a hra pozná, jestli dítěti rozuměla.
//   AZURE_SPEECH_REGION  oblast služby, např. westeurope (k AZURE_SPEECH_KEY)
//   AZURE_SPEECH_ENDPOINT  místo oblasti celá adresa prostředku, např.
//                        https://nazev.cognitiveservices.azure.com (nepovinné)
//
// Data hry se na server nikdy neposílají – zůstávají v prohlížeči. Jedinou
// výjimkou je zapnuté mluvení: krátká nahrávka hlasu projde serverem do
// Azure k přepisu na text a nikde se neukládá.

import { createHmac, timingSafeEqual } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, gzipSync } from 'node:zlib';

const COOKIE = 'draci_ostrovy';
const MAX_AGE = 400 * 24 * 60 * 60; // prohlížeče delší platnost cookie nedovolí
const LOGIN = '/prihlaseni';
const LOGOUT = '/odhlasit';
const HEALTH = '/zdravi';
const MAX_FAILS = 10; // chybných pokusů z jedné adresy…
const FAIL_WINDOW = 15 * 60 * 1000; // …za 15 minut
const SPEECH = '/api/mluveni';
const MAX_AUDIO = 1024 * 1024; // 16 kHz mono WAV ≈ 32 kB za sekundu, tedy ~30 s
const SPEECH_LIMIT = 300; // nahrávek za hodinu (pojistka pro bezplatný tarif Azure)
const SPEECH_WINDOW = 60 * 60 * 1000;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};
const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.svg', '.json', '.webmanifest', '.txt']);
// Ikony a manifest prohlížeč stahuje bez cookie (přidání na plochu), a tak
// jsou dostupné i bez přihlášení. Prozrazují jen název a ikonu hry.
const PUBLIC_FILES = new Set(['/manifest.webmanifest', '/icon.svg', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png']);

const BASE_HEADERS = {
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Strict-Transport-Security': 'max-age=31536000',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; " +
    "font-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
};

/** Normalizace kódu: nezáleží na velikosti písmen ani mezerách. */
const normalize = (s) => String(s).normalize('NFKC').replace(/\s+/g, '').toLowerCase();

/** Načte všechny soubory sestavené hry do paměti (i předkomprimované). */
function loadFiles(root) {
  const files = new Map();
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      const ext = extname(name).toLowerCase();
      const body = readFileSync(full);
      const path = '/' + relative(root, full).split(sep).join('/');
      const compress = COMPRESSIBLE.has(ext) && body.length > 1024;
      files.set(path, {
        type: TYPES[ext] ?? 'application/octet-stream',
        body,
        br: compress ? brotliCompressSync(body) : null,
        gzip: compress ? gzipSync(body, { level: 9 }) : null,
        cache: path.startsWith('/assets/')
          ? 'private, max-age=31536000, immutable' // názvy obsahují otisk obsahu
          : path === '/index.html'
            ? 'no-cache'
            : 'private, max-age=86400',
      });
    }
  };
  walk(root);
  return files;
}

function loginPage(message = '') {
  return `<!doctype html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>Dračí ostrovy</title>
<link rel="icon" type="image/svg+xml" href="/icon.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#1d4e73">
<style>
  :root { --sky-top: #9fd3ee; --sky-bottom: #e4f3fb; --ink: #1d2d44; --muted: #52607a;
    --card: #fdf5e6; --edge: #e8d5ae; --fire: #f4a13a; --fire-dark: #c26f12; --error: #b23a1d; }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px 16px;
    font: 18px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: var(--ink);
    background: linear-gradient(180deg, var(--sky-top), var(--sky-bottom)); }
  main { width: 100%; max-width: 380px; background: var(--card); border: 3px solid var(--edge);
    border-radius: 24px; padding: 28px 24px; box-shadow: 0 10px 0 rgba(29, 45, 68, 0.12); text-align: center; }
  .egg { width: 72px; height: 88px; margin: 0 auto 12px; border-radius: 50% 50% 46% 46% / 60% 60% 40% 40%;
    background: radial-gradient(circle at 35% 30%, #fff8e6 0 18%, transparent 19%),
      radial-gradient(circle at 62% 58%, #7cc4e4 0 12%, transparent 13%),
      radial-gradient(circle at 34% 70%, #7cc4e4 0 9%, transparent 10%), #f6e3b4;
    border: 3px solid #c9a15b; }
  h1 { margin: 0 0 4px; font-size: 1.6rem; }
  p { margin: 0 0 18px; color: var(--muted); }
  form { display: grid; gap: 12px; }
  label { font-weight: 600; text-align: left; }
  input { font: inherit; padding: 12px 14px; border-radius: 14px; border: 3px solid var(--edge);
    background: #fff; color: var(--ink); width: 100%; }
  input:focus-visible { outline: 3px solid var(--fire); outline-offset: 2px; }
  button { font: inherit; font-weight: 700; padding: 12px; border: 0; border-radius: 16px; cursor: pointer;
    color: #fff; background: var(--fire); box-shadow: 0 5px 0 var(--fire-dark); }
  button:focus-visible { outline: 3px solid var(--ink); outline-offset: 3px; }
  .error { margin: 0 0 14px; color: var(--error); font-weight: 600; }
  .note { margin: 18px 0 0; font-size: 0.85rem; }
</style>
</head>
<body>
<main>
  <div class="egg" aria-hidden="true"></div>
  <h1>Dračí ostrovy</h1>
  <p>Vzdělávací hra pro děti 6–9 let. Dítě si vylíhne draka a spolu se učí počítat, číst, poznávat svět, zacházet s penězi i přemýšlet jako vynálezce.</p>
  <p>Zadejte kód, který jste dostali. Zařízení si ho zapamatuje.</p>
  ${message ? `<p class="error" role="alert">${message}</p>` : ''}
  <form method="post" action="${LOGIN}">
    <label for="kod">Přístupový kód</label>
    <input id="kod" name="kod" type="password" autocomplete="current-password" autocapitalize="none"
      spellcheck="false" required autofocus>
    <button type="submit">Vstoupit</button>
  </form>
  <p class="note">Hra nic neodesílá: postup dítěte zůstává jen v tomto zařízení.</p>
</main>
</body>
</html>`;
}

/** Kódy z proměnné prostředí: oddělené čárkou, prázdné vynechá. */
export const parseCodes = (value) =>
  String(value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

/** Adresa převodu řeči na text (REST pro krátké nahrávky), nebo null. */
export function speechUrl({ region, endpoint } = {}) {
  const path = 'speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed';
  if (endpoint) {
    const url = new URL(endpoint);
    if (url.protocol !== 'https:') throw new Error('AZURE_SPEECH_ENDPOINT musí začínat https://');
    return `${url.origin}/stt/${path}`;
  }
  if (region) {
    if (!/^[a-z0-9]+$/.test(region)) throw new Error(`Neplatná oblast AZURE_SPEECH_REGION: ${region}`);
    return `https://${region}.stt.speech.microsoft.com/${path}`;
  }
  return null;
}

/** Referenční text pro hodnocení výslovnosti: krátká anglická věta, jinak nic. */
const cleanRef = (value) => {
  const ref = String(value ?? '').trim();
  return ref.length <= 200 && /^[A-Za-z0-9 .,!?'’-]+$/.test(ref) ? ref.replace(/’/g, "'") : '';
};

const score = (value) => (typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : null);

/** Zjednoduší odpověď Azure na to, co hra potřebuje. */
export function speechResult(body) {
  const status = body?.RecognitionStatus;
  const best = Array.isArray(body?.NBest) ? body.NBest[0] : undefined;
  if (status !== 'Success' || !best) {
    const silent = status === 'NoMatch' || status === 'InitialSilenceTimeout' || status === 'BabbleTimeout' || status === 'Success';
    return { status: silent ? 'nomatch' : 'error', text: '', lexical: '', scores: null, words: [] };
  }
  // Výsledky hodnocení výslovnosti bývají přímo v položce, nebo v PronunciationAssessment.
  const pa = (o) => o?.PronunciationAssessment ?? o ?? {};
  const scores = pa(best);
  return {
    status: 'ok',
    text: String(best.Display ?? body.DisplayText ?? ''),
    lexical: String(best.Lexical ?? ''),
    scores: scores.AccuracyScore === undefined
      ? null
      : { accuracy: score(scores.AccuracyScore), fluency: score(scores.FluencyScore), completeness: score(scores.CompletenessScore), pron: score(scores.PronScore) },
    words: (Array.isArray(best.Words) ? best.Words : []).map((w) => ({
      word: String(w.Word ?? ''),
      accuracy: score(pa(w).AccuracyScore),
      error: String(pa(w).ErrorType ?? 'None'),
    })),
  };
}

/**
 * Vytvoří HTTP server (zatím neposlouchá).
 * @param {{ root: string, accessCode: string, guestCodes?: string[], secret?: string, now?: () => number,
 *   speech?: { key?: string, region?: string, endpoint?: string, fetch?: typeof fetch, limit?: number } }} options
 */
export function createApp({ root, accessCode, guestCodes = [], secret, now = Date.now, speech = {} }) {
  if (!accessCode) throw new Error('Chybí přístupový kód (ACCESS_CODE).');
  const files = loadFiles(root);
  const index = files.get('/index.html');
  if (!index) throw new Error(`V ${root} chybí index.html – spusťte nejdřív npm run build.`);

  const key = secret || accessCode;
  const mac = (text) => createHmac('sha256', key).update(text).digest();
  // Každý kód má vlastní cookie. Rodinný kód má stejnou jako dřív, takže
  // přidání dalších kódů nikoho neodhlásí.
  const codes = [...new Set([accessCode, ...guestCodes].map(normalize).filter(Boolean))].map((code) => ({
    check: mac(`kod/${code}`),
    token: Buffer.from(mac(`draci-ostrovy/v1/${code}`).toString('base64url')),
  }));
  const fails = new Map();
  let speechTarget = null;
  try {
    speechTarget = speech.key ? speechUrl(speech) : null;
  } catch (err) {
    // Chybné nastavení mluvení nesmí shodit celou hru.
    console.warn(`${err.message} – mluvení zůstane vypnuté.`);
  }
  const speechFetch = speech.fetch ?? globalThis.fetch;
  const speechLimit = speech.limit ?? SPEECH_LIMIT;
  let speechUse = { first: 0, count: 0 };

  const cookieOf = (req) => {
    for (const part of (req.headers.cookie ?? '').split(';')) {
      const [name, ...rest] = part.trim().split('=');
      if (name === COOKIE) return rest.join('=');
    }
    return '';
  };
  const same = (a, b) => a.length === b.length && timingSafeEqual(a, b);
  const authed = (req) => {
    const cookie = Buffer.from(cookieOf(req));
    return codes.some((c) => same(cookie, c.token));
  };
  // Mluvení jen pro rodinný kód: hlas kamarádů se nikam neposílá.
  const family = (req) => same(Buffer.from(cookieOf(req)), codes[0].token);

  // Railway předává adresu klienta v X-Forwarded-For (poslední položku
  // doplňuje jeho proxy, ty předchozí si může klient vymyslet).
  const clientIp = (req) => {
    const hops = String(req.headers['x-forwarded-for'] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    return hops.at(-1) ?? req.socket.remoteAddress ?? '?';
  };
  const blocked = (ip) => {
    const entry = fails.get(ip);
    if (!entry) return false;
    if (now() - entry.first > FAIL_WINDOW) {
      fails.delete(ip);
      return false;
    }
    return entry.count >= MAX_FAILS;
  };
  const recordFail = (ip) => {
    const entry = fails.get(ip);
    if (!entry || now() - entry.first > FAIL_WINDOW) fails.set(ip, { first: now(), count: 1 });
    else entry.count++;
    if (fails.size > 5000) fails.clear(); // pojistka proti zahlcení paměti
  };

  const send = (res, status, headers, body, head = false) => {
    res.writeHead(status, { ...BASE_HEADERS, ...headers });
    res.end(head ? undefined : body);
  };
  const html = (res, status, body, extra = {}) =>
    send(res, status, { 'Content-Type': TYPES['.html'], 'Cache-Control': 'no-store', ...extra }, body);
  const cookie = (value, maxAge) =>
    `${COOKIE}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;

  const readForm = (req) =>
    new Promise((resolveBody, reject) => {
      let size = 0;
      const chunks = [];
      req.on('data', (chunk) => {
        size += chunk.length;
        if (size > 4096) {
          reject(new Error('příliš velký požadavek'));
          req.destroy();
          return;
        }
        chunks.push(chunk);
      });
      req.on('end', () => resolveBody(new URLSearchParams(Buffer.concat(chunks).toString('utf8'))));
      req.on('error', reject);
    });

  const json = (res, status, data) =>
    send(res, status, { 'Content-Type': TYPES['.json'], 'Cache-Control': 'no-store' }, JSON.stringify(data));

  const readBody = (req, limit) =>
    new Promise((resolveBody, reject) => {
      let size = 0;
      const chunks = [];
      req.on('data', (chunk) => {
        size += chunk.length;
        if (size > limit) {
          reject(Object.assign(new Error('příliš velká nahrávka'), { status: 413 }));
          req.destroy();
          return;
        }
        chunks.push(chunk);
      });
      req.on('end', () => resolveBody(Buffer.concat(chunks)));
      req.on('error', reject);
    });

  const speechAllowed = () => {
    if (now() - speechUse.first > SPEECH_WINDOW) speechUse = { first: now(), count: 0 };
    speechUse.count++;
    return speechUse.count <= speechLimit;
  };

  const handleSpeech = async (req, res, method, url) => {
    if (!authed(req)) return json(res, 401, { error: 'login' });
    const enabled = Boolean(speechTarget) && family(req);
    if (method === 'GET' || method === 'HEAD') return json(res, 200, { enabled });
    if (method !== 'POST') return send(res, 405, { Allow: 'GET, HEAD, POST' }, '');
    if (!enabled) return json(res, 403, { error: 'off' });
    if (!String(req.headers['content-type'] ?? '').startsWith('audio/wav')) return json(res, 415, { error: 'wav' });
    if (Number(req.headers['content-length'] ?? 0) > MAX_AUDIO) return json(res, 413, { error: 'size' });
    let audio;
    try {
      audio = await readBody(req, MAX_AUDIO);
    } catch (err) {
      return json(res, err.status ?? 400, { error: 'body' });
    }
    if (audio.length < 44 || audio.toString('ascii', 0, 4) !== 'RIFF' || audio.toString('ascii', 8, 12) !== 'WAVE') return json(res, 415, { error: 'wav' });
    if (!speechAllowed()) return json(res, 429, { error: 'limit' });

    const headers = {
      'Ocp-Apim-Subscription-Key': speech.key,
      'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
      Accept: 'application/json',
    };
    const ref = cleanRef(url.searchParams.get('ref'));
    if (ref) {
      const params = { ReferenceText: ref, GradingSystem: 'HundredMark', Granularity: 'Word', Dimension: 'Comprehensive', EnableMiscue: 'True' };
      headers['Pronunciation-Assessment'] = Buffer.from(JSON.stringify(params)).toString('base64');
    }
    try {
      const reply = await speechFetch(speechTarget, { method: 'POST', headers, body: audio, signal: AbortSignal.timeout(20_000) });
      if (!reply.ok) {
        console.warn(`Azure Speech odpověděl ${reply.status}.`);
        return json(res, 502, { status: 'error', text: '', lexical: '', scores: null, words: [] });
      }
      return json(res, 200, speechResult(await reply.json()));
    } catch (err) {
      console.warn(`Azure Speech nedostupný: ${err?.name ?? 'chyba'}.`);
      return json(res, 502, { status: 'error', text: '', lexical: '', scores: null, words: [] });
    }
  };

  const serveFile = (req, res, file) => {
    const accept = String(req.headers['accept-encoding'] ?? '');
    const headers = { 'Content-Type': file.type, 'Cache-Control': file.cache, Vary: 'Accept-Encoding, Cookie' };
    let body = file.body;
    if (file.br && /\bbr\b/.test(accept)) {
      body = file.br;
      headers['Content-Encoding'] = 'br';
    } else if (file.gzip && /\bgzip\b/.test(accept)) {
      body = file.gzip;
      headers['Content-Encoding'] = 'gzip';
    }
    headers['Content-Length'] = String(body.length);
    send(res, 200, headers, body, req.method === 'HEAD');
  };

  return createServer(async (req, res) => {
    try {
      let path;
      let url;
      try {
        url = new URL(req.url ?? '/', 'http://x');
        path = decodeURIComponent(url.pathname);
      } catch {
        return send(res, 400, { 'Content-Type': TYPES['.txt'] }, 'Neplatná adresa.');
      }
      const method = req.method ?? 'GET';
      const read = method === 'GET' || method === 'HEAD';

      if (path === HEALTH && read) return send(res, 200, { 'Content-Type': TYPES['.txt'], 'Cache-Control': 'no-store' }, 'ok');
      if (path === '/robots.txt' && read) return send(res, 200, { 'Content-Type': TYPES['.txt'] }, 'User-agent: *\nDisallow: /\n');

      if (path === LOGIN) {
        // Kdo už je přihlášený, jde rovnou do hry – třeba z ikony na ploše,
        // která se uložila na přihlašovací stránce.
        if (read && authed(req)) return send(res, 303, { Location: '/', 'Cache-Control': 'no-store' }, '');
        if (read) return html(res, 200, loginPage());
        if (method !== 'POST') return send(res, 405, { Allow: 'GET, HEAD, POST' }, '');
        const ip = clientIp(req);
        if (blocked(ip)) return html(res, 429, loginPage('Příliš mnoho pokusů. Zkuste to prosím za čtvrt hodiny.'));
        const form = await readForm(req);
        const typed = mac(`kod/${normalize(form.get('kod') ?? '')}`);
        const match = codes.find((c) => same(typed, c.check));
        if (match) {
          fails.delete(ip);
          return send(res, 303, { Location: '/', 'Set-Cookie': cookie(match.token.toString(), MAX_AGE), 'Cache-Control': 'no-store' }, '');
        }
        recordFail(ip);
        return html(res, 401, loginPage('Kód nesedí. Zkuste to znovu.'));
      }

      if (path === SPEECH) return await handleSpeech(req, res, method, url);

      if (path === LOGOUT && read) {
        return send(res, 303, { Location: LOGIN, 'Set-Cookie': cookie('', 0), 'Cache-Control': 'no-store' }, '');
      }

      if (!read) return send(res, 405, { Allow: 'GET, HEAD' }, '');
      if (PUBLIC_FILES.has(path) && files.has(path)) return serveFile(req, res, files.get(path));
      if (!authed(req)) {
        // Stránky přesměrujeme na přihlášení, soubory prostě odmítneme.
        if (path === '/' || !extname(path)) return send(res, 302, { Location: LOGIN, 'Cache-Control': 'no-store' }, '');
        return send(res, 401, { 'Content-Type': TYPES['.txt'], 'Cache-Control': 'no-store' }, 'Nejdřív se přihlaste.');
      }

      const file = files.get(path === '/' ? '/index.html' : path);
      if (file) return serveFile(req, res, file);
      // Hra nemá vlastní cesty – neznámá adresa bez přípony vede na úvod.
      if (!extname(path)) return serveFile(req, res, index);
      return send(res, 404, { 'Content-Type': TYPES['.txt'] }, 'Nenalezeno.');
    } catch {
      if (!res.headersSent) send(res, 500, { 'Content-Type': TYPES['.txt'] }, 'Chyba serveru.');
      else res.destroy();
    }
  });
}

// Spuštění: node server.mjs
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(fileURLToPath(new URL('.', import.meta.url)), 'dist');
  const accessCode = process.env.ACCESS_CODE ?? '';
  if (!accessCode) {
    console.error('Chybí proměnná ACCESS_CODE – bez přístupového kódu server nespustím.');
    process.exit(1);
  }
  if (!existsSync(join(root, 'index.html'))) {
    console.error(`Chybí sestavená hra (${root}) – spusťte npm run build.`);
    process.exit(1);
  }
  if (!process.env.SESSION_SECRET) console.warn('SESSION_SECRET není nastavený – cookie se podepisuje přístupovým kódem.');
  const guestCodes = parseCodes(process.env.GUEST_CODES);
  const speech = {
    key: process.env.AZURE_SPEECH_KEY?.trim() || undefined,
    region: process.env.AZURE_SPEECH_REGION?.trim().toLowerCase() || undefined,
    endpoint: process.env.AZURE_SPEECH_ENDPOINT?.trim() || undefined,
  };
  if (speech.key && !speech.region && !speech.endpoint) {
    console.warn('AZURE_SPEECH_KEY je nastavený, ale chybí AZURE_SPEECH_REGION – mluvení zůstane vypnuté.');
    speech.key = undefined;
  }
  const server = createApp({ root, accessCode, guestCodes, secret: process.env.SESSION_SECRET, speech });
  if (guestCodes.length) console.log(`Další přístupové kódy: ${guestCodes.length}.`);
  console.log(speech.key ? 'Mluvení (Azure Speech) je zapnuté.' : 'Mluvení je vypnuté (chybí AZURE_SPEECH_KEY).');
  const port = Number(process.env.PORT ?? 3000);
  // Bez adresy: Node poslouchá na IPv6 i IPv4 (::), kde IPv6 není, jen na IPv4.
  server.listen(port, () => console.log(`Dračí ostrovy běží na portu ${port}.`));
  const stop = () => server.close(() => process.exit(0));
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
}
