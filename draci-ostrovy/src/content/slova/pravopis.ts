// Pravopis i/y. U každé úlohy je uložené celé správné slovo (nebo věta)
// i tvar s mezerou „_“, test ověřuje, že do sebe zapadají.
// L2: po tvrdých a měkkých souhláskách (a dy/ty/ny × di/ti/ni podle výslovnosti).
// L3: vyjmenovaná slova × slova, která vyjmenovaná nejsou.
// L4: slova příbuzná, předpona vy-/vý-, záludná slova a dvojice ve větách.

import { choice } from '../../core/czech';
import type { Level, SkillDef } from '../../core/types';
import { assertUniqueKeys, makeGenerator, slug, type Entry, type Pools } from './common';

const ID = 'slova.pravopis';

export interface GapItem {
  key: string;
  /** Slovo nebo věta s jedním „_“. */
  gapped: string;
  /** Celé správné slovo nebo věta. */
  full: string;
  /** Doplněné písmeno (i, í, y, ý). */
  letter: 'i' | 'í' | 'y' | 'ý';
  hints: string[];
  explanation: string;
  options: string[];
}

const HARD = ['h', 'ch', 'k', 'r'];
const SOFT = ['ž', 'š', 'č', 'ř', 'c', 'j'];
const DTN = ['d', 't', 'n'];

/** Doplní písmeno z plného slova podle pozice „_“. */
function letterAt(gapped: string, full: string): GapItem['letter'] {
  const i = gapped.indexOf('_');
  const ch = full[i];
  if (ch !== 'i' && ch !== 'í' && ch !== 'y' && ch !== 'ý') throw new Error(`pravopis: „${full}“ nemá na místě mezery i/y`);
  if (gapped.replace('_', ch) !== full) throw new Error(`pravopis: „${gapped}“ nesedí na „${full}“`);
  return ch;
}

/** Souhláska těsně před mezerou (ch jako jedna hláska). */
function consonantBefore(gapped: string): string {
  const i = gapped.indexOf('_');
  const two = gapped.slice(Math.max(0, i - 2), i).toLowerCase();
  if (two === 'ch') return 'ch';
  return gapped[i - 1].toLowerCase();
}

const isLong = (l: string) => l === 'í' || l === 'ý';
const pairFor = (l: string) => (isLong(l) ? ['í', 'ý'] : ['i', 'y']);
const ALL4 = ['i', 'í', 'y', 'ý'];

// ---------------------------------------------------------------------------
// L2 – tvrdé a měkké souhlásky

const L2_WORDS: [string, string][] = [
  ['r_ba', 'ryba'], ['r_že', 'rýže'], ['r_tíř', 'rytíř'], ['kr_sa', 'krysa'], ['r_s', 'rys'],
  ['ch_ba', 'chyba'], ['ch_tat', 'chytat'], ['k_tka', 'kytka'], ['k_tara', 'kytara'], ['k_selý', 'kyselý'],
  ['k_chat', 'kýchat'], ['h_bat', 'hýbat'], ['poh_b', 'pohyb'], ['dobr_', 'dobrý'], ['drah_', 'drahý'],
  ['hezk_', 'hezký'], ['kor_to', 'koryto'], ['d_ně', 'dýně'], ['d_m', 'dým'], ['d_chat', 'dýchat'],
  ['t_den', 'týden'], ['t_gr', 'tygr'], ['mot_l', 'motýl'], ['t_č', 'tyč'],
  ['ž_rafa', 'žirafa'], ['ž_vot', 'život'], ['ž_žala', 'žížala'], ['š_pka', 'šipka'], ['š_t', 'šít'],
  ['č_slo', 'číslo'], ['č_stý', 'čistý'], ['ř_zek', 'řízek'], ['hř_b', 'hřib'], ['hř_ště', 'hřiště'],
  ['c_bule', 'cibule'], ['c_tron', 'citron'], ['c_hla', 'cihla'], ['j_skra', 'jiskra'], ['j_dlo', 'jídlo'],
  ['j_h', 'jih'], ['př_tel', 'přítel'], ['d_vadlo', 'divadlo'], ['t_cho', 'ticho'], ['n_tka', 'nitka'],
  ['d_tě', 'dítě'],
];

const L2_HINT_SETS = 'Tvrdé souhlásky: h, ch, k, r, d, t, n. Měkké souhlásky: ž, š, č, ř, c, j, ď, ť, ň.';

