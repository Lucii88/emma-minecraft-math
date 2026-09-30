import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp, parseCodes } from '../server.mjs';

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
