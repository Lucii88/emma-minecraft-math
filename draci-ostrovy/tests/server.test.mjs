import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp, parseCodes, speechResult, speechUrl } from '../server.mjs';

const CODE = 'Ostrov-7k4m';
const SECRET = 'testovaci-tajemstvi';
const JS = `console.log(${JSON.stringify('drak '.repeat(600))});`;

let root;
let clock = 1_000_000;
const servers = [];

async function start(options = {}) {
  const server = createApp({ root, accessCode: CODE, secret: SECRET, now: () => clock, ...options });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  servers.push(server);
  return `http://127.0.0.1:${server.address().port}`;
}

const get = (base, path, headers = {}) => fetch(base + path, { headers, redirect: 'manual' });
const login = (base, code, headers = {}) =>
  fetch(base + '/prihlaseni', {
    method: 'POST',
    redirect: 'manual',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...headers },
    body: new URLSearchParams({ kod: code }).toString(),
  });
const cookieFrom = (res) => (res.headers.get('set-cookie') ?? '').split(';')[0];

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'draci-ostrovy-'));
  mkdirSync(join(root, 'assets'));
  writeFileSync(join(root, 'index.html'), '<!doctype html><title>Hra</title><div id="root"></div>');
  writeFileSync(join(root, 'assets', 'app-abc123.js'), JS);
  writeFileSync(join(root, 'icon.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
});

afterAll(async () => {
  await Promise.all(servers.map((s) => new Promise((done) => s.close(done))));
  rmSync(root, { recursive: true, force: true });
});

