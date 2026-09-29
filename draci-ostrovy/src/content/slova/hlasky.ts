// Hlásky a velká písmena: délka samohlásek, ú/ů, dě/tě/ně, bě/pě/vě, mě/mně
// (až od L3) a velká písmena na začátku věty a u vlastních jmen.

import { choice } from '../../core/czech';
import type { Level, SkillDef } from '../../core/types';
import { assertUniqueKeys, makeGenerator, slug, type Draft, type Entry, type Pools } from './common';
import type { Rng } from '../../core/rng';

const ID = 'slova.hlasky';

// ---------------------------------------------------------------------------
// Pomocníci

const LONG: Record<string, string> = { a: 'á', e: 'é', i: 'í', u: 'ú', y: 'ý', o: 'ó' };

/** Délka samohlásky: [s mezerou, celé slovo]. */
function vowel(gapped: string, full: string): Entry {
  const i = gapped.indexOf('_');
  const letter = full[i];
  const short = Object.keys(LONG).find((k) => k === letter || LONG[k] === letter);
  if (!short || gapped.replace('_', letter) !== full) throw new Error(`hlasky: špatná data ${gapped}/${full}`);
  const long = LONG[short];
  const isLong = letter === long;
  return {
    key: `delka-${slug(full)}`,
    build: (rng) => ({
      prompt: `Které písmeno chybí? Doplň ${short}, nebo ${long}.`,
      speak: `Doplň krátké ${short}, nebo dlouhé ${long}. Slovo: ${full}.`,
      visual: { type: 'big', text: gapped },
      answer: choice(rng, letter, [isLong ? short : long]),
      hints: [
        'Řekni slovo pomalu nahlas a poslouchej, jestli je hláska krátká, nebo dlouhá.',
        'Dlouhou samohlásku píšeme s čárkou.',
      ],
      explanation: `Ve slově ${full} slyšíme ${isLong ? 'dlouhé' : 'krátké'} ${letter}.`,
    }),
  };
}

/** ú/ů: [s mezerou, celé slovo, vlastní vysvětlení (nepovinné)]. */
function uu(gapped: string, full: string, why?: string): Entry {
  const i = gapped.indexOf('_');
  const letter = full[i];
  if ((letter !== 'ú' && letter !== 'ů') || gapped.replace('_', letter) !== full) throw new Error(`hlasky: špatná data ${gapped}/${full}`);
  const explanation =
    why ??
    (letter === 'ú'
      ? `Na začátku slova píšeme ú: ${full}.`
      : `Uprostřed a na konci slova píšeme ů: ${full}.`);
  return {
    key: `u-${slug(full)}`,
    build: (rng) => ({
      prompt: 'Které písmeno chybí? Doplň ú, nebo ů.',
      speak: `Doplň ú s čárkou, nebo ů s kroužkem. Slovo: ${full}.`,
      visual: { type: 'big', text: gapped },
      answer: choice(rng, letter, [letter === 'ú' ? 'ů' : 'ú']),
      hints: [
        'Kde ve slově chybějící hláska je – na začátku, nebo uprostřed či na konci?',
        'Ú s čárkou píšeme hlavně na začátku slova, ů s kroužkem uprostřed a na konci.',
      ],
      explanation,
    }),
  };
}

type Kind = 'dtn' | 'bpv' | 'mne' | 'vje';

const SPELL_HINTS: Record<Kind, string[]> = {
  dtn: ['Slyšíme ďe, ťe, ňe. Píše se to ale jinak, než to slyšíme.', 'Místo háčku nad d, t, n dáme háček nad e.'],
  bpv: ['Slyšíme bje, pje, vje. Jak se to píše?', 'Místo je píšeme po b, p, v jen ě.'],
  mne: ['Slyšíme mňe. Někdy píšeme mě, jindy mně.', 'Mně píšeme, když v příbuzném slově slyšíme n: zapomenout, vzpomenout.'],
  vje: ['Rozděl slovo na části. Nezačíná předponou?', 'Když se potká předpona v- nebo ob- se slovem, které začíná na j, píšeme je.'],
};

/** Které slovo je napsané správně? */
function spelled(kind: Kind, correct: string, wrongs: string[], why: string): Entry {
  return {
    key: `${kind}-${slug(correct)}`,
    build: (rng) => ({
      prompt: 'Které slovo je napsané správně?',
      answer: choice(rng, correct, wrongs),
      hints: SPELL_HINTS[kind],
      explanation: why,
    }),
  };
}

