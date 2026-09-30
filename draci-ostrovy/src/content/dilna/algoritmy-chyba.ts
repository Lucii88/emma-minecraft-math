// Najdi chybu v programu:
// (a) mřížka s nakresleným chybným programem – ve kterém kroku je chyba?
//     Generátor zkusí všechny záměny všech kroků a pustí jen programy, které
//     opraví právě jedna záměna právě jednoho kroku;
// (b) oprav program – hráčka poskládá opravený let sama;
// (c) postupy a programy robota s chybou: krok na špatném místě, chybějící
//     krok, špatná podmínka nebo špatný počet opakování.

import { bankSkill, type ChoiceSpec, type FixedSpec, type ProgramSpec, type Spec } from '../../core/bank';
import { count } from '../../core/czech';
import { MOVES, MOVE_WORD, fly } from '../../core/grid';
import type { Rng } from '../../core/rng';
import type { ChoiceOption, KnowledgeCard, Move } from '../../core/types';
import {
  KROK,
  arrowsSpeak,
  arrowsText,
  describeFlight,
  drawnPath,
  gridOf,
  inStep,
  lengthDifficulty,
  programKey,
  randomShortestProgram,
  randomWorld,
  singleFixes,
  speakTimes,
  worldKey,
  type World,
} from './algoritmy-mrizka';

const ID = 'dilna.chyba';

type ChybaLevel = 2 | 3 | 4 | 5;

// ---------------------------------------------------------------------------
// Generované úlohy s mřížkou

interface Cfg {
  cols: number;
  rows: number;
  rocks: [number, number];
  eggs: [number, number];
  /** Délka správného programu. */
  len: [number, number];
  /** Chyba se neprozradí hned: drak nenarazí přímo v chybném kroku a chyba
   *  není v posledním kroku. */
  late: boolean;
}

const CFG: Record<ChybaLevel, Cfg> = {
  2: { cols: 4, rows: 4, rocks: [0, 2], eggs: [0, 0], len: [3, 4], late: false },
  3: { cols: 5, rows: 5, rocks: [1, 4], eggs: [0, 0], len: [4, 6], late: false },
  4: { cols: 5, rows: 5, rocks: [2, 5], eggs: [1, 1], len: [5, 7], late: true },
  5: { cols: 6, rows: 6, rocks: [3, 7], eggs: [1, 2], len: [6, 9], late: true },
};

/** Chybný program `bug` ve světě `w`; oprava = záměna kroku `step` za `move`. */
export interface Bug {
  w: World;
  bug: Move[];
  step: number;
  move: Move;
}

/** Ověřený chybný program pro případ, že by náhodné pokusy nic nenašly. */
export const CHYBA_FALLBACK: Bug = {
  w: { cols: 4, rows: 4, dragon: { x: 0, y: 0 }, goal: { x: 3, y: 0 }, rocks: [], eggs: [] },
  bug: ['R', 'L', 'R'],
  step: 1,
  move: 'R',
};

/** Je chyba poznat z nakreslené cesty? Čára vede i přes skálu (na skále je
 *  ✖), z mapy už ale nevede – kroky za okrajem nejsou vidět. Proto:
 *  - cesta nesmí vést hnízdem (dítě by vidělo, že drak do hnízda doletěl),
 *  - smí přejít nejvýš jednu skálu (jeden ✖),
 *  - z mapy smí vyletět jen chybný krok sám a jen tam, kde se chyba smí
 *    prozradit hned (L2–L3); dřív nesmí narazit do skály. */
function clearDrawing(level: ChybaLevel, w: World, bug: readonly Move[], step: number): boolean {
  const d = drawnPath(w, bug);
  if (d.goalSteps.length || d.rockSteps.length > 1) return false;
  if (d.exitStep < 0) return true;
  return !CFG[level].late && d.exitStep === step && !d.rockSteps.length;
}

/** Najde chybný program. Při `unique` ho opraví jen jediná záměna jediného
 *  kroku a chyba je poznat i z nakreslené cesty. */