function l2Item([gapped, full]: [string, string]): GapItem {
  const letter = letterAt(gapped, full);
  const c = consonantBefore(gapped);
  const soft = letter === 'i' || letter === 'í';
  let explanation: string;
  const hints = ['Podívej se na souhlásku před vynechaným písmenem. Je tvrdá, nebo měkká?'];
  if (DTN.includes(c)) {
    hints.push(`Řekni slovo nahlas. Čteš ${c} tvrdě, nebo měkce?`);
    explanation = soft
      ? `Ve slově ${full} čteme ${c}${letter} měkce, a proto píšeme ${letter}.`
      : `Ve slově ${full} čteme ${c}${letter} tvrdě, a proto píšeme ${letter}.`;
  } else if (HARD.includes(c)) {
    hints.push(L2_HINT_SETS);
    explanation = `Po tvrdé souhlásce ${c} píšeme ${letter}: ${full}.`;
  } else if (SOFT.includes(c)) {
    hints.push(L2_HINT_SETS);
    explanation = `Po měkké souhlásce ${c} píšeme ${letter}: ${full}.`;
  } else {
    throw new Error(`pravopis L2: neočekávaná souhláska ${c} v ${gapped}`);
  }
  return { key: slug(full), gapped, full, letter, hints, explanation, options: pairFor(letter) };
}

// ---------------------------------------------------------------------------
// L3 – vyjmenovaná slova

export const VYJMENOVANA: Record<string, string> = {
  b: 'být, bydlit, obyvatel, byt, příbytek, nábytek, dobytek, obyčej, bystrý, bylina, kobyla, býk, Přibyslav',
  l: 'slyšet, mlýn, blýskat se, polykat, plynout, plýtvat, vzlykat, lysý, lýko, lýtko, lyže, pelyněk, plyš',
  m: 'my, mýt, myslit, mýlit se, hmyz, myš, hlemýžď, mýtit, zamykat, smýkat, dmýchat, chmýří, nachomýtnout se, Litomyšl',
  p: 'pýcha, pytel, pysk, netopýr, slepýš, pyl, kopyto, klopýtat, třpytit se, zpytovat, pykat, pýr, pýřit se, čepýřit se',
  s: 'syn, sytý, sýr, syrový, sychravý, usychat, sýkora, sýček, sysel, syčet, sypat',
  v: 'vy, vysoký, výt, výskat, zvykat, žvýkat, vydra, výr, vyžle, povyk, výheň',
  z: 'brzy, jazyk, nazývat se',
};

/** [s mezerou, celé slovo, vyjmenované slovo, nebo null když není vyjmenované]. */
const L3_WORDS: [string, string, string | null][] = [
  ['b_dlit', 'bydlit', 'bydlit'], ['b_strý', 'bystrý', 'bystrý'], ['kob_la', 'kobyla', 'kobyla'],
  ['b_k', 'býk', 'býk'], ['b_lina', 'bylina', 'bylina'], ['ob_čej', 'obyčej', 'obyčej'],
  ['náb_tek', 'nábytek', 'nábytek'], ['dob_tek', 'dobytek', 'dobytek'], ['ml_n', 'mlýn', 'mlýn'],
  ['sl_šet', 'slyšet', 'slyšet'], ['pol_kat', 'polykat', 'polykat'], ['l_tko', 'lýtko', 'lýtko'],
  ['l_ko', 'lýko', 'lýko'], ['pl_š', 'plyš', 'plyš'], ['pl_nout', 'plynout', 'plynout'],
  ['m_š', 'myš', 'myš'], ['hm_z', 'hmyz', 'hmyz'], ['m_slet', 'myslet', 'myslit'],
  ['zam_kat', 'zamykat', 'zamykat'], ['hlem_žď', 'hlemýžď', 'hlemýžď'], ['p_tel', 'pytel', 'pytel'],
  ['p_cha', 'pýcha', 'pýcha'], ['netop_r', 'netopýr', 'netopýr'], ['kop_to', 'kopyto', 'kopyto'],
  ['s_n', 'syn', 'syn'], ['s_kora', 'sýkora', 'sýkora'], ['s_pat', 'sypat', 'sypat'],
  ['s_sel', 'sysel', 'sysel'], ['v_soký', 'vysoký', 'vysoký'], ['v_dra', 'vydra', 'vydra'],
  ['žv_kat', 'žvýkat', 'žvýkat'], ['brz_', 'brzy', 'brzy'], ['jaz_k', 'jazyk', 'jazyk'],
  ['naz_vat', 'nazývat', 'nazývat se'],
  ['b_lý', 'bílý', null], ['ob_lí', 'obilí', null], ['l_st', 'list', null], ['l_ška', 'liška', null],
  ['l_pa', 'lípa', null], ['l_dé', 'lidé', null], ['m_sa', 'mísa', null], ['m_nuta', 'minuta', null],
  ['m_lý', 'milý', null], ['m_ska', 'miska', null], ['m_r', 'mír', null], ['p_la', 'pila', null],
  ['p_smeno', 'písmeno', null], ['p_sek', 'písek', null], ['s_la', 'síla', null], ['s_to', 'síto', null],
  ['s_lnice', 'silnice', null], ['v_dlička', 'vidlička', null], ['v_tr', 'vítr', null], ['v_šně', 'višně', null],
  ['z_ma', 'zima', null], ['z_vat', 'zívat', null],
];

