// Karty znalostí a společné mise hotových ostrovů fáze 1 (čísla, slova, tělo):
// platnost podle společného validátoru, pokrytí dovedností, česká typografie
// a kontrola faktů proti nezávislým tabulkám a výpočtům.

import { describe, expect, it } from 'vitest';
import { cards as cislaCards, missions as cislaMissions, skills as cislaSkills } from '../src/content/cisla';
import { cards as slovaCards, missions as slovaMissions, skills as slovaSkills } from '../src/content/slova';
import { cards as teloCards, missions as teloMissions, skills as teloSkills } from '../src/content/telo';
import type { IslandId, JointMission, KnowledgeCard, SkillDef } from '../src/core/types';
import { validateCards, validateMissions } from './validate';

interface IslandContent {
  id: IslandId;
  skills: SkillDef[];
  cards: KnowledgeCard[];
  missions: JointMission[];
  /** Nejmenší počet karet na každou uzavřenou dovednost. */
  perSkill: number;
  /** Povolené rozmezí celkového počtu karet. */
  total: [number, number];
  /** Nejmenší počet „opravených stránek“. */
  fixes: number;
}

const ISLANDS: IslandContent[] = [
  { id: 'cisla', skills: cislaSkills, cards: cislaCards, missions: cislaMissions, perSkill: 2, total: [20, 30], fixes: 2 },
  { id: 'slova', skills: slovaSkills, cards: slovaCards, missions: slovaMissions, perSkill: 2, total: [18, 26], fixes: 2 },
  { id: 'telo', skills: teloSkills, cards: teloCards, missions: teloMissions, perSkill: 3, total: [24, 30], fixes: 3 },
];

const ALL_CARDS = ISLANDS.flatMap((i) => i.cards);
const ALL_MISSIONS = ISLANDS.flatMap((i) => i.missions);

function card(id: string): KnowledgeCard {
  const c = ALL_CARDS.find((x) => x.id === id);
  if (!c) throw new Error(`chybí karta ${id}`);
  return c;
}

function mission(id: string): JointMission {
  const m = ALL_MISSIONS.find((x) => x.id === id);
  if (!m) throw new Error(`chybí mise ${id}`);
  return m;
}

/** Celý text karty: nadpis, text a opravená stránka. */
const cardText = (c: KnowledgeCard) => [c.title, c.text, c.fix?.before ?? '', c.fix?.evidence ?? ''].join(' ');

/** Počet vět: věta končí . ! ? nebo … a další začíná velkým písmenem, číslicí nebo uvozovkou. */
const sentences = (t: string) => t.trim().split(/(?<=[.!?…])\s+(?=[\p{Lu}\d„])/u).length;

/** Uvozené úseky „…“ z textu. */
const quoted = (t: string) => [...t.matchAll(/„([^“]+)“/g)].map((m) => m[1]);

/** Všechny texty karet a misí s popisem, kde jsou. */
const TEXTS: [string, string][] = [
  ...ALL_CARDS.flatMap((c): [string, string][] => [
    [`${c.id} nadpis`, c.title],
    [`${c.id} text`, c.text],
    ...(c.fix ? ([[`${c.id} dřív`, c.fix.before], [`${c.id} důkaz`, c.fix.evidence]] as [string, string][]) : []),
  ]),
  ...ALL_MISSIONS.flatMap((m): [string, string][] => [
    [`${m.id} nadpis`, m.title],
    [`${m.id} zadání`, m.text],
    [`${m.id} tip`, m.parentTip],
  ]),
];