function findBug(level: ChybaLevel, rng: Rng, unique: boolean): Bug {
  const cfg = CFG[level];
  for (let attempt = 0; attempt < 5000; attempt++) {
    const w = randomWorld(rng, cfg.cols, cfg.rows, rng.int(...cfg.rocks), rng.int(...cfg.eggs));
    const good = randomShortestProgram(w, rng);
    if (!good || good.length < cfg.len[0] || good.length > cfg.len[1]) continue;
    const step = rng.int(0, good.length - 1);
    if (cfg.late && step === good.length - 1) continue;
    const bug = [...good];
    bug[step] = rng.pick(MOVES.filter((m) => m !== good[step]));
    const flight = fly(w, bug, w.eggs);
    if (flight.ok) continue;
    if (cfg.late && flight.end !== 'elsewhere' && flight.stoppedAt <= step) continue;
    if (unique && !clearDrawing(level, w, bug, step)) continue;
    const fixes = singleFixes(w, bug);
    if (unique && (fixes.length !== 1 || fixes[0].step !== step)) continue;
    // Oprava podle klíče: první možná záměna (u jediné opravy je to ta naše).
    return { w, bug, step: fixes[0].step, move: fixes[0].move };
  }
  return CHYBA_FALLBACK;
}

const GOAL_TEXT = ['Drak měl doletět do hnízda.', 'Drak měl sebrat vajíčko a doletět do hnízda.', 'Drak měl sebrat obě vajíčka a doletět do hnízda.'];
const FIX_GOAL = ['aby drak doletěl do hnízda', 'aby drak sebral vajíčko a doletěl do hnízda', 'aby drak sebral obě vajíčka a doletěl do hnízda'];

const fixedProgram = (b: Bug) => b.bug.map((m, i) => (i === b.step ? b.move : m));

/** Popis opravy: „drak má letět doprava, ne doleva“. */
const fixText = (b: Bug) => `drak má letět ${MOVE_WORD[b.move]}, ne ${MOVE_WORD[b.bug[b.step]]}`;

/** (a) Ve kterém kroku je chyba? Možnosti „1. krok“… v pořadí, nejvýš 4. */
function whichStep(level: ChybaLevel, rng: Rng): FixedSpec {
  const b = findBug(level, rng, true);
  const flight = fly(b.w, b.bug, b.w.eggs);
  const outcome = flight.end === 'rock' ? 'narazil do skály' : flight.end === 'edge' ? 'vyletěl z mapy' : 'do hnízda nedoletěl';
  const goal = GOAL_TEXT[b.w.eggs.length];
  const size = Math.min(4, b.bug.length);
  const start = rng.int(Math.max(0, b.step - size + 1), Math.min(b.step, b.bug.length - size));
  const hints = ['Sleduj prstem, kudy drak letí.', 'Zkus u jednoho kroku otočit šipku jinam. Doletěl by pak drak?'];
  if (flight.end === 'rock' && flight.stoppedAt > b.step) hints.push('Chyba může být i dřív, než drak narazil.');
  if (flight.end === 'elsewhere') hints.push('Porovnej, kde drak skončil a kde je hnízdo.');
  return {
    kind: 'fixed',
    key: `krok-${worldKey(b.w)}-p${programKey(b.bug)}`,
    prompt: `${goal} Letěl podle programu ${arrowsText(b.bug)}, ale ${outcome}. Ve kterém kroku je chyba?`,
    speak: `${goal} Letěl podle programu: ${arrowsSpeak(b.bug)}, ale ${outcome}. Ve kterém kroku je chyba?`,
    visual: { type: 'grid', ...gridOf(b.w, b.bug) },
    options: Array.from({ length: size }, (_, k) => `${start + k + 1}. krok`),
    correct: b.step - start,
    hints,
    explain: `Chyba je ${inStep(b.step + 1)}: ${fixText(b)}. Opravený let: ${describeFlight(b.w, fixedProgram(b))}.`,
    difficulty: lengthDifficulty(b.bug.length, ...CFG[level].len),
  };
}

/** (b) Oprav program: nakreslený chybný let, hráčka poskládá správný. */
function repair(level: ChybaLevel, rng: Rng): ProgramSpec {
  const b = findBug(level, rng, false);
  const n = b.bug.length;
  const exact = level === 5;
  return {
    kind: 'program',
    key: `oprav-${worldKey(b.w)}-p${programKey(b.bug)}`,
    prompt: `Nakreslený program nefunguje. Poskládej opravený program, ${FIX_GOAL[b.w.eggs.length]}.${exact ? ` Máš jen ${count(n, KROK)}.` : ''}`,
    grid: gridOf(b.w, b.bug),
    ...(exact ? { maxSteps: n } : {}),
    hints: ['Najdi krok, ve kterém drak letí špatným směrem.', 'Stačí změnit jedinou šipku.'],
    explain: `Stačilo opravit ${b.step + 1}. krok: ${fixText(b)}. Celý opravený let: ${describeFlight(b.w, fixedProgram(b))}.`,
    difficulty: lengthDifficulty(n, ...CFG[level].len),
  };
}

const gen = (level: ChybaLevel) => (rng: Rng): Spec => (rng.chance(level === 2 ? 0.6 : 0.5) ? whichStep(level, rng) : repair(level, rng));