function l3Item([gapped, full, base]: [string, string, string | null]): GapItem {
  const letter = letterAt(gapped, full);
  const c = consonantBefore(gapped);
  const list = VYJMENOVANA[c];
  if (!list) throw new Error(`pravopis L3: ${c} není obojetná souhláska`);
  let explanation: string;
  if (base) {
    explanation = base === full
      ? `Slovo ${full} patří mezi vyjmenovaná slova po ${c}, proto píšeme ${letter}.`
      : `Slovo ${full} patří k vyjmenovanému slovu ${base}, proto píšeme ${letter}.`;
  } else {
    explanation = `Slovo ${full} není vyjmenované ani příbuzné s vyjmenovaným slovem, proto píšeme ${letter}.`;
    if (full === 'zívat') explanation += ' Pozor, se slovem nazývat nemá nic společného.';
    if (full === 'vítr') explanation += ' Se slovem výt nesouvisí.';
  }
  return {
    key: slug(full),
    gapped,
    full,
    letter,
    hints: [
      `Souhláska ${c} je obojetná. Vzpomeň si na vyjmenovaná slova po ${c}.`,
      `Vyjmenovaná slova po ${c}: ${list}.`,
    ],
    explanation,
    options: pairFor(letter),
  };
}

// ---------------------------------------------------------------------------
// L4 – příbuzná slova, předpona vy-/vý-, záludná slova, dvojice ve větách

/** [s mezerou, celé slovo, vyjmenované slovo, ke kterému patří]. */
const L4_RELATED: [string, string, string][] = [
  ['ob_vatel', 'obyvatel', 'bydlit'], ['zb_tek', 'zbytek', 'být'], ['pob_t', 'pobyt', 'být'],
  ['b_ložravec', 'býložravec', 'bylina'], ['ml_nář', 'mlynář', 'mlýn'], ['spol_kat', 'spolykat', 'polykat'],
  ['l_žař', 'lyžař', 'lyže'], ['m_dlo', 'mýdlo', 'mýt'], ['um_vadlo', 'umývadlo', 'mýt'],
  ['m_šlenka', 'myšlenka', 'myslit'], ['om_l', 'omyl', 'mýlit se'], ['m_ška', 'myška', 'myš'],
  ['odem_kat', 'odemykat', 'zamykat'], ['p_tlík', 'pytlík', 'pytel'], ['p_šný', 'pyšný', 'pýcha'],
  ['s_novec', 'synovec', 'syn'], ['nas_tit', 'nasytit', 'sytý'], ['v_ška', 'výška', 'vysoký'],
  ['zv_k', 'zvyk', 'zvykat'], ['žv_kačka', 'žvýkačka', 'žvýkat'], ['jaz_ček', 'jazýček', 'jazyk'],
  ['kop_tko', 'kopýtko', 'kopyto'], ['v_dří', 'vydří', 'vydra'], ['ob_čejný', 'obyčejný', 'obyčej'],
  ['pl_n', 'plyn', 'plynout'],
];

/** Předpona vy-/vý-. */
const L4_PREFIX: [string, string][] = [
  ['v_savač', 'vysavač'], ['v_let', 'výlet'], ['v_brat', 'vybrat'],
];

/** Záludná slova s i/í: [s mezerou, celé slovo, vyjmenované slovo, se kterým
 *  se plete, případná poznámka k vysvětlení]. */
const L4_TRAPS: [string, string, string, string?][] = [
  ['b_lý', 'bílý', 'bylina'], ['v_tr', 'vítr', 'výt'], ['m_sit', 'mísit', 'myslit'],
  ['sl_mák', 'slimák', 'slyšet'], ['l_zátko', 'lízátko', 'lyže'], ['p_skat', 'pískat', 'pysk'],
  ['sv_tit', 'svítit', 'blýskat se'], ['sl_bit', 'slíbit', 'slyšet'], ['zv_ře', 'zvíře', 'zvykat'],
  ['l_pa', 'lípa', 'lýko', 'Lipové lýko se sice používalo třeba na provazy, ale slova lípa a lýko příbuzná nejsou.'],
];

