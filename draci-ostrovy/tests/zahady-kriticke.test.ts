import { describe, expect, it } from 'vitest';
import { enumerateItems } from '../src/core/bank';
import { createRng } from '../src/core/rng';
import type { Item, Level, SkillDef } from '../src/core/types';
import { kritickeCards, kritickeMissions, kritickeSkills } from '../src/content/zahady/kriticke';
// Jen kvůli kontrole překryvu s „Fakt, nebo pohádka?“ na Ostrově těla (hotový ostrov z fáze 1).
import { enumerateItems as enumerateTelo } from '../src/content/telo/common';
import { faktPohadka } from '../src/content/telo/faktPohadka';
import { sweepSkill, validateCards, validateItem, validateMissions } from './validate';

const EXPECTED_LEVELS: Record<string, Level[]> = {
  'zahady.jak-to-vime': [1, 2, 3, 4],
  'zahady.fakt-nazor': [1, 2, 3, 4],
  'zahady.mytus': [1, 2, 3, 4, 5],
  'zahady.reklama': [2, 3, 4, 5],
  'zahady.detektiv': [2, 3, 4, 5],
};

/** Kódy RVP ZV 2021, které jsme ověřili v plném textu a které dovednosti smějí používat. */
const RVP_OVERENE = new Set([
  'ČJS-3-4-02', 'ČJS-3-4-03', 'ČJS-5-2-03', 'ČJS-5-4-02', 'ČJS-5-4-04', 'ČJS-5-4-06',
  'ČJL-3-1-01', 'ČJL-5-1-01', 'ČJL-5-1-02', 'ČJL-5-1-06', 'M-5-4-01', 'I-5-1-01',
]);

const FAKT_ASK = /^„(.+[.!?])“ Je to fakt, nebo názor\?$/;
const MYTUS_ASK = /^„(.+[.!?])“ Je to pravda, nebo mýtus\?$/;
const TELO_ASK = /^„(.+)“ Je to fakt, nebo pohádka\?$/;

/** Slova, podle kterých je ve vysvětlení mýtu poznat, JAK se to zjistilo. */
const JAK_TO_VIME = /(pozor|měř|pokus|zkouš|přístroj|kamer|fot|dalekohled|sond|zkoum|spočít|počít|zjist|natáč|natoč|kroužk|astronom|astronaut|vědc|vědec|lékař|veterinář|ornitolog|zoolog|botanik|meteorolog|přírodověd|výprav|zkamen|ochutn|odborní|porovn|vážil|teploměr|urči)/i;

/** Strašidelná a nevhodná témata (smrt, krev, zločin, válka). */
const STRASIDELNE = /(smrt|zemř|umř|umír|zabi|zabí|sežr|sežer|krev|krví|krve|válk|vražd|zloč|zloděj|ukrad|krade|kradl|zranil|policie)/i;

/** Ženský tvar o hráči (2. osoba) bez značky {ženský|mužský}: „abys měla“,
 *  „Viděla jsi“, „aby ses bála“, „budeš smutná“. Postavy ve 3. osobě tvar
 *  „jsi/bys/sis/ses“ nemají, takže tu nevadí. */
const UNMARKED_FEMININE =
  /(?<!\p{L})(?:(?:jsi|bys|abys|kdybys|sis|ses)(?: (?:to|ho|ji|je|si|se|mu|jí|už|opravdu|nejvíc))? \p{L}+la|\p{L}+la (?:jsi|bys|sis|ses)|(?:jsi|budeš|buď) \p{L}+á)(?!\p{L})/iu;
const withoutMarks = (t: string) => t.replace(/\{[^{}|]*\|[^{}|]*\}/g, '');

/** Skutečné značky, které se v reklamách nesmějí objevit (jen vymyšlené).
 *  „Dračí síla“ jsou skutečné bylinné kapky, „Sluneční zahrada“ skutečná dílna. */