// ---------------------------------------------------------------------------
// Banka: postupy a programy robota s chybou

/** Postupy s krokem na špatném místě – test ověří, že je posunutý aspoň
 *  o dvě místa (pak ho jde opravit jen jediným přesunem). */
export const MISPLACED: { key: string; correct: string[] }[] = [];

/** „Který krok je na špatném místě?“ – krok `from` správného postupu je na místě `to`. */
function misto(key: string, intro: string, title: string, correct: string[], from: number, to: number, hints: string[], explain: string): ChoiceSpec {
  if (Math.abs(from - to) < 2) throw new Error(`${ID}:${key}: krok musí být posunutý aspoň o dvě místa`);
  const steps = [...correct];
  const [moved] = steps.splice(from, 1);
  steps.splice(to, 0, moved);
  MISPLACED.push({ key: `misto-${key}`, correct });
  return {
    key: `misto-${key}`,
    prompt: `${intro} Který krok je na špatném místě?`,
    visual: { type: 'steps', title, steps },
    correct: moved,
    wrong: correct.filter((s) => s !== moved),
    hints,
    explain,
  };
}

/** „Který krok v postupu chybí?“ – chybné možnosti jsou kroky, které v postupu
 *  už jsou, nebo kroky z úplně jiného postupu. */
function chybi(key: string, intro: string, title: string, correct: string[], missing: number, wrong: string[], hints: string[], explain: string): ChoiceSpec {
  return {
    key: `chybi-${key}`,
    prompt: `${intro} Který krok v postupu chybí?`,
    visual: { type: 'steps', title, steps: correct.filter((_, i) => i !== missing) },
    correct: correct[missing],
    wrong,
    hints,
    explain,
  };
}

/** „Který krok je špatně?“ – tlačítka s čísly kroků v pořadí. */
function spatne(key: string, prompt: string, title: string, steps: string[], bad: number, hints: string[], explain: string): FixedSpec {
  return {
    kind: 'fixed',
    key: `spatne-${key}`,
    prompt,
    visual: { type: 'steps', title, steps },
    options: steps.map((_, i) => `${i + 1}. krok`),
    correct: bad,
    hints,
    explain,
  };
}

/** „Jak program opravíš?“ – právě jedna z nabízených oprav funguje. */
function oprava(key: string, prompt: string, title: string, steps: string[], correct: string, wrong: string[], hints: string[], explain: string): ChoiceSpec {
  const option = (label: string): string | ChoiceOption => (label.includes('×') ? { label, speak: speakTimes(label) } : label);
  return { key: `oprava-${key}`, prompt, visual: { type: 'steps', title, steps }, correct: option(correct), wrong: wrong.map(option), hints, explain };
}

const CAJ = ['Nalij vodu do konvice', 'Uvař vodu', 'Dej do hrnku sáček čaje', 'Zalij sáček horkou vodou', 'Nech čaj vychladnout', 'Napij se'];
const SEMINKO = ['Nasyp do květináče hlínu', 'Udělej v hlíně důlek', 'Vlož do důlku semínko', 'Zasyp semínko hlínou', 'Zalij ho vodou'];
const ZUBY = ['Vezmi kartáček', 'Nanes pastu na kartáček', 'Čisti si zuby', 'Vyplivni pěnu', 'Vypláchni si pusu'];
const RUCE = ['Pusť vodu', 'Namoč si ruce', 'Namydli si ruce', 'Opláchni mýdlo', 'Utři si ruce'];
const ZIMA = ['Obleč si tričko', 'Obleč si svetr', 'Obleč si bundu', 'Zapni si bundu', 'Jdi ven'];
const CHLEBA = ['Polož krajíc na prkénko', 'Naber nožem máslo', 'Namaž krajíc', 'Posyp ho pažitkou', 'Sněz ho'];
const DRAK = ['Naber ryby do kyblíku', 'Dones kyblík k drakovi', 'Vysyp ryby do misky', 'Nech draka najíst'];
const DOPIS = ['Napiš dopis', 'Vlož ho do obálky', 'Zalep obálku', 'Hoď dopis do schránky'];
const SNEHULAK = ['Uválej velkou kouli', 'Polož na ni prostřední kouli', 'Nahoru dej nejmenší kouli', 'Přidej nos z mrkve'];
const KOLO = ['Nasaď si přilbu', 'Nasedni na kolo', 'Šlapej do pedálů', 'Zabrzdi', 'Sesedni z kola'];
const KONEV = ['Naplň konev vodou', 'Dones konev ke květině', 'Zalij květinu', 'Vrať konev na místo'];