/** Dvojice ve větách: [klíč, věta s mezerou, celá věta, vysvětlení]. */
const L4_SENTENCES: [string, string, string, string][] = [
  ['byt-veterinarkou', '{Chtěla|Chtěl} bych b_t {veterinářkou|veterinářem}.', '{Chtěla|Chtěl} bych být {veterinářkou|veterinářem}.', 'Být (existovat, stát se někým) je vyjmenované slovo, píšeme ý.'],
  ['srdce-bije', 'Srdce mi b_je radostí.', 'Srdce mi bije radostí.', 'Bije je od slovesa bít (tlouct). To není vyjmenované slovo, píšeme i.'],
  ['myt-ruce', 'Před jídlem si musím m_t ruce.', 'Před jídlem si musím mýt ruce.', 'Mýt (umývat) je vyjmenované slovo, píšeme ý.'],
  ['mit-psa', '{Chtěla|Chtěl} bych m_t psa.', '{Chtěla|Chtěl} bych mít psa.', 'Mít (vlastnit) není vyjmenované slovo, píšeme í.'],
  ['vyr-houka', 'V noci houká v_r.', 'V noci houká výr.', 'Výr je sova a patří mezi vyjmenovaná slova po v, píšeme ý.'],
  ['vir-voda', 'Voda se točila ve v_ru.', 'Voda se točila ve víru.', 'Vír je točící se voda nebo vzduch. Není vyjmenovaný, píšeme í.'],
  ['pyl-vcely', 'Včely sbírají p_l z květů.', 'Včely sbírají pyl z květů.', 'Pyl z květů je vyjmenované slovo po p, píšeme y.'],
  ['pil-caj', 'Děda p_l horký čaj.', 'Děda pil horký čaj.', 'Pil je od slovesa pít. To není vyjmenované slovo, píšeme i.'],
  ['lyze-jezdime', 'V zimě jezdíme na l_žích.', 'V zimě jezdíme na lyžích.', 'Lyže je vyjmenované slovo po l, píšeme y.'],
  ['lize-pes', 'Pes mi l_že ruku.', 'Pes mi líže ruku.', 'Líže je od slovesa lízat. To není vyjmenované slovo, píšeme í.'],
  ['vi-maminka', 'Maminka to v_.', 'Maminka to ví.', 'Ví je od slovesa vědět. Není vyjmenované, píšeme í.'],
  ['vy-kamaradi', 'V_ jste naši kamarádi.', 'Vy jste naši kamarádi.', 'Vy je zájmeno (já, ty, on, my, vy, oni) a patří mezi vyjmenovaná slova, píšeme y.'],
  ['my-v-lese', 'M_ jsme byli v lese.', 'My jsme byli v lese.', 'My (zájmeno) je vyjmenované slovo, píšeme y.'],
  ['mi-knizku', 'Podej m_ tu knížku.', 'Podej mi tu knížku.', 'Mi je krátký tvar zájmena já (komu? mně, mi). Není vyjmenované, píšeme i.'],
  ['odbily-poledne', 'Hodiny odb_ly poledne.', 'Hodiny odbily poledne.', 'Odbily je od slovesa odbít, které vzniklo ze slova bít (tlouct). Není vyjmenované, píšeme i.'],
  ['odbyt-ukol', 'Úkol nesmíš odb_t.', 'Úkol nesmíš odbýt.', 'Odbýt (udělat něco rychle a špatně) je příbuzné se slovem být, píšeme ý.'],
  ['vyje-vlk', 'V lese v_je vlk.', 'V lese vyje vlk.', 'Vyje je od slovesa výt, které patří mezi vyjmenovaná slova, píšeme y.'],
  ['viji-venecky', 'Děti v_jí věnečky z kopretin.', 'Děti vijí věnečky z kopretin.', 'Vijí je od slovesa vít (splétat). Není vyjmenované, píšeme i.'],
  ['zmyli-kazdy', 'Každý se někdy zm_lí.', 'Každý se někdy zmýlí.', 'Zmýlit se je příbuzné s vyjmenovaným slovem mýlit se, píšeme ý.'],
  ['mila-babicka', 'Moje m_lá babička peče buchty.', 'Moje milá babička peče buchty.', 'Milá není vyjmenované ani příbuzné slovo, píšeme i.'],
  ['nabit-tablet', 'Tablet se musí nab_t.', 'Tablet se musí nabít.', 'Nabít (dobít baterii) je od slovesa bít. Není vyjmenované, píšeme í.'],
  ['bylo-hezky', 'Venku b_lo hezky.', 'Venku bylo hezky.', 'Bylo je od slovesa být, které je vyjmenované, píšeme y.'],
  ['bilo-srdce', 'Srdce jí b_lo rychle.', 'Srdce jí bilo rychle.', 'Bilo je od slovesa bít (tlouct). Není vyjmenované, píšeme i.'],
];