const SKUTECNE_ZNACKY = /(kofola|tatranka|horalk|kinder|lentilk|míša|brumík|pribináček|kubík|fidork|orion|opavia|milka|nutella|lego|barbie|mcdonald|coca|pepsi|youtube|tiktok|instagram|nesquik|granko|haribo|disney|dračí síla|sluneční zahrada)/i;

function itemsOf(skill: SkillDef): Item[] {
  return skill.levels.flatMap((level) => enumerateItems(skill.id, level));
}

function skill(id: string): SkillDef {
  const s = kritickeSkills.find((x) => x.id === id);
  if (!s) throw new Error(`chybí dovednost ${id}`);
  return s;
}

function correctLabel(item: Item): string | null {
  return item.answer.kind === 'choice' ? item.answer.options[item.answer.correct].label : null;
}

function labels(item: Item): string[] {
  return item.answer.kind === 'choice' ? item.answer.options.map((o) => o.label) : [];
}

function texts(item: Item): string[] {
  const out = [item.prompt, item.explanation, ...item.hints];
  if (item.speak) out.push(item.speak);
  if (item.visual?.type === 'reading') out.push(item.visual.title, item.visual.text);
  if (item.answer.kind === 'choice') for (const o of item.answer.options) out.push(o.label, ...(o.speak ? [o.speak] : []));
  if (item.answer.kind === 'order') out.push(...item.answer.correct);
  return out;
}

/** Tvrzení bez uvozovek a interpunkce, malými písmeny – kvůli porovnání. */
const normalize = (s: string) => s.toLocaleLowerCase('cs').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const words = (s: string) => new Set(normalize(s).split(' ').filter((w) => w.length > 2));

/** Podobnost dvou tvrzení: podíl společných slov (Jaccard). */
function overlap(a: string, b: string): number {
  const A = words(a);
  const B = words(b);
  const shared = [...A].filter((w) => B.has(w)).length;
  return shared / Math.max(1, new Set([...A, ...B]).size);
}

/** Tvrzení z úloh s pevnými tlačítky (Fakt × Názor, Pravda × Mýtus). */
function statements(skillId: string, ask: RegExp): { level: Level; id: string; statement: string; first: boolean }[] {
  const s = skill(skillId);
  const out: { level: Level; id: string; statement: string; first: boolean }[] = [];
  for (const level of s.levels) {
    for (const item of enumerateItems(skillId, level)) {
      const m = item.prompt.match(ask);
      if (!m || item.answer.kind !== 'choice') continue;
      out.push({ level, id: item.id, statement: m[1], first: item.answer.correct === 0 });
    }
  }
  return out;
}

const allItems = kritickeSkills.flatMap(itemsOf);