const L2: Spec[] = [
  misto('caj-napit', 'Robot vaří čaj.', 'Robot vaří čaj', CAJ, 5, 1,
    ['Co se dá udělat až úplně na konci?'],
    'Napít se dá až z hotového a vychladlého čaje, takže tenhle krok patří na konec.'),
  chybi('caj-uvarit', 'Robot vaří čaj, ale sáček zalil studenou vodou.', 'Robot vaří čaj', CAJ, 1,
    ['Napij se', 'Nech čaj vychladnout', 'Zasaď semínko', 'Obuj si boty'],
    ['Jaká voda je potřeba na čaj?'],
    'Na čaj je potřeba horká voda. Robot ji musí uvařit dřív, než s ní zalije sáček.'),
  misto('seminko-zasypat', 'Robot sází semínko.', 'Robot sází semínko', SEMINKO, 3, 0,
    ['Dá se zasypat semínko, které ještě není v hlíně?'],
    'Semínko jde zasypat, až když leží v důlku. Tenhle krok patří hned za vložení semínka.'),
  chybi('seminko-dulek', 'Robot sází semínko.', 'Robot sází semínko', SEMINKO, 1,
    ['Zalij ho vodou', 'Nasyp do květináče hlínu', 'Uvař vodu', 'Obleč si svetr'],
    ['Kam robot semínko vloží?'],
    'Semínko se vkládá do důlku, a ten musí robot nejdřív udělat.'),
  misto('zuby-pasta', 'Robot si čistí zuby.', 'Robot si čistí zuby', ZUBY, 1, 3,
    ['Kdy se dává pasta na kartáček?'],
    'Pastu je potřeba nanést na kartáček dřív, než robot začne čistit zuby.'),
  chybi('zuby-pasta', 'Robot si čistí zuby, ale nemá v puse žádnou pěnu.', 'Robot si čistí zuby', ZUBY, 1,
    ['Vypláchni si pusu', 'Čisti si zuby', 'Zalij ho vodou', 'Obuj si boty'],
    ['Z čeho se v puse dělá pěna?'],
    'Bez pasty by robot čistil zuby jen vodou. Pastu musí nanést na kartáček před čištěním.'),
  misto('ruce-utrit', 'Robot si myje ruce.', 'Robot si myje ruce', RUCE, 4, 1,
    ['Kdy se ruce utírají?'],
    'Ruce se utírají až na konci, když jsou umyté a opláchnuté.'),
  misto('zima-tricko', 'Robot se obléká ven do zimy.', 'Robot se obléká', ZIMA, 0, 2,
    ['Co nosíš nejblíž u těla?'],
    'Tričko se obléká jako první, protože je nejblíž u těla. Svetr a bunda jdou přes něj.'),
  chybi('chleba-maslo', 'Robot si dělá chleba s máslem, ale na krajíci žádné máslo není.', 'Robot maže chleba', CHLEBA, 1,
    ['Sněz ho', 'Posyp ho pažitkou', 'Zalij ho vodou', 'Obuj si boty'],
    ['Čím robot krajíc namaže?'],
    'Aby robot mohl krajíc namazat, musí nejdřív nabrat máslo.'),
  misto('drak-najist', 'Robot krmí draka.', 'Robot krmí draka', DRAK, 3, 0,
    ['Může se drak najíst, když ještě nemá ryby?'],
    'Drak se může najíst, až když má ryby v misce. Tenhle krok patří na konec.'),
  misto('dopis-schranka', 'Robot posílá dopis.', 'Robot posílá dopis', DOPIS, 3, 1,
    ['Co se s dopisem dělá nakonec?'],
    'Do schránky se hází až hotový dopis v zalepené obálce, takže tenhle krok patří na konec.'),
  chybi('snehulak-koule', 'Robot staví sněhuláka ze tří koulí.', 'Robot staví sněhuláka', SNEHULAK, 1,
    ['Přidej nos z mrkve', 'Uválej velkou kouli', 'Zalij ho vodou', 'Vypláchni si pusu'],
    ['Kolik koulí má sněhulák mít?'],
    'Sněhulák má tři koule. Mezi velkou a nejmenší koulí chybí ta prostřední.'),
  misto('kolo-prilba', 'Robot jede na kole.', 'Robot jede na kole', KOLO, 0, 2,
    ['Kdy si nasazuješ přilbu?'],
    'Přilbu si nasazuješ dřív, než se rozjedeš. Chrání hlavu po celou jízdu.'),
  chybi('konev-voda', 'Robot zalévá květinu, ale květina zůstala suchá.', 'Robot zalévá', KONEV, 0,
    ['Zalij květinu', 'Vrať konev na místo', 'Nasaď si přilbu', 'Zapni si bundu'],
    ['Co musí být v konvi, aby šlo zalévat?'],
    'Konev je potřeba nejdřív naplnit vodou. Prázdnou konví se zalévat nedá.'),
];

