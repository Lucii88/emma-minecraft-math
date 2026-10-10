// Vede, nebo nevede? Vodiče a izolanty (co dát do mezery v obvodu) a
// bezpečnost: baterka ano, zásuvka ne; mokré ruce, spadlý drát, papírový
// drak u vedení, baterie do sběru, bouřka.

import { bankSkill, type ChoiceSpec, type FixedSpec, type NumberSpec, type Spec } from '../../core/bank';
import { THINGS } from '../../core/circuit';
import { count } from '../../core/czech';
import type { Rng } from '../../core/rng';
import { bulb, capital, ser, thing, wire } from './common';

const FROM: Record<string, string> = {
  kov: 'z kovu',
  dřevo: 'ze dřeva',
  papír: 'z papíru',
  látka: 'z látky',
  guma: 'z gumy',
  vosk: 'z vosku',
  plast: 'z plastu',
  karton: 'z kartonu',
};

const SEKUNDA = ['sekundu', 'sekundy', 'sekund'] as const;
const KEYS = Object.keys(THINGS);
const CONDUCTORS = KEYS.filter((k) => THINGS[k].conducts);
const INSULATORS = KEYS.filter((k) => !THINGS[k].conducts);

const option = (k: string) => ({ label: `${THINGS[k].emoji} ${THINGS[k].name}`, speak: THINGS[k].name });

/** Proč (ne)vede: „Klíč je z kovu. Kovy proud vedou – jsou to vodiče.“ */
function whyThing(k: string): string {
  const t = THINGS[k];
  const made = t.name === t.stuff ? capital(t.name) : `${capital(t.name)} je ${FROM[t.stuff]} a ${t.stuff}`;
  return t.conducts
    ? `${capital(t.name)} je ${FROM[t.stuff]}. Kovy proud vedou – jsou to vodiče.`
    : `${made} proud nevede – je to izolant.`;
}

const circuit = (...parts: Parameters<typeof ser>) => ({ type: 'circuit' as const, nets: [ser(...parts)] });

// ---------------------------------------------------------------------------
// Generátory

/** Úroveň 1: co v mezeře rozsvítí žárovku. */
function gapSpec(rng: Rng): FixedSpec {
  const k = rng.chance(0.5) ? rng.pick(CONDUCTORS) : rng.pick(INSULATORS);
  const t = THINGS[k];
  return {
    kind: 'fixed',
    key: `mezera-${k}`,
    prompt: `Do mezery v drátu jsme dali ${t.acc}. Rozsvítí se žárovka?`,
    visual: circuit(bulb('y'), thing(k), wire),
    options: ['Svítí', 'Nesvítí'],
    correct: t.conducts ? 0 : 1,
    hints: ['Proud musí oběhnout celý kruh – i přes věc v mezeře.', 'Z čeho je ta věc? Kov, nebo něco jiného?'],
    explain: `${whyThing(k)} ${t.conducts ? 'Kruh se uzavře a žárovka svítí.' : 'Kruh zůstane přerušený a žárovka nesvítí.'}`,
  };
}

/** Úroveň 2: vyber jediný vodič (nebo jediný izolant) ze čtyř věcí. */
function pickSpec(rng: Rng): ChoiceSpec {
  const wantConductor = rng.chance(0.5);
  const right = rng.pick(wantConductor ? CONDUCTORS : INSULATORS);
  const others = rng.shuffle(wantConductor ? INSULATORS : CONDUCTORS).slice(0, 3);
  return {
    key: `${wantConductor ? 'vede' : 'nevede'}-${right}-${[...others].sort().join('-')}`,
    prompt: wantConductor ? 'Co z toho vede elektrický proud?' : 'Co z toho proud nevede?',
    correct: option(right),
    wrong: others.map(option),
    hints: ['Proud vedou hlavně kovy.', wantConductor ? 'Hledej věc z kovu.' : 'Hledej věc, která není z kovu.'],
    explain: wantConductor
      ? `${whyThing(right)} Ostatní věci jsou izolanty.`
      : `${whyThing(right)} Ostatní věci jsou z kovu, a ty proud vedou.`,
  };
}