describe('Ostrov záhad, kritické myšlení – dovednosti', () => {
  it('má pět dovedností se správnými id, ostrovem, úrovněmi a kódy RVP', () => {
    expect(kritickeSkills.map((s) => s.id).sort()).toEqual(Object.keys(EXPECTED_LEVELS).sort());
    for (const s of kritickeSkills) {
      expect(s.island).toBe('zahady');
      expect(s.levels, s.id).toEqual(EXPECTED_LEVELS[s.id]);
      expect(s.ability, s.id).toBe('usuzovani');
      expect(s.open, s.id).toBeUndefined();
      expect(s.name.trim(), s.id).not.toBe('');
      expect(s.description.trim(), s.id).toMatch(/\.$/);
      for (const level of s.levels) {
        const codes = s.rvp[level] ?? [];
        if (level <= 5) expect(codes.length, `${s.id} L${level} RVP`).toBeGreaterThan(0);
        for (const code of codes) {
          expect(code).toMatch(/^[A-ZČŠŽ]{1,4}-[35]-\d-\d{2}$/);
          expect(RVP_OVERENE.has(code), `${s.id}: kód ${code} není mezi ověřenými`).toBe(true);
        }
      }
      for (const lv of Object.keys(s.rvp)) expect(s.levels, `${s.id}: RVP pro úroveň ${lv}`).toContain(Number(lv));
    }
    expect(kritickeSkills.some((s) => s.id === 'zahady.reklama' && s.rvp[5]?.includes('ČJL-5-1-06'))).toBe(true);
  });

  for (const s of kritickeSkills) {
    it(`${s.id}: sweep bez chyb a aspoň 15 různých úloh na úroveň`, () => {
      const { errors, distinct } = sweepSkill(s, 300);
      expect(errors).toEqual([]);
      for (const level of s.levels) expect(distinct[level], `${s.id} L${level}`).toBeGreaterThanOrEqual(15);
    });

    it(`${s.id}: každá otázka z banky je platná a jedinečná`, () => {
      for (const level of s.levels) {
        const items = enumerateItems(s.id, level);
        expect(items.length, `${s.id} L${level}`).toBeGreaterThanOrEqual(15);
        for (const item of items) expect(validateItem(item, s, level)).toEqual([]);
        const ids = items.map((i) => i.id);
        expect(new Set(ids).size, `duplicitní klíče v ${s.id} L${level}`).toBe(ids.length);
        const prompts = items.map((i) => `${i.prompt}|${JSON.stringify(i.visual ?? null)}`);
        expect(new Set(prompts).size, `duplicitní zadání v ${s.id} L${level}`).toBe(prompts.length);
      }
    });
  }

  it('stejné semínko = stejná úloha', () => {
    for (const s of kritickeSkills) {
      for (const level of s.levels) expect(s.generate(level, createRng(42))).toEqual(s.generate(level, createRng(42)));
    }
  });

  it('stejné id = stejné zadání, vizuál i správná odpověď (400 semínek)', () => {
    const seen = new Map<string, string>();
    for (const s of kritickeSkills) {
      for (const level of s.levels) {
        for (let seed = 1; seed <= 400; seed++) {
          const item = s.generate(level, createRng(seed));
          const a = item.answer;
          const answer = a.kind === 'choice' ? a.options[a.correct].label : a.kind === 'order' ? a.correct.join('|') : '';
          const content = `${item.prompt}|${JSON.stringify(item.visual ?? null)}|${answer}`;
          const before = seen.get(item.id);
          if (before !== undefined) expect(content, item.id).toBe(before);
          seen.set(item.id, content);
        }
      }
    }
  });

  it('úroveň mimo rozsah dovednosti vrátí nejbližší úroveň', () => {
    for (const s of kritickeSkills) {
      const item = s.generate(6, createRng(7));
      const top = s.levels[s.levels.length - 1];
      expect(item.id.startsWith(`${s.id}:${top}:`), item.id).toBe(true);
    }
  });
});