describe('Karty a mise fáze 1 – platnost a pokrytí', () => {
  for (const island of ISLANDS) {
    it(`${island.id}: validateCards a validateMissions nehlásí chyby`, () => {
      expect(validateCards(island.cards, island.skills)).toEqual([]);
      expect(validateMissions(island.missions, island.id)).toEqual([]);
    });

    it(`${island.id}: každá uzavřená dovednost má aspoň ${island.perSkill} karty, otevřená žádnou`, () => {
      for (const skill of island.skills) {
        const n = island.cards.filter((c) => c.skillId === skill.id).length;
        if (skill.open) expect(n, skill.id).toBe(0);
        else expect(n, skill.id).toBeGreaterThanOrEqual(island.perSkill);
      }
      expect(island.cards.length).toBeGreaterThanOrEqual(island.total[0]);
      expect(island.cards.length).toBeLessThanOrEqual(island.total[1]);
    });

    it(`${island.id}: aspoň ${island.fixes} opravené stránky a karty na nízkých i vysokých úrovních`, () => {
      expect(island.cards.filter((c) => c.fix).length).toBeGreaterThanOrEqual(island.fixes);
      expect(island.cards.some((c) => c.level <= 2)).toBe(true);
      expect(island.cards.some((c) => c.level >= 4)).toBe(true);
    });

    it(`${island.id}: 3–4 společné mise`, () => {
      expect(island.missions.length).toBeGreaterThanOrEqual(3);
      expect(island.missions.length).toBeLessThanOrEqual(4);
    });
  }

  it('id karet a misí jsou unikátní napříč ostrovy, nadpisy karet se neopakují', () => {
    const ids = [...ALL_CARDS, ...ALL_MISSIONS].map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
    const titles = ALL_CARDS.map((c) => c.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});

describe('Karty a mise fáze 1 – texty', () => {
  it('text karty má 1–3 věty a končí tečkou, zadání mise 1–3 věty', () => {
    for (const c of ALL_CARDS) {
      expect(sentences(c.text), c.id).toBeLessThanOrEqual(3);
      expect(c.text, c.id).toMatch(/\.$/);
    }
    for (const m of ALL_MISSIONS) expect(sentences(m.text), m.id).toBeLessThanOrEqual(3);
  });

  it('opravená stránka má obě části jako celé věty', () => {
    for (const c of ALL_CARDS.filter((x) => x.fix)) {
      for (const t of [c.fix!.before, c.fix!.evidence]) {
        expect(t, c.id).toMatch(/^[\p{Lu}„]/u);
        expect(t, c.id).toMatch(/[.!?]$/);
      }
    }
  });

  it('česká typografie: uvozovky, pomlčky, tři tečky, mezery, tisíce', () => {
    for (const [where, t] of TEXTS) {
      expect(t, where).not.toMatch(/["']/);
      expect(t, where).not.toMatch(/\.\.\./);
      expect(t, where).not.toMatch(/ - /);
      expect(t, where).not.toMatch(/\s[,.;:!?…]/);
      expect(t, where).not.toMatch(/^\s|\s$|\s{2,}/);
      expect(t, where).not.toMatch(/\d{5,}/); // 100 000, ne 100000
      expect(t, where).toMatch(/^[\p{Lu}\d„]/u);
      expect((t.match(/„/g) ?? []).length, where).toBe((t.match(/“/g) ?? []).length);
    }
  });

  it('hráčku oslovujeme v ženském rodě a nezmiňujeme zakázané názvy', () => {
    for (const [where, t] of TEXTS) {
      expect(t, where).not.toMatch(/(?<!\p{L})(jsi|ses|sis|bys|abys|kdybys)\s+\p{L}*l(?!\p{L})/iu);
      expect(t, where).not.toMatch(/(?<!\p{L})\p{L}+l\s+(jsi|ses|sis)(?!\p{L})/u);
      expect(t.toLocaleLowerCase('cs'), where).not.toMatch(/kniha draků|emma/);
    }
  });

  it('emoji jsou nejvýš z Unicode 12 a žádné vlajky', () => {
    // Blok 1FA70–1FAFF: v Unicode 12 z něj existují jen tyto rozsahy.
    const unicode12 = [[0x1fa70, 0x1fa73], [0x1fa78, 0x1fa7a], [0x1fa80, 0x1fa82], [0x1fa90, 0x1fa95]];
    // Novější emoji mimo ten blok (Unicode 13 a 14).
    const newer = [0x1f6d6, 0x1f6d7, 0x1f6dd, 0x1f6de, 0x1f6df, 0x1f6fb, 0x1f6fc, 0x1f7f0, 0x1f90c, 0x1f972, 0x1f977,
      0x1f978, 0x1f979, 0x1f9a3, 0x1f9a4, 0x1f9ab, 0x1f9ac, 0x1f9ad, 0x1f9cb, 0x1f9cc];
    for (const x of [...ALL_CARDS, ...ALL_MISSIONS]) {
      for (const ch of x.emoji) {
        const cp = ch.codePointAt(0)!;
        expect(cp >= 0x1f1e6 && cp <= 0x1f1ff, `${x.id}: vlajka`).toBe(false);
        const extA = cp >= 0x1fa70 && cp <= 0x1faff;
        expect(extA && !unicode12.some(([a, b]) => cp >= a && cp <= b), `${x.id}: emoji novější než Unicode 12`).toBe(false);
        expect(newer.includes(cp), `${x.id}: emoji novější než Unicode 12`).toBe(false);
      }
    }
  });
});

describe('Karty fáze 1 – fakta podle nezávislých tabulek', () => {
  /** Letopočty, čísla a jména, která karta musí obsahovat. */
  const FACTS: Record<string, (string | number)[]> = {
    'telo.organy.sto-tisic-uderu': ['100 000'],
    'telo.kostra.pocet-kosti': [206],
    'telo.zivot.schovane-zuby': [20, 32],
    'telo.fakt-pohadka.fonendoskop': [1816, 'Laennec'],
    'telo.fakt-pohadka.rentgen': [1895, 'Röntgen'],
    'telo.zdravi.mozek-ve-spanku': [1953],
    'slova.cteni.braillovo-pismo': ['Braille', 15],
    'slova.cteni.runy': ['futhark', 16],
    'slova.cteni.oci-skacou': [1879, 'Javal'],
    'slova.hadanky.odin': ['Ódin', 'Heidrek'],
    'slova.presmycky.galileo': [1610, 1877, 'Saturn', 'Mars'],
    'slova.hlasky.hacky-a-carky': ['připisuje', 'Husovi'],
    'slova.skupiny.velryba': [1758, 'Linné'],
    'cisla.scitani.plus-minus': [1489],
    'cisla.nasobeni.krizek-tecka': [1631, 'Oughtred', 'Leibniz'],
    'cisla.cisla.nula': [628, 'Brahmagupta'],
    'cisla.cas.orloj': [1410],
    'cisla.rady.fibonacci': [1202],
    'cisla.vahy.rovnitko': [1557, 'Recorde'],
  };

  it('letopočty, čísla a jména sedí k tabulce', () => {
    for (const [id, facts] of Object.entries(FACTS)) {
      for (const f of facts) expect(cardText(card(id)), id).toContain(String(f));
    }
  });

  it('údaje „před X lety“ sedí k letopočtům událostí', () => {
    const now = new Date().getFullYear();
    // rok události (záporný = před naším letopočtem); „víc“ = tvrzení „víc než X“, „asi“ = do 10 %
    const AGES: { id: string; re: RegExp; year: number; mode: 'víc' | 'asi' }[] = [
      { id: 'cisla.penize.tolar', re: /před víc než (\d+) lety/, year: 1520, mode: 'víc' },
      { id: 'telo.fakt-pohadka.prvni-bakterie', re: /[Pp]řed víc než (\d+) lety/, year: 1683, mode: 'víc' },
      { id: 'slova.hadanky.erben', re: /před víc než (\d+) lety/, year: 1864, mode: 'víc' },
      { id: 'cisla.slovni.vlk-koza-zeli', re: /stará přes (\d+) let/, year: 804, mode: 'víc' },
      { id: 'cisla.nasobeni.egyptske-nasobeni', re: /starých přes (\d+) let/, year: -1550, mode: 'víc' },
      { id: 'cisla.penize.prvni-mince', re: /asi před (\d+) lety/, year: -600, mode: 'asi' },
      { id: 'slova.hlasky.hacky-a-carky', re: /asi před (\d+) lety/, year: 1412, mode: 'asi' },
      { id: 'cisla.vahy.algebra', re: /asi před (\d+) lety/, year: 820, mode: 'asi' },
      { id: 'cisla.cisla.zaporna-cisla', re: /asi před (\d+) lety/, year: 50, mode: 'asi' },
    ];
    for (const a of AGES) {
      const m = cardText(card(a.id)).match(a.re);
      expect(m, a.id).not.toBeNull();
      const claimed = Number(m![1]);
      const age = now - a.year;
      if (a.mode === 'víc') expect(age, a.id).toBeGreaterThan(claimed);
      else expect(Math.abs(age - claimed) / claimed, a.id).toBeLessThan(0.1);
    }
  });

  it('srdce: zhruba 100 000 úderů za den', () => {
    const perDay = 70 * 60 * 24; // klidový tep dospělého asi 70 za minutu
    expect(Math.abs(perDay - 100_000) / 100_000).toBeLessThan(0.1);
  });

  it('brzdná dráha při 50 km/h: 25 až 30 metrů, asi dva autobusy', () => {
    const v = 50 / 3.6;
    for (const decel of [7, 8]) {
      const total = v * 1 + (v * v) / (2 * decel); // reakce 1 s + brzdění na suchu
      expect(total).toBeGreaterThanOrEqual(25);
      expect(total).toBeLessThanOrEqual(30);
    }
    expect(Math.abs(2 * 12 - 25) / 25).toBeLessThan(0.2); // městský autobus měří asi 12 m
    expect(card('telo.bezpeci.brzdna-draha').text).toContain('25 až 30 metrů');
  });

  it('růst: o 25 cm za rok by v sedmi letech dalo přes dva metry', () => {
    expect(50 + 25 * 7).toBeGreaterThan(200); // novorozenec měří asi 50 cm
    expect(card('telo.zivot.prvni-rok').text).toContain('přes dva metry');
  });

  it('Gaussův součet od 1 do 100', () => {
    const sum = Array.from({ length: 100 }, (_, i) => i + 1).reduce((a, b) => a + b, 0);
    expect(sum).toBe(5050);
    expect(50 * 101).toBe(sum);
    expect(card('cisla.scitani.gauss').text).toContain(`${sum}`);
  });

  it('egyptské násobení zdvojováním', () => {
    const doubles = [1, 2, 4, 8].map((k) => 7 * k);
    expect(doubles).toEqual([7, 14, 28, 56]);
    expect(1 + 4 + 8).toBe(13);
    expect(7 + 28 + 56).toBe(13 * 7);
    const t = card('cisla.nasobeni.egyptske-nasobeni').text;
    for (const s of ['7, 14, 28, 56', '13 = 1 + 4 + 8', '7 + 28 + 56', `${13 * 7}`]) expect(t).toContain(s);
  });

  it('egyptské zlomky: 5 chlebů pro 8 lidí', () => {
    // 1/2 + 1/8 = (4 + 1) / 8
    expect(8 / 2 + 8 / 8).toBe(5);
    expect(card('cisla.zlomky.egyptske-zlomky').text).toContain('1/2 + 1/8 chleba – a to je dohromady 5/8');
  });

  it('šedesátka a její dělitelé', () => {
    const m = card('cisla.cas.sedesat-minut').text.match(/dělit ([\d, i]+), a proto/);
    expect(m).not.toBeNull();
    const listed = m![1].split(/,\s*|\s+i\s+/).map(Number);
    const divisors = Array.from({ length: 58 }, (_, i) => i + 2).filter((d) => 60 % d === 0);
    expect(listed).toEqual(divisors);
  });

  it('milion a miliarda sekund', () => {
    const days = 1e6 / 86_400;
    const years = 1e9 / (365.25 * 86_400);
    expect(days).toBeGreaterThan(11.25);
    expect(days).toBeLessThan(11.75);
    expect(years).toBeGreaterThan(31);
    expect(years).toBeLessThan(32);
    const t = card('cisla.cisla.milion-sekund').text;
    expect(t).toContain('11 a půl dne');
    expect(t).toContain('skoro 32 let');
  });

  it('nula je sudá a záporná čísla leží pod nulou', () => {
    expect(0 % 2).toBe(0);
    expect(7 + 0).toBe(7);
    expect(7 - 7).toBe(0);
    expect(card('cisla.cisla.nula').fix).toBeDefined();
    expect(card('cisla.cisla.zaporna-cisla').fix).toBeDefined();
  });

  it('rýže na šachovnici: víc, než se sklidí za stovky let', () => {
    const grains = 2n ** 64n - 1n;
    const tonnes = (Number(grains) * 0.02) / 1e6; // zrnko rýže váží asi 0,02 g (spíš méně)
    const years = tonnes / 8e8; // světová sklizeň rýže je pod 800 milionů tun ročně
    expect(years).toBeGreaterThan(300);
    expect(card('cisla.rady.sachovnice').text).toContain('64 políček');
  });

  it('Fibonacciho řada', () => {
    const xs = [1, 1];
    while (xs.length < 7) xs.push(xs[xs.length - 1] + xs[xs.length - 2]);
    expect(card('cisla.rady.fibonacci').text).toContain(xs.join(', '));
  });

  it('dračí autobus: zkratka i počítání pozpátku', () => {
    const trips = [
      { start: 5, stops: [{ off: 2, on: 3 }, { off: 4, on: 1 }, { off: 0, on: 6 }] },
      { start: 12, stops: [{ off: 7, on: 0 }, { off: 3, on: 8 }, { off: 10, on: 2 }, { off: 1, on: 1 }] },
    ];
    for (const { start, stops } of trips) {
      let cur = start;
      for (const s of stops) cur = cur - s.off + s.on;
      const shortcut = start + stops.reduce((a, s) => a + s.on, 0) - stops.reduce((a, s) => a + s.off, 0);
      expect(shortcut).toBe(cur);
      let back = cur;
      for (const s of [...stops].reverse()) back = back - s.on + s.off;
      expect(back).toBe(start);
    }
  });

  it('početní hadi: na pořadí kroků nezáleží', () => {
    expect(3 - 5 + 7).toBe(5);
    expect(7 + 3 - 5).toBe(5);
    const t = card('cisla.hadi.na-poradi-nezalezi').text;
    for (const s of ['+3, −5, +7', '+7, +3, −5', '+5']) expect(t).toContain(s);
  });

  it('součtové trojúhelníky: součet stran je sudý, strany 2, 3, 4 dávají necelé vrcholy', () => {
    for (let a = 1; a <= 9; a++) {
      for (let b = 1; b <= 9; b++) {
        for (let c = 1; c <= 9; c++) expect(((a + b) + (b + c) + (c + a)) % 2).toBe(0);
      }
    }
    const [ab, bc, ca] = [2, 3, 4];
    const all = (ab + bc + ca) / 2;
    const vertices = [all - bc, all - ca, all - ab]; // a, b, c
    expect(vertices[0] + vertices[1]).toBe(ab);
    expect(vertices[1] + vertices[2]).toBe(bc);
    expect(vertices[2] + vertices[0]).toBe(ca);
    expect([...vertices].sort((x, y) => x - y)).toEqual([0.5, 1.5, 2.5]);
    const t = card('cisla.trojuhelniky.necela-cisla').text;
    expect(t).toContain(`součet ${ab + bc + ca}`);
    expect(t).toContain('0,5; 1,5 a 2,5');
  });

  it('magický čtverec 3 × 3 s čísly 1–9: jediný až na otočení a převrácení, pětka uprostřed', () => {
    const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    const found: number[][] = [];
    const permute = (rest: number[], acc: number[]) => {
      if (!rest.length) {
        if (lines.every((l) => l.reduce((s, i) => s + acc[i], 0) === 15)) found.push(acc);
        return;
      }
      rest.forEach((x, i) => permute([...rest.slice(0, i), ...rest.slice(i + 1)], [...acc, x]));
    };
    permute([1, 2, 3, 4, 5, 6, 7, 8, 9], []);
    expect(found.length).toBe(8);
    for (const g of found) expect(g[4]).toBe(5);
    const rot = (x: number[]) => [x[6], x[3], x[0], x[7], x[4], x[1], x[8], x[5], x[2]];
    const flip = (x: number[]) => [x[2], x[1], x[0], x[5], x[4], x[3], x[8], x[7], x[6]];
    const variants = new Set<string>();
    let g = found[0];
    for (let r = 0; r < 4; r++) {
      variants.add(g.join());
      variants.add(flip(g).join());
      g = rot(g);
    }
    expect([...variants].sort()).toEqual(found.map((x) => x.join()).sort());
    expect(card('cisla.ctverce.petka-uprostred').text).toContain('pětka');
    expect(card('cisla.ctverce.petka-uprostred').text).toContain('15');
    expect(card('cisla.ctverce.jediny-ctverec').text).toContain(`${found.length} podob`);
  });

  it('palindromy se čtou pozpátku stejně (bez mezer, velikosti písmen a diakritiky)', () => {
    const plain = (s: string) => s.normalize('NFD').replace(/[^\p{L}]/gu, '').toLocaleLowerCase('cs');
    const t = card('slova.presmycky.palindromy').text;
    const samples = [...quoted(t), 'oko', 'krk', 'radar'];
    expect(samples).toContain('Kobyla má malý bok');
    for (const s of samples) {
      expect(t).toContain(s);
      expect(plain(s), s).toBe([...plain(s)].reverse().join(''));
    }
  });

  it('věta bez samohlásek a slabikotvorné r, l', () => {
    const t = card('slova.hlasky.strc-prst').text;
    for (const s of [...quoted(t), 'vlk', 'krk']) expect(s.toLocaleLowerCase('cs'), s).not.toMatch(/[aáeéěiíoóuúůyý]/);
  });

  it('ch stojí v české abecedě za h', () => {
    const cs = new Intl.Collator('cs');
    expect(cs.compare('hvězda', 'chleba')).toBeLessThan(0);
    expect(cs.compare('hz', 'ch')).toBeLessThan(0);
    expect(cs.compare('ch', 'i')).toBeLessThan(0);
    const t = card('slova.hlasky.ch').text;
    expect(t).toContain('chleba až za slovem hvězda');
  });

  it('futhark má jméno podle prvních šesti run', () => {
    const runes = ['f', 'u', 'th', 'a', 'r', 'k'];
    expect(runes.join('')).toBe('futhark');
    expect(card('slova.cteni.runy').text).toContain(`(${runes.join(', ')})`);
  });

  it('stejně znějící slova se liší jen i a y', () => {
    const sound = (s: string) => s.replace(/y/g, 'i').replace(/ý/g, 'í');
    const t = card('slova.pravopis.stejne-zni').text.toLocaleLowerCase('cs');
    for (const [a, b] of [['mýt', 'mít'], ['výr', 'vír'], ['vyje', 'vije']]) {
      expect(a).not.toBe(b);
      expect(sound(a)).toBe(sound(b));
      expect(t).toContain(a);
      expect(t).toContain(b);
    }
  });

  it('opravené stránky těla: mapa chutí a modrá krev', () => {
    const fixes = teloCards.filter((c) => c.fix).map((c) => c.fix!.before);
    expect(fixes.some((b) => /mapa chutí/.test(b))).toBe(true);
    expect(fixes.some((b) => /modrá krev/.test(b))).toBe(true);
  });
});

describe('Společné mise fáze 1 – obsah a bezpečí', () => {
  it('tep po skákání: v klidu a po 20 výskocích (přání rodiče)', () => {
    const m = mission('telo.tep');
    expect(m.text).toContain('v klidu');
    expect(m.text).toContain('20 výskoků');
  });

  it('chuťová laboratoř: zavřené oči, dospělý a potraviny bez alergie', () => {
    const m = mission('telo.chutova-laborator');
    expect(m.text).toContain('Zavři oči');
    expect(m.text).toContain('dospělý');
    expect(m.parentTip).toContain('alergii');
  });

  it('spánkový deník: týden, doporučení sedí s úlohami o zdraví, výpočet přes půlnoc', () => {
    const m = mission('telo.spankovy-denik');
    expect(m.text).toContain('týden');
    expect(m.parentTip).toContain('9 až 12 hodin');
    const minutes = (24 * 60 - (20 * 60 + 30)) + 7 * 60; // od 20:30 do 7:00
    expect(minutes / 60).toBe(10.5);
    expect(m.parentTip).toContain('10 a půl hodiny');
  });

  it('mise čísel a slov odpovídají zadání', () => {
    expect(mission('cisla.prochazka').text).toMatch(/sudými.*lichými/);
    expect(mission('cisla.peceni').text).toContain('s dospělým');
    expect(mission('cisla.fazole').text).toContain('po desítkách');
    expect(mission('cisla.fazole').parentTip).toContain('nejsou k jídlu');
    for (const id of ['slova.kniha-hadanek', 'slova.dopis-drakovi', 'slova.slovni-fotbal']) expect(mission(id).island).toBe('slova');
    // slovní fotbal: každé slovo začíná poslední hláskou předchozího
    const chain = mission('slova.slovni-fotbal').text.match(/: ([^…]+)…/)![1].split(' – ');
    expect(chain.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < chain.length; i++) expect(chain[i][0]).toBe(chain[i - 1].at(-1));
  });

  it('nebezpečné věci jen s dospělým a tip vždy radí, na co se ptát', () => {
    for (const m of ALL_MISSIONS) {
      if (/trou[bf]|nůž|sporák|oheň|plotn|plech/i.test(`${m.text} ${m.parentTip}`)) expect(m.text, m.id).toMatch(/dospěl/);
      expect(m.parentTip, m.id).toContain('?');
    }
  });
});