const CAP_HINTS = [
  'Velké písmeno píšeme na začátku věty.',
  'Velké písmeno mají i vlastní jména: jména lidí, zvířat, měst, řek a hor.',
];

/** Která věta je napsaná správně? */
function sentence(key: string, correct: string, wrongs: string[], why: string): Entry {
  return {
    key: `veta-${key}`,
    build: (rng) => ({
      prompt: 'Která věta je napsaná správně?',
      answer: choice(rng, correct, wrongs),
      hints: CAP_HINTS,
      explanation: `Správně je: ${correct} ${why}`,
    }),
  };
}

/** Které slovo má začínat velkým písmenem? (věta obsahuje jednu chybu) */
function capWord(key: string, wrongSentence: string, target: string, others: string[], why: string): Entry {
  if (!wrongSentence.includes(target) || others.some((o) => !wrongSentence.includes(o))) {
    throw new Error(`hlasky: slova nejsou ve větě ${wrongSentence}`);
  }
  return {
    key: `velke-${key}`,
    build: (rng: Rng): Draft => ({
      prompt: 'Ve větě je chyba. Které slovo má začínat velkým písmenem?',
      visual: { type: 'big', text: wrongSentence },
      answer: choice(rng, target, others),
      hints: CAP_HINTS,
      explanation: why,
    }),
  };
}

// ---------------------------------------------------------------------------
// Úroveň 1

const L1: Entry[] = [
  vowel('tr_va', 'tráva'), vowel('kr_va', 'kráva'), vowel('ml_ko', 'mléko'), vowel('l_to', 'léto'),
  vowel('r_no', 'ráno'), vowel('ž_ba', 'žába'), vowel('z_mek', 'zámek'), vowel('kl_č', 'klíč'),
  vowel('ps_t', 'psát'), vowel('d_rek', 'dárek'), vowel('l_s', 'les'), vowel('m_d', 'med'),
  vowel('s_no', 'seno'), vowel('m_k', 'mák'), vowel('dr_k', 'drak'), vowel('h_d', 'had'),
  uu('_kol', 'úkol'), uu('d_m', 'dům'), uu('st_l', 'stůl'), uu('_sta', 'ústa'), uu('k_ň', 'kůň'),
  uu('s_l', 'sůl'), uu('_l', 'úl'), uu('v_z', 'vůz'), uu('r_že', 'růže'), uu('_terý', 'úterý'), uu('h_l', 'hůl'),
  spelled('dtn', 'děti', ['ďeti', 'djeti'], 'Slyšíme ďe, ale píšeme dě: děti.'),
  spelled('dtn', 'dědeček', ['ďeďeček', 'djedeček'], 'Slyšíme ďe, ale píšeme dě: dědeček.'),
  spelled('dtn', 'tělo', ['ťelo', 'tjelo'], 'Slyšíme ťe, ale píšeme tě: tělo.'),
  spelled('dtn', 'těsto', ['ťesto', 'tjesto'], 'Slyšíme ťe, ale píšeme tě: těsto.'),
  spelled('dtn', 'kotě', ['koťe', 'kotje'], 'Slyšíme ťe, ale píšeme tě: kotě.'),
  spelled('dtn', 'něco', ['ňeco', 'njeco'], 'Slyšíme ňe, ale píšeme ně: něco.'),
  sentence('ingrid', 'Ingrid má psa.', ['ingrid má psa.', 'Ingrid Má psa.'], 'Věta začíná velkým písmenem a Ingrid je jméno.'),
  sentence('knut', 'Knut jí jablko.', ['knut jí jablko.', 'Knut jí Jablko.'], 'Knut je jméno, jablko je obyčejné slovo.'),
  sentence('liv', 'Liv čte knížku.', ['liv čte knížku.', 'Liv Čte knížku.'], 'Jméno Liv a začátek věty mají velké písmeno.'),
  sentence('mama', 'Máma vaří oběd.', ['máma vaří oběd.', 'Máma Vaří oběd.'], 'Velké písmeno je jen na začátku věty.'),
  sentence('frida', 'Frída hraje na flétnu.', ['frída hraje na flétnu.', 'Frída hraje na Flétnu.'], 'Frída je jméno, flétna je obyčejné slovo.'),
  sentence('olaf', 'Olaf peče chléb.', ['olaf peče chléb.', 'Olaf Peče chléb.'], 'Olaf je jméno a stojí na začátku věty.'),
];

// ---------------------------------------------------------------------------
// Úroveň 2