describe('Fakt, nebo názor?', () => {
  const s = skill('zahady.fakt-nazor');
  const all = statements(s.id, FAKT_ASK);

  it('tvrzení mají tlačítka Fakt a Názor a v každé úrovni je 35–65 % faktů', () => {
    for (const level of s.levels) {
      const items = enumerateItems(s.id, level).filter((i) => FAKT_ASK.test(i.prompt));
      expect(items.length, `L${level}`).toBeGreaterThanOrEqual(10);
      for (const item of items) {
        expect(labels(item), item.id).toEqual(['Fakt', 'Názor']);
        // Hra po chybě napíše „Správně je Fakt.“, vysvětlení to nemá opakovat.
        expect(item.explanation, item.id).not.toMatch(/^(Fakt|Názor)\b/);
        expect(item.speak, item.id).toBe(item.prompt.replace(/[„“]/g, ''));
      }
      const facts = all.filter((x) => x.level === level && x.first).length / items.length;
      expect(facts, `L${level}: podíl faktů`).toBeGreaterThanOrEqual(0.35);
      expect(facts, `L${level}: podíl faktů`).toBeLessThanOrEqual(0.65);
    }
  });

  it('L3–L4 mají i věty, ve kterých je fakt i názor, a správná část je opravdu ve větě', () => {
    for (const level of [3, 4] as Level[]) {
      const parts = enumerateItems(s.id, level).filter((i) => /^„.+“ (Která část věty|Které slovo)/.test(i.prompt));
      expect(parts.length, `L${level}`).toBeGreaterThanOrEqual(4);
      for (const item of parts) {
        const sentence = normalize(item.prompt.match(/^„(.+)“/)![1]);
        for (const w of normalize(correctLabel(item)!).split(' ')) expect(sentence.split(' '), `${item.id}: „${w}“`).toContain(w);
      }
    }
  });

  it('názory mají hodnoticí slovo a fakta ho nemají (kromě faktů o tom, co kdo řekl)', () => {
    // „Studený“ je pocit (karta Číslo, nebo pocit?), takže nesmí být ani ve faktech.
    const hodnoceni = /(nej|super|krásn|hezk|hezč|nudn|výborn|otravn|roztomil|zábav|lepší|hůř|strašně|smutn|kouzeln|chytřejší|zajímavější|moc |málo|drahé|brzo|podle mě|studen)/i;
    for (const x of all) {
      if (!x.first) expect(x.statement, x.id).toMatch(hodnoceni);
      else if (!/(řekla|anketě|doporučují)/.test(x.statement)) {
        expect(x.statement.replace(/nejvyšší|nejdelší|největší|mezi prvními/gi, ''), x.id).not.toMatch(hodnoceni);
      }
    }
  });
});

describe('Mýtus, nebo pravda?', () => {
  const s = skill('zahady.mytus');
  const all = statements(s.id, MYTUS_ASK);

  it('každá úloha má tlačítka Pravda a Mýtus a v každé úrovni je 35–65 % pravd', () => {
    for (const level of s.levels) {
      const items = enumerateItems(s.id, level);
      for (const item of items) {
        expect(item.prompt, item.id).toMatch(MYTUS_ASK);
        expect(labels(item), item.id).toEqual(['Pravda', 'Mýtus']);
        expect(item.explanation, item.id).not.toMatch(/^(Pravda|Mýtus)\b/);
      }
      const truths = all.filter((x) => x.level === level && x.first).length / items.length;
      expect(truths, `L${level}: podíl pravd`).toBeGreaterThanOrEqual(0.35);
      expect(truths, `L${level}: podíl pravd`).toBeLessThanOrEqual(0.65);
    }
  });

  it('vysvětlení vždy říká, jak se to zjistilo', () => {
    for (const item of itemsOf(s)) expect(item.explanation, item.id).toMatch(JAK_TO_VIME);
  });

  it('nejisté a sporné mýty tu nejsou (chameleon a barva, slon a myš)', () => {
    for (const x of all) expect(x.statement, x.id).not.toMatch(/chameleon|slon.*myš/i);
  });

  it('draci z pohádek jsou vždy mýtus, skuteční „draci“ (varan, dráček létavý) nechrlí oheň', () => {
    for (const x of all) {
      if (/chrlí|chrlících|ohniv/i.test(x.statement)) expect(x.first, `${x.id}: ohnivý drak musí být mýtus`).toBe(false);
    }
    const real = all.filter((x) => /komodský varan je největší|dráček létavý je skutečná/i.test(x.statement));
    expect(real.length).toBe(2);
    for (const x of real) expect(x.first, x.id).toBe(true);
  });
});