/** Úroveň 3: dvě věci v mezerách za sebou – svítí, jen když vedou obě. */
function twoGapsSpec(rng: Rng): FixedSpec {
  const a = rng.pick(rng.chance(0.6) ? CONDUCTORS : INSULATORS);
  const b = rng.pick((rng.chance(0.6) ? CONDUCTORS : INSULATORS).filter((k) => k !== a));
  const lit = THINGS[a].conducts && THINGS[b].conducts;
  const bad = [a, b].filter((k) => !THINGS[k].conducts);
  return {
    kind: 'fixed',
    key: `dve-mezery-${a}-${b}`,
    prompt: `V drátu jsou dvě mezery. Do jedné jsme dali ${THINGS[a].acc}, do druhé ${THINGS[b].acc}. Rozsvítí se žárovka?`,
    visual: circuit(bulb('y'), thing(a), thing(b)),
    options: ['Svítí', 'Nesvítí'],
    correct: lit ? 0 : 1,
    hints: ['Obě věci jsou za sebou v jednom kruhu.', 'Proud musí projít oběma. Stačí jeden izolant a kruh je přerušený.'],
    explain: lit
      ? `${capital(THINGS[a].name)} i ${THINGS[b].name} jsou z kovu a vedou proud. Kruh je celý, žárovka svítí.`
      : `${bad.map(whyThing).join(' ')} Kruh zůstane přerušený a žárovka nesvítí.`,
  };
}

/** Úroveň 4: jak daleko je bouřka (zvuk uletí asi kilometr za 3 sekundy),
 *  nebo naopak kolik sekund napočítáš, když víš, jak je daleko. */
function stormSpec(rng: Rng): NumberSpec {
  const km = rng.int(1, 5);
  const s = km * 3;
  if (rng.chance(0.5)) {
    return {
      kind: 'number',
      key: `bourka-km-${km}`,
      prompt: `Bouřka je ${km} km daleko. Kolik sekund napočítáš od blesku do hromu? Zvuk uletí asi kilometr za 3 sekundy.`,
      correct: s,
      unit: 's',
      hints: ['Každý kilometr = 3 sekundy.', `Kolik je ${km} krát 3?`],
      explain: `${km} · 3 = ${s}. Na ${km} km letí zvuk hromu asi ${count(s, SEKUNDA)}. Světlo blesku dorazí skoro hned.`,
    };
  }
  return {
    kind: 'number',
    key: `bourka-${s}`,
    prompt: `{Uviděla|Uviděl} jsi blesk a do hromu jsi {napočítala|napočítal} ${count(s, SEKUNDA)}. Kolik kilometrů daleko je bouřka? Zvuk uletí asi kilometr za 3 sekundy.`,
    correct: km,
    unit: 'km',
    hints: ['Každé 3 sekundy = 1 kilometr.', `Kolikrát se vejde 3 do ${s}?`],
    explain: `${s} : 3 = ${km}. Bouřka je asi ${km} km daleko. Světlo blesku vidíme hned, zvuk hromu letí pomaleji.`,
  };
}

// ---------------------------------------------------------------------------
// Ručně psané otázky (bezpečnost a pojmy)

const q = (key: string, prompt: string, correct: string, wrong: string[], hints: string[], explain: string): ChoiceSpec => ({ key, prompt, correct, wrong, hints, explain });