const L2: Entry[] = [
  vowel('kamar_d', 'kamarád'), vowel('poh_dka', 'pohádka'), vowel('zahr_da', 'zahrada'), vowel('čokol_da', 'čokoláda'),
  vowel('pol_vka', 'polévka'), vowel('p_tek', 'pátek'), vowel('kr_lovna', 'královna'), vowel('ž_lud', 'žalud'),
  vowel('kab_t', 'kabát'), vowel('ban_n', 'banán'), vowel('kyt_ra', 'kytara'), vowel('kom_n', 'komín'),
  vowel('dr_ha', 'dráha'), vowel('kr_m', 'krém'),
  uu('dom_', 'domů'), uu('_roda', 'úroda'), uu('p_da', 'půda'), uu('k_ra', 'kůra'), uu('_žas', 'úžas'),
  uu('l_žko', 'lůžko'), uu('_hel', 'úhel'), uu('m_stek', 'můstek'), uu('_plněk', 'úplněk'), uu('k_že', 'kůže'),
  uu('v_ně', 'vůně'), uu('_klid', 'úklid'), uu('p_lka', 'půlka'),
  spelled('bpv', 'běhat', ['bjehat', 'behat'], 'Slyšíme bje, ale píšeme bě: běhat.'),
  spelled('bpv', 'oběd', ['objed', 'objéd'], 'Slyšíme bje, ale píšeme bě: oběd.'),
  spelled('bpv', 'pěna', ['pjena', 'pena'], 'Slyšíme pje, ale píšeme pě: pěna.'),
  spelled('bpv', 'pět', ['pjet', 'pjét'], 'Slyšíme pje, ale píšeme pě: pět.'),
  spelled('bpv', 'zpěv', ['zpjev', 'spjev'], 'Slyšíme pje, ale píšeme pě: zpěv. Na začátku je z, protože zpívat.'),
  spelled('bpv', 'věc', ['vjec', 'vec'], 'Slyšíme vje, ale píšeme vě: věc.'),
  spelled('bpv', 'věž', ['vjež', 'vješ'], 'Slyšíme vje, ale píšeme vě: věž.'),
  spelled('bpv', 'květ', ['kvjet', 'kveť'], 'Slyšíme vje, ale píšeme vě: květ.'),
  spelled('bpv', 'hvězda', ['hvjezda', 'hvězta'], 'Slyšíme vje, ale píšeme vě: hvězda.'),
  spelled('bpv', 'svět', ['svjet', 'sfět'], 'Slyšíme vje, ale píšeme vě: svět.'),
  spelled('bpv', 'pěkný', ['pjekný', 'pěknej'], 'Slyšíme pje, ale píšeme pě: pěkný.'),
  spelled('bpv', 'obě', ['obje', 'objě'], 'Slyšíme bje, ale píšeme bě: obě.'),
  spelled('dtn', 'dítě', ['díťe', 'dítje'], 'Slyšíme ťe, ale píšeme tě: dítě.'),
  spelled('dtn', 'štěně', ['šťeňe', 'štjenje'], 'Slyšíme ťe a ňe, ale píšeme tě a ně: štěně.'),
  spelled('dtn', 'koně', ['koňe', 'konje'], 'Slyšíme ňe, ale píšeme ně: koně.'),
  sentence('alik', 'Náš pes Alík rád běhá.', ['Náš pes alík rád běhá.', 'náš pes Alík rád běhá.'], 'Alík je jméno psa, proto má velké písmeno.'),
  sentence('micka', 'Kočka Micka spí na gauči.', ['Kočka micka spí na gauči.', 'kočka Micka spí na gauči.'], 'Micka je jméno kočky.'),
  sentence('brno', 'Babička bydlí v Brně.', ['Babička bydlí v brně.', 'babička bydlí v Brně.'], 'Brno je jméno města.'),
  sentence('plzen', 'Jedeme na výlet do Plzně.', ['Jedeme na výlet do plzně.', 'Jedeme na Výlet do Plzně.'], 'Plzeň je jméno města, výlet je obyčejné slovo.'),
  sentence('praha', 'Praha je hlavní město.', ['praha je hlavní město.', 'Praha je Hlavní město.'], 'Praha je jméno města a stojí na začátku věty.'),
  sentence('mracek', 'Dráček Mráček letí nad Ostravou.', ['Dráček mráček letí nad Ostravou.', 'dráček Mráček letí nad ostravou.'], 'Mráček je jméno draka a Ostrava je město.'),
  sentence('belka', 'Liv a Bjorn krmí koně Bělku.', ['Liv a Bjorn krmí koně bělku.', 'Liv a bjorn krmí koně Bělku.'], 'Bělka je jméno koně, Liv a Bjorn jsou jména dětí.'),
  sentence('pepik', 'Křeček Pepík spí v domečku.', ['Křeček pepík spí v domečku.', 'Křeček Pepík spí v Domečku.'], 'Pepík je jméno křečka, domeček je obyčejné slovo.'),
  sentence('novakova', 'Ingrid pozdravila paní Novákovou.', ['Ingrid pozdravila paní novákovou.', 'Ingrid pozdravila Paní Novákovou.'], 'Příjmení Nováková je vlastní jméno, slovo paní píšeme s malým písmenem.'),
  capWord('rex', 'Náš pes se jmenuje rex.', 'rex', ['pes', 'jmenuje'], 'Rex je jméno psa, proto píšeme Rex s velkým R.'),
  capWord('brno', 'Včera jsme jeli do brna.', 'brna', ['jeli', 'jsme'], 'Brno je jméno města, proto píšeme do Brna.'),
  capWord('liv', 'V lese potkala liv ježka.', 'liv', ['lese', 'ježka'], 'Liv je jméno, proto má velké písmeno.'),
  capWord('micka', 'Kočka micka má koťata.', 'micka', ['koťata', 'má'], 'Micka je jméno kočky, proto píšeme Micka.'),
  capWord('bublinka', 'Dráček bublinka umí plavat.', 'bublinka', ['umí', 'plavat'], 'Bublinka je jméno dráčka, proto píšeme Bublinka.'),
  capWord('olomouc', 'Moje teta bydlí v olomouci.', 'olomouci', ['teta', 'bydlí'], 'Olomouc je jméno města, proto píšeme v Olomouci. Slovo teta je obyčejné.'),
];