describe('Tvrzení se neopakují', () => {
  const fakty = statements('zahady.fakt-nazor', FAKT_ASK);
  const myty = statements('zahady.mytus', MYTUS_ASK);
  const vsechna = [...fakty, ...myty];

  it('žádné tvrzení se neopakuje napříč úrovněmi ani mezi oběma dovednostmi', () => {
    const seen = new Map<string, string>();
    for (const x of vsechna) {
      const key = normalize(x.statement);
      expect(seen.has(key), `${x.id} opakuje ${seen.get(key)}`).toBe(false);
      seen.set(key, x.id);
    }
    for (let i = 0; i < vsechna.length; i++) {
      for (let j = i + 1; j < vsechna.length; j++) {
        const a = vsechna[i];
        const b = vsechna[j];
        expect(overlap(a.statement, b.statement), `${a.id} × ${b.id}`).toBeLessThan(0.7);
      }
    }
  });

  it('žádné tvrzení nekopíruje „Fakt, nebo pohádka?“ z Ostrova těla', () => {
    const telo = faktPohadka.levels.flatMap((l) => enumerateTelo(faktPohadka.id, l))
      .map((i) => i.prompt.match(TELO_ASK)?.[1])
      .filter((x): x is string => !!x);
    expect(telo.length).toBeGreaterThan(50);
    for (const x of vsechna) {
      for (const t of telo) {
        expect(normalize(x.statement), `${x.id} = „${t}“`).not.toBe(normalize(t));
        expect(overlap(x.statement, t), `${x.id} se podobá „${t}“`).toBeLessThan(0.6);
      }
    }
    // Zlatá rybka a žirafí krk jsou na Ostrově těla – tady nejsou ani jako tvrzení.
    for (const x of vsechna) expect(x.statement, x.id).not.toMatch(/zlatá rybka|žiraf/i);
  });
});