const L1: Spec[] = [
  q('baterka-nebo-zasuvka', 'S čím se smí dělat pokusy s žárovkou a dráty?', 'S plochou baterkou', ['Se zásuvkou ve zdi', 'S nabíječkou v zásuvce'],
    ['Jedno je bezpečné, druhé nebezpečné pro život.'],
    'Plochá baterka má 4,5 voltu a pokusy s ní jsou bezpečné. Zásuvka ve zdi má 230 voltů – to je nebezpečné pro život.'),
  q('spadly-drat', 'Venku leží na zemi spadlý drát od elektřiny. Co uděláš?', 'Nepřiblížím se a řeknu to dospělému', ['Odnesu ho stranou', 'Šťouchnu do něj klackem', 'Přeskočím ho'],
    ['Může v něm pořád téct proud.'],
    'Spadlým drátem může pořád téct proud. K drátu se nepřibližuj, odejdi a řekni to dospělému – zavolá pomoc.'),
  q('mokre-ruce', 'Máš mokré ruce a chceš zapnout fén. Co uděláš?', 'Nejdřív si ruce osuším', ['Zapnu ho rychle, než uschnou', 'Nic, na tom nezáleží'],
    ['Voda z kohoutku proud vede.'],
    'Voda z kohoutku proud vede. S mokrýma rukama na zásuvky a spotřebiče nesahej – nejdřív se osuš.'),
  q('nic-do-zasuvky', 'Smí se strkat do zásuvky sponka nebo hřebík?', 'Nikdy', ['Ano, když je malý', 'Ano, když se nikdo nedívá'],
    ['Sponka i hřebík jsou z kovu.'],
    'Do zásuvky patří jen zástrčka spotřebiče. Kovová sponka by pustila proud z 230 voltů rovnou do ruky.'),
];

const L2: Spec[] = [
  q('slovo-izolant', 'Jak se říká věcem, které proud nevedou?', 'Izolanty', ['Vodiče', 'Baterky', 'Vypínače'],
    ['Plast, guma, dřevo, papír…'],
    'Izolanty proud nevedou: plast, guma, dřevo, sklo, papír. Vodiče ho vedou – hlavně kovy.'),
  q('slovo-vodic', 'Jak se říká věcem, které proud vedou?', 'Vodiče', ['Izolanty', 'Žárovky', 'Magnety'],
    ['Proud po nich „vede“ cesta.'],
    'Vodiče proud vedou. Nejlepší vodiče jsou kovy – měď, hliník, železo nebo stříbro.'),
  q('papirovy-drak', 'Kde nesmíš pouštět papírového draka?', 'Blízko elektrického vedení', ['Na louce', 'Na kopci za vesnicí'],
    ['Co kdyby se šňůra zachytila o dráty?'],
    'Kdyby se drak zachytil o dráty elektrického vedení, proud by mohl projít po šňůře až k tobě. Draka pouštěj na louce daleko od drátů.'),
  q('vytahnout-zastrcku', 'Jak správně vytáhneš nabíječku ze zásuvky?', 'Chytím zástrčku a vytáhnu ji', ['Zatáhnu za kabel', 'Vykopnu ji nohou'],
    ['Kabel je jen obal kolem drátu.'],
    'Když se tahá za kabel, může se uvnitř přetrhnout drát nebo poškodit izolace. Proto se drží zástrčka.'),
];

const L3: Spec[] = [
  q('setrit', 'Jak můžeš ušetřit elektřinu?', 'Zhasnout, když odcházím z pokoje', ['Nechat svítit všechna světla', 'Nechat lednici otevřenou'],
    ['Co spotřebovává elektřinu zbytečně?'],
    'Světlo v prázdném pokoji svítí zbytečně. Zhasínání šetří elektřinu, peníze i přírodu.'),
  q('kabel-uvnitr', 'Proč je v kabelu uvnitř měděný drát a navrchu plast?', 'Měď vede proud a plast chrání ruku', ['Plast vede proud a měď ho zdobí', 'Aby byl kabel těžší'],
    ['Co z toho je vodič a co izolant?'],
    'Po mědi teče proud. Plastový obal je izolant – proud ven do ruky nepustí.'),
  q('sroubovak', 'Proč mají šroubováky pro elektrikáře plastovou rukojeť?', 'Plast nevede proud', ['Plast je hezčí', 'Aby neplavaly'],
    ['Čím se elektrikář drží?'],
    'Plastová rukojeť je izolant. Kdyby se elektrikář dotkl drátu s proudem, do ruky mu proud neprojde.'),
  q('baterie-do-sberu', 'Kam patří vybitá baterie?', 'Do sběrného boxu na baterie', ['Do koše', 'Do kompostu', 'Do kamen'],
    ['Baterie se dají recyklovat.'],
    'Baterie obsahují kovy, které se dají znovu použít, a látky, které škodí přírodě. Sběrný box bývá v obchodech a ve školách.'),
  q('knoflikova-baterie', 'Co se s malou kulatou knoflíkovou baterií nesmí dělat?', 'Dávat ji do pusy', ['Dávat ji do hodinek', 'Nosit ji do sběru'],
    ['Malé děti dávají věci do pusy.'],
    'Spolknutá knoflíková baterie může vážně poranit jícen. Patří jen do přístroje, vybitá do sběru – a mimo dosah malých dětí.'),
];