const L3: Spec[] = [
  oprava('ctverec', 'Robot měl nakreslit čtverec, ale nakreslil jen tři strany. Jak program opravíš?', 'Robot kreslí čtverec',
    ['Polož tužku na papír', 'Opakuj 3×: nakresli čáru a otoč se doprava', 'Zvedni tužku'],
    'Opakovat 4×', ['Opakovat 2×', 'Otáčet se doleva', 'Zvednout tužku dřív'],
    ['Kolik stran má čtverec?'],
    'Čtverec má čtyři strany, takže se čára a otočka musí opakovat čtyřikrát.'),
  oprava('tleskani', 'Robot měl zatleskat šestkrát, ale tleskl jen čtyřikrát. Jak program opravíš?', 'Robot tleská',
    ['Opakuj 2×: tleskni, tleskni', 'Ukloň se'],
    'Opakovat 3×', ['Opakovat 4×', 'Opakovat 6×', 'Uklonit se dvakrát'],
    ['Kolikrát robot tleskne při jednom opakování?'],
    'Při každém opakování robot tleskne dvakrát. Aby tleskl šestkrát, musí se opakovat třikrát: 3 × 2 = 6.'),
  oprava('prechod', 'Robot se učí bezpečně přecházet silnici. Co je v jeho postupu špatně?', 'Robot přechází silnici',
    ['Dojdi k přechodu', 'Rozhlédni se', 'Když něco jede, přejdi', 'Když nic nejede, počkej'],
    'Podmínky jsou prohozené', ['Chybí rozhlédnutí', 'Přechod je zbytečný', 'Robot jde moc pomalu'],
    ['Kdy se smí přes silnici přejít?'],
    'Přejít se smí, jen když nic nejede. Když něco jede, musí robot počkat – podmínky jsou prohozené.'),
  spatne('zalevani', 'Robot zalévá jen květiny, které vodu nepotřebují. Který krok je špatně?', 'Robot zalévá květiny',
    ['Dojdi ke květině', 'Sáhni na hlínu', 'Když je hlína mokrá, zalij květinu', 'Dojdi k další květině'], 2,
    ['Kdy květina potřebuje vodu?'],
    'Zalévat se má, když je hlína suchá. Ve 3. kroku má být: Když je hlína suchá, zalij květinu.'),
  {
    kind: 'number',
    key: 'vysledek-pocitani-do-10',
    prompt: 'Robot měl počítat od 1 do 10. Na jakém čísle ale skončí?',
    visual: { type: 'steps', title: 'Robot počítá', steps: ['Řekni 1', 'Opakuj 10×: přičti 1 a řekni číslo'] },
    correct: 11,
    hints: ['Kolikrát robot přičte jedničku?', 'Zkus program projít: 1, pak 2, 3…'],
    explain: 'Robot nejdřív řekne 1 a pak ještě desetkrát přičte jedničku, takže skončí na 11. Opakovat se mělo jen devětkrát.',
  },
  spatne('mleko', 'Robot chodí kupovat mléko, i když ho má doma dost. Který krok je špatně?', 'Robot chystá snídani',
    ['Podívej se do lednice', 'Když tam je mléko, dojdi ho koupit', 'Nasyp do misky vločky', 'Zalij vločky mlékem'], 1,
    ['Kdy je potřeba jít pro mléko do obchodu?'],
    'Pro mléko se chodí, když v lednici není. Ve 2. kroku má být: Když tam mléko není, dojdi ho koupit.'),
  oprava('ryby', 'Drak měl dostat 12 ryb, ale dostal jen 9. Jak program opravíš?', 'Robot krmí draka',
    ['Naber ryby do kyblíku', 'Opakuj 3×: dej drakovi 3 ryby', 'Umyj kyblík'],
    'Opakovat 4×', ['Opakovat 5×', 'Dávat po 2 rybách', 'Opakovat 2×'],
    ['Kolik ryb dostane drak při jednom opakování?'],
    'Při každém opakování dostane drak 3 ryby. Čtyři opakování dají 4 × 3 = 12 ryb.'),
  spatne('schody', 'Schodiště má pět schodů, ale robot zamával už na předposledním. Který krok je špatně?', 'Robot jde po schodech',
    ['Dojdi ke schodům', 'Opakuj 4×: vyjdi jeden schod', 'Nahoře zamávej'], 1,
    ['Kolikrát musí robot vyjít schod?'],
    'Schodů je pět, takže se ve 2. kroku musí opakovat pětkrát.'),
  chybi('mydlo', 'Robot si utírá do ručníku mýdlo.', 'Robot si myje ruce',
    ['Pusť vodu', 'Namydli si ruce', 'Opakuj 10×: promni si dlaně', 'Opláchni si ruce', 'Utři si ruce'], 3,
    ['Pusť vodu', 'Namydli si ruce', 'Nasaď si přilbu', 'Nalij vodu do konvice'],
    ['Co se dělá s mýdlem, než si ruce utřeš?'],
    'Mýdlo je potřeba z rukou opláchnout. Jinak ho robot utře do ručníku.'),
  spatne('semafor', 'Robot přechází i na červenou. Který krok je špatně?', 'Robot u semaforu',
    ['Dojdi k semaforu', 'Když svítí zelená, přejdi', 'Když svítí červená, přejdi'], 2,
    ['Co se dělá, když svítí červená?'],
    'Na červenou se stojí. Ve 3. kroku má být: Když svítí červená, počkej.'),
];