describe('server s přístupovým kódem', () => {
  it('bez kódu nebo bez sestavené hry nenastartuje', () => {
    expect(() => createApp({ root, accessCode: '' })).toThrow(/ACCESS_CODE/);
    expect(() => createApp({ root: join(root, 'assets'), accessCode: CODE })).toThrow(/index\.html/);
  });

  it('bez přihlášení pustí jen kontrolu zdraví, robots.txt a přihlášení', async () => {
    const base = await start();
    const health = await get(base, '/zdravi');
    expect(health.status).toBe(200);
    expect(await health.text()).toBe('ok');
    expect(await (await get(base, '/robots.txt')).text()).toContain('Disallow: /');

    const home = await get(base, '/');
    expect(home.status).toBe(302);
    expect(home.headers.get('location')).toBe('/prihlaseni');
    expect(home.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect((await get(base, '/assets/app-abc123.js')).status).toBe(401);
    // Ikona je vidět i bez přihlášení (přidání na plochu), hra ne.
    expect((await get(base, '/icon.svg')).status).toBe(200);

    const page = await get(base, '/prihlaseni');
    expect(page.status).toBe(200);
    expect(await page.text()).toContain('Přístupový kód');
  });

  it('špatný kód odmítne, správný (bez ohledu na velikost písmen) přihlásí na dlouho', async () => {
    const base = await start();
    const wrong = await login(base, 'drak');
    expect(wrong.status).toBe(401);
    expect(await wrong.text()).toContain('Kód nesedí');
    expect(wrong.headers.get('set-cookie')).toBeNull();

    const ok = await login(base, ' ostrov-7K4M ');
    expect(ok.status).toBe(303);
    expect(ok.headers.get('location')).toBe('/');
    const setCookie = ok.headers.get('set-cookie');
    expect(setCookie).toMatch(/HttpOnly/);
    expect(setCookie).toMatch(/Secure/);
    expect(setCookie).toMatch(/SameSite=Lax/);
    expect(setCookie).toMatch(/Max-Age=34560000/);

    const home = await get(base, '/', { cookie: cookieFrom(ok) });
    expect(home.status).toBe(200);
    expect(home.headers.get('cache-control')).toBe('no-cache');
    expect(await home.text()).toContain('<title>Hra</title>');
  });

  it('po přihlášení servíruje soubory komprimované a neznámé stránky vede na úvod', async () => {
    const base = await start();
    const cookie = cookieFrom(await login(base, CODE));
    const js = await get(base, '/assets/app-abc123.js', { cookie, 'accept-encoding': 'br' });
    expect(js.status).toBe(200);
    expect(js.headers.get('content-type')).toContain('text/javascript');
    expect(js.headers.get('cache-control')).toContain('immutable');
    expect(js.headers.get('content-encoding')).toBe('br');
    // fetch v Node brotli sám rozbalí – ověřujeme hlavičku a výsledný obsah.
    expect(await js.text()).toBe(JS);

    expect(await (await get(base, '/nekde/jinde', { cookie })).text()).toContain('<title>Hra</title>');
    expect((await get(base, '/nic.js', { cookie })).status).toBe(404);
    expect((await get(base, '/%E0%A4%A', { cookie })).status).toBe(400);
  });

  it('podvržená cookie nestačí a změna kódu odhlásí všechna zařízení', async () => {
    const base = await start();
    const cookie = cookieFrom(await login(base, CODE));
    expect((await get(base, '/', { cookie: cookie.slice(0, -2) + 'xx' })).status).toBe(302);

    const changed = await start({ accessCode: 'novy-kod-2026' });
    expect((await get(changed, '/', { cookie })).status).toBe(302);
  });

  it('další kódy (třeba pro kamarády) jdou zrušit, aniž by se odhlásila rodina', async () => {
    const base = await start({ guestCodes: ['Kamaradi-2026', ' ', 'DRACI'] });
    const family = cookieFrom(await login(base, CODE));
    const guest = cookieFrom(await login(base, 'draci'));
    expect(family).not.toBe(guest);
    expect((await get(base, '/', { cookie: guest })).status).toBe(200);
    expect((await login(base, 'kamaradi-2026')).status).toBe(303);

    // Kód pro kamarády zrušen: kamarádi se odhlásí, rodina ne.
    const later = await start({ guestCodes: ['Kamaradi-2026'] });
    expect((await get(later, '/', { cookie: guest })).status).toBe(302);
    expect((await get(later, '/', { cookie: family })).status).toBe(200);
    expect((await login(later, 'DRACI')).status).toBe(401);

    // Rodinná cookie je stejná jako bez dalších kódů – přidáním nikoho neodhlásíme.
    const plain = await start();
    expect((await get(plain, '/', { cookie: family })).status).toBe(200);
  });

  it('přihlášeného pošle z přihlašovací stránky rovnou do hry (ikona na ploše)', async () => {
    const base = await start({ guestCodes: ['DRACI'] });
    const cookie = cookieFrom(await login(base, 'draci'));
    const again = await get(base, '/prihlaseni', { cookie });
    expect(again.status).toBe(303);
    expect(again.headers.get('location')).toBe('/');
    expect((await get(base, '/prihlaseni')).status).toBe(200);
    expect((await get(base, '/prihlaseni', { cookie: 'draci_ostrovy=cizi' })).status).toBe(200);
  });

  it('seznam kódů z proměnné prostředí', () => {
    expect(parseCodes(' drak, ,Kamaradi ,')).toEqual(['drak', 'Kamaradi']);
    expect(parseCodes(undefined)).toEqual([]);
  });

  it('po deseti chybných pokusech z jedné adresy na čtvrt hodiny zablokuje', async () => {
    const base = await start();
    const from = { 'x-forwarded-for': '203.0.113.9' };
    for (let i = 0; i < 10; i++) expect((await login(base, 'spatne', from)).status).toBe(401);
    expect((await login(base, CODE, from)).status).toBe(429);
    // Klient si nemůže pomoct podvrženou první adresou – počítá se poslední.
    expect((await login(base, CODE, { 'x-forwarded-for': '198.51.100.1, 203.0.113.9' })).status).toBe(429);
    expect((await login(base, CODE, { 'x-forwarded-for': '198.51.100.7' })).status).toBe(303);
    clock += 16 * 60 * 1000;
    expect((await login(base, CODE, from)).status).toBe(303);
  });

  it('jiné metody než čtení odmítne', async () => {
    const base = await start();
    const cookie = cookieFrom(await login(base, CODE));
    const res = await fetch(base + '/', { method: 'POST', headers: { cookie }, redirect: 'manual' });
    expect(res.status).toBe(405);
  });
});

/** Nejmenší platný WAV (hlavička + trocha ticha). */
function wav(samples = 1600) {
  const buf = Buffer.alloc(44 + samples * 2);
  buf.write('RIFF', 0, 'ascii');
  buf.writeUInt32LE(36 + samples * 2, 4);
  buf.write('WAVEfmt ', 8, 'ascii');
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(16000, 24);
  buf.writeUInt32LE(32000, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36, 'ascii');
  buf.writeUInt32LE(samples * 2, 40);
  return buf;
}

const AZURE_OK = {
  RecognitionStatus: 'Success',
  DisplayText: "I'm seven.",
  NBest: [{
    Lexical: "i'm seven", Display: "I'm seven.",
    AccuracyScore: 91.2, FluencyScore: 80, CompletenessScore: 100, PronScore: 87.6,
    Words: [{ Word: "i'm", AccuracyScore: 95, ErrorType: 'None' }, { Word: 'seven', AccuracyScore: 88.4, ErrorType: 'None' }],
  }],
};

describe('mluvení přes Azure Speech', () => {
  const fakeAzure = (reply = { status: 200, body: AZURE_OK }) => {
    const calls = [];
    const fetchFn = async (url, init) => {
      calls.push({ url, init });
      if (reply instanceof Error) throw reply;
      return new Response(JSON.stringify(reply.body ?? {}), { status: reply.status });
    };
    return { calls, fetchFn };
  };
  const speak = (base, cookie, body = wav(), path = '/api/mluveni') =>
    fetch(base + path, { method: 'POST', headers: { cookie, 'Content-Type': 'audio/wav' }, body });

  it('adresa služby podle oblasti nebo vlastního prostředku', () => {
    expect(speechUrl({ region: 'westeurope' })).toBe('https://westeurope.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed');
    expect(speechUrl({ endpoint: 'https://draci.cognitiveservices.azure.com/' })).toBe('https://draci.cognitiveservices.azure.com/stt/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed');
    expect(speechUrl({})).toBeNull();
    expect(() => speechUrl({ region: 'west europe/../x' })).toThrow();
    expect(() => speechUrl({ endpoint: 'http://draci.example' })).toThrow();
  });

  it('bez klíče je vypnuté a hra o tom ví', async () => {
    const base = await start();
    expect((await get(base, '/api/mluveni')).status).toBe(401);
    const cookie = cookieFrom(await login(base, CODE));
    const res = await get(base, '/api/mluveni', { cookie });
    expect(await res.json()).toEqual({ enabled: false });
    expect((await speak(base, cookie)).status).toBe(403);
  });

  it('chybné nastavení mluvení hru neshodí', async () => {
    const base = await start({ speech: { key: 'k', region: 'špatně' } });
    const cookie = cookieFrom(await login(base, CODE));
    expect(await (await get(base, '/api/mluveni', { cookie })).json()).toEqual({ enabled: false });
  });

  it('pošle nahrávku do Azure a vrátí zjednodušený výsledek s hodnocením výslovnosti', async () => {
    const azure = fakeAzure();
    const base = await start({ speech: { key: 'tajny-klic', region: 'westeurope', fetch: azure.fetchFn } });
    const cookie = cookieFrom(await login(base, CODE));
    expect(await (await get(base, '/api/mluveni', { cookie })).json()).toEqual({ enabled: true });

    const res = await speak(base, cookie, wav(), "/api/mluveni?ref=I'm%20seven.");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      status: 'ok', text: "I'm seven.", lexical: "i'm seven",
      scores: { accuracy: 91, fluency: 80, completeness: 100, pron: 88 },
      words: [{ word: "i'm", accuracy: 95, error: 'None' }, { word: 'seven', accuracy: 88, error: 'None' }],
    });
    expect(azure.calls).toHaveLength(1);
    const { url, init } = azure.calls[0];
    expect(url).toContain('westeurope.stt.speech.microsoft.com');
    expect(url).toContain('language=en-US');
    expect(init.headers['Ocp-Apim-Subscription-Key']).toBe('tajny-klic');
    expect(init.headers['Content-Type']).toContain('samplerate=16000');
    const pa = JSON.parse(Buffer.from(init.headers['Pronunciation-Assessment'], 'base64').toString());
    expect(pa).toMatchObject({ ReferenceText: "I'm seven.", GradingSystem: 'HundredMark', EnableMiscue: 'True' });
  });

  it('bez referenčního textu (nebo s podivným) jen přepisuje', async () => {
    const azure = fakeAzure();
    const base = await start({ speech: { key: 'k', region: 'westeurope', fetch: azure.fetchFn } });
    const cookie = cookieFrom(await login(base, CODE));
    await speak(base, cookie);
    await speak(base, cookie, wav(), '/api/mluveni?ref=%3Cscript%3E');
    expect(azure.calls.map((c) => c.init.headers['Pronunciation-Assessment'])).toEqual([undefined, undefined]);
  });

  it('host s kódem pro kamarády mluvení nemá – jeho hlas se nikam neposílá', async () => {
    const azure = fakeAzure();
    const base = await start({ guestCodes: ['kamarad-1'], speech: { key: 'k', region: 'westeurope', fetch: azure.fetchFn } });
    const cookie = cookieFrom(await login(base, 'kamarad-1'));
    expect(await (await get(base, '/api/mluveni', { cookie })).json()).toEqual({ enabled: false });
    expect((await speak(base, cookie)).status).toBe(403);
    expect(azure.calls).toHaveLength(0);
  });

  it('odmítne jiný formát, příliš velkou nahrávku a hlídá hodinový limit', async () => {
    const azure = fakeAzure();
    const base = await start({ speech: { key: 'k', region: 'westeurope', fetch: azure.fetchFn, limit: 2 } });
    const cookie = cookieFrom(await login(base, CODE));
    const mp3 = await fetch(base + '/api/mluveni', { method: 'POST', headers: { cookie, 'Content-Type': 'audio/mpeg' }, body: Buffer.alloc(100) });
    expect(mp3.status).toBe(415);
    expect((await speak(base, cookie, Buffer.from('RIFF....nope'))).status).toBe(415);
    const big = await speak(base, cookie, Buffer.concat([wav(), Buffer.alloc(1024 * 1024)])).catch(() => ({ status: 413 }));
    expect(big.status).toBe(413);
    expect((await speak(base, cookie)).status).toBe(200);
    expect((await speak(base, cookie)).status).toBe(200);
    expect((await speak(base, cookie)).status).toBe(429);
    clock += 61 * 60 * 1000;
    expect((await speak(base, cookie)).status).toBe(200);
    expect(azure.calls).toHaveLength(3);
  });

  it('chyba nebo výpadek Azure vrátí „error“ a klíč neprozradí', async () => {
    for (const reply of [{ status: 401, body: { error: 'bad key' } }, new Error('síť')]) {
      const azure = fakeAzure(reply);
      const base = await start({ speech: { key: 'tajny-klic', region: 'westeurope', fetch: azure.fetchFn } });
      const cookie = cookieFrom(await login(base, CODE));
      const res = await speak(base, cookie);
      expect(res.status).toBe(502);
      const text = await res.text();
      expect(JSON.parse(text).status).toBe('error');
      expect(text).not.toContain('tajny-klic');
    }
  });

  it('ticho a nesrozumitelná řeč jsou „nomatch“, ne chyba', () => {
    expect(speechResult({ RecognitionStatus: 'InitialSilenceTimeout' }).status).toBe('nomatch');
    expect(speechResult({ RecognitionStatus: 'NoMatch' }).status).toBe('nomatch');
    expect(speechResult({ RecognitionStatus: 'Error' }).status).toBe('error');
    // Výsledky hodnocení mohou být i vnořené.
    const nested = speechResult({ RecognitionStatus: 'Success', NBest: [{ Lexical: 'red', PronunciationAssessment: { AccuracyScore: 70 }, Words: [{ Word: 'red', PronunciationAssessment: { AccuracyScore: 70, ErrorType: 'Mispronunciation' } }] }] });
    expect(nested.scores?.accuracy).toBe(70);
    expect(nested.words[0]).toEqual({ word: 'red', accuracy: 70, error: 'Mispronunciation' });
  });
});