const L4: Spec[] = [
  q('bleskosvod', 'K čemu je na střeše bleskosvod?', 'Svede blesk bezpečně do země', ['Přitahuje déšť', 'Je to anténa na televizi', 'Chrání střechu před větrem'],
    ['Bleskosvod je z kovu a vede až do země.'],
    'Bleskosvod je kovová tyč s drátem až do země. Když do domu uhodí blesk, proud steče po kovu do země a dům nechytne.'),
  q('bourka-kolo', 'Jedeš na kole a blíží se bouřka. Co uděláš?', 'Slezu z kola a schovám se do budovy', ['Pojedu rychle dál po otevřené silnici', 'Schovám se pod osamělý strom'],
    ['Kde je za bouřky bezpečno?'],
    'Na otevřeném prostranství jsi nejvyšší bod v okolí. Slez z kola a schovej se do budovy nebo do auta.'),
  q('bourka-doma', 'Za bouřky jsi doma. Co se vyplatí udělat?', 'Vytáhnout počítač a televizi ze zásuvky', ['Jít se koupat do rybníka', 'Vylézt na střechu a dívat se'],
    ['Blesk může uhodit i do elektrického vedení.'],
    'Doma jsi v bezpečí. Blesk může do vedení poslat velký proud a zničit spotřebiče, proto se vyplatí je vytáhnout ze zásuvky.'),
  q('elektrarna', 'Odkud se bere elektřina v zásuvce?', 'Z elektráren, po drátech', ['Sama se vyrábí ve zdi', 'Ze schované baterky v zásuvce'],
    ['Pamatuješ na dráty na vysokých stožárech?'],
    'Elektřinu vyrábějí elektrárny – vodní, větrné, sluneční, uhelné nebo jaderné. Do domů vede po drátech.'),
  q('bourka-strom', 'Venku tě zastihne bouřka. Kam se neschovávej?', 'Pod osamělý vysoký strom', ['Do domu', 'Do auta se zavřenými okny'],
    ['Kam blesk uhodí nejčastěji?'],
    'Blesk často uhodí do nejvyššího místa v okolí, třeba do osamělého stromu. Bezpečný je dům nebo auto se zavřenými okny.'),
  q('bourka-voda', 'Koupeš se v rybníce a začne bouřka. Co uděláš?', 'Hned vylezu a jdu do bezpečí', ['Zůstanu ve vodě', 'Potopím se pod hladinu'],
    ['Na hladině jsi nejvyšší bod a voda vede proud.'],
    'Na hladině jsi nejvyšší bod v okolí a voda vede proud. Při bouřce hned vylez a schovej se do budovy.'),
];

export const vodiceSkill = bankSkill({
  id: 'blesky.vodice',
  island: 'blesky',
  name: 'Vede, nebo nevede?',
  description: 'Třídí věci na vodiče a izolanty a zkouší je v obvodu; ví, proč je baterka bezpečná a zásuvka ne, co dělat se spadlým drátem, s baterií a za bouřky.',
  rvp: {
    1: ['ČJS-3-4-03', 'ČJS-3-5-02'],
    2: ['ČJS-3-4-03', 'ČJS-3-5-02'],
    3: ['ČJS-3-4-03', 'ČJS-3-5-02'],
    4: ['ČJS-5-4-06', 'ČJS-5-5-04'],
  },
  ability: 'znalosti',
  showFact: true,
  banks: { 1: L1, 2: L2, 3: L3, 4: L4 },
  gen: { 1: gapSpec, 2: pickSpec, 3: twoGapsSpec, 4: stormSpec },
});