const L4: Spec[] = [
  oprava('jablka', 'V košíku mělo na konci zůstat 9 jablek, ale zůstalo jich 7. Jak program opravíš?', 'Robot sbírá jablka',
    ['Vezmi prázdný košík', 'Opakuj 4×: dej do košíku 2 jablka', 'Jedno jablko sněz'],
    'Opakovat 5×', ['Opakovat 6×', 'Dávat po 3 jablkách', 'Jablko nejíst'],
    ['Spočítej, kolik jablek robot do košíku dá a kolik jich sní.'],
    'Pět opakování dá 5 × 2 = 10 jablek. Jedno robot sní a v košíku jich zůstane 9.'),
  spatne('ponozky', 'Robot třídí ponožky, ale v modré krabici má i červené. Který krok je špatně?', 'Robot třídí ponožky',
    ['Vezmi ponožku z hromady', 'Když je modrá, dej ji do modré krabice', 'Když je červená, dej ji do modré krabice', 'Opakuj od 1. kroku, dokud zbývají ponožky'], 2,
    ['Kam patří červené ponožky?'],
    'Červené ponožky patří do červené krabice. Ve 3. kroku má být: Když je červená, dej ji do červené krabice.'),
  oprava('kyblik', 'Robot měl naplnit kyblík, ale odnesl v něm jen jeden hrnek vody. Jak program opravíš?', 'Robot plní kyblík',
    ['Postav kyblík pod kohoutek', 'Opakuj, dokud je kyblík prázdný: přilij hrnek vody', 'Odnes kyblík'],
    'Opakovat, dokud není plný', ['Odnést kyblík hned', 'Přilévat po dvou hrncích', 'Postavit kyblík jinam'],
    ['Kdy robot s opakováním přestane?'],
    'Po prvním hrnku už kyblík není prázdný, a tak robot přestane. Opakovat se má, dokud kyblík není plný.'),
  spatne('poklad', 'Poklad je o 4 políčka vpravo a o 2 nahoru. Robot ale kopal o políčko výš. Který krok je špatně?', 'Cesta k pokladu',
    ['Opakuj 3×: krok doprava', 'Opakuj 3×: krok nahoru', 'Krok doprava', 'Kopej'], 1,
    ['Spočítej, kolikrát robot vykročí nahoru.'],
    'Nahoru má robot jít jen dvakrát. Ve 2. kroku má být: Opakuj 2×: krok nahoru.'),
  oprava('pernicky', 'Robot vykrojil šest perníčků, ale jeden zůstal ležet na stole. Jak program opravíš?', 'Robot peče perníčky',
    ['Vyválej těsto', 'Opakuj 6×: vykroj perníček', 'Opakuj 5×: polož perníček na plech', 'Dej plech do trouby'],
    'Pokládat na plech 6×', ['Vykrojit 7 perníčků', 'Vyválet těsto dvakrát', 'Dát plech do trouby dřív'],
    ['Kolik perníčků robot vykrojí a kolik jich položí na plech?'],
    'Vykrojených perníčků je šest, takže i na plech je musí robot pokládat šestkrát.'),
  spatne('tanec', 'Tanec má jít: tlesk, dup, tlesk, dup, otočka, tlesk, dup, tlesk, dup, úklona. Který krok je špatně?', 'Robot tancuje',
    ['Opakuj 2×: tleskni a dupni', 'Otoč se', 'Opakuj 2×: dupni a tleskni', 'Ukloň se'], 2,
    ['Porovnej každý krok s tím, jak má tanec jít.'],
    'Ve 3. kroku robot nejdřív dupne a pak tleskne. Má to být obráceně: Opakuj 2×: tleskni a dupni.'),
  spatne('bunda', 'Robot si v létě bere bundu a v zimě chodí jen v tričku. Který krok je špatně?', 'Robot se obléká ven',
    ['Podívej se na teploměr', 'Když je víc než 25 stupňů, vezmi si bundu', 'Když prší, vezmi si deštník', 'Jdi ven'], 1,
    ['Kdy potřebuješ bundu?'],
    'Bunda je potřeba, když je zima. Ve 2. kroku má být třeba: Když je méně než 10 stupňů, vezmi si bundu.'),
  spatne('pocitadlo', 'Do třídy přišlo 5 dětí a 2 pak odešly. Robot ale říká, že je tam 7 dětí. Který krok je špatně?', 'Robot počítá děti',
    ['Napiš na tabuli 0', 'Když dítě přijde, přičti 1', 'Když dítě odejde, přičti 1', 'Řekni číslo z tabule'], 2,
    ['Co se má stát s číslem na tabuli, když někdo odejde?'],
    'Když dítě odejde, má robot jedničku odečíst. Pak řekne 5 − 2 = 3.'),
  {
    kind: 'number',
    key: 'vysledek-ovecky',
    prompt: 'Na louce je 5 oveček. Robot je měl spočítat. Jaké číslo řekne?',
    visual: { type: 'steps', title: 'Robot počítá ovečky', steps: ['Napiš na tabuli 0', 'U každé ovečky přičti k tabuli 2', 'Řekni číslo z tabule'] },
    correct: 10,
    hints: ['Kolik robot přičte za každou ovečku?'],
    explain: 'Robot za každou ovečku přičte 2 místo 1, takže řekne 5 × 2 = 10. Správně má přičítat jedničku.',
  },
];