describe('Reklama a detektivka', () => {
  const rek = itemsOf(skill('zahady.reklama'));
  const det = itemsOf(skill('zahady.detektiv'));

  it('reklamy používají jen vymyšlené značky', () => {
    for (const item of rek) for (const t of texts(item)) expect(t, item.id).not.toMatch(SKUTECNE_ZNACKY);
  });

  it('otázky „reklama, zpráva, nebo pohádka?“ mají stálá tlačítka a v každé úrovni aspoň dvě', () => {
    const druhy = rek.filter((i) => i.prompt.endsWith('Je to reklama, zpráva, nebo pohádka?'));
    for (const item of druhy) expect(labels(item), item.id).toEqual(['Reklama', 'Zpráva', 'Pohádka']);
    for (const level of [2, 3, 4] as Level[]) {
      expect(druhy.filter((i) => i.level === level).length, `L${level}`).toBeGreaterThanOrEqual(2);
    }
    const correct = new Set(druhy.map((i) => correctLabel(i)));
    expect([...correct].sort()).toEqual(['Pohádka', 'Reklama', 'Zpráva']);
  });

  it('většina úloh o reklamě má krátkou vymyšlenou reklamu k přečtení', () => {
    const withAd = rek.filter((i) => i.visual?.type === 'reading').length;
    expect(withAd / rek.length).toBeGreaterThan(0.45);
  });

  it('detektivky jsou krátké útulné příběhy (3–8 vět) bez zločinu a násilí', () => {
    let stories = 0;
    for (const item of det) {
      if (item.visual?.type !== 'reading') continue;
      stories++;
      // Číslování nápověd („1. Poklad není…“) se za větu nepočítá.
      const body = item.visual.text.replace(/(^|\n)\d+\.\s/g, '$1');
      const sentences = (body.match(/[.!?…](?=[“"]?(\s|$))/g) ?? []).length;
      expect(sentences, `${item.id}: ${sentences} vět`).toBeGreaterThanOrEqual(3);
      expect(sentences, `${item.id}: ${sentences} vět`).toBeLessThanOrEqual(8);
    }
    expect(stories / det.length).toBeGreaterThan(0.9);
  });

  it('otázka „kdo to byl?“ nabízí jen postavy, které v příběhu opravdu jsou', () => {
    const jmena = /^(Ingrid|Freja|Leif|Tove|Erik|Sigrid|Runa|Knut|Liv|Ivar|Ola|Dag|Alva|Bo|Jonas|Maja|Tom|Anna|Petr|Jiskra|Vlnka|Mech|Uhlík|Ohnivec|Jiskřička|Mlhoun|Hvězdička|Kapka|Perla)$/;
    let checked = 0;
    for (const item of det) {
      if (!/-kdo$/.test(item.id) || item.visual?.type !== 'reading') continue;
      const story = normalize(item.visual.text).split(' ');
      for (const n of labels(item).filter((l) => jmena.test(l))) {
        // Jméno se skloňuje (Freja → Frejině), stačí shoda kmene.
        const name = normalize(n);
        const stem = name.length > 4 ? name.slice(0, -1) : name;
        const found = story.some((w) => (name.length > 4 ? w.startsWith(stem) : w === name));
        expect(found, `${item.id}: ${n} v příběhu není`).toBe(true);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(20);
  });
});

describe('Karty a mise', () => {
  it('karty projdou kontrolou, každá dovednost má aspoň tři a aspoň čtyři jsou opravené stránky', () => {
    expect(validateCards(kritickeCards, kritickeSkills)).toEqual([]);
    for (const s of kritickeSkills) {
      expect(kritickeCards.filter((c) => c.skillId === s.id).length, s.id).toBeGreaterThanOrEqual(3);
    }
    const fixes = kritickeCards.filter((c) => c.fix);
    expect(fixes.length).toBeGreaterThanOrEqual(4);
    const topics = fixes.map((c) => c.id).join(' ');
    for (const t of ['pstros', 'netopyri', 'blesk', 'zlata-rybka']) expect(topics).toContain(t);
    for (const c of fixes) {
      expect(c.fix!.before, c.id).toMatch(/[.!?…]$/);
      expect(c.fix!.evidence, c.id).toMatch(/[.!?…]$/);
    }
  });

  it('jedna opravená stránka ukazuje, že i vědci mění názor podle nového důkazu', () => {
    expect(kritickeCards.some((c) => c.fix && /mění názor/.test(c.text))).toBe(true);
  });

  it('čtyři mise projdou kontrolou', () => {
    expect(validateMissions(kritickeMissions, 'zahady')).toEqual([]);
    expect(kritickeMissions.map((m) => m.id).sort()).toEqual([
      'zahady.detektiv-reklam', 'zahady.overeni-mytu', 'zahady.tyden-jak-to-vis', 'zahady.vecere',
    ]);
  });
});

describe('Texty', () => {
  it('výběr má 3–4 možnosti, krátké, s velkým písmenem, tečka buď u všech (celé věty), nebo u žádné', () => {
    for (const item of allItems) {
      const a = item.answer;
      if (a.kind !== 'choice') continue;
      const fixed = ['Fakt', 'Pravda', 'Reklama'].includes(a.options[0].label) && ['Názor', 'Mýtus', 'Zpráva'].includes(a.options[1].label);
      if (!fixed) expect(a.options.length, item.id).toBeGreaterThanOrEqual(3);
      for (const o of a.options) {
        expect(o.label.length, `${item.id}: „${o.label}“`).toBeLessThanOrEqual(40);
        expect(o.label, item.id).toMatch(/^[\p{Lu}\d]/u);
      }
      const dots = a.options.filter((o) => o.label.endsWith('.')).length;
      expect(dots === 0 || dots === a.options.length, `${item.id}: tečky jen u některých možností`).toBe(true);
    }
  });

  it('zadání ani nápověda neprozrazují správnou odpověď', () => {
    for (const item of allItems) {
      const label = correctLabel(item);
      if (!label || item.answer.kind !== 'choice' || item.answer.options.length === 2) continue;
      if (/^„.+“ (Která část věty|Které slovo)/.test(item.prompt)) continue;
      if (item.prompt.endsWith('Je to reklama, zpráva, nebo pohádka?')) continue;
      const needle = new RegExp(`(^|[^\\p{L}])${label.toLocaleLowerCase('cs').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}]|$)`, 'u');
      for (const t of [item.prompt, ...item.hints]) {
        expect(needle.test(t.toLocaleLowerCase('cs')), `${item.id}: „${t}“ prozrazuje „${label}“`).toBe(false);
      }
    }
  });

  it('texty jsou čisté: interpunkce, české uvozovky, krátká zadání, bez strašidelných témat a zakázaných jmen', () => {
    const cardTexts = kritickeCards.flatMap((c) => [c.title, c.text, c.fix?.before ?? '', c.fix?.evidence ?? '']);
    const missionTexts = kritickeMissions.flatMap((m) => [m.title, m.text, m.parentTip]);
    for (const t of [...cardTexts, ...missionTexts]) {
      expect(t).not.toMatch(STRASIDELNE);
      expect(t).not.toMatch(/["']|\s{2,}|\s[,.?!]|(^|[^\p{L}])em+a([^\p{L}]|$)/iu);
    }
    for (const item of allItems) {
      expect(item.prompt, item.id).toMatch(/[.?!]$/);
      expect(item.prompt.length, item.id).toBeLessThanOrEqual(200);
      expect(item.explanation, item.id).toMatch(/[.!]$/);
      expect(item.hints.length, item.id).toBeGreaterThanOrEqual(1);
      for (const h of item.hints) expect(h, item.id).toMatch(/[.?!…]$/);
      for (const t of texts(item)) {
        expect(t, item.id).not.toMatch(/\s{2,}|^\s|\s$/);
        expect(t, item.id).not.toMatch(/["']/);
        expect(t, item.id).not.toMatch(/\s[,.?!]/);
        expect(t, item.id).not.toMatch(STRASIDELNE);
        expect(t.toLocaleLowerCase('cs'), item.id).not.toMatch(/kniha draků|(^|[^\p{L}])em+a([^\p{L}]|$)/u);
      }
    }
  });

  it('počty uvozovek sedí: každé „ má svoje “', () => {
    for (const item of allItems) {
      for (const t of texts(item)) {
        expect((t.match(/„/g) ?? []).length, `${item.id}: ${t}`).toBe((t.match(/“/g) ?? []).length);
      }
    }
  });

  it('všech pět dovedností ukazuje vysvětlení jako zajímavost i po správné odpovědi', () => {
    for (const s of kritickeSkills) expect(s.showFact, s.id).toBe(true);
  });

  it('hráče oslovují značky {ženský|mužský}: žádný ženský tvar o hráči bez značky', () => {
    // „abys měla“, „Viděla jsi“, „budeš smutná“ – 2. osoba, takže vždy o hráči.
    const cardTexts = kritickeCards.flatMap((c) => [c.title, c.text, c.fix?.before ?? '', c.fix?.evidence ?? '']);
    const missionTexts = kritickeMissions.flatMap((m) => [m.title, m.text, m.parentTip]);
    for (const t of [...allItems.flatMap(texts), ...cardTexts, ...missionTexts]) {
      expect(withoutMarks(t), t).not.toMatch(UNMARKED_FEMININE);
    }
    // Tipy pro rodiče mluví o dítěti ve 3. osobě – „dcera“ jen se značkou.
    for (const t of missionTexts) expect(withoutMarks(t), t).not.toMatch(/(^|[^\p{L}])dcer/u);
  });
});

describe('Mýtus o tučňácích (připomínka maminky)', () => {
  it('lední medvědi ve vysvětlení navazují na otázku: žijí na severu místo tučňáků', () => {
    const item = enumerateItems('zahady.mytus', 2).find((i) => i.id.endsWith(':tucnaci-sever'))!;
    expect(item.explanation).toMatch(/na severním pólu žádní nejsou/);
    expect(item.explanation).toMatch(/místo nich žijí lední medvědi/);
  });
});