// ---------------------------------------------------------------------------
// Úroveň 3

const L3: Entry[] = [
  uu('troj_helník', 'trojúhelník', 'Slovo trojúhelník je složené ze slov tři a úhel. Úhel začíná na ú, a tak ú zůstává i uprostřed.'),
  uu('čtyř_helník', 'čtyřúhelník', 'Slovo čtyřúhelník je složené ze slov čtyři a úhel. Úhel začíná na ú, a tak ú zůstává.'),
  uu('pravo_hlý', 'pravoúhlý', 'Slovo pravoúhlý je složené ze slov pravý a úhel. Úhel začíná na ú, a tak ú zůstává.'),
  uu('ne_plný', 'neúplný', 'Neúplný je úplný s předponou ne-. Po předponě píšeme ú: neúplný.'),
  uu('p_lnoc', 'půlnoc'), uu('kr_ček', 'krůček'), uu('pr_vodce', 'průvodce'), uu('d_ležitý', 'důležitý'),
  uu('_častník', 'účastník'),
  vowel('d_lnice', 'dálnice'), vowel('h_danka', 'hádanka'), vowel('l_kárna', 'lékárna'), vowel('kř_da', 'křída'),
  spelled('mne', 'město', ['mněsto', 'mňesto'], 'Slyšíme mňe, ale píšeme mě: město. V příbuzných slovech žádné n neslyšíme.'),
  spelled('mne', 'měsíc', ['mněsíc', 'mňesíc'], 'Slyšíme mňe, ale píšeme mě: měsíc.'),
  spelled('mne', 'měkký', ['mněkký', 'mňekký'], 'Slyšíme mňe, ale píšeme mě: měkký.'),
  spelled('mne', 'náměstí', ['námněstí', 'námňestí'], 'Náměstí je příbuzné se slovem město, n tam neslyšíme, a proto píšeme mě.'),
  spelled('mne', 'rozuměl', ['rozumněl', 'rozumňel'], 'Rozuměl je od slova rozumět, kde žádné n neslyšíme, a proto píšeme mě.'),
  spelled('mne', 'zapomněl', ['zapoměl', 'zapomňel'], 'Zapomněl je od slova zapomenout, kde slyšíme n, a proto píšeme mně.'),
  spelled('mne', 'vzpomněl', ['vzpoměl', 'vzpomňel'], 'Vzpomněl je od slova vzpomenout, kde slyšíme n, a proto píšeme mně.'),
  spelled('vje', 'vjezd', ['vězd', 'vjest'], 'Vjezd se skládá z předpony v- a slova jezdit, proto píšeme vje.'),
  spelled('vje', 'objevit', ['oběvit', 'objěvit'], 'Objevit se skládá z předpony ob- a slova jevit, proto píšeme bje.'),
  spelled('vje', 'objem', ['oběm', 'objěm'], 'Objem souvisí se slovem objímat. Po předponě ob- následuje je, proto píšeme bje.'),
  sentence('vltava', 'Vltava teče přes Prahu.', ['vltava teče přes Prahu.', 'Vltava teče přes prahu.'], 'Vltava je jméno řeky a Praha jméno města.'),
  sentence('snezka', 'Sněžka je v Krkonoších.', ['Sněžka je v krkonoších.', 'sněžka je v Krkonoších.'], 'Sněžka je jméno hory a Krkonoše jméno pohoří.'),
  sentence('pondeli', 'V pondělí jedeme do Brna.', ['V Pondělí jedeme do Brna.', 'V pondělí jedeme do brna.'], 'Dny v týdnu píšeme s malým písmenem, Brno je město.'),
  sentence('kveten', 'V květnu kvetou šeříky.', ['V Květnu kvetou šeříky.', 'v květnu kvetou šeříky.'], 'Měsíce v roce píšeme s malým písmenem, velké je jen na začátku věty.'),
  sentence('labe', 'Labe teče do Německa.', ['labe teče do Německa.', 'Labe teče do německa.'], 'Labe je řeka a Německo je stát.'),
  sentence('sumava', 'Na Šumavě pramení Vltava.', ['Na šumavě pramení Vltava.', 'Na Šumavě pramení vltava.'], 'Šumava je jméno pohoří a Vltava jméno řeky.'),
  sentence('beskydy', 'Děda byl na výletě v Beskydech.', ['Děda byl na výletě v beskydech.', 'Děda byl na Výletě v Beskydech.'], 'Beskydy jsou pohoří, výlet je obyčejné slovo.'),
  sentence('sobota', 'V sobotu přijede teta Jana.', ['V Sobotu přijede teta Jana.', 'V sobotu přijede Teta Jana.'], 'Dny v týdnu i slovo teta píšeme s malým písmenem, Jana je jméno.'),
  sentence('maly-princ', 'Čteme knihu Malý princ.', ['Čteme knihu Malý Princ.', 'Čteme knihu malý princ.'], 'V názvu knihy píšeme velké písmeno jen na začátku.'),
  sentence('ceska-republika', 'Žijeme v České republice.', ['Žijeme v České Republice.', 'Žijeme v české republice.'], 'V názvu Česká republika má velké písmeno jen první slovo.'),
  sentence('prazsky-hrad', 'Navštívili jsme Pražský hrad.', ['Navštívili jsme Pražský Hrad.', 'Navštívili jsme pražský hrad.'], 'V názvu Pražský hrad má velké písmeno jen první slovo.'),
  sentence('karluv-most', 'Přešli jsme Karlův most.', ['Přešli jsme Karlův Most.', 'Přešli jsme karlův most.'], 'V názvu Karlův most má velké písmeno jen první slovo.'),
  capWord('labe', 'Řeka labe je dlouhá.', 'labe', ['dlouhá', 'je'], 'Labe je jméno řeky, proto píšeme Labe.'),
  capWord('snezka', 'Na sněžce fouká silný vítr.', 'sněžce', ['fouká', 'vítr'], 'Sněžka je jméno hory, proto píšeme na Sněžce.'),
  capWord('vltava', 'V létě plujeme na loďce po vltavě.', 'vltavě', ['létě', 'loďce'], 'Vltava je jméno řeky, proto píšeme po Vltavě.'),
  capWord('krkonose', 'V zimě jezdíme do krkonoš.', 'krkonoš', ['zimě', 'jezdíme'], 'Krkonoše jsou jméno pohoří, proto píšeme do Krkonoš.'),
];

const levels: Level[] = [1, 2, 3];

export const pools: Pools = { 1: L1, 2: L2, 3: L3 };
assertUniqueKeys(ID, pools);

export const hlasky: SkillDef = {
  id: ID,
  island: 'slova',
  name: 'Hlásky a velká písmena',
  description: 'Rozlišuje krátké a dlouhé samohlásky, píše ú/ů, dě, tě, ně, bě, pě, vě (od 3. úrovně i mě/mně) a velká písmena u vlastních jmen.',
  levels,
  rvp: {
    1: ['ČJL-3-2-01', 'ČJL-3-2-08'],
    2: ['ČJL-3-2-01', 'ČJL-3-2-08'],
    3: ['ČJL-3-2-01', 'ČJL-3-2-08'],
  },
  ability: 'slovni',
  generate: makeGenerator(ID, levels, pools),
};