const L5: Spec[] = [
  spatne('soucet', 'Program měl sečíst čísla od 1 do 5, ale robot řekl 10. Který krok je špatně?', 'Robot sčítá',
    ['Napiš na tabuli 0', 'Opakuj pro čísla 1 až 4: přičti číslo k tabuli', 'Řekni číslo z tabule'], 1,
    ['Zkus sečíst čísla od 1 do 4 a od 1 do 5.'],
    '1 + 2 + 3 + 4 = 10, pětka chybí. Ve 2. kroku má být: Opakuj pro čísla 1 až 5.'),
  spatne('vajicka', 'V hnízdech jsou 2, 4 a 3 vajíčka. Robot měl spočítat všechna, ale řekl 10. Který krok je špatně?', 'Robot počítá vajíčka',
    ['Napiš na tabuli 1', 'U každého hnízda přičti počet vajíček', 'Řekni číslo z tabule'], 0,
    ['Kolik je 2 + 4 + 3?', 'Porovnej výsledek s tím, co řekl robot.'],
    'Vajíček je 2 + 4 + 3 = 9. Robot začal počítat od jedničky místo od nuly, a tak mu vyšlo o jedno víc.'),
  spatne('nejvyssi', 'Robot měl zjistit výšku nejvyššího draka, ale řekl výšku nejnižšího. Který krok je špatně?', 'Robot hledá nejvyššího draka',
    ['Zapamatuj si výšku prvního draka', 'U každého dalšího: když je menší, zapamatuj si jeho výšku', 'Řekni zapamatovanou výšku'], 1,
    ['Kdy si má robot zapamatovat novou výšku?'],
    'Robot si má novou výšku zapamatovat, když je další drak vyšší. Ve 2. kroku má být: když je větší, zapamatuj si jeho výšku.'),
  oprava('plot', 'Plot má 5 metrů. Kůl má být na začátku, po každém metru i na konci, ale na konci chybí. Jak program opravíš?', 'Robot staví plot',
    ['Postav se na začátek plotu', 'Opakuj 5×: zatluč kůl a jdi 1 metr dál'],
    'Na konci zatlouct ještě kůl', ['Opakovat 4×', 'Chodit po 2 metrech', 'První kůl vynechat'],
    ['Nakresli si plot: kolik kůlů potřebuje 5 metrů?'],
    'Plot dlouhý 5 metrů potřebuje 6 kůlů. V opakování jich robot zatluče jen 5, a tak musí na konci přidat ještě jeden.'),
  oprava('bonbony', 'Robot měl rozdělit 12 bonbonů mezi 3 děti, ale 3 bonbony mu zbyly. Jak program opravíš?', 'Robot dělí bonbony',
    ['Vezmi sáček s 12 bonbony', 'Opakuj 3×: dej každému ze 3 dětí jeden bonbon'],
    'Opakovat 4×', ['Opakovat 5×', 'Dávat po 2 bonbonech', 'Opakovat 2×'],
    ['Kolik bonbonů robot rozdá při jednom opakování?'],
    'Při každém opakování rozdá robot 3 bonbony. Aby rozdal všech 12, musí opakovat čtyřikrát: 4 × 3 = 12.'),
  oprava('suda', 'Robot měl říct sudá čísla od 1 do 10, ale řekl 1, 3, 5, 7 a 9. Jak program opravíš?', 'Robot říká sudá čísla',
    ['Opakuj pro čísla 1 až 10: když je číslo liché, řekni ho', 'Ukloň se'],
    'Říkat sudá místo lichých', ['Opakovat až do 20', 'Začít od nuly', 'Uklonit se dřív'],
    ['Která čísla robot vybírá?'],
    'Robot vybírá lichá čísla. Podmínka má znít: když je číslo sudé, řekni ho. Pak řekne 2, 4, 6, 8 a 10.'),
  {
    kind: 'number',
    key: 'vysledek-schody',
    prompt: 'Robot měl skončit na 8. schodu. Na kterém schodu ale doopravdy skončí?',
    visual: { type: 'steps', title: 'Robot jde po schodech', steps: ['Postav se na 1. schod', 'Opakuj 4×: vyjdi o 2 schody výš'] },
    correct: 9,
    hints: ['Na kterém schodu robot začíná?', 'Zkus to projít: 1, pak 3…'],
    explain: 'Robot nezačíná na zemi, ale na 1. schodu: 1, 3, 5, 7, 9. Skončí tedy na 9. schodu.',
  },
  {
    kind: 'number',
    key: 'vysledek-kasicka',
    prompt: 'Robot chtěl mít v kasičce 30 korun. Kolik korun v ní na konci doopravdy bude?',
    visual: { type: 'steps', title: 'Robot šetří', steps: ['Dej do kasičky 10 korun', 'Opakuj 4×: přidej 5 korun', 'Vezmi si z kasičky 5 korun'] },
    correct: 25,
    hints: ['Počítej krok za krokem.'],
    explain: 'Po opakování je v kasičce 10 + 4 × 5 = 30 korun. Pak si robot 5 korun vezme, takže zbude 25.',
  },
];