const L4_HINT_1 = 'Zeptej se: Je to vyjmenované slovo, nebo slovo s ním příbuzné?';

function l4Items(): GapItem[] {
  const out: GapItem[] = [];
  for (const [gapped, full, base] of L4_RELATED) {
    const letter = letterAt(gapped, full);
    out.push({
      key: slug(full), gapped, full, letter, options: ALL4,
      hints: [L4_HINT_1, 'Najdi k tomuto slovu slovo, ze kterého vzniklo nebo se kterým souvisí.'],
      explanation: `Slovo ${full} je příbuzné s vyjmenovaným slovem ${base}, proto píšeme ${letter}.`,
    });
  }
  for (const [gapped, full] of L4_PREFIX) {
    const letter = letterAt(gapped, full);
    out.push({
      key: slug(full), gapped, full, letter, options: ALL4,
      hints: ['Začíná slovo předponou?', 'Předpona vy-, vý- se píše pořád stejně.'],
      explanation: `Slovo ${full} začíná předponou ${full.slice(0, 2)}- a ta se píše vždy s ${letter}.`,
    });
  }
  for (const [gapped, full, trap, note] of L4_TRAPS) {
    const letter = letterAt(gapped, full);
    out.push({
      key: slug(full), gapped, full, letter, options: ALL4,
      hints: [L4_HINT_1, `Nenech se zmást slovem ${trap}. Jsou tato slova opravdu příbuzná?`],
      explanation: `Slovo ${full} není příbuzné se slovem ${trap} ani s jiným vyjmenovaným slovem, proto píšeme ${letter}.${note ? ` ${note}` : ''}`,
    });
  }
  for (const [key, gapped, full, why] of L4_SENTENCES) {
    const letter = letterAt(gapped, full);
    out.push({
      key, gapped, full, letter, options: ALL4,
      hints: ['Přečti si celou větu. Co v ní slovo znamená?', 'Stejně znějící slova se mohou psát různě podle toho, co znamenají.'],
      explanation: why,
    });
  }
  return out;
}

export const GAP_ITEMS: Record<2 | 3 | 4, GapItem[]> = {
  2: L2_WORDS.map(l2Item),
  3: L3_WORDS.map(l3Item),
  4: l4Items(),
};

const SPEAK_LETTER: Record<string, string> = { i: 'měkké i', í: 'dlouhé měkké í', y: 'tvrdé y', ý: 'dlouhé tvrdé ý' };

function entry(g: GapItem): Entry {
  const sentence = /\s/.test(g.gapped);
  const optsText = g.options.length === 2 ? `${g.options[0]}, nebo ${g.options[1]}` : 'i, í, y, nebo ý';
  const optsSpeak = g.options.map((o) => SPEAK_LETTER[o]).join(', nebo ');
  return {
    key: g.key,
    build: (rng) => ({
      prompt: sentence ? `Které písmeno chybí ve větě? Doplň ${optsText}.` : `Které písmeno chybí? Doplň ${optsText}.`,
      speak: `Doplň ${optsSpeak}. ${sentence ? 'Věta' : 'Slovo'}: ${g.full}${sentence ? '' : '.'}`,
      visual: { type: 'big', text: g.gapped },
      answer: choice(rng, g.letter, g.options.filter((o) => o !== g.letter)),
      hints: g.hints,
      explanation: g.explanation,
    }),
  };
}

const levels: Level[] = [2, 3, 4];

export const pools: Pools = {
  2: GAP_ITEMS[2].map(entry),
  3: GAP_ITEMS[3].map(entry),
  4: GAP_ITEMS[4].map(entry),
};
assertUniqueKeys(ID, pools);

export const pravopis: SkillDef = {
  id: ID,
  island: 'slova',
  name: 'Pravopis i/y',
  description: 'Doplňuje i/y po tvrdých a měkkých souhláskách, ve vyjmenovaných a příbuzných slovech a rozlišuje stejně znějící slova podle významu.',
  levels,
  rvp: {
    2: ['ČJL-3-2-08'],
    3: ['ČJL-3-2-08'],
    4: ['ČJL-5-2-08'],
  },
  ability: 'slovni',
  generate: makeGenerator(ID, levels, pools),
};