export const chybaSkill = bankSkill({
  id: ID,
  island: 'dilna',
  name: 'Najdi chybu v programu',
  description: 'Hledá a opravuje chyby v programech a postupech: špatnou šipku, krok na špatném místě, chybějící krok nebo špatný počet opakování.',
  rvp: {
    2: ['I-5-2-04'],
    3: ['I-5-2-04'],
    4: ['I-5-2-04'],
    5: ['I-5-2-04'],
  },
  ability: 'usuzovani',
  banks: { 2: L2, 3: L3, 4: L4, 5: L5 },
  gen: { 2: gen(2), 3: gen(3), 4: gen(4), 5: gen(5) },
  genShare: 0.6,
});

export const chybaCards: KnowledgeCard[] = [
  {
    id: `${ID}.mura`,
    skillId: ID,
    level: 2,
    emoji: '🦋',
    title: 'Můra v počítači',
    text: 'V roce 1947 našli technici v počítači Mark II uvízlou můru. Nalepili ji do deníku s poznámkou, že je to první skutečný případ nalezeného „bugu“ – tak se anglicky říká hmyzu i chybě v programu.',
    fix: {
      before: 'Slovo bug pro chybu v programu vzniklo až podle této můry.',
      evidence: 'Deník s můrou se zachoval v muzeu a poznámka v něm říká „první skutečný případ“. Byl to vtip: slovo bug pro chyby v přístrojích se používalo už dřív. Ve svých dopisech ho psal třeba vynálezce Thomas Edison asi o 70 let dřív.',
    },
  },
  {
    id: `${ID}.kachnicka`,
    skillId: ID,
    level: 3,
    emoji: '🦆',
    title: 'Gumová kachnička',
    text: 'Někteří programátoři vysvětlují svůj program krok za krokem gumové kachničce. Při vysvětlování často na chybu přijdou sami – kachnička nemusí říct ani slovo.',
  },
  {
    id: `${ID}.testy`,
    skillId: ID,
    level: 5,
    emoji: '✅',
    title: 'Programy, které hlídají programy',
    text: 'Programátoři píšou testy: malé programy, které kontrolují, jestli jiný program počítá správně. I tahle hra má testy, které hlídají, aby se každá úloha dala vyřešit.',
  },
];
